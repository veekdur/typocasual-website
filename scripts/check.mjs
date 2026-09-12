#!/usr/bin/env node
/**
 * Validates static/data.json against static/data.schema.json, then runs the
 * semantic rules the schema cannot express.
 *
 * Runs in CI before every build, so a malformed edit cannot ship.
 * No dependencies — the JSON Schema subset below covers what the schema uses.
 *
 *   node scripts/check.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = resolve(ROOT, 'static/data.json');
const SCHEMA = resolve(ROOT, 'static/data.schema.json');
const HEAD = resolve(ROOT, 'layouts/partials/head.html');

const errors = [];
const warnings = [];

/* ── Load ─────────────────────────────────────────────────────────────── */

function readJSON(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`\n✗ Could not parse ${relative(ROOT, path)}\n  ${err.message}\n`);
    process.exit(1);
  }
}

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

/* ── Fonts ────────────────────────────────────────────────────────────── */

// Every face a frame claims to be must actually be requested by the fonts link.
// A documented face that never loads silently renders as a fallback.
const FONTS_URL = /https:\/\/fonts\.googleapis\.com\/css2\?([^"']+)/.exec(
  readFileSync(HEAD, 'utf8'),
)?.[1];

const loadedFamilies = new Set();
if (FONTS_URL) {
  for (const m of FONTS_URL.matchAll(/family=([^&:]+)/g)) {
    loadedFamilies.add(decodeURIComponent(m[1].replace(/\+/g, ' ')).trim());
  }
} else {
  errors.push('layouts/partials/head.html: no fonts.googleapis.com link found');
}

/** The first family in a CSS stack, e.g. `"Lora", Georgia, serif` → `Lora`. */
const firstFamily = (stack) => {
  const quoted = /^\s*"([^"]+)"/.exec(stack);
  if (quoted) return quoted[1];
  return stack.split(',')[0].trim();
};

const frames = Array.isArray(data.frames) ? data.frames : [];
const seenRoles = new Map();
const seenNames = new Map();

frames.forEach((frame, i) => {
  const at = `$.frames[${i}] ("${frame.name ?? 'unnamed'}")`;

  if (frame.role) {
    if (seenRoles.has(frame.role))
      errors.push(`${at}: role "${frame.role}" is already used by "${seenRoles.get(frame.role)}" — each face needs its own job`);
    else seenRoles.set(frame.role, frame.name);
  }

  if (frame.name) {
    if (seenNames.has(frame.name))
      errors.push(`${at}: "${frame.name}" appears twice`);
    else seenNames.set(frame.name, i);
  }

  if (frame.stack && frame.name) {
    const lead = firstFamily(frame.stack);
    if (lead !== frame.name) {
      errors.push(`${at}: name is "${frame.name}" but the stack starts with "${lead}" — make them agree`);
    }
    if (!loadedFamilies.has(lead)) {
      errors.push(`${at}: "${lead}" is not in the fonts link in layouts/partials/head.html, so the specimen renders in a fallback`);
    }
  }
});

/* ── Links ────────────────────────────────────────────────────────────── */

for (const [i, link] of (data.links ?? []).entries()) {
  if (typeof link.url === 'string') {
    try {
      new URL(link.url);
    } catch {
      errors.push(`$.links[${i}]: "${link.url}" is not a valid absolute URL`);
    }
  }
}

/* ── Essays ───────────────────────────────────────────────────────────── */

// Essays get a generated plate, so a repeated seed means two essays show the
// same image.
const POSTS_DIR = resolve(ROOT, 'content/posts');
const essays = existsSync(POSTS_DIR)
  ? readdirSync(POSTS_DIR).filter((f) => f.endsWith('.md') && f !== '_index.md')
  : [];

/** Crude YAML front matter reader — enough for the flat keys an essay uses. */
function frontMatter(file) {
  const src = readFileSync(resolve(POSTS_DIR, file), 'utf8');
  const block = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const out = {};
  if (!block) return out;
  for (const line of block[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}

const essaySeeds = new Map();
for (const file of essays) {
  const fm = frontMatter(file);
  const at = `content/posts/${file}`;

  if (!fm.title) errors.push(`${at}: front matter has no "title"`);

  const seed = Number(fm.seed);
  if (Number.isFinite(seed)) {
    if (essaySeeds.has(seed))
      warnings.push(`${at}: seed ${seed} is already used by "${essaySeeds.get(seed)}" — the plates will look identical`);
    essaySeeds.set(seed, fm.title);
  } else {
    warnings.push(`${at}: no "seed", so the plate falls back to 1 and will repeat`);
  }

  if (fm.draft === 'true') warnings.push(`${at}: marked draft, so it will not be published`);
}

/* ── DOM contract ─────────────────────────────────────────────────────── */

// Every element app.js looks up by id must exist somewhere under layouts/.
const APP_SRC = readFileSync(resolve(ROOT, 'static/app.js'), 'utf8');

const layoutFiles = [];
(function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.html')) layoutFiles.push(full);
  }
})(resolve(ROOT, 'layouts'));

const declaredIds = new Set();
for (const file of layoutFiles) {
  for (const m of readFileSync(file, 'utf8').matchAll(/\bid="([^"]+)"/g)) declaredIds.add(m[1]);
}

const RUNTIME_IDS = new Set(['ld-links']);

const lookedUp = new Set([
  ...[...APP_SRC.matchAll(/\$\(\s*'#([A-Za-z0-9_-]+)'/g)].map((m) => m[1]),
  ...[...APP_SRC.matchAll(/getElementById\(\s*'([A-Za-z0-9_-]+)'/g)].map((m) => m[1]),
]);

for (const id of lookedUp) {
  if (!declaredIds.has(id) && !RUNTIME_IDS.has(id)) {
    errors.push(`static/app.js looks up #${id}, but no template under layouts/ defines it`);
  }
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
  console.error('\n   Schema: static/data.schema.json   Guide: AGENTS.md\n');
  process.exit(1);
}

console.log(
  `\n✓ ${rel} is valid\n` +
  `   frames ${frames.length}  ·  links ${(data.links ?? []).length}  ·  essays ${essays.length}\n` +
  `   faces  ${[...seenNames.keys()].join(', ')}\n` +
  `   loaded ${[...loadedFamilies].join(', ')}\n` +
  `   dom    ${lookedUp.size} id(s) resolved across ${layoutFiles.length} template(s)\n`,
);
