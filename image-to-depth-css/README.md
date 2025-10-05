# Image to Depth CSS

Convert poster graphics and woodcut-style scans to CSS multi-layer parallax assets.

## Overview

This tool implements a comprehensive pipeline for converting 2D graphics into layered parallax assets, specifically optimized for:

- **Flat poster graphics** with limited color palettes
- **Woodcut/etching scans** with line work and hatching
- **Mixed media** combining flat art with photorealistic elements

## Features

### 🎨 Smart Image Classification
- Automatic detection of image type (poster/woodcut/mixed)
- Type-specific processing optimizations
- Adaptive color quantization based on content

### 🔧 Advanced Processing Pipeline
- **Layer-first decomposition** (not depth-first)
- Palette quantization with connected region analysis
- Vectorization support for clean SVG edges
- Optional depth estimation for subtle relief effects
- Z-ordering algorithm with adjacency graph resolution

### 📦 Asset Generation
- PNG/SVG/Hybrid output formats
- Trimmed bounding boxes for optimal file sizes
- CSS parallax manifest with layer metadata
- Interactive HTML demo with JavaScript controller

### 🚀 Performance Optimized
- Efficient image processing with Sharp
- Layer optimization for web delivery
- Responsive CSS generation
- Mobile-friendly touch support

## Installation

```bash
npm install -g image-to-depth-css
```

Or clone and build locally:

```bash
git clone <repository-url>
cd image-to-depth-css
npm install
npm run build
npm link
```

## Quick Start

### Process a single image:

```bash
image-to-depth-css process poster.jpg --output ./assets --colors 8 --depth
```

### Analyze an image first:

```bash
image-to-depth-css analyze poster.jpg
```

### Batch process multiple images:

```bash
image-to-depth-css batch "*.png" --output ./batch-output
```

## CLI Commands

### `process`
Process a single image into parallax layers.

```bash
image-to-depth-css process <image> [options]
```

**Options:**
- `-o, --output <dir>` - Output directory (default: ./output)
- `-c, --colors <number>` - Maximum colors (default: 8)
- `-f, --format <format>` - Output format: png, svg, hybrid (default: png)
- `-d, --depth` - Enable depth estimation
- `-b, --depth-bands <number>` - Depth bands (default: 4)
- `-v, --vectorize` - Enable vectorization
- `-p, --perspective <number>` - CSS perspective (default: 1000)
- `--no-css` - Skip CSS generation
- `--no-html` - Skip HTML generation
- `--no-js` - Skip JavaScript generation

### `batch`
Process multiple images using glob patterns.

```bash
image-to-depth-css batch <pattern> [options]
```

### `analyze`
Analyze image characteristics without processing.

```bash
image-to-depth-css analyze <image>
```

### `demo`
Generate demo setup with sample configurations.

```bash
image-to-depth-css demo [options]
```

## Output Structure

```
output/
├── parallax-manifest.json    # Layer metadata
├── parallax.css             # CSS styles
├── parallax.js              # JavaScript controller
├── demo.html                # Interactive demo
├── layers_preview.png       # Composite preview
├── layer_0_region_*.png     # Layer assets
├── layer_1_region_*.png
└── paper_texture.png        # Woodcut paper texture (if applicable)
```

## Image Type Recommendations

### Poster Graphics
- **Colors:** 6-12 for best results
- **Vectorization:** Enabled for clean edges
- **Depth:** Optional for subtle relief
- **Format:** Hybrid recommended

### Woodcut Scans
- **Colors:** 2-4 maximum
- **Vectorization:** Disabled for authentic texture
- **Depth:** Not recommended
- **Format:** PNG recommended
- **Special:** Automatic paper texture layer

### Mixed Media
- **Colors:** 8-12
- **Vectorization:** Consider hybrid approach
- **Depth:** Recommended
- **Format:** Hybrid or SVG

## API Usage

