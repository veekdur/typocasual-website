#!/usr/bin/env node
/**
 * Regenerates public/llms.txt from public/data.json.
 *
 * llms.txt is a generated file. Edit data.json instead, then run this.
 * scripts/check.mjs fails if the committed copy is out of date.
 *
 *   node scripts/sync.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { renderLlms } from './llms.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'public/data.json');
const OUT = resolve(ROOT, 'public/llms.txt');

const data = JSON.parse(readFileSync(DATA, 'utf8'));
const next = renderLlms(data);

let previous = null;
try {
  previous = readFileSync(OUT, 'utf8');
} catch {
  /* first run */
}

if (previous === next) {
  console.log(`\n= ${relative(ROOT, OUT)} already up to date\n`);
  process.exit(0);
}

writeFileSync(OUT, next);
console.log(`\n✓ wrote ${relative(ROOT, OUT)} (${next.length} bytes)\n`);
