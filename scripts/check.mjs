#!/usr/bin/env node
/**
 * Validates public/data.json against data.schema.json, then runs the
 * semantic rules the schema cannot express.
 *
 * Runs in CI before every deploy, so a malformed edit cannot ship.
 * No dependencies — the JSON Schema subset below covers what the schema uses.
 *
 *   node scripts/check.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';
import { renderLlms } from './llms.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'public/data.json');
const SCHEMA = resolve(ROOT, 'data.schema.json');

/** Growth bands. These are the contract for `stage`; keep in sync with AGENTS.md. */
const BANDS = [
  { stage: 'bare',        max: 0.34 },
  { stage: 'encroaching', max: 0.67 },
  { stage: 'consumed',    max: Infinity },
];
const bandFor = (g) => BANDS.find((b) => g <= b.max).stage;

const errors = [];
const warnings = [];

/* ── Load ─────────────────────────────────────────────────────────────── */

const readJSON = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`\n✗ Could not parse ${relative(ROOT, path)}\n  ${err.message}\n`);
    process.exit(1);
  }
};

const data = readJSON(DATA);
const schema = readJSON(SCHEMA);

/* ── Minimal JSON Schema validation ───────────────────────────────────── */

const typeOf = (v) =>
  v === null ? 'null' : Array.isArray(v) ? 'array' : Number.isInteger(v) ? 'integer' : typeof v;

const isType = (v, t) => {
  const actual = typeOf(v);
  if (t === 'number') return actual === 'number' || actual === 'integer';
  return actual === t;
};

const deref = (node) => {
  if (!node || typeof node.$ref !== 'string') return node;
  let cur = schema;
  for (const seg of node.$ref.replace(/^#\//, '').split('/')) cur = cur?.[seg];
  return cur;
};

/** Try a subschema purely as a test: discard anything it reports. */
const probe = (value, node, path) => {
  const e = errors.length;
  const w = warnings.length;
  validate(value, node, path);
  const ok = errors.length === e;
  errors.length = e;
  warnings.length = w;
  return ok;
};

function validate(value, rawNode, path) {
  const node = deref(rawNode);
  if (!node || typeof node !== 'object') return;

  if (node.type) {
    const types = Array.isArray(node.type) ? node.type : [node.type];
    if (!types.some((t) => isType(value, t))) {
      errors.push(`${path}: expected ${types.join(' | ')}, got ${typeOf(value)}`);
      return;
    }
  }

  if (node.const !== undefined && value !== node.const) {
    errors.push(`${path}: must be ${JSON.stringify(node.const)}, got ${JSON.stringify(value)}`);
  }
  if (node.enum && !node.enum.includes(value)) {
    errors.push(
      `${path}: must be one of ${node.enum.map((e) => JSON.stringify(e)).join(' | ')}, ` +
      `got ${JSON.stringify(value)}`,
    );
  }

  if (typeof value === 'number') {
    if (node.minimum !== undefined && value < node.minimum)
      errors.push(`${path}: ${value} is below the minimum of ${node.minimum}`);
    if (node.maximum !== undefined && value > node.maximum)
      errors.push(`${path}: ${value} is above the maximum of ${node.maximum}`);
  }

  if (typeof value === 'string') {
    if (node.minLength !== undefined && value.length < node.minLength)
      errors.push(`${path}: must not be empty`);
    if (node.maxLength !== undefined && value.length > node.maxLength)
      errors.push(`${path}: must be at most ${node.maxLength} characters`);
    if (node.pattern && !new RegExp(node.pattern).test(value))
      errors.push(`${path}: ${JSON.stringify(value)} does not match ${node.pattern}`);
  }

  if (Array.isArray(value)) {
    if (node.minItems !== undefined && value.length < node.minItems)
      errors.push(`${path}: needs at least ${node.minItems} item(s), has ${value.length}`);
    if (node.maxItems !== undefined && value.length > node.maxItems)
      errors.push(`${path}: allows at most ${node.maxItems} item(s), has ${value.length}`);
    if (node.items) value.forEach((v, i) => validate(v, node.items, `${path}[${i}]`));
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of node.required ?? []) {
      if (!(key in value)) errors.push(`${path}: missing required field "${key}"`);
    }
    if (node.properties) {
      for (const [key, sub] of Object.entries(node.properties)) {
        if (key in value) validate(value[key], sub, `${path}.${key}`);
      }
      for (const key of Object.keys(value)) {
        if (!(key in node.properties))
          warnings.push(`${path}.${key}: field is not in data.schema.json — typo, or add it there`);
      }
    }
  }

  for (const sub of node.allOf ?? []) validate(value, sub, path);

  if (node.anyOf && !node.anyOf.some((sub) => probe(value, sub, path)))
    errors.push(`${path}: does not match any allowed shape`);

  if (node.oneOf && node.oneOf.filter((sub) => probe(value, sub, path)).length !== 1)
    errors.push(`${path}: must match exactly one allowed shape`);

  if (node.if) {
    if (probe(value, node.if, path)) {
      if (node.then) validate(value, node.then, path);
    } else if (node.else) {
      validate(value, node.else, path);
    }
  }
}

validate(data, schema, '$');

/* ── Semantic rules ───────────────────────────────────────────────────── */

const items = Array.isArray(data.items) ? data.items : [];

items.forEach((item, i) => {
  const at = `$.items[${i}] ("${item.title ?? 'untitled'}")`;

  // stage must agree with growth, or the badge lies about the moss.
  if (typeof item.growth === 'number' && item.stage) {
    const expected = bandFor(item.growth);
    if (item.stage !== expected) {
      errors.push(
        `${at}: stage "${item.stage}" disagrees with growth ${item.growth} ` +
        `(that growth is in the "${expected}" band)`,
      );
    }
  }

  // Two plates sharing a seed render as identical images.
  if (item.kind === 'plate' && typeof item.seed === 'number') {
    const clash = items.findIndex((o, j) => j < i && o.kind === 'plate' && o.seed === item.seed);
    if (clash !== -1)
      warnings.push(`${at}: seed ${item.seed} is already used by frame ${clash + 1} — the plates will look identical`);
  }
});

const titles = new Map();
items.forEach((item, i) => {
  if (!item.title) return;
  if (titles.has(item.title))
    warnings.push(`$.items[${i}]: duplicate title "${item.title}" (also frame ${titles.get(item.title) + 1})`);
  else titles.set(item.title, i);
});

// A filter that matches nothing renders a dead button.
for (const filter of data.filters ?? []) {
  if (filter.id === 'all') continue;
  const hits = items.filter((i) => i.kind === filter.id || i.stage === filter.id).length;
  if (hits === 0)
    warnings.push(`$.filters: "${filter.id}" matches no frame — the button will show 00 and an empty sheet`);
}

for (const [i, link] of (data.links ?? []).entries()) {
  if (typeof link.url === 'string') {
    try {
      new URL(link.url);
    } catch {
      errors.push(`$.links[${i}]: "${link.url}" is not a valid absolute URL`);
    }
  }
}

/* ── DOM contract ─────────────────────────────────────────────────────── */

// Every element app.js looks up by id must exist in index.html. A renamed id
// is the most common way an edit breaks this page, and it fails silently in
// the browser, so it is worth a hard check here.
const APP_SRC = readFileSync(resolve(ROOT, 'public/app.js'), 'utf8');
const HTML_SRC = readFileSync(resolve(ROOT, 'public/index.html'), 'utf8');

const declaredIds = new Set(
  [...HTML_SRC.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]),
);

