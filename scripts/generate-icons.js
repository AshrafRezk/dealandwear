/**
 * Builds the Find Your Fit icon set from the official lockup in brand-src/.
 * The rounded-square "f" monogram is cropped from the horizontal lockup, then
 * exported as PWA, maskable, Apple touch and favicon sizes.
 *
 * Usage: node scripts/generate-icons.js
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const root = process.cwd();
const lockup = join(root, 'brand-src', 'Screenshot_2026_08_24_at_11.37.06___PM.png');
const outDir = join(root, 'public', 'icons');
const IVORY = { r: 248, g: 245, b: 239, alpha: 1 };

async function cropMonogram() {
  const meta = await sharp(lockup).metadata();
  // The monogram tile spans roughly 5%-28% of the width and 19%-87% of the height.
  const left = Math.round(meta.width * 0.04);
  const top = Math.round(meta.height * 0.165);
  const size = Math.round(meta.width * 0.245);
  return sharp(lockup).extract({ left, top, width: size, height: Math.min(size, meta.height - top) }).png().toBuffer();
}

/** Square interior of the tile (no rounded corners) plus its background colour. */
async function tileInterior(tile) {
  const meta = await sharp(tile).metadata();
  const inset = Math.round(meta.width * 0.1);
  const side = meta.width - inset * 2;
  const inner = await sharp(tile).extract({ left: inset, top: inset, width: side, height: side }).png().toBuffer();
  const { data } = await sharp(inner).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  return { inner, bg: { r: data[0], g: data[1], b: data[2], alpha: 1 } };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const tile = await cropMonogram();

  for (const size of [192, 512]) {
    const buf = await sharp(tile).resize(size, size, { fit: 'contain', background: IVORY }).png().toBuffer();
    writeFileSync(join(outDir, `icon-${size}x${size}.png`), buf);
  }

  // Maskable: monogram centred inside the 80% safe zone on the tile's own green.
  const { inner: interior, bg } = await tileInterior(tile);
  for (const size of [192, 512]) {
    const inner = Math.round(size * 0.72);
    const art = await sharp(interior).resize(inner, inner, { fit: 'contain', background: bg }).toBuffer();
    const buf = await sharp({ create: { width: size, height: size, channels: 4, background: bg } })
      .composite([{ input: art, gravity: 'center' }])
      .png()
      .toBuffer();
    writeFileSync(join(outDir, `maskable-${size}x${size}.png`), buf);
  }

  const apple = await sharp(tile).resize(180, 180, { fit: 'contain', background: IVORY }).png().toBuffer();
  writeFileSync(join(outDir, 'apple-touch-icon.png'), apple);

  const fav32 = await sharp(tile).resize(32, 32, { fit: 'contain', background: IVORY }).png().toBuffer();
  writeFileSync(join(root, 'public', 'favicon-32.png'), fav32);
  writeFileSync(join(root, 'public', 'logo.png'), await sharp(tile).resize(512, 512).png().toBuffer());

  // Open Graph card: ivory background with the full lockup.
  const og = await sharp(lockup).resize(1000, null).toBuffer();
  const ogCard = await sharp({ create: { width: 1200, height: 630, channels: 4, background: IVORY } })
    .composite([{ input: og, gravity: 'center' }])
    .png()
    .toBuffer();
  writeFileSync(join(root, 'public', 'og-image.png'), ogCard);

  console.log('Find Your Fit icons written to public/ and public/icons/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
