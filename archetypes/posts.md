---
title: "{{ replace .File.ContentBaseName "-" " " | title }}"
date: {{ .Date }}
draft: true
description: "One line. Shown under the title, in the index, and in link previews."
# seed picks the generated concrete plate (archetype rotates by seed % 6).
# Two essays must not share a seed. Omit `image` to get a generated plate.
seed: 101
growth: 0.3
caption: "Plate caption, shown under the image."
---

Open with the thing you actually want to say.

## A heading

Body text. Links, `code`, lists, blockquotes and tables all work, and are styled by
`.prose` in `static/styles.css`.

> Blockquotes render in Lora, italic, in moss.
