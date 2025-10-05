export type ImageType = 'poster' | 'woodcut' | 'mixed';

export interface LayerOptions {
  maxColors?: number;
  useDepth?: boolean;
  depthBands?: number;
  vectorize?: boolean;
  outputFormat?: 'png' | 'svg' | 'hybrid';
}

export interface Region {
  id: string;
  color: [number, number, number];
  mask: Buffer;
  boundingBox: BoundingBox;
  area: number;
  adjacency: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Layer {
  id: string;
  type: 'region' | 'depth' | 'texture';
  zIndex: number;
  parallaxSpeed: number;
  boundingBox: BoundingBox;
  format: 'png' | 'svg';
  data: Buffer | string;
  anchor: { x: number; y: number };
  naturalSize: { width: number; height: number };
  depthBand?: number;
}

export interface ParallaxManifest {
  version: '1.0';
  originalImage: {
    width: number;
    height: number;
    type: ImageType;
  };
  layers: Layer[];
  perspective: number;
  containerSize: {
    width: number;
    height: number;
  };
}

export interface ProcessingResult {
  manifest: ParallaxManifest;
  outputDir: string;
  processingTime: number;
}