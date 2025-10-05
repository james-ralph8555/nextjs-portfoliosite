#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';
import ImageToDepthCss from './index';
import { LayerOptions } from './types';

const program = new Command();

program
  .name('image-to-depth-css')
  .description('Convert poster graphics and woodcut-style scans to CSS multi-layer parallax assets')
  .version('1.0.0');

program
  .command('process')
  .description('Process a single image')
  .argument('<image>', 'Input image path')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-c, --colors <number>', 'Maximum number of colors', '8')
  .option('-f, --format <format>', 'Output format (png, svg, hybrid)', 'png')
  .option('-d, --depth', 'Use depth estimation', false)
  .option('-b, --depth-bands <number>', 'Number of depth bands', '4')
  .option('-v, --vectorize', 'Enable vectorization', false)
  .option('-p, --perspective <number>', 'CSS perspective value', '1000')
  .option('--no-css', 'Skip CSS generation')
  .option('--no-html', 'Skip HTML generation')
  .option('--no-js', 'Skip JavaScript generation')
  .option('--type <type>', 'Force image type (poster, woodcut, mixed)')
  .action(async (imagePath: string, options: any) => {
    try {
      console.log(chalk.blue.bold('🎨 Image to Depth CSS Processor'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Validate input
      if (!await ImageToDepthCss.validateImage(imagePath)) {
        console.error(chalk.red('❌ Invalid image file or file not found'));
        process.exit(1);
      }
      
      // Parse options
      const layerOptions: LayerOptions = {
        maxColors: parseInt(options.colors),
        useDepth: options.depth,
        depthBands: parseInt(options.depthBands),
        vectorize: options.vectorize,
        outputFormat: options.format as 'png' | 'svg' | 'hybrid'
      };
      
      console.log(chalk.yellow('📋 Configuration:'));
      console.log(`   Input: ${imagePath}`);
      console.log(`   Output: ${options.output}`);
      console.log(`   Max Colors: ${layerOptions.maxColors}`);
      console.log(`   Format: ${layerOptions.outputFormat}`);
      console.log(`   Depth: ${layerOptions.useDepth ? 'Enabled' : 'Disabled'}`);
      console.log(`   Vectorize: ${layerOptions.vectorize ? 'Enabled' : 'Disabled'}`);
      console.log();
      
      // Process image
      const processor = new ImageToDepthCss({
        ...layerOptions,
        outputDir: options.output,
        perspective: parseInt(options.perspective),
        generateCSS: options.css,
        generateHTML: options.html,
        generateJS: options.js
      });
      
      const result = await processor.processImage(imagePath);
      
      // Display results
      console.log(chalk.green.bold('✅ Processing Complete!'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.yellow('📊 Results:'));
      console.log(`   Processing Time: ${result.processingTime}ms`);
      console.log(`   Layers Generated: ${result.manifest.layers.length}`);
      console.log(`   Output Directory: ${result.outputDir}`);
      console.log();
      
      console.log(chalk.yellow('📁 Generated Files:'));
      const files = await fs.readdir(result.outputDir);
      files.forEach(file => {
        console.log(`   📄 ${file}`);
      });
      
      console.log();
      console.log(chalk.green('🎉 Parallax assets ready for use!'));
      console.log(chalk.gray(`Open ${path.join(result.outputDir, 'demo.html')} to preview`));
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('batch')
  .description('Process multiple images')
  .argument('<pattern>', 'Glob pattern for images (e.g., "*.png", "images/*.jpg")')
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-c, --colors <number>', 'Maximum number of colors', '8')
  .option('-f, --format <format>', 'Output format (png, svg, hybrid)', 'png')
  .option('-d, --depth', 'Use depth estimation', false)
  .option('-b, --depth-bands <number>', 'Number of depth bands', '4')
  .option('-v, --vectorize', 'Enable vectorization', false)
  .option('-p, --perspective <number>', 'CSS perspective value', '1000')
  .option('--no-css', 'Skip CSS generation')
  .option('--no-html', 'Skip HTML generation')
  .option('--no-js', 'Skip JavaScript generation')
  .action(async (pattern: string, options: any) => {
    try {
      console.log(chalk.blue.bold('🔄 Batch Processing Mode'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Find matching files (simple implementation)
      const files = [pattern]; // Simplified for now
      
      if (files.length === 0) {
        console.error(chalk.red('❌ No files found matching pattern:', pattern));
        process.exit(1);
      }
      
      console.log(chalk.yellow(`📁 Found ${files.length} images to process`));
      console.log();
      
      // Parse options
      const layerOptions: LayerOptions = {
        maxColors: parseInt(options.colors),
        useDepth: options.depth,
        depthBands: parseInt(options.depthBands),
        vectorize: options.vectorize,
        outputFormat: options.format as 'png' | 'svg' | 'hybrid'
      };
      
      // Process batch
      const processor = new ImageToDepthCss({
        ...layerOptions,
        outputDir: options.output,
        perspective: parseInt(options.perspective),
        generateCSS: options.css,
        generateHTML: options.html,
        generateJS: options.js
      });
      
      const results = await processor.processBatch(files);
      
      // Display results
      console.log(chalk.green.bold('✅ Batch Processing Complete!'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(chalk.yellow('📊 Summary:'));
      console.log(`   Total Images: ${files.length}`);
      console.log(`   Successful: ${results.length}`);
      console.log(`   Failed: ${files.length - results.length}`);
      console.log();
      
      if (results.length > 0) {
        console.log(chalk.yellow('📁 Processed Images:'));
        results.forEach(result => {
          const imageName = path.basename(result.outputDir);
          console.log(`   ✅ ${imageName} (${result.manifest.layers.length} layers)`);
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('analyze')
  .description('Analyze an image without processing')
  .argument('<image>', 'Input image path')
  .action(async (imagePath: string) => {
    try {
      console.log(chalk.blue.bold('🔍 Image Analysis'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Validate input
      if (!await ImageToDepthCss.validateImage(imagePath)) {
        console.error(chalk.red('❌ Invalid image file or file not found'));
        process.exit(1);
      }
      
      // Get image info
      const metadata = await sharp(imagePath).metadata();
      
      console.log(chalk.yellow('📋 Image Information:'));
      console.log(`   File: ${imagePath}`);
      console.log(`   Size: ${metadata.width}x${metadata.height}`);
      console.log(`   Format: ${metadata.format}`);
      console.log(`   Color Space: ${metadata.space || 'unknown'}`);
      console.log(`   Has Alpha: ${metadata.hasAlpha ? 'Yes' : 'No'}`);
      
      // Classify image
      const { ImageProcessor } = await import('./utils/imageUtils');
      const imageType = await ImageProcessor.classifyImage(imagePath);
      
      console.log();
      console.log(chalk.yellow('🎨 Classification:'));
      console.log(`   Type: ${chalk.bold(imageType)}`);
      
      // Recommendations
      console.log();
      console.log(chalk.yellow('💡 Recommendations:'));
      
      switch (imageType) {
        case 'poster':
          console.log('   • Use 6-12 colors for best results');
          console.log('   • Enable vectorization for clean edges');
          console.log('   • Depth estimation can add subtle relief');
          break;
        case 'woodcut':
          console.log('   • Use 2-4 colors maximum');
          console.log('   • Disable vectorization for authentic texture');
          console.log('   • Paper texture layer will be added automatically');
          break;
        case 'mixed':
          console.log('   • Use 8-12 colors');
          console.log('   • Consider hybrid output format');
          console.log('   • Depth estimation recommended');
          break;
      }
      
      console.log();
      console.log(chalk.green('✅ Analysis complete!'));
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

program
  .command('demo')
  .description('Generate demo with sample images')
  .option('-o, --output <dir>', 'Output directory', './demo-output')
  .action(async (options) => {
    try {
      console.log(chalk.blue.bold('🎨 Demo Generation'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Create demo directory
      await fs.mkdir(options.output, { recursive: true });
      
      // Generate sample configuration
      const config = {
        images: [
          {
            name: 'poster-sample',
            type: 'poster',
            description: 'Sample poster-style image',
            options: {
              maxColors: 8,
              useDepth: true,
              vectorize: true,
              outputFormat: 'hybrid'
            }
          },
          {
            name: 'woodcut-sample',
            type: 'woodcut',
            description: 'Sample woodcut-style image',
            options: {
              maxColors: 4,
              useDepth: false,
              vectorize: false,
              outputFormat: 'png'
            }
          }
        ]
      };
      
      // Save configuration
      const configPath = path.join(options.output, 'demo-config.json');
      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      console.log(chalk.yellow('📁 Demo setup created:'));
      console.log(`   Directory: ${options.output}`);
      console.log(`   Config: ${configPath}`);
      console.log();
      console.log(chalk.green('💡 To use the demo:'));
      console.log('   1. Add your images to the demo directory');
      console.log('   2. Update the config.json with your image paths');
      console.log('   3. Run: image-to-depth-css process <image-path>');
      
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(chalk.red('❌ Uncaught Error:'), error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});