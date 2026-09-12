# AGENTS.md — working on typocasual

A personal site: six typeface frames on the front page, and a small blog behind them. Hugo
builds it; a Cloudflare Worker serves the static output. Read this before editing.

Read `DESIGN.md` before changing anything visual. It explains *why* the design is the way it
is, and lists the things that were tried and removed.

## Commands

```bash
npm install                     # once
npm run check                   # validate content — ALWAYS run after editing
npm run build                   # hugo → public/   (this is what gets deployed)
npm run dev                     # build, then wrangler dev on http://localhost:8787
npm run new -- posts/slug.md    # scaffold an essay from archetypes/posts.md
npm run deploy                  # check, build, wrangler deploy
npm run og                      # regenerate the link preview image
```

`npm run check` must pass before committing. CI runs it before the build, so a malformed edit
fails there instead of shipping a broken page.

Requires Node 22+ and Hugo 0.166+ **extended** (`brew install hugo`).

## The shape of the site

| | Front page | Essays |
| --- | --- | --- |
| What | Six frames, one typeface each | Long-form posts |
| Content lives in | `static/data.json` | `content/posts/*.md` |
| Template | `layouts/index.html` | `layouts/_default/single.html` |
| Index | — | `layouts/_default/list.html` at `/posts/` |

The home introduction is `content/_index.md`, rendered above the frames. The rail, footer,
grain texture and sprig mark are partials and must not be duplicated into a page.

## Where things live

| Path | Role |
| --- | --- |
| `static/data.json` | **The frames and the outbound links.** Most front-page edits touch only this. |
| `static/data.schema.json` | The shape of `data.json`. Published at `/data.schema.json`. |
| `content/_index.md` | The home introduction. |
| `content/posts/*.md` | **The essays.** One file per post, YAML front matter. |
| `scripts/check.mjs` | Validation. Runs in CI. No dependencies. |
| `DESIGN.md` | The design rules, and the measurements behind them. |
| `CONTEXT.md` | What the project is, what it is not, the decisions. |
| `LEDGER.md` | Revision history. **Append an entry for substantial changes.** |
| `README.md` | The manual, written for the owner in ASD-STE100. |
| `layouts/` | Hugo templates. `baseof.html` wraps every page. |
| `static/styles.css` | All styling. Tokens first, then components, then responsive. |
| `static/app.js` | Frame and link rendering, plate generation, theme switch. |
| `hugo.toml` | Site config and output formats. |
| `wrangler.jsonc` | Worker name (`typotypocasual`) and the assets config. |
| `public/` | **Build output. Gitignored. Never edit it.** |

## Edit a frame

Each frame is one typeface. Append to `frames` in `static/data.json`.

```jsonc
{
  "role": "Interface",                    // the job; must be unique across frames
  "name": "Fira Sans",                    // must match the first family in `stack`
  "weights": "100–900 · variable",
  "sample": "Aa",                         // the large glyphs
  "specimen": "Frames · Essays · Sunlit", // the sample line, set in the face
  "stack": "\"Fira Sans\", system-ui, sans-serif",
  "weight": 500,
  "why": "Drawn for small screen text.",  // one sentence
  "used": "The top rail, labels, buttons."
}
```

**The frame count is the face count.** Add a font, add a frame. Remove a font, remove its
frame. `check.mjs` enforces that `name` agrees with `stack`, and that the family is actually
requested by the fonts link in `layouts/partials/head.html`.

To add a face: add it to that fonts link, then add the frame.

## Edit a link

```jsonc
{
  "title": "Bluesky",
  "url": "https://bsky.app/profile/HANDLE",  // absolute, https
  "handle": "@handle",
  "desc": "Short things, posted while walking."
}
```

The domain label and the favicon are derived from `url`.

## Post an essay

```bash
npm run new -- posts/my-post.md
```

Then remove `draft: true`. Front matter:

```yaml
---
title: "On gutter joints"
date: 2026-07-02
description: "One line. Standfirst, index summary, and link preview."
seed: 102          # picks the generated plate; MUST be unique among essays
caption: "Gutter detail, 2024."
# image: "/images/foo.jpg"   # optional; replaces the generated plate
---
```

## Invariants

1. **Moss grows in the joints, not on the faces.** Moss is clipped to the slab it belongs to
   and lives in that slab's own bottom padding. It must never be a `position: fixed` layer and
   must never sit under text. This is the change that fixed the site; see `DESIGN.md`.
