import { Region, ImageType } from '../types';
import { DepthMap } from './depthEstimation';

export interface ZOrderResult {
  orderedRegions: Region[];
  regionDepths: Map<string, number>;
  layerGroups: Map<number, string[]>; // z-index -> region IDs
}

export class ZOrderingAlgorithm {
  /**
   * Calculate z-ordering for regions based on multiple factors
   */
  static async calculateZOrder(
    regions: Region[],
    imageType: ImageType,
    depthMap?: DepthMap,
    useDepth: boolean = false
  ): Promise<ZOrderResult> {
    // Calculate base scores for each region
    const regionScores = new Map<string, number>();
    
    for (const region of regions) {
      let score = 0;

      // Factor 1: Area (larger regions tend to be background)
      const areaScore = this.calculateAreaScore(region);
      score += areaScore * 0.3;

      // Factor 2: Position (vertical position in image)
      const positionScore = this.calculatePositionScore(region);
      score += positionScore * 0.2;

      // Factor 3: Color brightness (brighter regions tend to be foreground)
      const colorScore = this.calculateColorScore(region);
      score += colorScore * 0.2;

      // Factor 4: Centrality (central regions tend to be foreground)
      const centralityScore = this.calculateCentralityScore(region);
      score += centralityScore * 0.2;

      // Factor 5: Edge proximity (regions touching edges tend to be background)
      const edgeScore = this.calculateEdgeScore(region);
      score += edgeScore * 0.1;

      regionScores.set(region.id, score);
    }

    // Apply depth information if available
    if (useDepth && depthMap) {
      const depthScores = await this.calculateDepthScores(regions, depthMap);
      for (const [regionId, depthScore] of depthScores) {
        const currentScore = regionScores.get(regionId) || 0;
        regionScores.set(regionId, currentScore + depthScore * 0.3);
      }
    }

    // Apply image-type specific adjustments
    this.applyImageTypeAdjustments(regionScores, regions, imageType);

    // Resolve adjacency conflicts
    this.resolveAdjacencyConflicts(regionScores, regions);

    // Sort regions by score (higher score = foreground)
    const orderedRegions = [...regions].sort((a, b) => {
      const scoreA = regionScores.get(a.id) || 0;
      const scoreB = regionScores.get(b.id) || 0;
      return scoreB - scoreA;
    });

    // Create layer groups (regions with similar z-order)
    const layerGroups = this.createLayerGroups(orderedRegions, regionScores);

    return {
      orderedRegions,
      regionDepths: regionScores,
      layerGroups
    };
  }

  /**
   * Calculate area-based score (smaller areas get higher scores)
   */
  private static calculateAreaScore(region: Region): number {
    // Normalize area score (0-1), smaller areas get higher scores
    const maxArea = 2000 * 2000; // Assuming max image size
    const normalizedArea = Math.min(region.area / maxArea, 1);
    return 1 - normalizedArea;
  }

  /**
   * Calculate position-based score (higher in image = higher score)
   */
  private static calculatePositionScore(region: Region): number {
    const { y, height } = region.boundingBox;
    const centerY = y + height / 2;
    
    // Assuming max image height of 2000px
    const maxImageHeight = 2000;
    const normalizedY = centerY / maxImageHeight;
    
    // Higher position (smaller y) gets higher score
    return 1 - normalizedY;
  }

  /**
   * Calculate color-based score (brighter colors get higher scores)
   */
  private static calculateColorScore(region: Region): number {
    const [r, g, b] = region.color;
    const brightness = (r + g + b) / (3 * 255);
    return brightness;
  }

  /**
   * Calculate centrality score (more central = higher score)
   */
  private static calculateCentralityScore(region: Region): number {
    const { x, y, width, height } = region.boundingBox;
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    // Assuming max image dimensions
    const maxImageWidth = 2000;
    const maxImageHeight = 2000;
    
    // Distance from center (0-1, where 0 is center)
    const distFromCenterX = Math.abs(centerX - maxImageWidth / 2) / (maxImageWidth / 2);
    const distFromCenterY = Math.abs(centerY - maxImageHeight / 2) / (maxImageHeight / 2);
    const distFromCenter = Math.sqrt(distFromCenterX * distFromCenterX + distFromCenterY * distFromCenterY) / Math.sqrt(2);
    
    // More central = higher score
    return 1 - distFromCenter;
  }

  /**
   * Calculate edge proximity score (regions touching edges get lower scores)
   */
  private static calculateEdgeScore(region: Region): number {
    const { x, y, width, height } = region.boundingBox;
    
    // Assuming max image dimensions
    const maxImageWidth = 2000;
    const maxImageHeight = 2000;
    
    // Check if region touches any edge
    const touchesLeft = x <= 10;
    const touchesRight = x + width >= maxImageWidth - 10;
    const touchesTop = y <= 10;
    const touchesBottom = y + height >= maxImageHeight - 10;
    
    // Regions touching edges get lower scores
    return (touchesLeft || touchesRight || touchesTop || touchesBottom) ? 0 : 1;
  }

