/**
 * Build script using esbuild
 * Transpiles TypeScript without type checking - much faster than tsc
 * 
 * Usage: node build-esbuild.js
 * 
 * Requirements: npm install --save-dev esbuild glob
 */

const fs = require('fs');
const path = require('path');

// Check if esbuild is installed
try {
  require.resolve('esbuild');
} catch (e) {
  console.error('❌ esbuild is not installed!');
  console.error('📦 Install it with: npm install --save-dev esbuild glob');
  process.exit(1);
}

const esbuild = require('esbuild');

// Simple glob function if glob package is not available
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

console.log('🔨 Building with esbuild (no type checking)...');
console.log('');

try {
  // Find all TypeScript files in src
  const entryPoints = findTsFiles('src');
  
  console.log(`📦 Found ${entryPoints.length} TypeScript files to transpile`);
  console.log('');

  // Remove old dist directory
  if (fs.existsSync('dist')) {
    console.log('🗑️  Removing old dist/ directory...');
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Build with esbuild
  console.log('⚙️  Transpiling with esbuild...');
  esbuild.buildSync({
    entryPoints,
    outdir: 'dist',
    outbase: 'src',
    platform: 'node',
    target: 'es2022',
    format: 'cjs',
    sourcemap: true,
    minify: false,
    keepNames: true,
    bundle: false,
    logLevel: 'warning',
  });

  console.log('✅ Transpilation completed!');
  console.log('');

  // Copy prisma directory if it exists
  if (fs.existsSync('prisma')) {
    console.log('📋 Copying prisma directory...');
    const copyDir = (src, dest) => {
      fs.mkdirSync(dest, { recursive: true });
      const entries = fs.readdirSync(src, { withFileTypes: true });
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
          copyDir(srcPath, destPath);
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    copyDir('prisma', 'dist/prisma');
    console.log('✅ Prisma directory copied');
    console.log('');
  }

  // Show summary
  const distFiles = findTsFiles('dist').length || fs.readdirSync('dist', { recursive: true }).filter(f => f.endsWith('.js')).length;
  console.log('🎉 Build successful!');
  console.log(`📁 Output: dist/ (${distFiles} files)`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Run: npm start');
  console.log('  or');
  console.log('  2. Run: node dist/server.js');
  
  process.exit(0);
} catch (error) {
  console.error('');
  console.error('❌ Build failed!');
  console.error('');
  console.error('Error:', error.message);
  console.error('');
  console.error('💡 Make sure esbuild is installed:');
  console.error('   npm install --save-dev esbuild');
  process.exit(1);
}