2. **Green is a field or an accent, never a layer.** Green is the Moonlit background, and the
   link and focus colour. Nothing green goes on top of content.
3. **Every plate `seed` must be unique among essays**, or two posts show the same image.
4. **A frame's `name` must match the first family in its `stack`**, and that family must be in
   the fonts link. Enforced.
5. **Each frame `role` must be unique.** Two faces cannot share a job.
6. **Link `url`s must be absolute `https://`.**
7. **`public/` is generated.** Edit `static/`, `layouts/`, `content/`, then rebuild.
8. **Plates are drawn, not stored.** `plateSVG(seed)` generates them from the seed; the same
   function runs for essays via `[data-plate-seed]`. Do not add image files for plates.
9. **Colours come from CSS custom properties**, including inside generated SVG. Never
   hard-code a hex in a plate.
10. **Both themes must define every token.** `[data-theme="dark"]` and `[data-theme="light"]`.
11. **`llms.txt` is generated** by `layouts/index.llms.txt`. Never hand-write it.
12. **Every `id` that `app.js` looks up must exist in some template** under `layouts/`.
    Enforced, because a renamed id fails silently in the browser.

## Do not

- **Do not publish the Obsidian vault here.** There is a separate digital garden. This rule
  stands. There is exactly one recorded exception: three published notes were imported once,
  as a test, with the owner's explicit approval.
  - `content/_index.md` — from *What is Typocasual?*, the vault's home note
  - `content/posts/hands.md` — from *hands*
  - `content/posts/typocasual-title.md` — from *typocasual title*

  Do not extend this. Do not import drafts or inbox notes. Ask before adding anything else.
- **Do not put the owner's resume, employment history, or personal records here.**
- **Do not bring back the overgrowth layer.** `DESIGN.md` has the measurement showing why it
  was removed. A full-viewport moss overlay is the specific thing that buried the links.
- **Do not enlarge the wordmark.** It ran at 160px and filled the viewport. Keep it at or
  below the current `clamp(2.4rem, 7vw, 4.6rem)`.
- **Do not add subtitles under the title.** There were four stacked lines; one remains.
- **Do not correct the spelling of `typocasual`.** The red squiggle under it is the brand mark.
- **Do not duplicate the rail, footer or sprig** into a page template. They are partials.

## Design system

Palette and type come from the **Typocasual Forest** system. Its canonical source is in the
owner's Obsidian vault, not in this repo:

```
99 System/Design System/Typocasual Forest/tokens.json
```

`static/styles.css` consumes those tokens as CSS custom properties and extends them with
concrete greys and the signature red (`#ff382c`). Nothing here reaches into the vault; if the
vault tokens change, update the token block by hand.

| Face | Job |
| --- | --- |
| Epilogue | Display — the logotype |
| Fira Sans | Interface — rail, labels, buttons |
| Lora | Headings — page and essay titles, blockquotes |
| Lexend Deca | Standfirst — the line under a title |
| Atkinson Hyperlegible Next | Reading — all body copy |
| Atkinson Hyperlegible Mono | Data — captions, dates, frame numbers, code |

Reading is 17px at line-height 1.7, in a column under 68 characters.

## Environment notes

- **The session model has no vision.** `PI_MODEL` is a text-only DeepSeek, so pasted images
  are stripped. Use `auge --all <image>` (Apple Vision CLI, installed) for image analysis.
  Delegating to a vision model does not work: subagents receive no file-reading tools here.
- **`auge`** wraps Apple Vision: `--ocr`, `--classify`, `--document`, `--saliency-attention`,
  `--aesthetics`, `--layout`, and `--all`.

## Verifying a change

1. `npm run check` — must pass, no new warnings.
2. `npm run dev`, then confirm:
   - `/` shows six frames, each with a live specimen in the correct face
   - `/posts/` lists the essays, newest first
   - an essay page shows its plate, title, date and body, with the image column sticky on a
     wide window and stacked on a narrow one
   - `/llms.txt` mentions the essay you just added
   - the theme toggle flips both appearances without unreadable text
   - **no green shape covers any text** at any width
3. Check a narrow window (~390px) for horizontal overflow.
4. Append an entry to `LEDGER.md` if the change was substantial.
5. Commit and push. CI validates, builds, and deploys.
