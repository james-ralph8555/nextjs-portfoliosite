import sharp from 'sharp';
import * as path from 'path';
import { ImageProcessor } from './utils/imageUtils';
import { PaletteQuantizer } from './utils/quantization';
import { Vectorizer } from './utils/vectorization';
import { DepthEstimator } from './utils/depthEstimation';
import { ZOrderingAlgorithm } from './utils/zOrdering';
import { AssetBaker } from './utils/assetBaking';
import { ManifestGenerator } from './utils/manifestGenerator';
import { 
  ImageType, 
  LayerOptions, 
  ProcessingResult
} from './types';
import { DepthMap } from './utils/depthEstimation';

export interface ImageToDepthCssOptions extends LayerOptions {
  outputDir?: string;
  perspective?: number;
  generateCSS?: boolean;
  generateHTML?: boolean;
  generateJS?: boolean;
}

export class ImageToDepthCss {
  private options: ImageToDepthCssOptions;

  constructor(options: ImageToDepthCssOptions = {}) {
    this.options = {
      maxColors: 8,
      useDepth: false,
      depthBands: 4,
      vectorize: false,
      outputFormat: 'png',
      outputDir: './output',
      perspective: 1000,
      generateCSS: true,
      generateHTML: true,
      generateJS: true,
      ...options
    };
  }

  /**
   * Process an image and generate parallax layers
   */
  async processImage(imagePath: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      console.log('🎨 Starting image processing...');
      
      // Step 1: Classify image type
      console.log('📊 Classifying image type...');
      const imageType = await ImageProcessor.classifyImage(imagePath);
      console.log(`   Detected: ${imageType}`);
      
      // Step 2: Canonicalize image
      console.log('⚙️  Canonicalizing image...');
      const { image: canonicalImage, metadata } = await ImageProcessor.canonicalizeImage(imagePath);
      console.log(`   Size: ${metadata.width}x${metadata.height}`);
      
      // Step 3: Quantize palette and generate regions
      console.log('🎨 Quantizing palette and generating regions...');
      const maxColors = this.getMaxColorsForType(imageType);
      const { palette, quantizedImage } = await PaletteQuantizer.quantizeImage(canonicalImage, maxColors);
      const regions = await PaletteQuantizer.generateRegionMasks(quantizedImage, palette);
      console.log(`   Generated ${regions.length} regions from ${palette.length} colors`);
      
      // Step 4: Generate depth map (optional)
      let depthMap: DepthMap | undefined;
      if (this.options.useDepth) {
        console.log('📏 Generating depth map...');
        depthMap = await DepthEstimator.generateDepthMap(canonicalImage);
      }
      
      // Step 5: Calculate z-ordering
      console.log('📚 Calculating z-ordering...');
      const zOrderResult = await ZOrderingAlgorithm.calculateZOrder(
        regions, 
        imageType, 
        depthMap, 
        this.options.useDepth
      );
      console.log(`   Ordered ${zOrderResult.orderedRegions.length} regions`);
      
      // Step 6: Bake assets
      console.log('🔥 Baking layer assets...');
      const outputDir = this.options.outputDir || './output';
      const layers = await AssetBaker.bakeLayers(
        zOrderResult.orderedRegions,
        canonicalImage,
        outputDir,
        this.options,
        metadata.width!,
        metadata.height!
      );
      
      // Step 7: Add texture layers for woodcut
      if (imageType === 'woodcut') {
        console.log('📄 Adding paper texture layer...');
        const textureLayers = await AssetBaker.createTextureLayers(
          canonicalImage,
          outputDir,
          imageType
        );
        layers.push(...textureLayers);
      }
      
      // Step 8: Optimize layers
      console.log('⚡ Optimizing layer assets...');
      await AssetBaker.optimizeLayers(layers, outputDir);
      
      // Step 9: Generate preview
      console.log('👁️  Generating layer preview...');
      await AssetBaker.generateLayerPreview(
        layers,
        outputDir,
        metadata.width!,
        metadata.height!
      );
      
      // Step 10: Generate manifest
      console.log('📋 Generating parallax manifest...');
      const manifest = await ManifestGenerator.generateManifest(
        layers,
        imageType,
        { width: metadata.width!, height: metadata.height! },
        outputDir,
        {
          perspective: this.options.perspective,
          cssOutput: this.options.generateCSS,
          htmlOutput: this.options.generateHTML
        }
      );
      
      // Step 11: Generate JavaScript (optional)
      if (this.options.generateJS) {
        console.log('📜 Generating JavaScript controller...');
        await ManifestGenerator.generateJavaScript(manifest, outputDir);
      }
      
      const processingTime = Date.now() - startTime;
      console.log(`✅ Processing completed in ${processingTime}ms`);
      
      return {
        manifest,
        outputDir,
        processingTime
      };
      
    } catch (error) {
      console.error('❌ Processing failed:', error);
      throw error;
    }
  }

  /**
   * Get optimal color count based on image type
   */
  private getMaxColorsForType(imageType: ImageType): number {
    switch (imageType) {
      case 'poster':
        return this.options.maxColors || 8;
      case 'woodcut':
        return Math.min(this.options.maxColors || 4, 4); // Woodcut needs fewer colors
      case 'mixed':
        return this.options.maxColors || 12;
      default:
        return 8;
    }
  }

  /**
   * Process multiple images in batch
   */
  async processBatch(imagePaths: string[]): Promise<ProcessingResult[]> {
    console.log(`🔄 Processing batch of ${imagePaths.length} images...`);
    
    const results: ProcessingResult[] = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const imageName = path.basename(imagePath, path.extname(imagePath));
      
      console.log(`\n📸 Processing image ${i + 1}/${imagePaths.length}: ${imageName}`);
      
      // Set output directory for this image
      const imageOutputDir = path.join(
        this.options.outputDir || './output',
        imageName
      );
      
      const processor = new ImageToDepthCss({
        ...this.options,
        outputDir: imageOutputDir
      });
      
      try {
        const result = await processor.processImage(imagePath);
        results.push(result);
      } catch (error) {
        console.error(`❌ Failed to process ${imageName}:`, error);
        // Continue with other images
      }
    }
    
    console.log(`\n✅ Batch processing completed. ${results.length}/${imagePaths.length} images processed successfully.`);
    return results;
  }

  /**
   * Get supported image formats
   */
  static getSupportedFormats(): string[] {
    return ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.gif'];
  }

  /**
   * Validate image file
   */
  static async validateImage(imagePath: string): Promise<boolean> {
    try {
      const metadata = await sharp(imagePath).metadata();
      return !!(metadata.width && metadata.height);
    } catch {
      return false;
    }
  }
}

// Export main class and utilities
export default ImageToDepthCss;
export { 
  ImageProcessor, 
  PaletteQuantizer, 
  Vectorizer, 
  DepthEstimator, 
  ZOrderingAlgorithm, 
  AssetBaker, 
  ManifestGenerator 
};
export * from './types';