// Created by app.js at runtime, so not expected in the markup.
const RUNTIME_IDS = new Set(['ld-links']);

const lookedUp = new Set([
  ...[...APP_SRC.matchAll(/\$\(\s*'#([A-Za-z0-9_-]+)'/g)].map((m) => m[1]),
  ...[...APP_SRC.matchAll(/getElementById\(\s*'([A-Za-z0-9_-]+)'/g)].map((m) => m[1]),
  // fillCounts() targets ids through a helper: set('cf-frames', n)
  ...[...APP_SRC.matchAll(/set\(\s*'([A-Za-z0-9_-]+)'/g)].map((m) => m[1]),
]);

for (const id of lookedUp) {
  if (!declaredIds.has(id) && !RUNTIME_IDS.has(id)) {
    errors.push(`public/app.js looks up #${id}, but public/index.html does not define it`);
  }
}

/* ── Generated file freshness ─────────────────────────────────────────── */

// llms.txt is rendered from data.json. A stale copy is a lie to crawlers.
const LLMS = resolve(ROOT, 'public/llms.txt');
let llmsActual = null;
try {
  llmsActual = readFileSync(LLMS, 'utf8');
} catch {
  /* handled below */
}

if (llmsActual === null) {
  errors.push('public/llms.txt is missing — run `npm run sync`');
} else if (llmsActual !== renderLlms(data)) {
  errors.push('public/llms.txt is out of date with public/data.json — run `npm run sync`');
}

/* ── Report ───────────────────────────────────────────────────────────── */

const rel = relative(ROOT, DATA);

if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} warning(s)\n`);
  for (const w of warnings) console.log(`   ${w}`);
}

if (errors.length) {
  console.error(`\n✗ ${rel} failed validation — ${errors.length} error(s)\n`);
  for (const e of errors) console.error(`   ${e}`);
  console.error('\n   Schema: data.schema.json   Guide: AGENTS.md\n');
  process.exit(1);
}

const count = (kind) => items.filter((i) => i.kind === kind).length;
console.log(
  `\n✓ ${rel} is valid\n` +
  `   frames ${items.length}  ·  plates ${count('plate')}  ·  type ${count('spec')}  ·  cards ${count('note')}\n` +
  `   links  ${(data.links ?? []).length}\n` +
  `   growth ${Math.min(...items.map((i) => i.growth)).toFixed(2)} → ${Math.max(...items.map((i) => i.growth)).toFixed(2)}\n` +
  `   dom    ${lookedUp.size} id(s) resolved, llms.txt in sync\n`,
);
