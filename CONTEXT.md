# CONTEXT.md — what this project is, and why

Orientation for a person or an agent picking this up cold. `DESIGN.md` covers how it looks.
`AGENTS.md` covers the rules for editing it. This file covers **what it is and what it is
not**, and the decisions behind it.

---

## In one paragraph

A personal website at `typotypocasual.victroyarroyo.workers.dev`. The front page presents the
six typefaces the site uses, one per frame, with the reasoning for each. Behind that sits a
small blog for longer pieces. It is built by Hugo into static files and served by a
Cloudflare Worker. It has no database, no CMS, and no server-side rendering.

---

## What this is not

These have all come up. Writing them down prevents a future agent from helpfully doing them.

- **Not the digital garden.** The owner has a separate Obsidian vault with a digital garden
  publishing pipeline. That is a different site with different content. Only two notes and
  the vault's home page were ever imported here, as a deliberate one-off test.
- **Not a resume.** The owner's employment history and personal records do not belong here.
  This was explicitly declined.
- **Not a contact sheet of photographs.** An earlier version was. It was rejected: the owner
  could not tell what the frames were for. The frames are typefaces now.
- **Not a green overlay.** See the measurement in `DESIGN.md`.

---

## Decisions, and the reason for each

| Decision | Reason |
| --- | --- |
| Hugo, not a hand-rolled generator | The owner wants to type Markdown and publish. Hugo gives that, plus RSS, a sitemap and an archetype, with no runtime. |
| Static assets, no Worker script | Nothing here needs a server. `wrangler.jsonc` serves `public/` directly. |
| One content file for the front page | `static/data.json`. The schema is published so an agent can fetch and validate it. |
| Generated plates, no image files | Keeps the repo small and lets the images follow the theme. |
| Frames are typefaces | The earlier photo frames communicated nothing. Type is the actual subject. |
| Greyscale structure, green field | The reference the owner liked is 88% green but uses it as a *field*. |
| Moss clipped inside slabs | A moss layer over content buried the links. Measured, then removed. |
| `check.mjs` gates the deploy | Catches seed collisions, missing fields, unloaded fonts, and stale element ids before publishing. |
| British spelling in prose | The site's `languageCode`/`locale` is `en-GB`. |

---

## Where the content comes from

| Content | Source | Owner |
| --- | --- | --- |
| The front-page frames and links | `static/data.json` | The owner, or an agent following `AGENTS.md` |
| The home introduction | `content/_index.md` | Imported from the vault's home note |
| The essays | `content/posts/*.md` | The owner |
| Palette and type | The Typocasual Forest design system | Canonical copy lives in the owner's Obsidian vault, **not in this repo** |

That last row matters. `99 System/Design System/Typocasual Forest/tokens.json` in the vault is
the source of truth for the design system. `static/styles.css` consumes those tokens as CSS
custom properties and extends them with concrete greys and the signature red. Nothing here
reaches into the vault; if the vault tokens change, the token block in `styles.css` is
updated by hand.

---

## Current state

- **Six faces, six frames.** Epilogue, Fira Sans, Lora, Lexend Deca, Atkinson Hyperlegible
  Next, Atkinson Hyperlegible Mono.
- **Five essays.** Three are placeholder writing about a brutalist building. Two are real
  imported notes (`hands`, `typocasual title`). The mix is unresolved — see below.
- **Three outbound links.** GitHub, Pika, Letterbird. More are expected; the owner said they
  would add Bluesky, Mastodon and Threads themselves.
- **Both themes work.** Moonlit (deep green) is the default; Sunlit (pale concrete) is a
  toggle.

---

## Open threads

1. **The placeholder essays are still there.** `/posts/` interleaves real writing with
   fictional essays about a building that does not exist. This reads as unfinished. Either
   delete them or date them behind the real posts.
2. **The automatic deploy is not wired up.** The GitHub Actions workflow is complete, but
   the repository has no `CLOUDFLARE_API_TOKEN`, so the deploy step fails. The account id
   secret is set. Until the token exists, publishing means running `npm run deploy`.
   The owner's Cloudflare OAuth credentials cannot create a token — the API returns 403 on
   `/user/tokens` — so this needs the dashboard.
3. **The plates have never been reviewed by eye.** They are generated, and can be tuned in
   `plateSVG()` without touching content.
4. **Fira Sans and Lexend Deca have assigned jobs the owner has not confirmed.**
5. **Images cannot be handed to a vision model in this environment.** Child agents receive no
   file-reading tools, so delegated vision does not work. `auge` (Apple Vision on the command
   line) is the working substitute and was used for the moss measurement.

---

## Environment notes

Useful to know, and easy to rediscover painfully.

- **The model in use has no vision.** `PI_MODEL` is a text-only DeepSeek, so pasted images are
  stripped before they arrive. Use `auge --all <image>` for image analysis. A vision model
  does exist in the registry (`commandcode/z-ai/glm-5.3-flash`), but subagents cannot read
  files to feed it.
- **`auge`** is installed at `/opt/homebrew/bin/auge` and wraps a wide range of Apple Vision
  requests: `--ocr`, `--classify`, `--document`, `--saliency-attention`, `--aesthetics`,
  and `--all` for everything.
- **Hugo is installed** via Homebrew, 0.166.0 extended.
- **`public/` is build output** and is gitignored. Never edit it.
