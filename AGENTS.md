# AGENTS.md — working on typocasual

A contact sheet plus an essay blog, built by Hugo and served as static assets by a
Cloudflare Worker. Read this before editing; it is the contract.

## Commands

```bash
npm install                 # once
npm run check               # validate content — ALWAYS run after editing
npm run build               # hugo → public/  (this is what gets deployed)
npm run dev                 # build, then wrangler dev on http://localhost:8787
npm run new -- posts/slug.md   # scaffold a new essay from archetypes/posts.md
npm run deploy              # check, build, wrangler deploy
```

`npm run check` must pass before committing. CI runs it before the build and the deploy,
so a malformed edit fails there instead of shipping a broken page.

Requires Node 22+ and Hugo 0.166+ **extended** (`brew install hugo`).

## The two halves

| | Front page | Essays |
| --- | --- | --- |
| What | The contact sheet — a grid of frames | Long-form posts, one Markdown file each |
| Content lives in | `static/data.json` | `content/posts/*.md` |
| Template | `layouts/index.html` | `layouts/_default/single.html` |
| Index | — | `layouts/_default/list.html` at `/posts/` |

Everything else — the rail, the footer, the moss overlay, the filters and lightbox — is
shared and comes from `layouts/partials/` and `layouts/_default/baseof.html`. Do not
duplicate it into a page template.

## Where things live

| Path | Role |
| --- | --- |
| `static/data.json` | **The sheet's content.** Frames, filters, outbound links. Most sheet edits touch only this. |
| `static/data.schema.json` | The shape of `data.json`. Published at `/data.schema.json`. |
| `content/_index.md` | **The home intro**, above the sheet. Rendered via `{{ .Content }}` in `layouts/index.html`. |
| `content/posts/*.md` | **The essays.** One file per post, YAML front matter. |
| `archetypes/posts.md` | The scaffold used by `npm run new`. |
| `scripts/check.mjs` | Validation. Runs in CI. No dependencies. |
| `layouts/` | Hugo templates. `baseof.html` wraps every page. |
| `static/styles.css` | All styling. Tokens first, then components, then responsive. |
| `static/app.js` | Frame and link rendering, plate generation, vines, lightbox. |
| `hugo.toml` | Site config, output formats (`llms.txt`), markdown settings. |
| `wrangler.jsonc` | Worker name (`typotypocasual`) and the assets config. |
| `public/` | **Build output. Gitignored. Never edit it.** |

## Posting an essay

```bash
npm run new -- posts/my-post.md
```

Then edit the file and delete `draft: true`. Front matter:

```yaml
---
title: "On gutter joints"
date: 2026-07-02
description: "One line. Used as the standfirst, the index summary, and the link preview."
seed: 102          # picks the generated plate; MUST be unique
growth: 0.5        # 0–1, how overgrown the plate is
caption: "Gutter detail, 2024. Where it starts."
# image: "/images/foo.jpg"   # optional; replaces the generated plate
---
```

Body is ordinary Markdown. `##` headings, links, lists, blockquotes, tables, fenced code
and raw HTML all render, and are styled by `.prose` in `static/styles.css`.

Publishing is `git push`. There is no draft server and no CMS.

## Editing the sheet

Append to `items` in `static/data.json`. `kind` decides how the window is drawn and which
fields are required.

```jsonc
{
  "kind": "plate",          // "plate" | "spec" | "note"
  "stage": "encroaching",   // "bare" | "encroaching" | "consumed"
  "growth": 0.5,            // 0 = bare concrete, 1 = buried
  "title": "North Wall",
  "year": "2024",
  "medium": "Silver gelatin",
  "subject": "The shaded face",   // plate: lightbox meta line
  "seed": 37,                     // plate: picks the composition
  "note": "Optional italic aside, lightbox only."
}
```

| `kind` | Window shows | Required beyond the common fields |
| --- | --- | --- |
| `plate` | A generated concrete photograph | `seed` |
| `spec` | A type specimen | `sample`, `stack`, `specimen` (optional `weight`) |
| `note` | A text card | `body` |

Outbound links go in `links` and render as preview cards under the sheet:

```jsonc
{
  "title": "Bluesky",
  "url": "https://bsky.app/profile/HANDLE",   // absolute, must be https
  "handle": "@handle",
  "desc": "Short things, posted while walking.",
  "growth": 0.3,
  "seed": 65
}
```

## Invariants — these break the page if violated

