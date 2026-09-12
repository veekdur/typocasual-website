/* ══════════════════════════════════════════════════════════════════════
   typocasual
   Renders the six typeface frames and the link cards, draws the generated
   concrete plates used by essays, and runs the theme switch.

   No vines, no spores, no overlays. Green is a field and an accent only.
   ══════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  /* ── Seeded randomness ──────────────────────────────────────────────
     A plate must look identical on every load, or the site feels unstable. */
  function rng(seed) {
    let a = (seed * 1831565813 + 0x6d2b79f5) >>> 0;
    const next = () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return {
      f: next,
      range: (lo, hi) => lo + next() * (hi - lo),
      int: (lo, hi) => Math.floor(lo + next() * (hi - lo + 1)),
    };
  }

  /* ── Plates ─────────────────────────────────────────────────────────
     Generated concrete. Six compositions, chosen by seed % 6. Colours come
     from CSS custom properties, so plates follow the active theme. */
  const V = {
    sky: 'var(--plate-0)',
    lit: 'var(--plate-1)',
    mid: 'var(--plate-2)',
    shade: 'var(--plate-3)',
    deep: 'var(--plate-4)',
    ground: 'var(--plate-ground)',
  };

  function plateSVG(seed) {
    const R = rng(seed);
    const uid = `p${seed}`;
    const svg = el('svg', {
      viewBox: '0 0 400 500',
      preserveAspectRatio: 'xMidYMid slice',
      class: 'plate',
      'aria-hidden': 'true',
      focusable: 'false',
    });

    const defs = el('defs');
    const fade = el('linearGradient', { id: `${uid}-fade`, x1: '0', y1: '0', x2: '0', y2: '1' });
    fade.append(
      el('stop', { offset: '0%', 'stop-color': 'rgba(0,0,0,0)' }),
      el('stop', { offset: '60%', 'stop-color': 'rgba(0,0,0,0)' }),
      el('stop', { offset: '100%', 'stop-color': 'rgba(0,0,0,0.45)' }),
    );
    defs.append(fade);
    svg.append(defs);

    const add = (tag, attrs) => { const n = el(tag, attrs); svg.append(n); return n; };
    const face = (x, y, w, h) => {
      add('rect', { x, y, width: w, height: h, fill: V.lit });
      add('rect', { x: x + w * 0.72, y, width: w * 0.28, height: h, fill: V.shade });
    };

    add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.ground });

    switch (seed % 6) {
      /* 0 — deep horizontal reveal with one standing pier */
      case 0: {
        const y = R.range(120, 175);
        add('rect', { x: 0, y: 0, width: 400, height: y, fill: V.ground });
        add('rect', { x: 0, y: y - 26, width: 400, height: 26, fill: V.deep });
        add('rect', { x: 0, y, width: 400, height: 500 - y, fill: V.ground });
        add('rect', { x: 0, y, width: 400, height: R.range(16, 26), fill: V.deep, opacity: 0.85 });
        face(R.range(120, 230), y - R.range(90, 150), R.range(34, 50), R.range(130, 190));
        for (let i = 0; i < 3; i++) {
          add('rect', { x: R.range(0, 340), y: y + 90 + i * 74, width: R.range(60, 150), height: 2, fill: V.deep, opacity: 0.4 });
        }
        break;
      }

      /* 1 — colonnade, receding */
      case 1: {
        const n = R.int(4, 6), w = 400 / n;
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.ground });
        for (let i = 0; i < n; i++) {
          const inset = (n - i) * R.range(2, 7);
          face(i * w + inset * 0.5, 40 + inset, w - inset - 6, 420 - inset * 2);
        }
        add('rect', { x: 0, y: 0, width: 400, height: 130, fill: V.sky, opacity: 0.3 });
        add('rect', { x: 0, y: 430, width: 400, height: 70, fill: V.deep, opacity: 0.7 });
        break;
      }

      /* 2 — dark mass, a few openings still catching light */
      case 2: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.ground });
        add('rect', { x: R.range(30, 70), y: 0, width: R.range(250, 320), height: 500, fill: V.shade });
        const cols = R.int(2, 3), rows = R.int(3, 4);
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if (R.f() < 0.28) continue;
            add('rect', {
              x: 78 + c * 92, y: 96 + r * 96,
              width: R.range(34, 52), height: R.range(40, 62),
              fill: R.f() < 0.55 ? V.sky : V.lit,
              opacity: R.range(0.72, 1),
            });
          }
        }
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: `url(#${uid}-fade)`, opacity: 0.5 });
        break;
      }

      /* 3 — stair, cut by one hard shadow */
      case 3: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.ground });
        add('rect', { x: 0, y: 0, width: 400, height: R.range(150, 210), fill: V.sky, opacity: 0.42 });
        const steps = R.int(9, 13), rise = 300 / steps;
        for (let i = 0; i < steps; i++) {
          add('rect', { x: 20, y: 220 + i * rise, width: 60 + i * (320 / steps), height: rise + 1, fill: i % 2 ? V.lit : V.shade });
          add('rect', { x: 20, y: 220 + i * rise, width: 60 + i * (320 / steps), height: 2.5, fill: V.deep, opacity: 0.55 });
        }
        add('path', { d: `M0 0 L${R.range(170, 240)} 0 L0 ${R.range(330, 420)} Z`, fill: V.deep, opacity: 0.34 });
        break;
      }

      /* 4 — strict window grid, light only on the top rows */
      case 4: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.ground });
        const cols = R.int(3, 4), rows = 6, cw = 400 / cols, rh = 500 / rows;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const lit = (r / rows) < R.range(0.35, 0.7);
            add('rect', {
              x: c * cw + 9, y: r * rh + 10, width: cw - 18, height: rh - 20,
              fill: lit ? V.sky : V.deep,
              opacity: lit ? R.range(0.5, 0.95) : R.range(0.7, 1),
            });
            add('rect', { x: c * cw + 9, y: r * rh + 10, width: cw - 18, height: 4, fill: V.lit, opacity: 0.5 });
          }
        }
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: `url(#${uid}-fade)` });
        break;
      }

      /* 5 — collapsed slabs, sky through the gap */
      case 5: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.ground });
        add('rect', { x: 0, y: 0, width: 400, height: 190, fill: V.sky, opacity: 0.7 });
        add('g', { transform: `rotate(${R.range(-13, -4).toFixed(2)} 200 330)` });
        add('rect', { x: -40, y: 250, width: 260, height: R.range(90, 130), fill: V.mid });
        add('rect', { x: -40, y: 250, width: 260, height: 12, fill: V.lit });
        add('rect', { x: 150, y: 300, width: 300, height: R.range(70, 110), fill: V.shade });
        add('rect', { x: 150, y: 300, width: 300, height: 10, fill: V.mid });
        add('rect', { x: 60, y: R.range(380, 430), width: 360, height: R.range(80, 120), fill: V.deep });
        break;
      }
    }

    return svg;
  }

  /* Deterministic moss height per slab, so no two joints creep alike. */
  const creepFor = (i) => (((i * 7 + 3) % 11) / 11).toFixed(3);

  /* ── Frames: one typeface each ────────────────────────────────────── */

  const text = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    node.textContent = value;
    return node;
  };

  function renderFrames(head, frames) {
    const grid = $('#frame-grid');
    if (!grid) return;

    const titleNode = $('#frames-title'), blurbNode = $('#frames-blurb');
    if (head?.title && titleNode) titleNode.append(document.createTextNode(head.title));
    if (blurbNode) blurbNode.textContent = head.blurb ?? '';

    grid.innerHTML = '';
    (frames ?? []).forEach((frame, i) => {
      const card = document.createElement('article');
      card.className = 'frame';
      card.style.setProperty('--creep', creepFor(i));

      const header = document.createElement('div');
      header.className = 'frame__head';
      header.append(
        text('span', 'frame__n', String(i + 1).padStart(2, '0')),
        text('span', 'frame__role', frame.role ?? ''),
      );

      const win = document.createElement('div');
      win.className = 'frame__win';

      const sample = text('span', 'frame__sample', frame.sample ?? '');
      const line = text('span', 'frame__line', frame.specimen ?? '');
      // Set the stack through the style property, not a string, so quotes in
      // the family name cannot break the markup.
      for (const node of [sample, line]) {
        node.style.fontFamily = frame.stack ?? '';
        if (frame.weight) node.style.fontWeight = String(frame.weight);
      }
      win.append(sample, line);

      const meta = document.createElement('div');
      meta.className = 'frame__meta';
      meta.append(
        text('h3', 'frame__name', frame.name ?? ''),
        text('p', 'frame__weights', frame.weights ?? ''),
      );

      const notes = document.createElement('dl');
      notes.className = 'frame__notes';
      for (const [label, value] of [['Why', frame.why], ['Used', frame.used]]) {
        if (!value) continue;
        const row = document.createElement('div');
        row.append(text('dt', null, label), text('dd', null, value));
        notes.append(row);
      }

      card.append(header, win, meta, notes);
      grid.append(card);
    });
  }

  /* ── Elsewhere: outbound links ────────────────────────────────────── */

  function renderLinks(head, links) {
    const grid = $('#link-grid');
    if (!grid) return;

    const titleNode = $('#links-title'), blurbNode = $('#links-blurb');
    if (head?.title && titleNode) titleNode.append(document.createTextNode(head.title));
    if (blurbNode) blurbNode.textContent = head.blurb ?? '';

    grid.innerHTML = '';
    (links ?? []).forEach((link, i) => {
      let host = '';
      try { host = new URL(link.url).hostname.replace(/^www\./, ''); } catch { host = ''; }

      const card = document.createElement('a');
      card.className = 'linkcard';
      card.style.setProperty('--creep', creepFor(i + 4));
      card.href = link.url;
      card.target = '_blank';
      card.rel = 'noopener me';

      const preview = document.createElement('div');
      preview.className = 'linkcard__preview';
      preview.append(text('span', 'linkcard__mark', (link.title ?? '?').charAt(0).toUpperCase()));

      const body = document.createElement('div');
      body.className = 'linkcard__body';
      body.append(
        text('p', 'linkcard__domain', host),
        text('h3', 'linkcard__title', link.title ?? ''),
      );
      if (link.handle) body.append(text('p', 'linkcard__handle', link.handle));
      if (link.desc) body.append(text('p', 'linkcard__desc', link.desc));

      const go = document.createElement('p');
      go.className = 'linkcard__go';
      go.append(document.createTextNode('Open '));
      const arrow = text('span', 'arrow', '↗');
      arrow.setAttribute('aria-hidden', 'true');
      go.append(arrow);
      const sr = text('span', 'sr-only', ` — ${link.title ?? ''} (opens in a new tab)`);
      go.append(sr);
      body.append(go);

      card.append(preview, body);
      grid.append(card);

      // The mark sits under the favicon: if the favicon never loads, the
      // monogram is still there, so a dead link looks deliberate.
      if (host) {
        const img = document.createElement('img');
        img.className = 'linkcard__favicon';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = '';
        img.width = 42;
        img.height = 42;
        img.src = `https://${host}/favicon.ico`;
        img.addEventListener('error', () => img.remove());
        preview.append(img);
      }

      emitLinkSchema(head, links, i);
    });
  }

  /* Structured data for the links, from the same source as the cards. */
  function emitLinkSchema(head, links) {
    let node = document.getElementById('ld-links');
    if (!node) {
      node = document.createElement('script');
      node.type = 'application/ld+json';
      node.id = 'ld-links';
      document.head.append(node);
    }
    node.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: head?.title ?? 'Elsewhere',
      itemListElement: (links ?? []).map((link, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: link.title,
        url: link.url,
        description: link.desc,
      })),
    });
  }

  /* ── Theme ────────────────────────────────────────────────────────── */

  const LABEL = { dark: 'Moonlit', light: 'Sunlit' };

  function setTheme(theme, persist = true) {
    document.documentElement.dataset.theme = theme;
    const label = $('#theme-label');
    if (label) label.textContent = LABEL[theme];
    $('#theme-toggle')?.setAttribute(
      'aria-label',
      `Appearance: ${LABEL[theme]}. Switch to ${LABEL[theme === 'dark' ? 'light' : 'dark']}.`,
    );
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d1a12' : '#e5e2da');
    if (persist) { try { localStorage.setItem('tc-theme', theme); } catch {} }
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('tc-theme'); } catch {}
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(saved || (prefersLight ? 'light' : 'dark'), false);
  })();

  $('#theme-toggle')?.addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  /* ── Squiggle ─────────────────────────────────────────────────────── */

  (function drawSquiggle() {
    const path = $('.squiggle__path');
    if (!path || REDUCED) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.style.transition = 'stroke-dashoffset 820ms cubic-bezier(0.2, 0, 0, 1) 200ms';
    requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; }));
  })();

  /* ── Boot ─────────────────────────────────────────────────────────── */

  // Essay pages ask for a plate without shipping data.json.
  $$('[data-plate-seed]').forEach((host) => {
    host.append(plateSVG(Number(host.dataset.plateSeed) || 1));
  });

  if (!$('#frame-grid')) return;

  fetch('/data.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`data.json ${r.status}`); return r.json(); })
    .then((data) => {
      renderFrames(data.framesHead, data.frames);
      renderLinks(data.linksHead, data.links);
    })
    .catch((err) => {
      const grid = $('#frame-grid');
      if (grid) grid.textContent = `Could not load /data.json — ${err.message}`;
      console.error(err);
    });
})();
