# Synth Skins

This folder contains SVG graphics for synthesizer controls.

## File Structure

- `knob.svg` - High-quality knob graphic with gradients and detailed design
- `led-green.svg` - Green LED states
- `led-amber.svg` - Amber LED states  
- `led-red.svg` - Red LED states
- `led-cyan.svg` - Cyan LED states
- `led-magenta.svg` - Magenta LED states
- `switch-toggle.svg` - Toggle switch graphics
- `screen-bg.svg` - Screen/monitor backgrounds
- `keyboard-white.svg` - White piano keys
- `keyboard-black.svg` - Black piano keys

## Usage

SVG files are loaded as individual images in the synthesizer components. The knob SVG uses an `<image>` element with a rotating overlay for the indicator.

## Performance

Individual SVG files are preloaded in the layout for faster loading. Each file is optimized for size and can be further minified during the build process.