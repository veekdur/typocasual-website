/* ══════════════════════════════════════════════════════════════════════
   typocasual — contact sheet
   Renders frames from /data.json, grows vines over the structure,
   and keeps the whole thing usable without a mouse.
   ══════════════════════════════════════════════════════════════════════ */

(() => {
  'use strict';

  const $  = (sel, root = document) => root.querySelector(sel);
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}) => {
    const node = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    return node;
  };

  /* ── Seeded randomness ──────────────────────────────────────────────
     Plates must be identical on every load, or the sheet feels unstable. */
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
     Procedural concrete. Six compositions, so a contact sheet of them
     reads as a body of work rather than a repeated tile.
     Colours come from CSS custom properties, so plates follow the theme. */
  const V = { sky0: 'var(--plate-sky-0)', sky1: 'var(--plate-sky-1)', lit: 'var(--plate-lit)',
              mid: 'var(--plate-mid)', shade: 'var(--plate-shadow)', deep: 'var(--plate-deep)',
              mossMid: 'var(--moss-mid)', mossDeep: 'var(--moss-deep)', mossLit: 'var(--moss-lit)',
              mossBright: 'var(--moss-bright)' };

  function plateSVG(seed, growth) {
    const R = rng(seed);
    const uid = `p${seed}`;
    const svg = el('svg', {
      viewBox: '0 0 400 500', preserveAspectRatio: 'xMidYMid slice',
      class: 'plate', role: 'presentation', 'aria-hidden': 'true',
    });

    const defs = el('defs');
    const sky = el('linearGradient', { id: `${uid}-sky`, x1: '0', y1: '0', x2: '0.4', y2: '1' });
    sky.append(
      el('stop', { offset: '0%',   'stop-color': V.sky0 }),
      el('stop', { offset: '100%', 'stop-color': V.sky1 }),
    );
    const fade = el('linearGradient', { id: `${uid}-fade`, x1: '0', y1: '0', x2: '0', y2: '1' });
    fade.append(
      el('stop', { offset: '0%',   'stop-color': 'rgba(0,0,0,0)' }),
      el('stop', { offset: '58%',  'stop-color': 'rgba(0,0,0,0)' }),
      el('stop', { offset: '100%', 'stop-color': 'rgba(0,0,0,0.42)' }),
    );
    defs.append(sky, fade);
    svg.append(defs);

    const add = (tag, attrs) => { const n = el(tag, attrs); svg.append(n); return n; };

    add('rect', { x: 0, y: 0, width: 400, height: 500, fill: `url(#${uid}-sky)` });

    // Raking light: one bright face, one deep one. Every archetype uses it.
    const litFace = (x, y, w, h) => {
      add('rect', { x, y, width: w, height: h, fill: V.lit });
      add('rect', { x: x + w * 0.72, y, width: w * 0.28, height: h, fill: V.shade });
    };

    switch (seed % 6) {
      /* 0 — deep horizontal reveal, one lit pier standing in it */
      case 0: {
        const y = R.range(120, 175);
        add('rect', { x: 0, y: 0, width: 400, height: y, fill: V.sky0, opacity: 0.55 });
        add('rect', { x: 0, y: y - 26, width: 400, height: 26, fill: V.deep });
        add('rect', { x: 0, y: y, width: 400, height: 500 - y, fill: V.mid });
        add('rect', { x: 0, y: y, width: 400, height: R.range(16, 26), fill: V.deep, opacity: 0.85 });
        const px = R.range(120, 230), pw = R.range(34, 50);
        litFace(px, y - R.range(90, 150), pw, R.range(90, 150) + 40);
        for (let i = 0; i < 3; i++) {
          add('rect', { x: R.range(0, 340), y: y + 90 + i * 74, width: R.range(60, 150),
                        height: 2, fill: V.deep, opacity: 0.4 });
        }
        break;
      }

      /* 1 — colonnade receding into shade */
      case 1: {
        const n = R.int(4, 6), w = 400 / n;
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.deep });
        for (let i = 0; i < n; i++) {
          const x = i * w;
          const inset = (n - i) * R.range(2, 7);
          litFace(x + inset * 0.5, 40 + inset, w - inset - 6, 420 - inset * 2);
          add('rect', { x, y: 0, width: w, height: 44, fill: V.deep });
        }
        add('rect', { x: 0, y: 0, width: 400, height: 130, fill: V.sky0, opacity: 0.30 });
        add('rect', { x: 0, y: 430, width: 400, height: 70, fill: V.deep, opacity: 0.7 });
        break;
      }

      /* 2 — dark mass, a few openings still catching light */
      case 2: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.deep });
        add('rect', { x: R.range(30, 70), y: 0, width: R.range(250, 320), height: 500, fill: V.shade });
        const cols = R.int(2, 3), rows = R.int(3, 4);
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            if (R.f() < 0.28) continue;
            add('rect', { x: 78 + c * 92, y: 96 + r * 96, width: R.range(34, 52), height: R.range(40, 62),
                          fill: R.f() < 0.55 ? V.sky0 : V.lit, opacity: R.range(0.72, 1) });
          }
        }
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: `url(#${uid}-fade)`, opacity: 0.5 });
        break;
      }

      /* 3 — stair, cut by one hard shadow */
      case 3: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.mid });
        add('rect', { x: 0, y: 0, width: 400, height: R.range(150, 210), fill: V.sky0, opacity: 0.42 });
        const steps = R.int(9, 13), rise = 300 / steps;
        for (let i = 0; i < steps; i++) {
          const w = 60 + i * (320 / steps);
          add('rect', { x: 20, y: 220 + i * rise, width: w, height: rise + 1,
                        fill: i % 2 ? V.lit : V.shade });
          add('rect', { x: 20, y: 220 + i * rise, width: w, height: 2.5, fill: V.deep, opacity: 0.55 });
        }
        add('path', { d: `M0 0 L${R.range(170, 240)} 0 L0 ${R.range(330, 420)} Z`, fill: V.deep, opacity: 0.34 });
        break;
      }

      /* 4 — strict window grid, light falling only on the top rows */
      case 4: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.shade });
        const cols = R.int(3, 4), rows = 6, cw = 400 / cols, rh = 500 / rows;
        for (let c = 0; c < cols; c++) {
          for (let r = 0; r < rows; r++) {
            const lit = (r / rows) < R.range(0.35, 0.7);
            add('rect', {
              x: c * cw + 9, y: r * rh + 10, width: cw - 18, height: rh - 20,
              fill: lit ? V.sky0 : V.deep, opacity: lit ? R.range(0.5, 0.95) : R.range(0.7, 1),
            });
            add('rect', { x: c * cw + 9, y: r * rh + 10, width: cw - 18, height: 4, fill: V.lit, opacity: 0.5 });
          }
        }
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: `url(#${uid}-fade)` });
        break;
      }

      /* 5 — collapsed slabs, sky through the gap */
      case 5: {
        add('rect', { x: 0, y: 0, width: 400, height: 500, fill: V.sky1, opacity: 0.75 });
        add('rect', { x: 0, y: 0, width: 400, height: 190, fill: V.sky0, opacity: 0.7 });
        add('g', { transform: `rotate(${R.range(-13, -4).toFixed(2)} 200 330)` });
        add('rect', { x: -40, y: 250, width: 260, height: R.range(90, 130), fill: V.mid });
        add('rect', { x: -40, y: 250, width: 260, height: 12, fill: V.lit });
        add('rect', { x: 150, y: 300, width: 300, height: R.range(70, 110), fill: V.shade });
        add('rect', { x: 150, y: 300, width: 300, height: 10, fill: V.mid });
        add('rect', { x: 60, y: R.range(380, 430), width: 360, height: R.range(80, 120), fill: V.deep });
        break;
      }
    }

    // Growth creeps into the photograph too — the frames are not exempt.
    const bank = el('g', { filter: 'url(#overgrown-fine)' });
    const h = 40 + growth * 190;
    bank.append(el('path', {
      d: `M-10 520 L-10 ${500 - h} Q60 ${500 - h - R.range(24, 52)} 130 ${500 - h + R.range(6, 30)} ` +
         `T280 ${500 - h - R.range(4, 34)} Q350 ${500 - h - R.range(22, 48)} 410 ${500 - h + R.range(0, 26)} ` +
         `L410 520 Z`,
      fill: V.mossDeep, opacity: 0.92,
    }));
    bank.append(el('path', {
      d: `M-10 520 L-10 ${500 - h * 0.55} Q70 ${500 - h * 0.62} 150 ${500 - h * 0.5} ` +
         `T300 ${500 - h * 0.6} Q360 ${500 - h * 0.68} 410 ${500 - h * 0.52} L410 520 Z`,
      fill: V.mossMid, opacity: 0.9,
    }));
    svg.append(bank);

    return svg;
  }

  /* ── Vines ────────────────────────────────────────────────────────── */

  const cubic = (p0, p1, p2, p3, t) => {
    const u = 1 - t, a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
    return {
      x: a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
      y: a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
    };
  };

  const VINES = [
    { cls: 'vine',      pts: [[-20, -30], [120, 90], [60, 260], [150, 420]], leaves: 15, len: 150 },
    { cls: 'vine vine--b', pts: [[1620, -40], [1470, 100], [1540, 280], [1430, 470]], leaves: 13, len: 140 },
    { cls: 'vine vine--c', pts: [[820, -60], [880, 140], [760, 320], [830, 560]], leaves: 17, len: 175 },
  ];

  function growVines() {
    const host = $('#vines');
    if (!host) return;

    VINES.forEach((v, vi) => {
      const g = el('g', { class: v.cls });
      const [p0, p1, p2, p3] = v.pts;

      // Two stems per vine, slightly offset, so it reads as a runner not a rope.
      for (let s = 0; s < 2; s++) {
        const off = s * 4;
        g.append(el('path', {
          class: 'vine__stem',
          'stroke-width': (7 - s * 2.4).toFixed(1),
          d: `M${p0[0] + off} ${p0[1]} C${p1[0] + off} ${p1[1]}, ${p2[0] + off} ${p2[1]}, ${p3[0] + off} ${p3[1]}`,
        }));
      }

      const R = rng(100 + vi * 17);
      for (let i = 1; i <= v.leaves; i++) {
        const t = i / (v.leaves + 1);
        const { x, y } = cubic(p0, p1, p2, p3, t);
        const side = i % 2 ? 1 : -1;
        const size = v.len * R.range(0.2, 0.34) * (1 - t * 0.45);
        const rot = side * R.range(18, 62) + (t * 90);
        const leaf = el('ellipse', {
          class: i % 3 === 0 ? 'vine__leaf vine__leaf--lit' : 'vine__leaf',
          cx: x + side * size * 0.42, cy: y + R.range(-5, 5),
          rx: size * 0.44, ry: size * 0.2,
          transform: `rotate(${rot.toFixed(1)} ${x} ${y})`,
          opacity: (0.72 + R.f() * 0.28).toFixed(2),
        });
        // Idle motion costs nothing but sells the whole idea.
        if (!REDUCED) {
          leaf.style.animation = `sway ${(6 + R.f() * 7).toFixed(1)}s ease-in-out ${(-R.f() * 6).toFixed(1)}s infinite alternate`;
          leaf.style.transformBox = 'fill-box';
          leaf.style.transformOrigin = 'center';
        }
        g.append(leaf);
      }
      host.append(g);
    });

    if (REDUCED) return;
    const spores = $('#spores');
    if (!spores) return;
    const R = rng(4);
    for (let i = 0; i < 26; i++) {
      spores.append(el('circle', {
        class: 'spore',
        cx: R.range(0, 1600), cy: R.range(420, 900),
        r: R.range(1.1, 2.8).toFixed(1),
        opacity: 0.4,
        style: `animation-duration:${R.range(14, 30).toFixed(1)}s;animation-delay:${(-R.range(0, 26)).toFixed(1)}s`,
      }));
    }
  }

  /* ── Frame rendering ──────────────────────────────────────────────── */

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const STAGE_LABEL = { bare: 'Bare', encroaching: 'Encroaching', consumed: 'Consumed' };

  function renderFrame(item, index) {
    const frame = document.createElement('article');
    frame.className = `frame frame--${item.kind}`;
    frame.style.setProperty('--g', String(item.growth ?? 0));
    frame.dataset.index = String(index);

    const no = String(index + 1).padStart(3, '0');
    frame.innerHTML = `
      <p class="frame__no">FR&nbsp;${no}</p>
      <p class="frame__stage" data-stage="${esc(item.stage)}">${esc(STAGE_LABEL[item.stage] ?? item.stage ?? '')}</p>
      <div class="frame__win"></div>
      <div class="frame__moss"></div>
      <div class="frame__tuft"></div>
      <div class="frame__cap">
        <b>${esc(item.title)}</b>
        <span>${esc(item.year ?? '')}</span>
      </div>
      <button class="frame__trigger" type="button" aria-label="Open frame ${no}: ${esc(item.title)}"></button>`;

    const win = $('.frame__win', frame);

    if (item.kind === 'plate') {
      win.append(plateSVG(item.seed ?? index + 1, item.growth ?? 0));
    } else if (item.kind === 'spec') {
      const spec = document.createElement('div');
      spec.className = 'spec';
      spec.innerHTML = `
        <div>
          <div class="spec__glyph" style="font-family:${esc(item.stack)};font-weight:${item.weight ?? 400}">${esc(item.sample)}</div>
          <div class="spec__line" style="font-family:${esc(item.stack)};font-weight:${item.weight ?? 400}">${esc(item.specimen)}</div>
        </div>
        <div class="spec__foot"><span>${esc(item.title)}</span><span>${esc(item.medium)}</span></div>`;
      win.append(spec);
    } else {
      const note = document.createElement('div');
      note.className = 'note';
      note.innerHTML = `
        <h3 class="note__head">${esc(item.title)}</h3>
        <p class="note__body">${esc(item.body)}</p>
        ${item.tags?.length
          ? `<ul class="note__tags">${item.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>`
          : ''}`;
      win.append(note);
    }

    $('.frame__trigger', frame).addEventListener('click', () => openLightbox(index));
    return frame;
  }

  /* ── State ────────────────────────────────────────────────────────── */

  const state = { items: [], filters: [], active: 'all', shown: [], lastFocus: null };

  function renderFilters() {
    const host = $('.filters__inner');
    host.innerHTML = '';
    state.filters.forEach((f) => {
      const n = f.id === 'all'
        ? state.items.length
        : state.items.filter((i) => i.kind === f.id || i.stage === f.id).length;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'filter';
      b.dataset.id = f.id;
      b.setAttribute('aria-pressed', String(f.id === state.active));
      b.innerHTML = `${esc(f.label)}<span class="filter__n">${String(n).padStart(2, '0')}</span>`;
      b.addEventListener('click', () => setFilter(f.id));
      host.append(b);
    });
  }

  function setFilter(id) {
    state.active = id;
    document.querySelectorAll('.filter').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    paint();
  }

  function paint() {
    const sheet = $('#sheet');
    sheet.innerHTML = '';
    const items = state.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => state.active === 'all' || item.kind === state.active || item.stage === state.active);

    if (!items.length) {
      sheet.innerHTML = '<p class="nojs">No frames in this state yet. There is only growth.</p>';
    } else {
      const frag = document.createDocumentFragment();
      items.forEach(({ item, index }) => frag.append(renderFrame(item, index)));
      sheet.append(frag);
    }

    state.shown = items.map(({ index }) => index);
    const note = $('#filters-note');
    const label = state.filters.find((f) => f.id === state.active)?.label ?? 'All frames';
    note.textContent = `${label} · showing ${state.shown.length} of ${state.items.length} frames`;
    $('#frame-count').textContent = String(state.items.length);
  }

  /* ── Elsewhere: outbound links ────────────────────────────────────────
     The card's preview is a generated plate, so it never depends on the
     destination being reachable. A favicon is layered on top if it loads. */
  function renderLinks(head, links) {
    const grid = $('#link-grid');
    if (!grid) return;

    const titleNode = $('#links-head'), blurbNode = $('#links-blurb');
    if (head?.title && titleNode) titleNode.textContent = head.title;
    if (blurbNode) blurbNode.textContent = head.blurb ?? '';

    grid.innerHTML = '';
    (links ?? []).forEach((link, i) => {
      let host = '';
      try { host = new URL(link.url).hostname.replace(/^www\./, ''); } catch { host = ''; }

      const card = document.createElement('a');
      card.className = 'linkcard';
      card.href = link.url;
      card.target = '_blank';
      card.rel = 'noopener me';
      card.style.setProperty('--g', String(link.growth ?? 0.2));
      card.innerHTML = `
        <div class="linkcard__preview">
          <span class="linkcard__mark" aria-hidden="true">${esc((link.title ?? '?').trim().charAt(0).toUpperCase())}</span>
        </div>
        <div class="linkcard__body">
          <p class="linkcard__domain">${esc(host)}</p>
          <h3 class="linkcard__title">${esc(link.title)}</h3>
          ${link.handle ? `<p class="linkcard__handle">${esc(link.handle)}</p>` : ''}
          <p class="linkcard__desc">${esc(link.desc)}</p>
          <p class="linkcard__go">Open <span class="arrow" aria-hidden="true">↗</span><span class="sr-only"> — ${esc(link.title)} (opens in a new tab)</span></p>
        </div>
        <div class="linkcard__moss"></div>
        <div class="linkcard__tuft"></div>`;

      const preview = $('.linkcard__preview', card);
      preview.prepend(plateSVG(link.seed ?? 90 + i, link.growth ?? 0.2));

      if (host) {
        const img = document.createElement('img');
        img.className = 'linkcard__favicon';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = '';
        img.width = 46;
        img.height = 46;
        img.src = `https://${host}/favicon.ico`;
        img.addEventListener('error', () => img.remove());
        preview.append(img);
      }

      grid.append(card);
    });

    emitLinkSchema(head, links);
  }

  /* The links are already the source of truth for the cards, so derive the
     structured data from them rather than maintaining a second copy. */
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

  /* Counts in the colophon are derived, never hand-written. */
  function fillCounts() {
    const tally = (kind) => state.items.filter((i) => i.kind === kind).length;
    const set = (id, value) => { const n = $(`#${id}`); if (n) n.textContent = String(value); };
    set('cf-frames', state.items.length);
    set('cf-plates', tally('plate'));
    set('cf-specs', tally('spec'));
    set('cf-notes', tally('note'));
  }

  /* ── Lightbox ─────────────────────────────────────────────────────── */

  const lb = $('#lightbox');

  function openLightbox(index) {
    state.lastFocus = document.activeElement;
    fillLightbox(index);
    lb.hidden = false;
    document.body.classList.add('is-locked');
    $('.lightbox__close').focus();
  }

  function closeLightbox() {
    lb.hidden = true;
    document.body.classList.remove('is-locked');
    state.lastFocus?.focus?.();
  }

  function fillLightbox(index) {
    const item = state.items[index];
    if (!item) return;
    lb.dataset.index = String(index);
    const no = String(index + 1).padStart(3, '0');

    $('#lb-frame').textContent = `Frame ${no} · ${STAGE_LABEL[item.stage] ?? ''} · Growth ${Math.round((item.growth ?? 0) * 100)}%`;
    $('#lb-title').textContent = item.title;
    $('#lb-meta').textContent = [item.medium, item.year, item.subject].filter(Boolean).join(' · ');

    const media = $('#lb-media');
    media.innerHTML = '';
    if (item.kind === 'plate') {
      media.append(plateSVG(item.seed ?? index + 1, item.growth ?? 0));
    } else if (item.kind === 'spec') {
      const d = document.createElement('div');
      d.className = 'spec';
      d.innerHTML = `
        <div>
          <div class="spec__glyph" style="font-family:${esc(item.stack)};font-weight:${item.weight ?? 400}">${esc(item.sample)}</div>
          <div class="spec__line" style="font-family:${esc(item.stack)};font-weight:${item.weight ?? 400}">${esc(item.specimen)}</div>
        </div>
        <div class="spec__foot"><span>${esc(item.title)}</span><span>${esc(item.medium)}</span></div>`;
      media.append(d);
    } else {
      const d = document.createElement('div');
      d.className = 'spec';
      d.innerHTML = `<div class="spec__glyph" style="font-size:clamp(3.4rem,9vw,6rem)">§</div>
        <div class="spec__foot"><span>${esc(item.title)}</span><span>${esc(item.year ?? '')}</span></div>`;
      media.append(d);
    }

    const text = $('#lb-text');
    text.innerHTML = item.body ? `<p>${esc(item.body)}</p>` : '';
    if (item.note) text.innerHTML += `<p><em>${esc(item.note)}</em></p>`;
    if (item.tags?.length) {
      text.innerHTML += `<ul class="note__tags">${item.tags.map((t) => `<li class="tag">${esc(t)}</li>`).join('')}</ul>`;
    }
  }

  function step(dir) {
    const cur = Number(lb.dataset.index ?? 0);
    const pos = state.shown.indexOf(cur);
    const nextPos = (pos + dir + state.shown.length) % state.shown.length;
    fillLightbox(state.shown[nextPos]);
  }

  lb.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeLightbox(); });
  $('#lb-prev').addEventListener('click', () => step(-1));
  $('#lb-next').addEventListener('click', () => step(1));

  document.addEventListener('keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') { closeLightbox(); return; }
    if (e.key === 'ArrowLeft') { step(-1); return; }
    if (e.key === 'ArrowRight') { step(1); return; }
    if (e.key !== 'Tab') return;
    // Keep focus inside the dialog.
    const focusable = [...lb.querySelectorAll('button:not([disabled])')];
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ── Theme ────────────────────────────────────────────────────────── */

  const LABEL = { dark: 'Moonlit', light: 'Sunlit' };

  function setTheme(theme, persist = true) {
    document.documentElement.dataset.theme = theme;
    $('#theme-label').textContent = LABEL[theme];
    $('#theme-toggle').setAttribute('aria-label', `Appearance: ${LABEL[theme]}. Switch to ${LABEL[theme === 'dark' ? 'light' : 'dark']}.`);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#06110f' : '#103c26');
    if (persist) { try { localStorage.setItem('tc-theme', theme); } catch {} }
  }

  (function initTheme() {
    let saved = null;
    try { saved = localStorage.getItem('tc-theme'); } catch {}
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    setTheme(saved || (prefersLight ? 'light' : 'dark'), false);
  })();

  $('#theme-toggle').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  /* ── Squiggle: draw it in, the way a spellchecker would ───────────── */

  (function drawSquiggle() {
    const path = $('.squiggle__path');
    if (!path || REDUCED) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    path.style.strokeDashoffset = String(len);
    path.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.2, 0, 0, 1) 220ms';
    requestAnimationFrame(() => requestAnimationFrame(() => { path.style.strokeDashoffset = '0'; }));
  })();

  /* ── Boot ─────────────────────────────────────────────────────────── */

  growVines();

  fetch('/data.json', { cache: 'no-cache' })
    .then((r) => { if (!r.ok) throw new Error(`data.json ${r.status}`); return r.json(); })
    .then((data) => {
      state.items = data.items ?? [];
      state.filters = data.filters ?? [{ id: 'all', label: 'All frames' }];
      renderFilters();
      paint();
      fillCounts();
      renderLinks(data.linksHead, data.links);
    })
    .catch((err) => {
      $('#sheet').innerHTML =
        `<p class="nojs">Could not load <code>/data.json</code> — ${esc(err.message)}</p>`;
      console.error(err);
    });
})();
