import sharp from 'sharp';
import { Region, BoundingBox } from '../types';

interface Point {
  x: number;
  y: number;
}



export class Vectorizer {
  static async traceRegion(region: Region, width: number, height: number): Promise<string> {
    // Convert region mask to contours using marching squares
    const contours = this.findContours(region.mask, width, height, region.boundingBox);
    
    // Simplify contours using Douglas-Peucker algorithm
    const simplifiedContours = contours.map(contour => 
      this.douglasPeucker(contour, 2.0)
    );

    // Convert to SVG path
    return this.contoursToSVG(simplifiedContours, region.color);
  }

  private static findContours(
    mask: Buffer,
    imageWidth: number,
    imageHeight: number,
    boundingBox: BoundingBox
  ): Point[][] {
    const contours: Point[][] = [];
    const visited = new Set<number>();

    const { x, y, width, height } = boundingBox;

    for (let py = y; py < y + height; py++) {
      for (let px = x; px < x + width; px++) {
        const idx = py * imageWidth + px;
        
        if (mask[idx] && !visited.has(idx)) {
          // Check if this is a boundary pixel
          if (this.isBoundaryPixel(mask, px, py, imageWidth, imageHeight)) {
            const contour = this.traceContour(mask, px, py, imageWidth, imageHeight, visited);
            if (contour.length > 3) {
              contours.push(contour);
            }
          }
        }
      }
    }

    return contours;
  }

  private static isBoundaryPixel(
    mask: Buffer,
    x: number,
    y: number,
    width: number,
    height: number
  ): boolean {
    const idx = y * width + x;
    if (!mask[idx]) return false;

    // Check if any neighbor is not in the region
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
        return true; // Edge of image
      }
      
      const nidx = ny * width + nx;
      if (!mask[nidx]) {
        return true;
      }
    }

    return false;
  }

  private static traceContour(
    mask: Buffer,
    startX: number,
    startY: number,
    width: number,
    height: number,
    visited: Set<number>
  ): Point[] {
    const contour: Point[] = [];
    let x = startX;
    let y = startY;
    let direction = 0; // 0=right, 1=down, 2=left, 3=up

    const directions = [
      [1, 0],   // right
      [0, 1],   // down
      [-1, 0],  // left
      [0, -1]   // up
    ];

    do {
      const idx = y * width + x;
      visited.add(idx);
      contour.push({ x, y });

      // Find next boundary pixel
      let found = false;
      for (let i = 0; i < 8; i++) {
        const checkDir = (direction + i) % 4;
        const [dx, dy] = directions[checkDir];
        const nx = x + dx;
        const ny = y + dy;

        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          if (mask[nidx] && this.isBoundaryPixel(mask, nx, ny, width, height)) {
            x = nx;
            y = ny;
            direction = checkDir;
            found = true;
            break;
          }
        }
      }

      if (!found) break;

      // Stop if we've returned to start
      if (contour.length > 10 && x === startX && y === startY) {
        break;
      }

    } while (contour.length < 10000); // Safety limit

    return contour;
  }

  private static douglasPeucker(points: Point[], epsilon: number): Point[] {
    if (points.length <= 2) return points;

    // Find the point with maximum distance
    let maxDist = 0;
    let maxIndex = 0;
    const start = points[0];
    const end = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const dist = this.perpendicularDistance(points[i], start, end);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }

    // If max distance is greater than epsilon, recursively simplify
    if (maxDist > epsilon) {
      const left = this.douglasPeucker(points.slice(0, maxIndex + 1), epsilon);
      const right = this.douglasPeucker(points.slice(maxIndex), epsilon);
      
      // Combine results (avoid duplicate point)
      return [...left.slice(0, -1), ...right];
    } else {
      return [start, end];
    }
  }

  private static perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    
    if (dx === 0 && dy === 0) {
      // Line start and end are the same
      return Math.sqrt(
        Math.pow(point.x - lineStart.x, 2) + 
        Math.pow(point.y - lineStart.y, 2)
      );
    }

    const t = Math.max(0, Math.min(1, 
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy)
    ));

    const projection = {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy
    };

    return Math.sqrt(
      Math.pow(point.x - projection.x, 2) + 
      Math.pow(point.y - projection.y, 2)
    );
  }

  private static contoursToSVG(contours: Point[][], color: [number, number, number]): string {
    if (contours.length === 0) return '';

    const colorStr = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
    let pathData = '';

    contours.forEach((contour) => {
      if (contour.length < 2) return;

      pathData += `M ${contour[0].x} ${contour[0].y}`;
      
      for (let i = 1; i < contour.length; i++) {
        pathData += ` L ${contour[i].x} ${contour[i].y}`;
      }
      
      pathData += ' Z '; // Close path
    });

    return `
      <path d="${pathData.trim()}" 
            fill="${colorStr}" 
            stroke="none" 
            fill-rule="evenodd"/>
    `;
  }

  static async createSVGFromRegions(
    regions: Region[],
    width: number,
    height: number
  ): Promise<string> {
    const svgPaths: string[] = [];

    // Sort regions by area (larger regions first for proper layering)
    const sortedRegions = [...regions].sort((a, b) => b.area - a.area);

    for (const region of sortedRegions) {
      const pathData = await this.traceRegion(region, width, height);
      if (pathData.trim()) {
        svgPaths.push(pathData);
      }
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${width}" 
           height="${height}" 
           viewBox="0 0 ${width} ${height}">
        ${svgPaths.join('\n        ')}
      </svg>
    `;
  }

  static async createHybridLayer(
    region: Region,
    originalImage: sharp.Sharp,
    width: number,
    height: number
  ): Promise<{ svg: string; raster: Buffer }> {
    // Create SVG path for clean edges
    const svgPath = await this.traceRegion(region, width, height);
    
    // Create raster mask for the region
    const maskBuffer = await this.createRegionMask(region, width, height);
    
    // Apply mask to original image to get raster content
    const rasterContent = await originalImage
      .composite([{ input: maskBuffer, blend: 'dest-in' }])
      .png()
      .toBuffer();

    return {
      svg: svgPath,
      raster: rasterContent
    };
  }

  private static async createRegionMask(
    region: Region,
    width: number,
    height: number
  ): Promise<Buffer> {
    // Create a binary mask image from the region mask buffer
    const maskData = Buffer.alloc(width * height * 4);
    
    for (let i = 0; i < region.mask.length; i++) {
      const maskValue = region.mask[i] ? 255 : 0;
      const idx = i * 4;
      maskData[idx] = maskValue;     // R
      maskData[idx + 1] = maskValue; // G
      maskData[idx + 2] = maskValue; // B
      maskData[idx + 3] = maskValue; // A
    }

    return sharp(maskData, {
      raw: {
        width,
        height,
        channels: 4
      }
    }).png().toBuffer();
  }
}