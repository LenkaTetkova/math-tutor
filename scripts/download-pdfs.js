#!/usr/bin/env node
/**
 * Downloads CERMAT math exam PDFs and answer keys.
 */
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data', 'pdfs');

mkdirSync(DATA_DIR, { recursive: true });

const BASE = 'https://prijimacky.cermat.cz/files/files';

// Build list of all PDFs to download
const tests = [];
for (let year = 2017; year <= 2025; year++) {
  for (const term of ['A', 'B', 'C', 'D']) {
    tests.push({ year, term, type: 'test',   url: `${BASE}/M9${term}_${year}_TS.pdf` });
    tests.push({ year, term, type: 'key',    url: `${BASE}/M9${term}_${year}_rozsireny_klic.pdf` });
    // Solution guides (not all years have them)
    tests.push({ year, term, type: 'solution', url: `${BASE}/M9${term}_${year}_vzorove_reseni.pdf` });
    tests.push({ year, term, type: 'solution', url: `${BASE}/M9${term}_${year}_pruvodce_resenimi.pdf` });
  }
}

async function download(url, destPath) {
  if (existsSync(destPath)) {
    console.log(`  SKIP (exists): ${path.basename(destPath)}`);
    return true;
  }
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    if (res.status === 404) return false;
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  await pipeline(res.body, createWriteStream(destPath));
  return true;
}

// Only download a specific subset when called with args
const args = process.argv.slice(2);
let toDownload = tests;
if (args.includes('--year')) {
  const y = parseInt(args[args.indexOf('--year') + 1]);
  toDownload = tests.filter(t => t.year === y);
}
if (args.includes('--term')) {
  const term = args[args.indexOf('--term') + 1].toUpperCase();
  toDownload = toDownload.filter(t => t.term === term);
}
if (args.includes('--type')) {
  const type = args[args.indexOf('--type') + 1];
  toDownload = toDownload.filter(t => t.type === type);
}

console.log(`Downloading ${toDownload.length} PDFs...`);
let ok = 0, skip = 0, miss = 0;
for (const { year, term, type, url } of toDownload) {
  const filename = `${year}_${term}_${type}_${path.basename(url)}`;
  const dest = path.join(DATA_DIR, filename);
  try {
    const found = await download(url, dest);
    if (found) {
      ok++;
      console.log(`  OK: ${filename}`);
    } else {
      miss++;
      console.log(`  404: ${url}`);
    }
  } catch (e) {
    console.error(`  ERR: ${url} — ${e.message}`);
  }
}
console.log(`\nDone. OK=${ok}  SKIP=${skip}  MISSING=${miss}`);