  /**
   * Calculate depth-based scores
   */
  private static async calculateDepthScores(
    regions: Region[],
    depthMap: DepthMap
  ): Promise<Map<string, number>> {
    const depthScores = new Map<string, number>();

    for (const region of regions) {
      let totalDepth = 0;
      let pixelCount = 0;

      const { x, y, width, height } = region.boundingBox;
      
      for (let py = y; py < y + height; py++) {
        for (let px = x; px < x + width; px++) {
          const maskIdx = py * depthMap.width + px;
          if (region.mask[maskIdx]) {
            const depthIdx = py * depthMap.width + px;
            totalDepth += depthMap.data[depthIdx];
            pixelCount++;
          }
        }
      }

      if (pixelCount > 0) {
        const avgDepth = totalDepth / pixelCount;
        // Normalize depth score (0-1), where higher depth = closer = higher score
        const normalizedDepth = avgDepth / 255;
        depthScores.set(region.id, normalizedDepth);
      } else {
        depthScores.set(region.id, 0.5); // Default middle depth
      }
    }

    return depthScores;
  }

  /**
   * Apply image-type specific adjustments
   */
  private static applyImageTypeAdjustments(
    regionScores: Map<string, number>,
    regions: Region[],
    imageType: ImageType
  ): void {
    switch (imageType) {
      case 'woodcut':
        // For woodcuts, prioritize ink (dark) regions as foreground
        for (const region of regions) {
          const [r, g, b] = region.color;
          const darkness = 1 - (r + g + b) / (3 * 255);
          const currentScore = regionScores.get(region.id) || 0;
          regionScores.set(region.id, currentScore + darkness * 0.2);
        }
        break;

      case 'poster':
        // For posters, prioritize saturated colors
        for (const region of regions) {
          const [r, g, b] = region.color;
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const currentScore = regionScores.get(region.id) || 0;
          regionScores.set(region.id, currentScore + saturation * 0.15);
        }
        break;

      case 'mixed':
        // For mixed, apply balanced adjustments
        break;
    }
  }

  /**
   * Resolve adjacency conflicts to prevent z-ordering issues
   */
  private static resolveAdjacencyConflicts(
    regionScores: Map<string, number>,
    regions: Region[]
  ): void {
    // Create adjacency map
    const adjacencyMap = new Map<string, Set<string>>();
    
    for (const region of regions) {
      adjacencyMap.set(region.id, new Set(region.adjacency));
    }

    // Iteratively resolve conflicts
    let changed = true;
    let iterations = 0;
    const maxIterations = 10;

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      for (const region of regions) {
        const neighbors = adjacencyMap.get(region.id) || new Set();
        let regionScore = regionScores.get(region.id) || 0;

        for (const neighborId of neighbors) {
          const neighborScore = regionScores.get(neighborId) || 0;
          
          // If this region is behind a neighbor but should be in front, adjust
          if (regionScore < neighborScore && this.shouldBeInFront(region, regions)) {
            const adjustment = (neighborScore - regionScore) * 0.1;
            regionScores.set(region.id, regionScore + adjustment);
            changed = true;
          }
        }
      }
    }
  }

  /**
   * Determine if a region should be in front based on heuristics
   */
  private static shouldBeInFront(region: Region, allRegions: Region[]): boolean {
    // Smaller regions tend to be foreground details
    const avgArea = allRegions.reduce((sum, r) => sum + r.area, 0) / allRegions.length;
    return region.area < avgArea * 0.5;
  }

  /**
   * Create layer groups for regions with similar z-order
   */
  private static createLayerGroups(
    orderedRegions: Region[],
    regionScores: Map<string, number>
  ): Map<number, string[]> {
    const layerGroups = new Map<number, string[]>();
    
    if (orderedRegions.length === 0) return layerGroups;

    // Group regions by score ranges
    const scores = Array.from(regionScores.values());
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore;

    const numLayers = Math.min(orderedRegions.length, 10); // Max 10 layers
    const layerSize = scoreRange / numLayers;

    for (let i = 0; i < orderedRegions.length; i++) {
      const region = orderedRegions[i];
      const score = regionScores.get(region.id) || 0;
      
      // Calculate layer index (0 = background, higher = foreground)
      const layerIndex = Math.floor((score - minScore) / layerSize);
      const zIndex = Math.max(0, Math.min(numLayers - 1, layerIndex));
      
      if (!layerGroups.has(zIndex)) {
        layerGroups.set(zIndex, []);
      }
      
      layerGroups.get(zIndex)!.push(region.id);
    }

    return layerGroups;
  }
}