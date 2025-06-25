import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SVGコンテンツ
const svgContent = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="triangleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
    </linearGradient>
  </defs>
  <path d="M256 64 L448 416 L64 416 Z" fill="url(#triangleGradient)" />
</svg>`;

// 各サイズでPNGを生成
const sizes = [16, 32, 180, 192, 512];

async function generateFavicons() {
  const svgBuffer = Buffer.from(svgContent);
  
  for (const size of sizes) {
    const outputPath = join(__dirname, '..', 'static', 
      size === 32 ? 'favicon.png' : `favicon-${size}.png`
    );
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`Generated ${outputPath}`);
  }
  
  // Apple Touch Icon用
  const appleTouchIconPath = join(__dirname, '..', 'static', 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(appleTouchIconPath);
  console.log(`Generated ${appleTouchIconPath}`);
}

generateFavicons().catch(console.error);