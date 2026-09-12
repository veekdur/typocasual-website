# typocasual — how to run this thing

Your site lives at `~/Projects/typocasual-hugo`. It is a git repo, and pushing to GitHub
publishes it. This file is the owner's manual: how to write a post, how to edit the front
page, what the files are, and what not to touch.

If you only read one section, read **The two-minute version** and **The five rules**.

---

## The two-minute version

```bash
cd ~/Projects/typocasual-hugo

npm run new -- posts/my-new-post.md   # 1. make a post
# ...edit the file it just made...
                                        # 2. delete the line `draft: true`
npm run check                          # 3. make sure nothing is broken
git add -A && git commit -m "new post" # 4. save
git push                               # 5. publish
```

That's it. GitHub builds it with Hugo and ships it to Cloudflare — **once the deploy token in
"Publishing" at the bottom is set up. Until then, use `npm run deploy` instead of `git push`
to actually publish.** Pushing still saves your work either way.

---

## One-time setup

Already done on this machine, but if you're on a new one:

```bash
brew install hugo     # needs the "extended" build; brew's default is extended
# Node 22 or newer
cd ~/Projects/typocasual-hugo
npm install
```

---

## Commands

Run all of these from `~/Projects/typocasual-hugo`.

| Command | What it does |
| --- | --- |
| `npm run dev` | Builds and serves a preview at **http://localhost:8787**. Use this instead of pushing when you're unsure. Ctrl-C to stop. |
| `npm run check` | Validates your content. Run it before every commit. It's the seatbelt. |
| `npm run build` | Turns `content/` + `layouts/` into `public/`. `dev` and `deploy` do this for you. |
| `npm run new -- posts/slug.md` | Creates a new post from a template. The `--` matters. |
| `npm run deploy` | Check, build, and push straight to Cloudflare, skipping git. Emergency lever. |
| `npm run tail` | Streams live logs from the Worker. Almost never needed. |

---

## Writing a post

### 1. Scaffold it

```bash
npm run new -- posts/on-gutter-joints.md
```

The filename becomes the URL: `/posts/on-gutter-joints/`. Lowercase, hyphens, no spaces.

### 2. Fill in the top

Every post starts with a block between `---` lines. That's the important part.

```yaml
---
title: "On gutter joints"
date: 2026-07-02
description: "One line. Shown under the title, in the index, and in link previews."
seed: 102
growth: 0.5
caption: "Gutter detail, 2024. Where it starts."
---
```

| Field | What it's for |
| --- | --- |
| `title` | The headline. Also the browser tab and the link preview. |
| `date` | Controls the order in the index. Newest first. |
| `description` | The italic line under the title, and the summary in `/posts/`. Write one. |
| `seed` | Picks which generated concrete image the post gets. **Every post needs a different number.** See below. |
| `growth` | How overgrown that image is, `0` to `1`. Low is bare concrete, high is buried. |
| `caption` | Small mono text under the image. Optional. |
| `image` | Optional. A real photo instead of the generated one. See below. |
| `draft` | Delete this line to publish. While it's there, the post stays hidden. |

### 3. Write the body

Ordinary Markdown. `##` for headings, `**bold**`, `[links](https://example.com)`, `-` for
bullets, `>` for quotes, triple backticks for code. It all works and it's all already styled.
Don't add HTML unless you want to.

### 4. Check and publish

```bash
npm run check
git add -A && git commit -m "post: on gutter joints" && git push
```

### Picking a `seed`

The site has no photographs in it. Every image you see — the frames on the front page and
the plate on each post — is **drawn by code from a number.** Same number, same picture,
forever.

There are six different compositions, and the number picks which one and how it's arranged:
`seed % 6` chooses the archetype, so seeds 7, 13, 19, 25… all look related but not identical.

**Two posts must never share a seed**, or they get the exact same photograph. `npm run check`
catches this and tells you which post already has it. Just pick another number. Any number
works; 100-and-something is a fine habit.

### Using a real photograph instead

Put the file in `static/images/`, then point at it:

```yaml
image: "/images/my-photo.jpg"
```

That replaces the generated plate for that post. The front page frames are separate — those
are always generated.

---

## Editing the front page

