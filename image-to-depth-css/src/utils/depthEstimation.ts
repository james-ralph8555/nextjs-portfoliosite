import sharp from 'sharp';
import { Region } from '../types';

export interface DepthMap {
  data: Buffer;
  width: number;
  height: number;
  minDepth: number;
  maxDepth: number;
}

export class DepthEstimator {
  /**
   * Generate a simplified depth map using gradient-based approach
   * This is a fallback when Depth Anything v2 is not available
   */
  static async generateDepthMap(image: sharp.Sharp): Promise<DepthMap> {
    const { data, info } = await image
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const width = info.width!;
    const height = info.height!;
    const depthData = Buffer.alloc(width * height);

    // Simple depth estimation based on vertical position and brightness
    // Objects higher in frame and brighter are typically closer
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const brightness = data[idx];
        
        // Combine vertical position (40%) and brightness (60%)
        const verticalFactor = 1 - (y / height); // Higher = closer
        const brightnessFactor = brightness / 255; // Brighter = closer
        
        const depth = verticalFactor * 0.4 + brightnessFactor * 0.6;
        depthData[idx] = Math.floor(depth * 255);
      }
    }

    // Apply edge-aware smoothing
    const smoothedDepth = this.edgeAwareSmoothing(depthData, width, height);

    return {
      data: smoothedDepth,
      width,
      height,
      minDepth: 0,
      maxDepth: 255
    };
  }

  /**
   * Quantize depth map into discrete bands for layering
   */
  static quantizeDepthBands(
    depthMap: DepthMap,
    numBands: number = 6
  ): Buffer {
    const { data, width, height, minDepth, maxDepth } = depthMap;
    const quantizedData = Buffer.alloc(width * height);
    const bandSize = (maxDepth - minDepth) / numBands;

    for (let i = 0; i < data.length; i++) {
      const depth = data[i];
      const band = Math.floor((depth - minDepth) / bandSize);
      quantizedData[i] = Math.min(band, numBands - 1);
    }

    return quantizedData;
  }

  /**
   * Generate depth layers for specific regions
   */
  static async generateRegionDepthLayers(
    regions: Region[],
    depthMap: DepthMap,
    numBands: number = 4
  ): Promise<Map<string, number[]>> {
    const regionDepthLayers = new Map<string, number[]>();
    const quantizedDepth = this.quantizeDepthBands(depthMap, numBands);

    for (const region of regions) {
      const depthBands = new Set<number>();

      // Sample depth values within the region
      const { x, y, width, height } = region.boundingBox;
      for (let py = y; py < y + height; py++) {
        for (let px = x; px < x + width; px++) {
          const maskIdx = py * depthMap.width + px;
          if (region.mask[maskIdx]) {
            depthBands.add(quantizedDepth[maskIdx]);
          }
        }
      }

      regionDepthLayers.set(region.id, Array.from(depthBands));
    }

    return regionDepthLayers;
  }

  /**
   * Apply edge-aware smoothing to depth map
   */
  private static edgeAwareSmoothing(
    depthData: Buffer,
    width: number,
    height: number,
    iterations: number = 2
  ): Buffer {
    let smoothed = Buffer.from(depthData);

    for (let iter = 0; iter < iterations; iter++) {
      const newSmoothed = Buffer.from(smoothed);

      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const centerDepth = smoothed[idx];

          // Calculate weighted average of neighbors
          let sum = 0;
          let weight = 0;

          for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
            const nx = x + dx;
            const ny = y + dy;
            const nidx = ny * width + nx;
            const neighborDepth = smoothed[nidx];

            // Edge-aware weight: preserve edges
            const depthDiff = Math.abs(centerDepth - neighborDepth);
            const w = Math.exp(-depthDiff * depthDiff / (2 * 25 * 25)); // Gaussian with edge preservation

            sum += neighborDepth * w;
            weight += w;
          }

          if (weight > 0) {
            newSmoothed[idx] = Math.floor(sum / weight);
          }
        }
      }

      smoothed = newSmoothed;
    }

    return smoothed;
  }

  /**
   * Create depth-based parallax speeds for regions
   */
  static calculateParallaxSpeeds(
    regions: Region[],
    regionDepthLayers: Map<string, number[]>,
    numBands: number = 4
  ): Map<string, number> {
    const parallaxSpeeds = new Map<string, number>();

    for (const region of regions) {
      const depthBands = regionDepthLayers.get(region.id) || [0];
      
      // Calculate average depth band (lower = farther)
      const avgBand = depthBands.reduce((sum, band) => sum + band, 0) / depthBands.length;
      
      // Convert to parallax speed (0.1 to 1.0, where 1.0 is fastest/closest)
      const speed = 0.1 + (1 - avgBand / (numBands - 1)) * 0.9;
      parallaxSpeeds.set(region.id, speed);
    }

    return parallaxSpeeds;
  }

  /**
   * Generate micro-layers for large regions using depth variation
   */
  static async generateMicroLayers(
    region: Region,
    depthMap: DepthMap,
    maxMicroLayers: number = 3
  ): Promise<{ mask: Buffer; depthBand: number }[]> {
    const { x, y, width, height } = region.boundingBox;
    const microLayers: { mask: Buffer; depthBand: number }[] = [];

    // Extract depth values within the region
    const regionDepths: number[] = [];
    const regionPositions: { x: number; y: number }[] = [];

    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        const maskIdx = py * depthMap.width + px;
        if (region.mask[maskIdx]) {
          const depthIdx = py * depthMap.width + px;
          regionDepths.push(depthMap.data[depthIdx]);
          regionPositions.push({ x: px, y: py });
        }
      }
    }

    if (regionDepths.length === 0) return microLayers;

    // Calculate depth statistics
    const minDepth = Math.min(...regionDepths);
    const maxDepth = Math.max(...regionDepths);
    const depthRange = maxDepth - minDepth;

    // If depth variation is too small, no micro-layers needed
    if (depthRange < 20) return microLayers;

    // Create depth-based micro-layers
    const numLayers = Math.min(maxMicroLayers, Math.floor(depthRange / 30) + 1);
    const layerThreshold = depthRange / numLayers;

    for (let i = 0; i < numLayers; i++) {
      const layerMinDepth = minDepth + i * layerThreshold;
      const layerMaxDepth = minDepth + (i + 1) * layerThreshold;
      
      const layerMask = Buffer.alloc(depthMap.width * depthMap.height);
      
      for (let j = 0; j < regionPositions.length; j++) {
        const depth = regionDepths[j];
        if (depth >= layerMinDepth && depth < layerMaxDepth) {
          const { x: px, y: py } = regionPositions[j];
          const maskIdx = py * depthMap.width + px;
          layerMask[maskIdx] = 1;
        }
      }

      microLayers.push({
        mask: layerMask,
        depthBand: i
      });
    }

    return microLayers;
  }
}