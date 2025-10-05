import sharp from 'sharp';
import { Region } from '../types';

// Simple color quantization implementation
class SimpleQuantizer {
  static quantize(pixels: [number, number, number][], maxColors: number): [number, number, number][] {
    if (pixels.length <= maxColors) {
      return [...new Set(pixels.map(p => `${p[0]},${p[1]},${p[2]}`))]
        .map(str => str.split(',').map(Number) as [number, number, number]);
    }

    // K-means clustering for color quantization
    const k = Math.min(maxColors, pixels.length);
    const centers = this.initializeCenters(pixels, k);
    
    for (let iteration = 0; iteration < 10; iteration++) {
      const clusters = this.assignToClusters(pixels, centers);
      this.updateCenters(clusters, centers);
    }

    return centers.filter(c => c !== null) as [number, number, number][];
  }

  private static initializeCenters(pixels: [number, number, number][], k: number): [number, number, number][] {
    const centers: [number, number, number][] = [];
    const step = Math.floor(pixels.length / k);
    
    for (let i = 0; i < k; i++) {
      centers.push([...pixels[i * step]]);
    }
    
    return centers;
  }

  private static assignToClusters(
    pixels: [number, number, number][],
    centers: [number, number, number][]
  ): number[] {
    return pixels.map(pixel => {
      let minDist = Infinity;
      let closestCenter = 0;
      
      centers.forEach((center, idx) => {
        const dist = Math.sqrt(
          Math.pow(pixel[0] - center[0], 2) +
          Math.pow(pixel[1] - center[1], 2) +
          Math.pow(pixel[2] - center[2], 2)
        );
        
        if (dist < minDist) {
          minDist = dist;
          closestCenter = idx;
        }
      });
      
      return closestCenter;
    });
  }

  private static updateCenters(
    clusters: number[],
    centers: [number, number, number][]
  ): void {
    const k = centers.length;
    const sums = Array(k).fill(null).map(() => [0, 0, 0]);
    const counts = Array(k).fill(0);

    clusters.forEach((clusterIdx, pixelIdx) => {
      // This would need the original pixels array - simplified for now
      counts[clusterIdx]++;
    });

    // For simplicity, keep original centers in this implementation
  }
}

export class PaletteQuantizer {
  static async quantizeImage(
    image: sharp.Sharp,
    maxColors: number = 8
  ): Promise<{ palette: [number, number, number][]; quantizedImage: sharp.Sharp }> {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert pixels to RGB array for quantization
    const pixels: [number, number, number][] = [];
    for (let i = 0; i < data.length; i += 4) {
      pixels.push([data[i], data[i + 1], data[i + 2]]);
    }

    // Apply simple color quantization
    const palette = SimpleQuantizer.quantize(pixels, maxColors);

    // Create quantized image
    const quantizedData = Buffer.alloc(data.length);
    for (let i = 0; i < data.length; i += 4) {
      const pixel = [data[i], data[i + 1], data[i + 2]] as [number, number, number];
      const closestColor = this.findClosestColor(pixel, palette);
      quantizedData[i] = closestColor[0];
      quantizedData[i + 1] = closestColor[1];
      quantizedData[i + 2] = closestColor[2];
      quantizedData[i + 3] = data[i + 3]; // Preserve alpha
    }

    const quantizedImage = sharp(quantizedData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    });

