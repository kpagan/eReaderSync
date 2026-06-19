const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;
const srcDir = path.join(rootDir, 'src');
const distDir = path.join(rootDir, 'dist');
const srcPublicDir = path.join(srcDir, 'public');
const distPublicDir = path.join(distDir, 'public');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function copyFile(srcPath, destPath) {
  ensureDir(path.dirname(destPath));
  fs.copyFileSync(srcPath, destPath);
}

function copyAssets(srcPath, destPath) {
  if (!fs.existsSync(srcPath)) return;
  const entries = fs.readdirSync(srcPath, { withFileTypes: true });
  entries.forEach(entry => {
    const sourceEntry = path.join(srcPath, entry.name);
    const destEntry = path.join(destPath, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'src') return;
      copyAssets(sourceEntry, destEntry);
    } else {
      console.log(`Copying ${sourceEntry} to ${destEntry}`);
      copyFile(sourceEntry, destEntry);
    }
  });
}

console.log('Cleaning dist folder...');
rmDir(distDir);
console.log('Creating dist folder...');
ensureDir(distPublicDir);
console.log('Copying files...');
copyAssets(srcPublicDir, distPublicDir);
copyFile(path.join(srcDir, 'server.js'), path.join(distDir, 'server.js'));

console.log('Copy complete.');
