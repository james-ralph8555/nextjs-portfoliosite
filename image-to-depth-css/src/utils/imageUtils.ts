import sharp from 'sharp';
import { ImageType } from '../types';

export class ImageProcessor {
  static async loadImage(imagePath: string): Promise<sharp.Sharp> {
    return sharp(imagePath);
  }

  static async getImageMetadata(imagePath: string): Promise<sharp.Metadata> {
    const image = await this.loadImage(imagePath);
    return image.metadata();
  }

  static async classifyImage(imagePath: string): Promise<ImageType> {
    const image = await this.loadImage(imagePath);
    const { data } = await image
      .resize(256, 256, { fit: 'inside' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data);
    let edgeCount = 0;
    let colorVariance = 0;
    let lineArtScore = 0;

    // Sample pixels for analysis
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      
      // Calculate color variance
      const gray = (r + g + b) / 3;
      colorVariance += Math.abs(r - gray) + Math.abs(g - gray) + Math.abs(b - gray);
      
      // Simple edge detection (high contrast between neighbors)
      if (i > 0 && i < pixels.length - 4) {
        const prevGray = (pixels[i - 4] + pixels[i - 3] + pixels[i - 2]) / 3;
        const diff = Math.abs(gray - prevGray);
        if (diff > 30) edgeCount++;
        
        // Line art detection (high contrast, low color variance)
        if (diff > 50 && colorVariance / (i / 4) < 20) {
          lineArtScore++;
        }
      }
    }

    const totalPixels = pixels.length / 4;
    const edgeRatio = edgeCount / totalPixels;
    const lineArtRatio = lineArtScore / totalPixels;
    const avgColorVariance = colorVariance / totalPixels;

    // Classification logic
    if (lineArtRatio > 0.05 && avgColorVariance < 30) {
      return 'woodcut';
    } else if (edgeRatio > 0.1 && avgColorVariance < 50) {
      return 'poster';
    } else {
      return 'mixed';
    }
  }

  static async canonicalizeImage(
    imagePath: string,
    targetWidth: number = 1024,
    targetHeight: number = 1024
  ): Promise<{ image: sharp.Sharp; metadata: sharp.Metadata }> {
    const image = await this.loadImage(imagePath);
    const metadata = await image.metadata();

    // Calculate aspect ratio preserving dimensions
    const aspectRatio = (metadata.width || 1) / (metadata.height || 1);
    let width = targetWidth;
    let height = targetHeight;

    if (aspectRatio > 1) {
      height = Math.round(targetWidth / aspectRatio);
    } else {
      width = Math.round(targetHeight * aspectRatio);
    }

    // Apply light denoising for scans
    const processed = image
      .resize(width, height, { 
        fit: 'inside',
        withoutEnlargement: true 
      })
      .sharpen(0.5, 0.1, 2);

    const newMetadata = await processed.metadata();
    return { image: processed, metadata: newMetadata };
  }

  static async extractPaperTexture(image: sharp.Sharp): Promise<sharp.Sharp> {
    // Extract high-frequency components for paper texture
    return image
      .clone()
      .modulate({
        brightness: 1.2,
        saturation: 0.3
      })
      .sharpen(1.0, 0.5, 0);
  }

  static async isolateInk(image: sharp.Sharp): Promise<sharp.Sharp> {
    // Isolate ink strokes for woodcut-style images
    return image
      .clone()
      .greyscale()
      .normalize()
      .threshold(128); // Binary threshold for ink separation
  }
}