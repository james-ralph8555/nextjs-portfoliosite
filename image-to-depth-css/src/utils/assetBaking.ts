import sharp from 'sharp';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Region, Layer, BoundingBox, LayerOptions } from '../types';
import { Vectorizer } from './vectorization';

export class AssetBaker {
  /**
   * Bake regions into optimized layer assets
   */
  static async bakeLayers(
    regions: Region[],
    originalImage: sharp.Sharp,
    outputDir: string,
    options: LayerOptions,
    imageWidth: number,
    imageHeight: number
  ): Promise<Layer[]> {
    const layers: Layer[] = [];

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      const layerId = `layer_${i}_${region.id}`;

      try {
        const layer = await this.bakeSingleLayer(
          region,
          originalImage,
          outputDir,
          layerId,
          options,
          imageWidth,
          imageHeight,
          i,
          regions.length
        );

        layers.push(layer);
      } catch (error) {
        console.warn(`Failed to bake layer ${layerId}:`, error);
      }
    }

    return layers;
  }

  /**
   * Bake a single region into a layer
   */
  private static async bakeSingleLayer(
    region: Region,
    originalImage: sharp.Sharp,
    outputDir: string,
    layerId: string,
    options: LayerOptions,
    imageWidth: number,
    imageHeight: number,
    zIndex: number,
    totalRegions: number
  ): Promise<Layer> {
    const { x, y, width, height } = region.boundingBox;
    const outputFormat = options.outputFormat || 'png';

    // Calculate trimmed bounding box
    const trimmedBounds = await this.calculateTrimmedBounds(region, imageWidth, imageHeight);
    
    // Create layer data based on format
    let layerData: Buffer | string;
    let format: 'png' | 'svg';

    switch (outputFormat) {
      case 'svg':
        layerData = await Vectorizer.traceRegion(region, imageWidth, imageHeight);
        format = 'svg';
        break;

      case 'hybrid':
        const hybrid = await Vectorizer.createHybridLayer(
          region,
          originalImage,
          imageWidth,
          imageHeight
        );
        // Save both SVG and raster components
        const svgPath = path.join(outputDir, `${layerId}.svg`);
        const rasterPath = path.join(outputDir, `${layerId}.png`);
        
        await fs.writeFile(svgPath, hybrid.svg);
        await fs.writeFile(rasterPath, hybrid.raster);
        
        layerData = hybrid.svg;
        format = 'svg';
        break;

      default: // png
        layerData = await this.createRasterLayer(
          region,
          originalImage,
          trimmedBounds,
          imageWidth,
          imageHeight
        );
        format = 'png';
        break;
    }

    // Save layer file
    const fileName = `${layerId}.${format}`;
    const filePath = path.join(outputDir, fileName);
    
    if (format === 'png' && Buffer.isBuffer(layerData)) {
      await fs.writeFile(filePath, layerData);
    } else if (format === 'svg' && typeof layerData === 'string') {
      await fs.writeFile(filePath, layerData);
    }

    // Calculate parallax speed based on z-order
    const parallaxSpeed = this.calculateParallaxSpeed(region, zIndex, totalRegions);

    return {
      id: layerId,
      type: 'region',
      zIndex,
      parallaxSpeed,
      boundingBox: trimmedBounds,
      format,
      data: layerData,
      anchor: { x: trimmedBounds.x, y: trimmedBounds.y },
      naturalSize: { width: trimmedBounds.width, height: trimmedBounds.height }
    };
  }

  /**
   * Create raster layer with transparency
   */
  private static async createRasterLayer(
    region: Region,
    originalImage: sharp.Sharp,
    boundingBox: BoundingBox,
    imageWidth: number,
    imageHeight: number
  ): Promise<Buffer> {
    // Create mask for the region
    const maskBuffer = await this.createRegionMask(region, imageWidth, imageHeight);

    // Apply mask to original image
    const maskedImage = await originalImage
      .composite([{ input: maskBuffer, blend: 'dest-in' }])
      .extract({
        left: boundingBox.x,
        top: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height
      })
      .png()
      .toBuffer();

    return maskedImage;
  }

  /**
   * Create region mask as image buffer
   */
  private static async createRegionMask(
    region: Region,
    imageWidth: number,
    imageHeight: number
  ): Promise<Buffer> {
    const maskData = Buffer.alloc(imageWidth * imageHeight * 4);
    
    for (let i = 0; i < region.mask.length; i++) {
      const maskValue = region.mask[i] ? 255 : 0;
      const idx = i * 4;
      maskData[idx] = 255;     // R
      maskData[idx + 1] = 255; // G
      maskData[idx + 2] = 255; // B
      maskData[idx + 3] = maskValue; // A
    }

    return sharp(maskData, {
      raw: {
        width: imageWidth,
        height: imageHeight,
        channels: 4
      }
    }).png().toBuffer();
  }

  /**
   * Calculate trimmed bounding box for region
   */
  private static async calculateTrimmedBounds(
    region: Region,
    imageWidth: number,
    imageHeight: number
  ): Promise<BoundingBox> {
    const boundingBox = region.boundingBox;
    
    let minX = boundingBox.x + boundingBox.width;
    let minY = boundingBox.y + boundingBox.height;
    let maxX = boundingBox.x;
    let maxY = boundingBox.y;

    // Find actual bounds of region pixels
    for (let py = boundingBox.y; py < boundingBox.y + boundingBox.height; py++) {
      for (let px = boundingBox.x; px < boundingBox.x + boundingBox.width; px++) {
        const maskIdx = py * imageWidth + px;
        if (region.mask[maskIdx]) {
          minX = Math.min(minX, px);
          minY = Math.min(minY, py);
          maxX = Math.max(maxX, px);
          maxY = Math.max(maxY, py);
        }
      }
    }

    // Add small padding
    const padding = 2;
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(imageWidth - 1, maxX + padding);
    maxY = Math.min(imageHeight - 1, maxY + padding);

    return {
      x: minX,
      y: minY,
      width: maxX - minX + 1,
      height: maxY - minY + 1
    };
  }

  /**
   * Calculate parallax speed based on z-order
   */
  private static calculateParallaxSpeed(
    region: Region,
    zIndex: number,
    totalRegions: number
  ): number {
    // Front regions move faster, back regions move slower
    const normalizedZ = zIndex / Math.max(1, totalRegions - 1);
    return 0.1 + (1 - normalizedZ) * 0.9; // Range: 0.1 to 1.0
  }

  /**
   * Create additional texture layers (paper texture, etc.)
   */
  static async createTextureLayers(
    originalImage: sharp.Sharp,
    outputDir: string,
    imageType: 'poster' | 'woodcut' | 'mixed'
  ): Promise<Layer[]> {
    const textureLayers: Layer[] = [];

    if (imageType === 'woodcut') {
      // Create paper texture layer
      const paperTexture = await this.createPaperTextureLayer(originalImage, outputDir);
      textureLayers.push(paperTexture);
    }

    return textureLayers;
  }

  /**
   * Create paper texture layer for woodcut images
   */
  private static async createPaperTextureLayer(
    originalImage: sharp.Sharp,
    outputDir: string
  ): Promise<Layer> {
    const metadata = await originalImage.metadata();
    const width = metadata.width || 1024;
    const height = metadata.height || 1024;

    // Extract paper texture (high-frequency components)
    const paperTexture = await originalImage
      .clone()
      .modulate({
        brightness: 1.1,
        saturation: 0.2
      })
      .sharpen(1.0, 0.5, 0)
      .png()
      .toBuffer();

    const fileName = 'paper_texture.png';
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, paperTexture);

    return {
      id: 'paper_texture',
      type: 'texture',
      zIndex: -1, // Background layer
      parallaxSpeed: 0.05, // Very slow movement
      boundingBox: { x: 0, y: 0, width, height },
      format: 'png',
      data: paperTexture,
      anchor: { x: 0, y: 0 },
      naturalSize: { width, height }
    };
  }

  /**
   * Optimize layer assets for web delivery
   */
  static async optimizeLayers(layers: Layer[], outputDir: string): Promise<void> {
    for (const layer of layers) {
      if (layer.format === 'png' && Buffer.isBuffer(layer.data)) {
        // Optimize PNG size
        const optimized = await sharp(layer.data)
          .png({
            compressionLevel: 9,
            adaptiveFiltering: true,
            palette: true
          })
          .toBuffer();

        // Update layer data and save optimized version
        layer.data = optimized;
        const filePath = path.join(outputDir, `${layer.id}.png`);
        await fs.writeFile(filePath, optimized);
      }
    }
  }

  /**
   * Generate layer preview for debugging
   */
  static async generateLayerPreview(
    layers: Layer[],
    outputDir: string,
    imageWidth: number,
    imageHeight: number
  ): Promise<void> {
    // Create a composite preview showing all layers
    const composite = sharp({
      create: {
        width: imageWidth,
        height: imageHeight,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    });

    const compositeInputs = await Promise.all(
      layers.map(async (layer) => {
        if (layer.format === 'png' && Buffer.isBuffer(layer.data)) {
          return {
            input: layer.data,
            left: layer.boundingBox.x,
            top: layer.boundingBox.y
          };
        }
        return null;
      })
    );

    const validInputs = compositeInputs.filter(input => input !== null) as any[];

    if (validInputs.length > 0) {
      const previewBuffer = await composite
        .composite(validInputs)
        .png()
        .toBuffer();

      const previewPath = path.join(outputDir, 'layers_preview.png');
      await fs.writeFile(previewPath, previewBuffer);
    }
  }
}