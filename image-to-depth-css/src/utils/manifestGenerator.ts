import * as fs from 'fs/promises';
import * as path from 'path';
import { Layer, ParallaxManifest, ImageType } from '../types';

export interface ManifestOptions {
  perspective?: number;
  containerSize?: { width: number; height: number };
  cssOutput?: boolean;
  htmlOutput?: boolean;
}

export class ManifestGenerator {
  /**
   * Generate CSS parallax manifest from layers
   */
  static async generateManifest(
    layers: Layer[],
    originalImageType: ImageType,
    originalImageSize: { width: number; height: number },
    outputDir: string,
    options: ManifestOptions = {}
  ): Promise<ParallaxManifest> {
    const manifest: ParallaxManifest = {
      version: '1.0',
      originalImage: {
        width: originalImageSize.width,
        height: originalImageSize.height,
        type: originalImageType
      },
      layers: this.sortLayersByZIndex(layers),
      perspective: options.perspective || 1000,
      containerSize: options.containerSize || originalImageSize
    };

    // Save manifest JSON
    const manifestPath = path.join(outputDir, 'parallax-manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    // Generate optional CSS and HTML
    if (options.cssOutput) {
      await this.generateCSS(manifest, outputDir);
    }

    if (options.htmlOutput) {
      await this.generateHTML(manifest, outputDir);
    }

    return manifest;
  }

  /**
   * Sort layers by z-index (background to foreground)
   */
  private static sortLayersByZIndex(layers: Layer[]): Layer[] {
    return [...layers].sort((a, b) => a.zIndex - b.zIndex);
  }

  /**
   * Generate CSS for parallax effect
   */
  private static async generateCSS(manifest: ParallaxManifest, outputDir: string): Promise<void> {
    const css = this.generateCSSContent(manifest);
    const cssPath = path.join(outputDir, 'parallax.css');
    await fs.writeFile(cssPath, css);
  }

  /**
   * Generate CSS content
   */
  private static generateCSSContent(manifest: ParallaxManifest): string {
    const { containerSize, perspective, layers } = manifest;

    let css = `/* CSS Parallax Styles for ${manifest.originalImage.type} Image */
.parallax-container {
  position: relative;
  width: ${containerSize.width}px;
  height: ${containerSize.height}px;
  perspective: ${perspective}px;
  overflow: hidden;
  transform-style: preserve-3d;
}

.parallax-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}

`;

    // Generate layer-specific styles
    layers.forEach((layer) => {
      const translateZ = this.calculateTranslateZ(layer, layers.length);
      const scale = this.calculateScale(layer, layers.length);

      css += `.parallax-layer[data-layer="${layer.id}"] {
  z-index: ${layer.zIndex};
  transform: translateZ(${translateZ}px) scale(${scale});
  background-image: url('${layer.id}.${layer.format}');
  background-position: ${-layer.boundingBox.x}px ${-layer.boundingBox.y}px;
  background-size: ${containerSize.width}px ${containerSize.height}px;
  background-repeat: no-repeat;
}

`;

      // Add hover effect for interactive layers
      if (layer.type === 'region') {
        css += `.parallax-layer[data-layer="${layer.id}"]:hover {
  transform: translateZ(${translateZ + 20}px) scale(${scale * 1.05});
  transition: transform 0.3s ease;
}

`;
      }
    });

    // Add animation keyframes
    css += `
@keyframes parallax-scroll {
  0% {
    transform: translateZ(0px) translateY(0px);
  }
  100% {
    transform: translateZ(0px) translateY(-50px);
  }
}

.parallax-container.scrolling .parallax-layer {
  animation: parallax-scroll 10s linear infinite;
}

`;

    // Responsive styles
    css += `
@media (max-width: 768px) {
  .parallax-container {
    perspective: ${perspective / 2}px;
  }
  
  .parallax-layer {
    transition: transform 0.1s ease-out;
  }
}
`;

    return css;
  }

  /**
   * Generate HTML demo
   */
  private static async generateHTML(manifest: ParallaxManifest, outputDir: string): Promise<void> {
    const html = this.generateHTMLContent(manifest);
    const htmlPath = path.join(outputDir, 'demo.html');
    await fs.writeFile(htmlPath, html);
  }

  /**
   * Generate HTML content
   */
  private static generateHTMLContent(manifest: ParallaxManifest): string {
    const { containerSize, layers } = manifest;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Parallax Demo - ${manifest.originalImage.type}</title>
    <link rel="stylesheet" href="parallax.css">
    <style>
        body {
            margin: 0;
            padding: 20px;
            font-family: Arial, sans-serif;
            background: #f0f0f0;
        }
        
        .demo-container {
            max-width: ${containerSize.width}px;
            margin: 0 auto;
        }
        
        .controls {
            margin-bottom: 20px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .controls button {
            margin: 5px;
            padding: 8px 16px;
            border: none;
            border-radius: 3px;
            background: #007bff;
            color: white;
            cursor: pointer;
        }
        
        .controls button:hover {
            background: #0056b3;
        }
        
        .info {
            margin-top: 20px;
            padding: 10px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .layer-info {
            margin: 5px 0;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>Parallax Demo - ${manifest.originalImage.type}</h1>
        
        <div class="controls">
            <button onclick="toggleScrolling()">Toggle Scrolling</button>
            <button onclick="resetView()">Reset View</button>
            <button onclick="toggleLayerVisibility()">Toggle Layers</button>
        </div>
        
        <div class="parallax-container" id="parallaxContainer">
            ${layers.map(layer => `
                <div class="parallax-layer" 
                     data-layer="${layer.id}" 
                     data-speed="${layer.parallaxSpeed}"
                     title="${layer.type} layer - Speed: ${layer.parallaxSpeed.toFixed(2)}">
                </div>
            `).join('')}
        </div>
        
        <div class="info">
            <h3>Layer Information</h3>
            <p>Original Image: ${manifest.originalImage.width}x${manifest.originalImage.height}px</p>
            <p>Total Layers: ${layers.length}</p>
            <div id="layerDetails">
                ${layers.map(layer => `
                    <div class="layer-info">
                        <strong>${layer.id}</strong>: 
                        Type: ${layer.type}, 
                        Z-Index: ${layer.zIndex}, 
                        Speed: ${layer.parallaxSpeed.toFixed(2)},
                        Format: ${layer.format}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>

    <script>
        let isScrolling = false;
        let layersVisible = true;
        
        function toggleScrolling() {
            const container = document.getElementById('parallaxContainer');
            isScrolling = !isScrolling;
            
            if (isScrolling) {
                container.classList.add('scrolling');
            } else {
                container.classList.remove('scrolling');
            }
        }
        
        function resetView() {
            const container = document.getElementById('parallaxContainer');
            container.classList.remove('scrolling');
            isScrolling = false;
            
            // Reset layer transforms
            const layers = container.querySelectorAll('.parallax-layer');
            layers.forEach(layer => {
                layer.style.transform = '';
            });
        }
        
        function toggleLayerVisibility() {
            const container = document.getElementById('parallaxContainer');
            layersVisible = !layersVisible;
            
            const layers = container.querySelectorAll('.parallax-layer');
            layers.forEach(layer => {
                layer.style.opacity = layersVisible ? '1' : '0.3';
            });
        }
        
        // Mouse parallax effect
        document.addEventListener('mousemove', (e) => {
            if (isScrolling) return;
            
            const container = document.getElementById('parallaxContainer');
            const rect = container.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;
            
            const layers = container.querySelectorAll('.parallax-layer');
            layers.forEach(layer => {
                const speed = parseFloat(layer.dataset.speed);
                const moveX = mouseX * speed * 0.02;
                const moveY = mouseY * speed * 0.02;
                
                const currentTransform = window.getComputedStyle(layer).transform;
                layer.style.transform = \`\${currentTransform} translate(\${moveX}px, \${moveY}px)\`;
            });
        });
    </script>
</body>
</html>`;
  }

  /**
   * Calculate translateZ value for layer
   */
  private static calculateTranslateZ(layer: Layer, totalLayers: number): number {
    // Background layers (lower z-index) get negative translateZ
    // Foreground layers get positive translateZ
    const normalizedZ = layer.zIndex / Math.max(1, totalLayers - 1);
    return (normalizedZ - 0.5) * 1000; // Range: -500 to 500
  }

  /**
   * Calculate scale for layer to maintain size
   */
  private static calculateScale(layer: Layer, totalLayers: number): number {
    const translateZ = this.calculateTranslateZ(layer, totalLayers);
    const perspective = 1000;
    
    // Scale to compensate for perspective
    if (translateZ < 0) {
      return perspective / (perspective + Math.abs(translateZ));
    }
    return 1;
  }

  /**
   * Generate JavaScript for dynamic parallax
   */
  static async generateJavaScript(manifest: ParallaxManifest, outputDir: string): Promise<void> {
    const js = this.generateJSContent(manifest);
    const jsPath = path.join(outputDir, 'parallax.js');
    await fs.writeFile(jsPath, js);
  }

  /**
   * Generate JavaScript content
   */
  private static generateJSContent(manifest: ParallaxManifest): string {
    return `// Dynamic Parallax Controller
class ParallaxController {
  constructor(containerId, manifest) {
    this.container = document.getElementById(containerId);
    this.manifest = manifest;
    this.layers = [];
    this.isScrolling = false;
    this.mouseX = 0;
    this.mouseY = 0;
    
    this.init();
  }
  
  init() {
    // Initialize layers
    this.layers = Array.from(this.container.querySelectorAll('.parallax-layer'));
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start animation loop
    this.animate();
  }
  
  setupEventListeners() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
    
    // Scroll events
    window.addEventListener('scroll', () => {
      this.updateScrollParallax();
    });
    
    // Touch events for mobile
    this.container.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouseX = e.touches[0].clientX;
        this.mouseY = e.touches[0].clientY;
      }
    });
  }
  
  updateScrollParallax() {
    const scrollY = window.pageYOffset;
    const containerRect = this.container.getBoundingClientRect();
    
    this.layers.forEach((layer, index) => {
      const layerData = this.manifest.layers[index];
      if (!layerData) return;
      
      const speed = layerData.parallaxSpeed;
      const yOffset = scrollY * speed * 0.5;
      
      layer.style.transform = \`translateY(\${yOffset}px)\`;
    });
  }
  
  updateMouseParallax() {
    const containerRect = this.container.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;
    
    const mouseX = this.mouseX - centerX;
    const mouseY = this.mouseY - centerY;
    
    this.layers.forEach((layer, index) => {
      const layerData = this.manifest.layers[index];
      if (!layerData) return;
      
      const speed = layerData.parallaxSpeed;
      const moveX = mouseX * speed * 0.02;
      const moveY = mouseY * speed * 0.02;
      
      const translateZ = this.calculateTranslateZ(layerData);
      const scale = this.calculateScale(layerData);
      
      layer.style.transform = \`translateZ(\${translateZ}px) scale(\${scale}) translate(\${moveX}px, \${moveY}px)\`;
    });
  }
  
  calculateTranslateZ(layer) {
    const totalLayers = this.manifest.layers.length;
    const normalizedZ = layer.zIndex / Math.max(1, totalLayers - 1);
    return (normalizedZ - 0.5) * 1000;
  }
  
  calculateScale(layer) {
    const translateZ = this.calculateTranslateZ(layer);
    const perspective = this.manifest.perspective;
    
    if (translateZ < 0) {
      return perspective / (perspective + Math.abs(translateZ));
    }
    return 1;
  }
  
  animate() {
    if (!this.isScrolling) {
      this.updateMouseParallax();
    }
    
    requestAnimationFrame(() => this.animate());
  }
  
  // Public methods
  toggleScrolling() {
    this.isScrolling = !this.isScrolling;
  }
  
  reset() {
    this.layers.forEach(layer => {
      layer.style.transform = '';
    });
  }
  
  setLayerSpeed(layerId, speed) {
    const layer = this.container.querySelector(\`[data-layer="\${layerId}"]\`);
    if (layer) {
      layer.dataset.speed = speed;
    }
  }
}

// Initialize with manifest
const manifest = ${JSON.stringify(manifest, null, 2)};
const parallaxController = new ParallaxController('parallaxContainer', manifest);

// Export for global access
window.ParallaxController = parallaxController;
`;
  }
}