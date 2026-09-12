# typocasual — owner manual

This manual tells you how to add a post, change the front page, and publish the site.
Read section 3 first. Read section 9 before you change a file.

Other documents:

- `DESIGN.md` — how the site must look, and the reason for each rule
- `CONTEXT.md` — what the project is, what it is not, and the decisions behind it
- `LEDGER.md` — the revision history
- `AGENTS.md` — the same rules as this manual, written for a coding agent

## 1. Purpose

The site has two parts.

- The front page shows six frames. Each frame shows one typeface.
- The essay pages show long text. Each essay is one Markdown file.

Hugo builds the site. Cloudflare supplies the site to the public.

## 2. Requirements

You need these items:

- Node.js, version 22 or later
- Hugo, version 0.166 or later, extended edition
- The `gh` command, for the deploy token in section 10

Run this command to install Hugo:

```bash
brew install hugo
```

## 3. Install the site

1. Open a terminal.
2. Go to the site folder:

   ```bash
   cd ~/Projects/typocasual-hugo
   ```

3. Install the Node.js packages:

   ```bash
   npm install
   ```

4. Make sure that the content is correct:

   ```bash
   npm run check
   ```

   The command shows `✓` and a list of counts. A correct result shows no `✗`.

## 4. Preview the site

Do this procedure before you publish a change.

1. Start the preview server:

   ```bash
   npm run dev
   ```

2. Open a browser.
3. Go to `http://localhost:8787`.
4. Examine your change.
5. Press `Ctrl` and `C` in the terminal. The server stops.

## 5. Write a post

### 5.1 Create the file

1. Run this command. Replace `my-post` with your title:

   ```bash
   npm run new -- posts/my-post.md
   ```

2. The command creates one file in `content/posts/`.

The file name becomes the web address. Use only lowercase letters and hyphens.

### 5.2 Change the front matter

The top of the file contains the front matter. The front matter is between two `---` lines.

```yaml
---
title: "My post"
date: 2026-07-02
description: "One line. This line appears below the title."
seed: 106
---
```

| Field | Purpose | Necessary |
| --- | --- | --- |
| `title` | The headline of the essay | Yes |
| `date` | The sort order. The newest essay comes first. | Yes |
| `description` | The line below the title. Also the summary in the index. | Yes |
| `seed` | Selects the generated image. Section 5.3 gives the rules. | Yes |
| `caption` | Small text below the image | No |
| `image` | A real photograph. Section 5.4 gives the procedure. | No |
| `draft` | Remove this line to publish the essay. | No |

### 5.3 Select a seed

The site contains no photograph files for the essay images. The site calculates each image
from a number. The number is the `seed`.

The same seed always gives the same image. Two essays with the same seed show the same
image. Therefore, each seed must be different.

`npm run check` examines every seed. The command tells you the name of the essay that
already uses a seed.

### 5.4 Use a real photograph

1. Copy the photograph into `static/images/`.
2. Add this line to the front matter:

   ```yaml
   image: "/images/my-photo.jpg"
   ```

The photograph replaces the generated image for that essay only.

### 5.5 Write the body

Write the body below the front matter. Use standard Markdown.

- Use `##` for a heading.
- Use `**text**` for bold text.
- Use `[name](https://example.com)` for a link.
- Use `-` for a bullet list.
- Use `>` for a quotation.

The site styles all of these items.

### 5.6 Remove the draft mark

1. Find the line `draft: true` in the front matter.
2. Delete the line.

The essay does not appear on the site while the line is present.

## 6. Change the front page

Two files control the front page.

- `content/_index.md` — the introduction text, above the frames
- `static/data.json` — the six frames and the link cards

### 6.1 Change a frame

Each frame shows one typeface. Open `static/data.json` and find the `frames` list.

```jsonc
{
  "role": "Interface",                    // The job. Must be different for each frame.
  "name": "Fira Sans",                    // The family name.
  "weights": "100–900 · variable",        // Shown under the name.
  "sample": "Aa",                         // The large glyphs.
  "specimen": "Frames · Essays · Sunlit", // The sample line.
  "stack": "\"Fira Sans\", system-ui, sans-serif",  // A CSS font-family value.
  "weight": 500,                          // The weight of the sample.
  "why": "Drawn for small screen text.",  // One sentence.
  "used": "The top rail, labels, buttons."// Where the face appears.
}
```

Two rules apply to a frame:

1. The `name` must agree with the first family in the `stack`.
2. The family must be loaded by the fonts link in `layouts/partials/head.html`.

`npm run check` examines both rules. The command stops the build if a rule fails.

### 6.2 Add a font

1. Open `layouts/partials/head.html`.
2. Add the family to the `fonts.googleapis.com` link.
3. Add a frame to the `frames` list in `static/data.json`.
4. Run `npm run check`.

The number of frames is the number of fonts. Add a frame for each new font.

### 6.3 Change a link card

1. Find the `links` list in `static/data.json`.
2. Copy one object and change the values.
3. Make sure that the `url` value starts with `https://`.

The site calculates the domain name and the small icon from the `url` value.

