import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [192, 512];

async function generateIcons() {
  for (const size of sizes) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#6366f1" rx="${size * 0.2}"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size * 0.4}" fill="#4f46e5" stroke="white" stroke-width="${size * 0.04}"/>
        <text x="${size/2}" y="${size * 0.6}" font-family="Arial, sans-serif" font-size="${size * 0.35}" font-weight="bold" fill="white" text-anchor="middle">D&amp;W</text>
      </svg>
    `;

    const png = await sharp(Buffer.from(svg))
      .png()
      .toBuffer();

    const outputPath = join(process.cwd(), 'public', 'icons', `icon-${size}x${size}.png`);
    writeFileSync(outputPath, png);
    console.log(`Generated ${outputPath}`);
  }
}

generateIcons().catch(console.error);

