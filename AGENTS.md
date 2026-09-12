# AGENTS.md — working on typocasual

A static contact sheet served by a Cloudflare Worker. No framework, no build step:
Wrangler uploads `public/` as-is. Read this before editing; it is the contract.

## Commands

```bash
npm run check     # validate public/data.json — ALWAYS run after editing content
npm run dev       # local preview at http://localhost:8787
npm run deploy    # runs check, then wrangler deploy
```

`npm run check` must pass before you commit. CI runs the same script and blocks
the deploy if it fails.

## Where things live

| File | Role |
| --- | --- |
| `public/data.json` | **All content.** Frames, filters, outbound links. This is the only file most edits touch. |
| `data.schema.json` | The content contract: types, enums, required fields, growth ranges. |
| `scripts/check.mjs` | Validates `data.json` against the schema plus semantic rules the schema cannot express. |
| `public/index.html` | Page structure, masthead copy, SVG filter defs, lightbox shell. |
| `public/styles.css` | All styling. Tokens at the top, then components, then responsive. |
| `public/app.js` | Renders frames and link cards, generates plates and vines, filter and lightbox logic. |
| `wrangler.jsonc` | Worker name (`typotypocasual`) and the assets config. |
| `.github/workflows/deploy.yml` | Validates, then deploys on push to `main`. |

## Editing content

Everything user-visible comes from `public/data.json`. If you find yourself writing
frame content into `index.html`, stop — you are in the wrong file.

### Add a frame

Append to `items`. `kind` decides how the window is drawn and which fields are required.

```jsonc
{
  "kind": "plate",          // "plate" | "spec" | "note"
  "stage": "encroaching",   // "bare" | "encroaching" | "consumed"
  "growth": 0.5,            // 0 = bare concrete, 1 = buried
  "title": "North Wall",
  "year": "2024",
  "medium": "Silver gelatin",
  "subject": "The shaded face",   // plate: shown in the lightbox meta line
  "seed": 37,                     // plate: picks the composition
  "note": "Optional italic aside, lightbox only."
}
```

| `kind` | Window shows | Required beyond the common fields |
| --- | --- | --- |
| `plate` | A generated concrete photograph | `seed` |
| `spec` | A type specimen | `sample`, `stack`, `specimen` (optional `weight`) |
| `note` | A text card | `body` |

### Add an outbound link

Append to `links`. These render as preview cards under the sheet.

```jsonc
{
  "title": "Bluesky",
  "url": "https://bsky.app/profile/HANDLE",   // absolute, must be https
  "handle": "@handle",                        // optional second line
  "desc": "Short things, posted while walking.",
  "growth": 0.3,                              // optional, defaults to 0.2
  "seed": 65                                  // optional, picks the preview plate
}
```

## Invariants — these break the page if violated

1. **`stage` must agree with `growth`.** Bands: `bare` ≤ 0.34, `encroaching` 0.34–0.67,
   `consumed` > 0.67. The badge would otherwise contradict the moss. `check.mjs` enforces this.
2. **`growth` is 0–1.** It drives moss height and the lightbox percentage.
3. **Plate `seed`s must be unique.** Two plates with the same seed render identically.
   Archetypes rotate by `seed % 6`; if you add many plates, vary seeds so the six
   compositions stay mixed.
4. **Filter `id`s must match a `kind` or a `stage`** of at least one frame, or the button
   shows `00` and an empty sheet. `all` is special and always matches.
5. **Link `url`s must be absolute `https://`.** The hostname is parsed from it for the
   domain label and the favicon lookup.
6. **No build step.** `public/` ships verbatim. Do not add a bundler, a `dist/`, or a
   dependency for something the browser already does.
7. **Plates are generated, not files.** `plateSVG()` in `app.js` draws them from a seed.
   Do not add image assets for plates; give an item a real photo only by extending the
   renderer deliberately.
8. **Colours come from CSS custom properties**, including inside the generated SVGs.
   Never hard-code a hex in a plate or vine — both appearances must keep working.

## Do not

- **Do not sync the Obsidian vault into this site.** There is a separate digital garden
  for that. The owner explicitly does not want vault notes published here. This site is
  a standalone contact sheet only.
- **Do not put the owner's resume, employment history, or personal records here.**
- **Do not hand-edit the light theme to "fix" contrast** by changing a value in only one
  theme. Both `[data-theme="dark"]` and `[data-theme="light"]` must define every token.
- **Do not remove the red squiggle** under the wordmark. The word *typocasual* is a
  deliberate misspelling and the squiggle is the brand mark.

## Design system

Palette and type come from the **Typocasual Forest** system. Its canonical source is a
file in the owner's Obsidian vault, not in this repo:

```
99 System/Design System/Typocasual Forest/tokens.json
```

`public/styles.css` consumes those tokens as CSS custom properties and extends them with
concrete greys and the signature red (`#ff382c`) taken from the wordmark. If the vault
tokens change, update the token block at the top of `styles.css` by hand — this repo has
no generator that reaches into the vault.

Typography: Epilogue 900 for the logotype, Lora for headings, Atkinson Hyperlegible Next
for reading, Atkinson Hyperlegible Mono for captions and frame numbers.

## Both appearances must work

The default is Moonlit (dark). Sunlit (light) is toggled in the top rail and stored in
`localStorage`. When changing any colour, check both. The plates, vines, and moss all
read their colours from tokens, so a token change propagates everywhere.

## Accessibility requirements

Do not regress these:

- `prefers-reduced-motion: reduce` stops the vines swaying, the spores drifting, and the
  squiggle drawing itself in.
- Interactive controls are at least 40px.
- The lightbox traps focus, closes on `Escape`, and steps with arrow keys.
- The sheet is keyboard navigable from the skip link onward.
- Every frame's trigger button has a descriptive `aria-label`.

## Verifying a change

1. `npm run check` — must pass.
2. `npm run dev`, then load `http://localhost:8787` and confirm:
   - the frame count in the top rail and in the colophon agree with `data.json`
   - each filter shows its own count, and no filter is empty
   - clicking a frame opens the lightbox; arrow keys step through the *filtered* set
   - the theme toggle flips both appearances without unreadable text
   - the link cards render with a monogram, and gain a favicon when it loads
3. Check a narrow window (~390px) for horizontal overflow.
4. Commit. Pushing to `main` validates and deploys.