1. **`stage` must agree with `growth`.** Bands: `bare` ≤ 0.34, `encroaching` 0.34–0.67,
   `consumed` > 0.67. Otherwise the badge contradicts the moss. Enforced by `check.mjs`.
2. **`growth` is 0–1** on both frames and essays.
3. **Every plate `seed` must be unique — across frames *and* essays.** They share one
   generator, so a repeated seed puts the same photograph on two pages. `check.mjs` warns.
4. **Filter `id`s must match a `kind` or a `stage`** of at least one frame, or the button
   reads `00` and the sheet comes up empty. `all` is special.
5. **Link `url`s must be absolute `https://`.** The hostname is parsed from it for the
   domain label and the favicon lookup.
6. **`public/` is generated.** Edit `static/`, `layouts/`, `content/`, then rebuild.
7. **Plates are drawn, not stored.** `plateSVG()` in `app.js` generates them from a seed;
   the same function runs at build time for essays via `[data-plate-seed]`. Do not add
   image files for plates.
8. **Colours come from CSS custom properties**, including inside generated SVG. Never
   hard-code a hex in a plate or a vine — both appearances must keep working.
9. **`llms.txt` is generated by `layouts/index.llms.txt`** from `data.json` and the essays.
   Never hand-write it; it cannot drift if you leave it alone.
10. **Every `id` that `app.js` looks up must exist in some template** under `layouts/`.
    `check.mjs` enforces this, because a renamed id fails silently in the browser.

## Do not

- **Do not publish the Obsidian vault here.** There is a separate digital garden for that.
  This rule stands. There is exactly one recorded exception: three published vault notes
  were imported once, as a test, with the owner's explicit approval.
  - `content/_index.md` — from *What is Typocasual?*, the vault's home note
  - `content/posts/hands.md` — from *hands*
  - `content/posts/typocasual-title.md` — from *typocasual title*

  Do not extend this. Do not sync further notes, do not import drafts, and do not import
  anything from the inbox. Ask the owner before you add any other vault content. Everything
  else on the sheet and in `content/posts/` is placeholder material written for this site.
- **Do not put the owner's resume, employment history, or personal records here.**
- **Do not write a second copy of the rail, footer, or moss overlay** into a page template.
  They are partials.
- **Do not change a colour in only one theme.** Both `[data-theme="dark"]` (Moonlit) and
  `[data-theme="light"]` (Sunlit) must define every token.
- **Do not remove the red squiggle** under the wordmark. *typocasual* is a deliberate
  misspelling and the squiggle is the brand mark.

## Design system

Palette and type come from the **Typocasual Forest** system. Its canonical source is a file
in the owner's Obsidian vault, not in this repo:

```
99 System/Design System/Typocasual Forest/tokens.json
```

`static/styles.css` consumes those tokens as CSS custom properties and extends them with
concrete greys and the signature red (`#ff382c`) from the wordmark. If the vault tokens
change, update the token block at the top of `styles.css` by hand — nothing here reaches
into the vault.

| Role | Typeface |
| --- | --- |
| Logotype | Epilogue 900 |
| Headings, essay titles, blockquotes | Lora |
| Reading (`.prose`, body) | Atkinson Hyperlegible Next |
| Captions, frame numbers, interface | Atkinson Hyperlegible Mono |

Long-form reading follows the Forest spec: 17px, line-height 1.7, held under 70ch on an
opaque low-glare ground.

## Accessibility requirements

Do not regress these:

- `prefers-reduced-motion: reduce` stops the vines swaying, the spores drifting, and the
  squiggle drawing itself in.
- Interactive controls are at least 40px.
- The lightbox traps focus, closes on `Escape`, and steps with arrow keys.
- The sheet is keyboard navigable from the skip link onward.
- Every frame's trigger button has a descriptive `aria-label`.

## Verifying a change

1. `npm run check` — must pass, no new warnings.
2. `npm run dev`, then confirm:
   - `/` shows the sheet; the frame count in the rail and colophon match `data.json`
   - each filter shows its own count, and none is empty
   - clicking a frame opens the lightbox; arrow keys step through the *filtered* set
   - `/posts/` lists the essays, newest first
   - an essay page shows its plate, title, date and body, with the image column sticky on
     a wide window and stacked on a narrow one
   - `/llms.txt` mentions the essay you just added
   - the theme toggle flips both appearances without unreadable text
3. Check a narrow window (~390px) for horizontal overflow.
4. Commit and push. CI validates, builds, and deploys.
