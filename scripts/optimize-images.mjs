import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const inputs = [
  { src: path.join(projectRoot, 'tanvi.jpg'), outBase: 'tanvi' },
  { src: path.join(projectRoot, 'muskaan.jpg'), outBase: 'muskaan' },
  { src: path.join(projectRoot, 'riddhi.jpg'), outBase: 'riddhi' },
];

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function optimizeOne({ src, outBase }) {
  if (!(await exists(src))) {
    console.warn(`[skip] Missing source image: ${path.relative(projectRoot, src)}`);
    return;
  }
  const img = sharp(src);
  const webpPath = path.join(projectRoot, `${outBase}.webp`);
  const jpgPath = path.join(projectRoot, `${outBase}.opt.jpg`);

  await img
    .webp({ quality: 72, effort: 5 })
    .toFile(webpPath);

  // Recreate pipeline for jpeg to avoid format carry-over
  await sharp(src)
    .jpeg({ quality: 78, progressive: true, mozjpeg: true })
    .toFile(jpgPath);

  console.log(`[ok] ${path.basename(src)} -> ${path.basename(webpPath)} & ${path.basename(jpgPath)}`);
}

async function main() {
  for (const item of inputs) {
    await optimizeOne(item);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
