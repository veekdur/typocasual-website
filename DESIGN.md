# DESIGN.md — how this site is supposed to look

The reasoning behind the design, so it can be changed on purpose instead of by accident.
Read this before touching `static/styles.css`.

---

## The idea

A brutalist concrete structure, photographed and slowly reclaimed.

Concrete was an argument about permanence. Moss is a shorter argument, and it is winning.

The site is the structure. Hairline seams, exposed grid, flat surfaces, no decoration that
is not doing work. The moss is the only thing on the page that is soft, and it is kept
small on purpose.

---

## The three rules

These are not preferences. Breaking one of them is what went wrong the first time.

### 1. Moss grows in the joints, not on the faces

Moss on a real wall establishes in the joints and along the edges. It does not float over
the surface. It is part of the thing it grows on.

So moss is **clipped to the slab it belongs to**. It occupies a few pixels of that slab's
own bottom padding. It cannot cross text or imagery, because the slab clips it.

A moss layer painted *over* content is not moss. It is a sticker, and it buries things.

### 2. Green is a field or an accent. Never a layer.

Green is the background of Moonlit, and the colour of links and focus rings. It is never
something placed on top of content.

### 3. The frames are typefaces

A frame is one typeface. The number of frames equals the number of faces. See below.

---

## Why those rules exist — the measurement

The first version had a fixed, full-viewport SVG of vines, spores and a moss bank. It was
measured with Apple Vision (`auge`) and pixel sampling:

| | green | Apple aesthetic score | Apple's classification |
| --- | --- | --- | --- |
| The reference design the owner liked | **88%** | 0.24 | a designed page |
| The old home page | 20% | 0 | a screenshot |
| **The old Elsewhere block** | **76%** | **−0.11** | **`outdoor 0.39, hill 0.38, land 0.38, sky 0.15`** |

Apple Vision classified that section as **a photograph of a hillside**. Text recognition
found one word in it: `ELSEWHERE`. The moss had covered the links.

The reference is 88% green and looks right, because there the green is the **field**. The
old page was only 20% green and looked wrong, because there the green was **on top**.

Volume was never the problem. Placement was.

---

## Moss

**What it is.** One generated sprig mark, and a creep line along the bottom edge of each
slab. Nothing else.

**Where it goes**

| Place | Treatment |
| --- | --- |
| Bottom edge of a frame, link card, or essay entry | A thin creep line inside the slab's own bottom padding |
| Beside a section heading, and in the footer | The sprig mark, small, in moss green |
| Bottom-right of an essay plate | One sprig |

**How it is built.** `styles.css`, the "Moss, integrated" block. Each slab is
`position: relative; overflow: hidden`, and gets a `::after` strip anchored to its bottom
edge. `--creep` varies per slab so no two joints look alike. The value comes from
`creepFor(i)` in `app.js` — deterministic, so the page is identical on every load.

**Never.** A `position: fixed` moss layer. A moss shape large enough to sit under text.
Anything that requires the content to move out of the way.

---

## The frames

One frame per typeface. Six faces, six frames. If a face is added, a frame is added; if a
face is dropped, its frame goes.

**Anatomy**

```
┌──────────────────────────────┐
│ 01                 Interface │  ← index, and the job the face does
├──────────────────────────────┤
│                              │
│  Aa                          │  ← live specimen, set in the real face
│  Frames · Essays · Sunlit    │
│                              │
├──────────────────────────────┤
│ Fira Sans                    │  ← family name
│ 100–900 · variable           │  ← weight range
├──────────────────────────────┤
│ Why   Drawn for small text…  │  ← one sentence of reasoning
│ Used  The top rail, labels…  │  ← where it actually appears
└──────────────────────────────┘
```

**The specimen is live type, not an image.** `app.js` sets `font-family` and `font-weight`
from the data, so a reader always sees the real face. This is why the fonts must load —
`scripts/check.mjs` fails the build if a frame names a family that the fonts link in
`layouts/partials/head.html` does not request.

**Content** lives in `static/data.json` under `frames`. One object per face. The schema is
`static/data.schema.json`.

---

## The plates

A plate is a generated concrete photograph. There are no image files for them.

**Where they are used.** Essay pages, as the image in the left column, unless the essay
supplies its own `image`. They are *not* used on the front page any more — the frames are
typefaces there.

**How they work.** `plateSVG(seed)` in `app.js` draws one of six compositions. The
archetype is `seed % 6`:

| `seed % 6` | Composition |
| --- | --- |
| 0 | A deep horizontal reveal with one standing pier |
| 1 | A colonnade, receding |
| 2 | A dark mass, a few openings still catching light |
| 3 | A stair, cut by one hard shadow |
| 4 | A strict window grid, light only on the top rows |
| 5 | Collapsed slabs, sky through the gap |

