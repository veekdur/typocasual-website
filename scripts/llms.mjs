/**
 * Renders public/llms.txt from public/data.json.
 *
 * Shared by scripts/sync.mjs (which writes it) and scripts/check.mjs (which
 * fails if it is stale), so the two can never disagree about the format.
 */

export const BASE = 'https://typotypocasual.victroyarroyo.workers.dev';
export const REPO = 'https://github.com/veekdur/typocasual-website';

const pad = (n, w = 3) => String(n).padStart(w, '0');

export function renderLlms(data) {
  const items = data.items ?? [];
  const links = data.links ?? [];
  const meta = data.meta ?? {};
  const count = (kind) => items.filter((i) => i.kind === kind).length;

  const band = (g) => (g <= 0.34 ? 'bare' : g <= 0.67 ? 'encroaching' : 'consumed');

  const frameRows = items
    .map((item, i) =>
      `| ${pad(i + 1)} | ${item.title} | ${item.kind} | ${item.year ?? '—'} | ` +
      `${(item.growth ?? 0).toFixed(2)} (${band(item.growth ?? 0)}) |`)
    .join('\n');

  const linkRows = links
    .map((l) => `- [${l.title}](${l.url}) — ${l.desc}`)
    .join('\n');

  const filters = (data.filters ?? []).map((f) => `\`${f.id}\``).join(', ');

  return `# typocasual

> ${meta.blurb ?? 'A contact sheet.'}

A static single-page site: a contact sheet of ${items.length} frames — ${count('plate')} generated
concrete plates, ${count('spec')} type specimens and ${count('note')} text cards. Served as static
assets by a Cloudflare Worker. No server-side rendering, no CMS, no build step.

Tagline: ${meta.tagline ?? '—'}

## Machine-readable

- [data.json](${BASE}/data.json) — every frame, filter and outbound link. The source of truth.
- [data.schema.json](${BASE}/data.schema.json) — JSON Schema describing the shape of data.json.
- [AGENTS.md](${REPO}/blob/main/AGENTS.md) — how to edit this site.

## A note on \`growth\`

Every frame carries a \`growth\` value from 0 to 1. It is this site's own concept:
how long the frame has been out in the weather, not a rating or a ranking. It
drives how much moss covers the frame — 0 is bare concrete, 1 is buried. Frames
are filtered by \`kind\` (${filters}).

## Frames

| # | Title | Kind | Year | Growth |
| --- | --- | --- | --- | --- |
${frameRows}

## Elsewhere

${linkRows || '_No outbound links configured._'}
`;
}
