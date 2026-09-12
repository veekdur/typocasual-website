# typocasual

A contact sheet, left out in the weather — plus the essays that came with it.

Concrete was an argument about permanence. Moss is a shorter argument, and it is winning.
The front page is twenty frames — generated concrete plates, type specimens, and text cards —
laid out at the same size on a brutalist slab that is slowly being reclaimed. Every frame
carries a `growth` value; the moss creeps further over it the higher that number goes. Hover
a frame and the growth pulls back.

Behind it, a small blog for longer pieces, in the same dark green.

- **Worker:** `typotypocasual`
- **Live:** https://typotypocasual.victroyarroyo.workers.dev
- **Index for agents:** [/llms.txt](https://typotypocasual.victroyarroyo.workers.dev/llms.txt)

## Quick start

```bash
npm install
npm run dev        # http://localhost:8787
npm run check      # validate content — run before committing
npm run deploy     # check, build, deploy
```

Requires **Node 22+** and **Hugo 0.166+ extended** (`brew install hugo`).

## Posting an essay

```bash
npm run new -- posts/my-post.md
```

Edit the file, remove `draft: true`, then `git push`. That is the whole workflow — there is
no CMS and no draft server.

Front matter:

```yaml
---
title: "On gutter joints"
date: 2026-07-02
description: "One line. Used as the standfirst, the index summary, and the link preview."
seed: 102          # picks the generated plate; must be unique across the whole site
growth: 0.5        # 0–1, how overgrown the plate is
caption: "Gutter detail, 2024."
# image: "/images/foo.jpg"   # optional — replaces the generated plate
---
```

The body is ordinary Markdown. Leave `image` out and the essay gets a generated concrete
plate, the same way the sheet's frames do. Point `image` at a file in `static/` to use a real
photograph instead.

## Editing the sheet

The front page's content is one file: [`static/data.json`](static/data.json). Add an object
to `items` and it becomes a frame; add one to `links` and it becomes a link card.

Its shape is [`static/data.schema.json`](static/data.schema.json), and `npm run check`
enforces it — plus the rules a schema cannot express: that `stage` agrees with `growth`,
that no plate seed is reused, that no filter is dead, and that every element `app.js` looks
up still exists in a template. That check runs in CI, before the build, on every push.

`data.json` starts with `"$schema": "./data.schema.json"`, so editors validate and autocomplete
as you type.

**Read [`AGENTS.md`](AGENTS.md) before editing.** It is the contract: the invariants that
break the page, the design system's source of truth, and how to verify a change. It is
written to be read by a coding agent as much as by a person.

## How it is built

Hugo renders `content/` and `layouts/` into `public/`, which is what the Worker serves as
static assets. `public/` is gitignored — it is output, not source.

```
content/posts/          essays, one Markdown file each
archetypes/posts.md     the scaffold behind `npm run new`
layouts/
  _default/baseof.html  the shell every page inherits
  _default/single.html  essay page — plate left, text column right
  _default/list.html    /posts/ index
  index.html            the contact sheet (front page)
  404.html              not-found page
  index.llms.txt        generates /llms.txt
  partials/             head, rail, colophon, overgrowth, lightbox, SVG defs
static/
  styles.css            all styling — tokens, components, responsive
  app.js                frame + link rendering, plate generator, vines, lightbox
  data.json             the sheet's content
  data.schema.json      its contract, published at /data.schema.json
  og.jpg                1200x630 link preview — `npm run og` to regenerate
scripts/
  check.mjs             validation, run by CI
  make-og.swift         renders the link preview image
```

Everything in `static/` is copied to the site root, so `static/data.json` is served at
`/data.json`.

## How the images work

There are no image assets for the plates. `plateSVG()` in `app.js` draws each concrete
photograph from its seed — six compositions, rotating by `seed % 6`. The same function runs
on essay pages, driven by `[data-plate-seed]`, so a post and a frame can share one visual
language without shipping any files. Because the plates read their colours from CSS custom
properties, they follow the active theme.

## Design system

Palette and type come from the **Typocasual Forest** system. Its canonical source is
`99 System/Design System/Typocasual Forest/tokens.json` in the owner's Obsidian vault, not
in this repository — see `AGENTS.md` for how to reconcile the two.

| Role | Typeface |
| --- | --- |
| Logotype | Epilogue 900 |
| Headings, essay titles, blockquotes | Lora |
| Reading | Atkinson Hyperlegible Next |
| Captions, frame numbers, interface | Atkinson Hyperlegible Mono |

Both appearances work: **Moonlit** (dark, the default) and **Sunlit** (light). The toggle is
in the top rail and remembers your choice.

## Deploying

Push to `main`; CI validates, builds with Hugo, and deploys. Pull requests validate and
build only.

Two repository secrets are required:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → **Edit Cloudflare Workers** template |
| `CLOUDFLARE_ACCOUNT_ID` | `371b07f7e80f69e81b04a5ed7ca06fca` |

## Scope

This site is standalone. It is **not** connected to the owner's Obsidian vault or their
digital garden, and no notes, resume, or personal records belong here. The frames and
sample essays are placeholder content.
