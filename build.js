const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const srcPublicDir = path.join(srcDir, 'public');
const distPublicDir = path.join(distDir, 'public');

function ensureDir(dir) {
  console.log(`Creating ${dir} folder...`);
  fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    console.log(`Cleaning ${dir} folder...`);
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyFile(srcPath, destPath) {
  console.log(`Copying ${srcPath} to ${destPath}`);
  fs.copyFileSync(srcPath, destPath);
}

rmDir(distDir);
ensureDir(distPublicDir);
copyFile(path.join(srcDir, 'server.js'), path.join(distDir, 'server.js'));
console.log('Copy complete.');
