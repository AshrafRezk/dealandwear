import sharp from 'sharp';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

const sizes = [192, 512];

async function generateIcons() {
  const logoPath = join(process.cwd(), 'public', 'logo.png');
  
  try {
    // Check if logo exists
    const logoBuffer = readFileSync(logoPath);
    
    for (const size of sizes) {
      const png = await sharp(logoBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .png()
        .toBuffer();

      const outputPath = join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`);
      writeFileSync(outputPath, png);
      console.log(`Generated ${outputPath}`);
    }
  } catch (error) {
    console.error('Error generating icons from logo:', error);
    // Fallback to simple colored icons if logo not found
    for (const size of sizes) {
      const svg = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="#1d1d1f" rx="${size * 0.2}"/>
          <text x="${size/2}" y="${size * 0.6}" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle">D&amp;W</text>
        </svg>
      `;

      const png = await sharp(Buffer.from(svg))
        .png()
        .toBuffer();

      const outputPath = join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`);
      writeFileSync(outputPath, png);
      console.log(`Generated fallback ${outputPath}`);
    }
  }
}

generateIcons().catch(console.error);