```javascript
import ImageToDepthCss from 'image-to-depth-css';

const processor = new ImageToDepthCss({
  maxColors: 8,
  useDepth: true,
  vectorize: true,
  outputFormat: 'hybrid',
  outputDir: './assets',
  generateCSS: true,
  generateHTML: true
});

const result = await processor.processImage('poster.jpg');
console.log(`Generated ${result.manifest.layers.length} layers`);
```

## CSS Integration

The generated CSS provides:

```css
.parallax-container {
  perspective: 1000px;
  transform-style: preserve-3d;
}

.parallax-layer {
  transform: translateZ(var(--depth)) scale(var(--scale));
  will-change: transform;
}
```

### HTML Structure:

```html
<div class="parallax-container">
  <div class="parallax-layer" data-layer="layer_0"></div>
  <div class="parallax-layer" data-layer="layer_1"></div>
  <!-- ... more layers -->
</div>
```

### JavaScript Controller:

```javascript
const controller = new ParallaxController('parallax-container', manifest);
controller.toggleScrolling();
controller.setLayerSpeed('layer_0', 0.8);
```

## Advanced Configuration

### Custom Layer Options

```javascript
const options = {
  maxColors: 12,
  useDepth: true,
  depthBands: 6,
  vectorize: true,
  outputFormat: 'hybrid',
  perspective: 1500,
  containerSize: { width: 1200, height: 800 }
};
```

### Manifest Customization

```javascript
const manifest = await ManifestGenerator.generateManifest(
  layers,
  imageType,
  imageSize,
  outputDir,
  {
    perspective: 1200,
    cssOutput: true,
    htmlOutput: true,
    containerSize: { width: 800, height: 600 }
  }
);
```

## Performance Tips

1. **Image Size:** Process images at 1024-2048px for optimal performance
2. **Color Count:** Use minimum colors needed for quality
3. **Format Choice:** 
   - PNG for photographs/texture
   - SVG for clean vector graphics
   - Hybrid for mixed content
4. **Depth Estimation:** Disable for simple graphics to speed up processing

## Browser Support

- **Modern Browsers:** Full support with CSS 3D transforms
- **Mobile:** Touch-enabled parallax with reduced motion support
- **Fallback:** Static layers for older browsers

## Troubleshooting

### Common Issues

**"Invalid image file"**
- Ensure image is in supported format (PNG, JPG, WebP, TIFF)
- Check file permissions and path

**"Too many regions generated"**
- Reduce color count with `-c` option
- Try pre-processing image to reduce noise

**"Poor depth estimation"**
- Depth works best on natural images
- For stylized art, rely on layering instead
- Disable with `--no-depth` flag

**"Large file sizes"**
- Use PNG optimization
- Consider SVG format for simple graphics
- Reduce image dimensions before processing

### Debug Mode

Enable verbose logging:

```bash
DEBUG=image-to-depth-css:* image-to-depth-css process image.jpg
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Architecture

The tool follows a **layer-first, not depth-first** approach:

1. **Classification** - Detect image type and characteristics
2. **Canonicalization** - Normalize resolution and apply preprocessing
3. **Decomposition** - Palette quantization → region masks → adjacency graph
4. **Depth Assistance** - Optional depth for intra-region relief
5. **Z-Ordering** - Human-in-the-loop sorting with conflict resolution
6. **Asset Baking** - Generate optimized PNG/SVG layers
7. **Manifest Generation** - Create CSS/HTML/JS for parallax effects

This approach ensures reliable results for stylized art where monocular depth models typically fail.

## References

- [Depth Anything V2 Paper](https://arxiv.org/abs/2406.09414)
- [Pure CSS Parallax](https://dev.to/ingosteinke/pure-css-parallax-perspective-beyond-landscape-images-24g2)
- [Modified Median Cut Quantization](https://en.wikipedia.org/wiki/Median_cut)
- [Douglas-Peucker Algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)