The front page is the **contact sheet**: a grid of frames. Its entire content is one file:

```
static/data.json
```

Open it and you'll see three lists: `filters`, `items` (the frames), and `links` (the cards
underneath).

### Adding a frame

Copy an existing block in `items` and change it. There are three kinds:

**A plate** — a generated concrete photograph:

```jsonc
{
  "kind": "plate",
  "stage": "encroaching",
  "growth": 0.5,
  "title": "North Wall",
  "year": "2024",
  "medium": "Silver gelatin",
  "subject": "The shaded face",
  "seed": 37
}
```

**A type specimen** — a typeface shown off:

```jsonc
{
  "kind": "spec",
  "stage": "bare",
  "growth": 0.13,
  "title": "Lora",
  "year": "2025",
  "medium": "Heading · 400–700",
  "sample": "Rg",
  "stack": "\"Lora\", Georgia, serif",
  "weight": 700,
  "specimen": "constant growth and decay"
}
```

**A card** — just text:

```jsonc
{
  "kind": "note",
  "stage": "bare",
  "growth": 0.17,
  "title": "Method",
  "year": "2025",
  "medium": "Card",
  "body": "Every frame is the same size. The sheet does not rank the work."
}
```

The required fields are listed in the table below. `npm run check` will tell you if you
forget one.

| `kind` | Needs |
| --- | --- |
| `plate` | `seed` |
| `spec` | `sample`, `stack`, `specimen` |
| `note` | `body` |

All three need `kind`, `stage`, `growth` and `title`.

### Adding a link

Under `links`:

```jsonc
{
  "title": "Bluesky",
  "url": "https://bsky.app/profile/your-handle",
  "handle": "@your-handle",
  "desc": "Short things, posted while walking.",
  "growth": 0.3,
  "seed": 65
}
```

The domain shown on the card, and the little icon, are both derived from the `url` — you
don't write them. The `url` must start with `https://`.

---

## What `growth` means

Every frame and every post carries a `growth` number from `0` to `1`. It is the site's own
idea, and it's the only thing that makes the design mean anything: **how long this thing has
been out in the weather.**

- `0` — bare concrete. Nothing has taken hold.
- `1` — buried. You can hardly see it.

It draws the moss, and it's printed in the lightbox as a percentage. Read the sheet left to
right and the structure gives way.

There's a second field, `stage`, which is just the label for that number. It has to agree
with it:

| `stage` | `growth` |
| --- | --- |
| `bare` | 0 to 0.34 |
| `encroaching` | 0.34 to 0.67 |
| `consumed` | over 0.67 |

If they disagree, `npm run check` stops you, because otherwise the badge on the frame would
contradict the moss on it.

---

## The file map

```
~/Projects/typocasual-hugo/
│
├── content/posts/            ← YOUR POSTS LIVE HERE
│   ├── _index.md               (the /posts/ page heading — rarely touched)
│   └── *.md                    one file per post
│
├── static/data.json          ← THE FRONT PAGE LIVES HERE
├── static/data.schema.json     the rules for the file above
│
├── static/styles.css           all the colours and layout
├── static/app.js               the code that draws frames and moss
├── static/og.jpg               the preview image when you share a link
├── static/images/              (make this if you want to add real photos)
│
├── layouts/                    the page templates
│   ├── index.html              the front page
│   ├── _default/single.html    a post page
│   ├── _default/list.html      the /posts/ index
│   ├── 404.html                the "not found" page
│   ├── index.llms.txt          generates /llms.txt
│   └── partials/               the shared top bar, footer, moss, etc.
│
├── scripts/check.mjs           the validator behind `npm run check`
├── .github/workflows/deploy.yml  what runs on every push
├── public/                     BUILD OUTPUT — DO NOT EDIT, it gets wiped
├── hugo.toml                   site settings
├── wrangler.jsonc              Cloudflare settings
├── README.md                   this file
└── AGENTS.md                   the technical contract, for coding agents
```

### Yours to edit freely

- `content/posts/*.md` — your writing
- `static/data.json` — the front page's content
- `static/images/` — your photos

### Fine to touch, but they change how it *looks*

