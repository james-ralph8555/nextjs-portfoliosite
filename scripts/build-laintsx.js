const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const lainTSXPath = path.join(__dirname, '../public/lainTSX');
const distPath = path.join(lainTSXPath, 'dist');

console.log('Building lainTSX...');

try {
  // Change to lainTSX directory
  process.chdir(lainTSXPath);
  
  // Install dependencies if node_modules doesn't exist
  if (!fs.existsSync('node_modules')) {
    console.log('Installing lainTSX dependencies...');
    execSync('npm install', { stdio: 'inherit' });
  }
  
  // Build the project
  console.log('Running lainTSX build...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('lainTSX build completed successfully!');
  console.log(`Static files are available at: ${distPath}`);
} catch (error) {
  console.error('Error building lainTSX:', error.message);
  process.exit(1);
}