The same seed always draws the same plate. Every essay needs its own seed or two essays
show the same image; `check.mjs` warns when they collide.

**Colour.** Plates read `--plate-0` … `--plate-4`, so they follow the theme. They stay
neutral grey in both themes, so they read against the green field in Moonlit.

---

## Brutalism, as this site means it

- **Hairline seams.** Separation is a 1px rule or a 1px grid gap, not a shadow or a border
  radius. `--seam` and `--rule`.
- **The grid is exposed.** The frame grid and the link grid show their own gaps.
- **No rounded corners on structure.** Corners are square. Contrast this with the moss,
  which is all curve. That contrast is the design.
- **Flat surfaces.** No gradients except the page background and the plates.
- **Monospace for anything that is data.** Frame numbers, dates, captions, weights.
- **Tabular numerals** site-wide, so numbers line up.
- **No iconography.** There is one arrow, in the link cards, and one sprig.

---

## Colour

Two appearances. The toggle is in the rail and remembers the choice in `localStorage`.

**Moonlit** (dark, default) — a deep green field, `#0d1a12`. This is the reference's move:
the green is what you read against.

**Sunlit** (light) — pale warm concrete, `#e5e2da` to `#d1cec5`. Not white. Not cream.

| Role | Moonlit | Sunlit |
| --- | --- | --- |
| Page field | `#0d1a12` | `#d6d3ca` |
| Slab | `#12241a` | `#e9e6df` |
| Text | `#e9e7e0` | `#17170f` |
| Muted text | `#a9b6ab` | `#4e4e46` |
| Moss / links / focus | `#a5ce91` | `#3f6b2c` |
| Signature red | `#ff382c` | `#d92d20` |

Every token is defined in **both** `[data-theme="dark"]` and `[data-theme="light"]`. A
token defined in only one theme is a bug.

---

## Type

Six faces, six jobs. Each one has a frame.

| Face | Job | Weights |
| --- | --- | --- |
| Epilogue | Display. The logotype, nowhere else. | 400–900 |
| Fira Sans | Interface. Rail, labels, buttons. | 100–900 |
| Lora | Headings. Page and essay titles, blockquotes. | 400–700 |
| Lexend Deca | Standfirst. The line under a title, pull quotes. | 100–900 |
| Atkinson Hyperlegible Next | Reading. All body copy. | 200–800 |
| Atkinson Hyperlegible Mono | Data. Captions, dates, frame numbers, code. | 200–700 |

Four of these (Epilogue, Lora, Atkinson Hyperlegible Next, Atkinson Hyperlegible Mono)
come from the owner's **Typocasual Forest** design system. Fira Sans and Lexend Deca were
added by request.

Reading is held to 17px at line-height 1.7, in a column under 68 characters.

---

## The red squiggle

The word *typocasual* is a deliberate misspelling. A spellchecker will always underline it.

That red line is the brand mark. It sits under the wordmark, drawn in on load. It is also
the one place where `--squiggle` is used at size. Elsewhere the same treatment marks inline
mentions of the word.

**Do not fix the spelling. Do not remove the squiggle.**

---

## Motion

Almost none, and all of it interruptible.

- The squiggle draws itself in once, over 820ms.
- Hover states transition in 160ms. Press feedback is `scale(0.96)`.
- `prefers-reduced-motion: reduce` stops the squiggle and all transitions.

There is no ambient animation. The old version had vines that swayed and spores that
drifted; both are gone.

---

## Anti-patterns

Things that were tried, measured, and removed. Do not bring them back.

| Removed | Why |
| --- | --- |
| A fixed SVG overgrowth layer | Covered content. Made Elsewhere read as a landscape photo. |
| A moss bank across the bottom of the page | It is a layer over the page, not part of it. |
| A wordmark at 160px | Filled the viewport. Now about 74px maximum. |
| Four stacked subtitles under the title | Kicker, tagline, two ledes and an epigraph. One line survives. |
| Per-frame moss banks | Replaced by a creep line in the slab's own padding. |
| The word "colophon" | The owner did not know what it meant. It is now a plain footer. |
| Two "Elsewhere" sections | One is the link cards. The other was buried under moss. |
| A "Growth 55%" line on essays | Meaningless to the reader. |
| The contact-sheet lightbox | The frames explain themselves; nothing to expand. |

---

## Open questions

- The plate compositions have never been reviewed by eye. They are generated, so they can
  be tuned in `plateSVG()` without touching any content.
- Fira Sans and Lexend Deca are assigned jobs that the owner has not confirmed.
- Sunlit has not been reviewed at length; the owner described it as fine.