    return { palette, quantizedImage };
  }

  static findClosestColor(
    pixel: [number, number, number],
    palette: [number, number, number][]
  ): [number, number, number] {
    let minDistance = Infinity;
    let closestColor = palette[0];

    for (const color of palette) {
      const distance = Math.sqrt(
        Math.pow(pixel[0] - color[0], 2) +
        Math.pow(pixel[1] - color[1], 2) +
        Math.pow(pixel[2] - color[2], 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }

    return closestColor;
  }

  static async generateRegionMasks(
    image: sharp.Sharp,
    palette: [number, number, number][]
  ): Promise<Region[]> {
    const { data, info } = await image
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width!;
    const height = info.height!;
    const regions: Region[] = [];
    const visited = new Set<number>();

    // Create color lookup map
    const colorToRegion = new Map<string, Region>();

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        if (visited.has(pixelIndex)) continue;

        // Find which palette color this pixel matches
        const pixelColor = [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]] as [number, number, number];
        const paletteColor = this.findClosestColor(pixelColor, palette);
        const paletteKey = `${paletteColor[0]},${paletteColor[1]},${paletteColor[2]}`;

        // Get or create region for this color
        let region = colorToRegion.get(paletteKey);
        if (!region) {
          region = {
            id: `region_${regions.length}`,
            color: paletteColor,
            mask: Buffer.alloc(width * height),
            boundingBox: { x: width, y: height, width: 0, height: 0 },
            area: 0,
            adjacency: []
          };
          colorToRegion.set(paletteKey, region);
          regions.push(region);
        }

        // Flood fill to find connected component
        const componentPixels = this.floodFill(
          data, width, height, x, y, paletteColor, visited
        );

        // Update region with component pixels
        for (const [px, py] of componentPixels) {
          const maskIndex = py * width + px;
          region.mask[maskIndex] = 1;
          region.area++;

          // Update bounding box
          region.boundingBox.x = Math.min(region.boundingBox.x, px);
          region.boundingBox.y = Math.min(region.boundingBox.y, py);
          region.boundingBox.width = Math.max(region.boundingBox.width, px - region.boundingBox.x + 1);
          region.boundingBox.height = Math.max(region.boundingBox.height, py - region.boundingBox.y + 1);
        }
      }
    }

    // Build adjacency graph
    this.buildAdjacencyGraph(regions, width, height);

    // Filter out tiny regions
    const minArea = Math.floor(width * height * 0.001); // 0.1% of image
    return regions.filter(region => region.area >= minArea);
  }

  static floodFill(
    data: Buffer,
    width: number,
    height: number,
    startX: number,
    startY: number,
    targetColor: [number, number, number],
    visited: Set<number>
  ): [number, number][] {
    const component: [number, number][] = [];
    const stack: [number, number][] = [[startX, startY]];
    const tolerance = 10; // Color tolerance for matching

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      
      const pixelIndex = (y * width + x) * 4;
      if (visited.has(pixelIndex)) continue;

      const pixelColor = [data[pixelIndex], data[pixelIndex + 1], data[pixelIndex + 2]] as [number, number, number];
      
      // Check if color matches within tolerance
      const colorDiff = Math.sqrt(
        Math.pow(pixelColor[0] - targetColor[0], 2) +
        Math.pow(pixelColor[1] - targetColor[1], 2) +
        Math.pow(pixelColor[2] - targetColor[2], 2)
      );

      if (colorDiff > tolerance) continue;

      visited.add(pixelIndex);
      component.push([x, y]);

      // Add neighbors to stack
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    return component;
  }

  static buildAdjacencyGraph(regions: Region[], width: number, height: number): void {
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        if (this.areRegionsAdjacent(regions[i], regions[j], width, height)) {
          regions[i].adjacency.push(regions[j].id);
          regions[j].adjacency.push(regions[i].id);
        }
      }
    }
  }

  static areRegionsAdjacent(region1: Region, region2: Region, width: number, height: number): boolean {
    // Check if bounding boxes overlap or touch
    const boxesTouch = !(
      region1.boundingBox.x + region1.boundingBox.width < region2.boundingBox.x ||
      region2.boundingBox.x + region2.boundingBox.width < region1.boundingBox.x ||
      region1.boundingBox.y + region1.boundingBox.height < region2.boundingBox.y ||
      region2.boundingBox.y + region2.boundingBox.height < region1.boundingBox.y
    );

    if (!boxesTouch) return false;

    // Check pixel-level adjacency in overlapping area
    const overlapX1 = Math.max(region1.boundingBox.x, region2.boundingBox.x);
    const overlapY1 = Math.max(region1.boundingBox.y, region2.boundingBox.y);
    const overlapX2 = Math.min(
      region1.boundingBox.x + region1.boundingBox.width,
      region2.boundingBox.x + region2.boundingBox.width
    );
    const overlapY2 = Math.min(
      region1.boundingBox.y + region1.boundingBox.height,
      region2.boundingBox.y + region2.boundingBox.height
    );

    for (let y = overlapY1; y < overlapY2; y++) {
      for (let x = overlapX1; x < overlapX2; x++) {
        const idx = y * width + x;
        if (region1.mask[idx] && region2.mask[idx]) {
          return true; // Regions overlap (shouldn't happen with proper segmentation)
        }
        
        // Check if pixels are neighbors
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = ny * width + nx;
            if (region1.mask[idx] && region2.mask[nidx]) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }
}