- `static/styles.css` — the colours are all at the top, in `:root` and the two
  `[data-theme="..."]` blocks. Change those and the whole site follows.

### Leave alone unless you know why

- `public/` — generated. Anything you put there is deleted on the next build.
- `layouts/` — the page structure. Editing these is how you break the site.
- `scripts/check.mjs` — the validator. If you weaken it, it stops catching your mistakes.
- `wrangler.jsonc` — the Worker config. Wrong here and the site 404s.

---

## The five rules

1. **Run `npm run check` before you commit.** It catches almost everything on this page and
   explains the problem in plain words.

2. **Never edit anything in `public/`.** It is rebuilt from scratch every time. Your changes
   will vanish.

3. **Every `seed` must be unique — across posts *and* front-page frames.** They share one
   generator. A repeat means two pages show the same picture.

4. **The word `typocasual` is spelled wrong on purpose.** The red squiggle under it is the
   logo. Don't fix it.

5. **This site is not your Obsidian vault.** Don't sync the vault, your notes, or your resume
   here. The vault has its own digital garden. This is a separate thing on purpose.

---

## When it complains

`npm run check` is the thing that talks to you. It prints `✓` when it's happy and `✗` plus a
list when it isn't. Warnings (`⚠`) don't stop a deploy; errors do.

| What it says | What it means |
| --- | --- |
| `missing required field "seed"` | A plate needs a seed number. Add one. |
| `must be one of "note" \| "spec" \| "plate"` | You typo'd `kind`. |
| `seed 101 is already used by "..."` | Two posts share a picture. Change the number. |
| `stage "bare" disagrees with growth 0.9` | Those two must match. See the table above. |
| `is not in data.schema.json — typo?` | You misspelled a field name. |
| `matches no frame — the button will show 00` | A filter in `data.json` doesn't match any frame. |
| `looks up #something, but no template defines it` | Code/template mismatch. **Stop and get help** — this one is a bug, not a typo. |
| `front matter has no "title"` | A post is missing `title`. |

If a build fails with something about templates or `layouts/`, that's not your content —
that's structure. Check `git status` and `git diff` to see what changed, and consider
`git checkout -- layouts/` to undo it.

### Undoing things

```bash
git status              # what have I changed?
git diff                # what exactly changed?
git checkout -- <file>  # undo changes to one file
git log --oneline       # what have I committed?
```

If you push something broken, the fix is another push. Nothing here is destructive.

### Previewing before you commit

```bash
npm run dev
```

Opens a preview at http://localhost:8787 with your changes, unpublished. This is the safe way
to try something. Ctrl-C when you're done.

---

## Publishing, and the one thing that isn't set up

Pushing to `main` triggers GitHub Actions, which validates, builds, and deploys. **That last
step needs a Cloudflare API token that isn't configured yet.** Until it is, the automated
deploy fails at the final step (the check and build still pass).

To fix it once:

```bash
# Cloudflare dashboard → My Profile → API Tokens → Create Token
# → use the "Edit Cloudflare Workers" template
gh secret set CLOUDFLARE_API_TOKEN --repo veekdur/typocasual-website
gh secret set CLOUDFLARE_ACCOUNT_ID  --repo veekdur/typocasual-website
# account ID: 371b07f7e80f69e81b04a5ed7ca06fca
```

Until then, `npm run deploy` from this folder publishes directly and works fine.

---

## What's in here right now

**All of the content is placeholder.** The twenty frames describe a fictional photo series
about a brutalist building; the three posts are essays written to that theme. They exist to
show the design working and to give you something to overwrite.

Nothing references your notes, your vault, or your resume — deliberately. Replace the frames
and the posts with your own things when you're ready.

The bottom of the page has a link list. GitHub, Pika and Letterbird are in there; Bluesky,
Mastodon and Threads are not, because I didn't want to guess your handles. Add them under
`links` in `static/data.json`.

---

## If you get lost

- `npm run check` — the fastest way to find out if something is wrong
- `AGENTS.md` — the same rules, written for a coding agent. If you're working with Claude or
  another assistant, point it at that file and it'll know what it's doing.
- `/llms.txt` on the live site — a machine-readable summary of everything published
- The live site: https://typotypocasual.victroyarroyo.workers.dev