## 7. Publish the site

1. Run the check:

   ```bash
   npm run check
   ```

2. Save the change:

   ```bash
   git add -A
   git commit -m "add a post"
   ```

3. Send the change to GitHub:

   ```bash
   git push
   ```

GitHub builds the site and sends it to Cloudflare. The operation takes about one minute.

**Important:** the automatic deploy needs a Cloudflare token. Section 10 gives the
procedure. Until you do that procedure, use `npm run deploy` in place of step 3.

## 8. Understand the files

| Path | Purpose | Safe to change |
| --- | --- | --- |
| `content/_index.md` | The home introduction | Yes |
| `content/posts/*.md` | The essays | Yes |
| `static/data.json` | The frames and the links | Yes |
| `static/images/` | Your photographs | Yes |
| `static/styles.css` | The colours and the layout | Yes, with care |
| `DESIGN.md` | The design rules | Yes |
| `CONTEXT.md` | The project context | Yes |
| `LEDGER.md` | The revision history | Yes |
| `README.md` | This manual | Yes |
| `layouts/` | The page structure | No |
| `scripts/check.mjs` | The check program | No |
| `public/` | The built site | No |
| `hugo.toml` | The site settings | No |
| `wrangler.jsonc` | The Cloudflare settings | No |
| `AGENTS.md` | The rules for a coding agent | No |

## 9. Obey these rules

1. Run `npm run check` before you save a change.
2. Do not change a file in `public/`. Hugo deletes the folder at each build.
3. Give each essay seed a different number.
4. Do not correct the spelling of `typocasual`. The red line below the word is the logo.
5. Do not copy the Obsidian vault to this site. The vault has a different web site.
6. Keep the moss small. Do not put moss on top of text. Read `DESIGN.md`, rule 1.
7. Change a colour in both theme blocks. The blocks are `[data-theme="dark"]` and
   `[data-theme="light"]` in `static/styles.css`.

## 10. Set the Cloudflare token

Do this procedure one time.

1. Open the Cloudflare dashboard.
2. Go to **My Profile**, then **API Tokens**.
3. Select **Create Token**.
4. Select the **Edit Cloudflare Workers** template.
5. Select **Continue to summary**, then **Create Token**.
6. Copy the token.
7. Run this command. Paste the token when the command asks for it:

   ```bash
   gh secret set CLOUDFLARE_API_TOKEN --repo veekdur/typocasual-website
   ```

8. Run this command:

   ```bash
   gh secret set CLOUDFLARE_ACCOUNT_ID --repo veekdur/typocasual-website \
     --body 371b07f7e80f69e81b04a5ed7ca06fca
   ```

## 11. Find the cause of a problem

Run `npm run check` first. The command finds most problems. A `⚠` mark is a warning. A
warning does not stop the deploy. A `✗` mark is an error. An error stops the deploy.

| Message or symptom | Cause | Action |
| --- | --- | --- |
| `missing required field "why"` | A frame has no reason sentence. | Add the `why` field. |
| `missing required field "seed"` | An essay has no seed. | Add a `seed` number. |
| `name is "X" but the stack starts with "Y"` | The name and the stack disagree. | Make the two values agree. |
| `is not in the fonts link` | A frame names a font that is not loaded. | Add the family to `layouts/partials/head.html`. |
| `role "X" is already used by "Y"` | Two frames have the same job. | Give each frame a different role. |
| `seed 101 is already used by "..."` | Two essays have the same seed. | Change the seed number. |
| `is not in data.schema.json — typo` | A field name has a spelling error. | Correct the field name. |
| `looks up #x, but no template defines it` | The code and the template disagree. | Stop. This is a fault in the code, not in your text. |
| `front matter has no "title"` | An essay has no title. | Add the `title` field. |
| `marked draft, so it will not be published` | The draft line is present. | This is usual. Delete `draft: true` to publish. |
| The image is the same on two pages | Two seeds are equal. | Change one seed number. |
| The text is absent from the preview | The draft line is present, or the server is old. | Delete `draft: true`. Start `npm run dev` again. |
| `npm run check` reports a layout error | A file in `layouts/` changed. | Run `git diff layouts/`. Then run `git checkout -- layouts/` to undo the change. |
| The site shows `404` after a deploy | The build failed, or the address is wrong. | Examine the GitHub Actions log. |
| The deploy stops with `CLOUDFLARE_API_TOKEN` | The token is absent. | Do the procedure in section 10. |

## 12. Undo a change

1. Run `git status`. The command shows the changed files.
2. Run `git diff`. The command shows the change.
3. Run `git checkout -- <file>` to undo the change in one file.

A push is not permanent. Correct the file and push again.

## 13. Get help

Use these sources:

- `npm run check` — the fastest method to find a problem
- `DESIGN.md` — the design rules and their reasons
- `CONTEXT.md` — what the project is and what it is not
- `AGENTS.md` — the same rules, written for a coding agent
- `https://typotypocasual.victroyarroyo.workers.dev/llms.txt` — a machine-readable summary
- `https://typotypocasual.victroyarroyo.workers.dev` — the live site
