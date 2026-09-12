# typocasual

A contact sheet, left out in the weather.

Concrete was an argument about permanence. Moss is a shorter argument, and it is winning.
Twenty frames — generated concrete plates, type specimens, and text cards — laid out at the
same size on a brutalist slab that is slowly being reclaimed. Every frame carries a
`growth` value; the moss creeps further over it the higher that number goes. Hover a frame
and the growth pulls back.

Served as static assets by a Cloudflare Worker. No framework, no build step.

- **Worker:** `typotypocasual`
- **Live:** https://typotypocasual.victroyarroyo.workers.dev
- **Index for agents:** [/llms.txt](https://typotypocasual.victroyarroyo.workers.dev/llms.txt)

## Quick start

```bash
npm install
npm run dev      # http://localhost:8787
npm run check    # validate content — run this before committing
npm run deploy   # check, then deploy
```

## Editing

**All content lives in one file: [`public/data.json`](public/data.json).** Add an object to
`items` and it becomes a frame. Add one to `links` and it becomes a link card.

The shape is defined by [`data.schema.json`](data.schema.json) and enforced by
`npm run check`, which runs in CI before every deploy — so a malformed edit fails the build
instead of shipping a broken sheet. It validates the schema, plus the rules the schema
cannot express: that `stage` agrees with `growth`, that plate seeds are unique, that no
filter is dead, and that every element `app.js` looks up still exists in `index.html`.

**Read [`AGENTS.md`](AGENTS.md) before editing.** It is the contract: the invariants that
break the page, the design system's source of truth, and how to verify a change. It is
written to be read by a coding agent as much as by a person.

## Project layout

```
public/
  index.html              markup, masthead copy, SVG filter defs, lightbox shell
  styles.css              all styling — tokens, components, responsive
  app.js                  frame + link rendering, plate generator, vines, lightbox
  data.json               ← every frame, filter and link. The only file most edits touch.
  llms.txt                generated from data.json — run `npm run sync`
  favicon.svg
  og.jpg                  1200x630 link preview — run `swift scripts/make-og.swift public/og.jpg`
  apple-touch-icon.png
data.schema.json          content contract
scripts/
  check.mjs               validation, run by CI
  sync.mjs                regenerates llms.txt
  llms.mjs                the llms.txt template, shared by sync and check
  make-og.swift           renders the link preview image
wrangler.jsonc            worker name and assets config
```

## How the images work

There are no image assets for the frames. `plateSVG()` in `app.js` draws each concrete
photograph from its `seed` — six compositions, rotating by `seed % 6`. That keeps the
repository small and means the plates follow the active theme, because they read their
colours from CSS custom properties rather than hard-coded hexes.

## Design system

Palette and type come from the **Typocasual Forest** system. Its canonical source is
`99 System/Design System/Typocasual Forest/tokens.json` in the owner's Obsidian vault, not
in this repository — see `AGENTS.md` for how to reconcile the two.

| Role | Typeface |
| --- | --- |
| Logotype | Epilogue 900 |
| Headings | Lora |
| Reading | Atkinson Hyperlegible Next |
| Captions, frame numbers, interface | Atkinson Hyperlegible Mono |

Both appearances work: **Moonlit** (dark, the default) and **Sunlit** (light). The toggle is
in the top rail and remembers your choice.

## Deploying

Push to `main`; the workflow validates then deploys. Pull requests validate only.

Two repository secrets are required:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | `371b07f7e80f69e81b04a5ed7ca06fca` |

## Scope

This site is a standalone contact sheet. It is **not** connected to the owner's Obsidian
vault or their digital garden, and no notes, resume, or personal records belong here.
