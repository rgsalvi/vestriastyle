#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const args = process.argv.slice(2);
let targetArg = null;
const dirFlagIdx = args.findIndex(a => a === '--dir');
if (dirFlagIdx !== -1 && args[dirFlagIdx + 1]) {
  targetArg = args[dirFlagIdx + 1];
} else {
  // Fallback: accept a single positional argument for convenience (npm on Windows)
  const firstNonFlag = args.find(a => !a.startsWith('-'));
  if (firstNonFlag) targetArg = firstNonFlag;
}
if (!targetArg) {
  console.error('Usage: node scripts/convertToWebp.mjs --dir <folder>\n       or: node scripts/convertToWebp.mjs <folder>');
  process.exit(1);
}
const targetDir = path.resolve(process.cwd(), targetArg);

async function main() {
  const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
  const pngs = entries.filter(e => e.isFile() && e.name.toLowerCase().endsWith('.png'));
  if (pngs.length === 0) {
    console.log('No PNG files found in', targetDir);
    return;
  }
  for (const f of pngs) {
    const inPath = path.join(targetDir, f.name);
    const outPath = inPath.replace(/\.png$/i, '.webp');
    if (fs.existsSync(outPath)) {
      console.log('Skip (exists):', path.basename(outPath));
      continue;
    }
    try {
      await sharp(inPath).webp({ quality: 85 }).toFile(outPath);
      console.log('Converted:', f.name, '->', path.basename(outPath));
    } catch (e) {
      console.error('Failed:', f.name, e);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
