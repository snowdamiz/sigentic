(() => {
  'use strict';

  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const stage = hero.querySelector('[data-stage]');
  const canvas = stage && stage.querySelector('canvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) return;

  const title = hero.querySelector('.hero__title');
  const rotor = hero.querySelector('[data-rotator]');
  const caption = hero.querySelector('[data-stage-caption]');
  const numEl = hero.querySelector('[data-stage-num]');
  const nameEl = hero.querySelector('[data-stage-name]');
  const fieldEl = hero.querySelector('[data-stage-field]');
  const ticksEl = hero.querySelector('[data-stage-ticks]');
  const pauseBtn = hero.querySelector('[data-stage-pause]');
  const indexLinks = [...hero.querySelectorAll('.index [data-product]')];

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const dot = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

  const SCENES = [
    {
      product: 'seed',
      name: 'The Seed',
      field: 'Sigentic Labs',
      word: 'what’s next.',
      fills: [...document.querySelectorAll('#i-logo path')].map((path) => path.getAttribute('d')),
    },
    {
      product: 'savorly',
      name: 'Savorly',
      field: 'Cooking',
      word: 'the kitchen.',
      box: [7, 0, 280],
      layers: [
        ['fill', 'M 85.831 20.955 C 65.669 24.652, 45.830 36.276, 34.458 51.055 C 9.377 83.650, 15.946 126.429, 49.476 148.856 C 53.525 151.564, 57.339 153.946, 57.953 154.151 C 59.191 154.564, 64.133 176.704, 72.500 219.328 C 78.831 251.576, 79.162 252.633, 83.601 254.750 C 86.704 256.229, 87.612 256.141, 100.192 253.130 C 136.586 244.421, 173.514 239.126, 211.242 237.204 C 234.454 236.022, 234.111 236.426, 236.494 207.500 C 237.400 196.500, 238.447 185.087, 238.821 182.137 L 239.500 176.774 245.641 174.553 C 262.741 168.366, 274 152.296, 274 134.076 C 274 97.310, 231.041 75.219, 195.603 93.762 C 181.257 101.268, 169.814 115.068, 157.842 139.300 L 150.826 153.500 151.287 144.500 C 152.136 127.972, 160.941 111.485, 174.287 101.436 C 177.704 98.862, 181.063 96.539, 181.750 96.272 C 184.884 95.054, 181.877 81.641, 175.513 68.445 C 164.497 45.606, 145.812 30.068, 120.826 22.967 C 112.610 20.632, 93.563 19.537, 85.831 20.955'],
        ['cut', 'M 194.007 154.593 C 189.800 156.417, 186.305 159.549, 184.409 163.193 C 182.316 167.216, 184.201 167.414, 190.039 163.785 C 194.353 161.103, 196.456 160.487, 202.370 160.175 C 210.025 159.770, 211.397 159.199, 210.478 156.803 C 209.041 153.059, 200.262 151.881, 194.007 154.593 M 131.453 169.326 C 123.795 172.277, 117.639 178.262, 115.575 184.763 C 114.495 188.166, 116.686 187.544, 121.539 183.071 C 126.496 178.502, 132.078 175.451, 137.261 174.479 C 142.040 173.582, 143.614 171.757, 141.463 169.606 C 139.609 167.751, 135.815 167.645, 131.453 169.326'],
        ['cut', 'M 192.500 174.608 C 179.597 181.672, 178.079 201.815, 189.871 209.495 C 196.729 213.962, 203.946 213.321, 209.501 207.750 C 216.078 201.155, 217.317 190.314, 212.548 181.093 C 209.082 174.391, 198.907 171.100, 192.500 174.608 M 132.500 187.164 C 119.027 194.597, 116.868 213.696, 128.497 222.566 C 136.357 228.561, 147.522 226.071, 152.764 217.154 C 158.318 207.707, 155.631 193.025, 147.420 187.951 C 143.896 185.773, 135.796 185.346, 132.500 187.164'],
        ['fill', 'M 201.180 178.283 C 198.885 181.049, 198.109 184.810, 199.096 188.385 C 201.327 196.465, 210.615 197.376, 213.306 189.778 C 214.157 187.376, 212.109 182, 210.343 182 C 209.540 182, 209.172 181.530, 209.527 180.956 C 211.387 177.948, 203.543 175.435, 201.180 178.283 M 140.455 191.455 C 133.904 198.005, 141.030 210.612, 149.455 207.379 C 153.839 205.697, 154.859 197.065, 150.922 194.958 C 149.866 194.393, 149.316 193.339, 149.639 192.499 C 150.007 191.538, 149.278 190.676, 147.537 190.014 C 143.773 188.583, 143.212 188.697, 140.455 191.455'],
      ],
    },
    {
      product: 'morse',
      name: 'Morse',
      field: 'Private messaging',
      word: 'private chats.',
      box: [212, 212, 600],
      layers: [
        ['fill', 'M 248 392 A 88 88 0 1 1 424 392 A 88 88 0 1 1 248 392 Z'],
        ['fill', 'M 336 544 H 688 A 88 88 0 0 1 688 720 H 336 A 88 88 0 0 1 336 544 Z'],
      ],
    },
    {
      product: 'mesh',
      name: 'Mesh',
      field: 'Programming language',
      word: 'the backend.',
      stroke: 7,
      paths: ['M50 17L88.1 83L11.9 83Z', 'M50 61L50 17', 'M50 61L88.1 83', 'M50 61L11.9 83'],
      fills: [dot(50, 17, 9), dot(88.1, 83, 9), dot(11.9, 83, 9), dot(50, 61, 11)],
    },
    {
      product: 'incant',
      name: 'Incant',
      field: 'Game engine',
      word: 'game makers.',
      box: [0, 0, 512],
      layers: [
        ['fill', 'M323 12C336.4 10.5 351.6 15.9 363.9 21C396.6 34.5 429.9 59.5 432.4 97.6C433.2 109.7 430.4 122.7 424 133.1C414 149.5 398.2 160.4 382.3 170.5C365.5 181.2 349.4 192.5 351.9 214.9C353.7 229.9 365.8 243.1 375.9 253.3C394.1 271.8 415 287.8 425.5 312.3C431.9 327.1 433 343.3 431.6 359.1C426.6 415.6 385.9 457.8 337.3 482.7C322.8 490.1 306.6 498.2 290.3 500C293.1 496.4 296.2 493 298.1 488.7C305.9 471.3 291.1 460.2 276 455.9C263.6 452.4 250.5 451.2 237.8 449.4C224.1 447.4 210.6 444.7 197.1 441.5C141.8 428 95.9 394.7 81.8 337.4C78.2 322.8 77.5 306.6 79.6 291.7C89.2 221.8 146 168.9 210.2 145.6C244.9 133.1 296.8 123.6 326.2 103.8C364.2 78.2 363.6 34.4 323 12Z'],
        ['cut', 'M246 291.6C231.4 291.7 225.1 308.3 223.6 320.3C220.6 343.1 228 370.1 245.2 385.9C249.9 390.3 255.8 393.8 262.4 393.8C277.1 393.9 283.5 377.9 285.3 365.7C288.2 345.2 282.2 323.1 269.7 306.6C264.2 299.3 255.9 291.4 246 291.6ZM140.7 269.3C132.2 271.3 128.3 281.7 126.9 289.3C123.4 307.3 125.7 326.2 133.8 342.7C137.3 349.9 145.4 360.8 154.8 358.8C163.2 357 167.8 346.7 169.3 339.2C172.9 321.2 170.6 301.3 162 285C158 277.5 150.6 266.9 140.7 269.3Z'],
      ],
    },
    {
      product: 'mixer',
      name: 'Mixer',
      field: 'Mobile platform',
      word: 'every phone.',
      image: 'assets/img/work/mixer-flick.webp',
    },
  ];

  const probe = document.createElement('i');
  probe.hidden = true;
  hero.append(probe);
  /* The canvas reads a colour back as #rrggbb for hex, named colours, rgb() and hsl(). oklch(), lab(), color() and
     color-mix() come back in their own syntax, which this cannot parse. The token table is six-digit hex anyway. */
  const rgbOf = (name) => {
    ctx.fillStyle = getComputedStyle(probe).getPropertyValue(name).trim();
    return [1, 3, 5].map((i) => parseInt(ctx.fillStyle.slice(i, i + 2), 16));
  };
  const INK = rgbOf('--ink');
  SCENES.forEach((s) => {
    probe.dataset.product = s.product;
    s.tint = rgbOf('--p-tint');
    s.ink = rgbOf('--p-ink');
  });
  probe.remove();

  const HOLD_MS = 4800;
  const RELEASE_MS = 650;
  const BLEND_MS = 1100;
  const SETTLE_MS = Math.max(1800, RELEASE_MS, BLEND_MS);
  const SHADES = 6;
  const NO_INK = 255;
  const LIT = 0, DARK = 1, BARE = 2;
  const WASH_SHIFT_PX = 5;

  let dpr = 1, W = 0, H = 0;
  let cx = 0, cy = 0, size = 0;
  let N = 0;
  let targets = [];
  let shades = [];
  let px, py, vx, vy, seed, psize;

  let current = 0, playing = false, settle = SETTLE_MS;
  let previous = 0;
  let palFrom = SCENES[0], palTo = SCENES[0], palT = 1;
  let elapsed = 0, last = 0, raf = 0, visible = true;
  const pointer = { x: -1e5, y: -1e5, on: false };

  /* ---------- sampling ---------- */
  function sample(scene, n) {
    const S = 240;
    const [bx, by, bs] = scene.box || [0, 0, 100];
    const k = S / bs;
    const off = document.createElement('canvas');
    off.width = off.height = S;
    const g = off.getContext('2d', { willReadFrequently: true });
    g.setTransform(k, 0, 0, k, -bx * k, -by * k);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = scene.stroke || 1;
    g.strokeStyle = '#888';
    g.fillStyle = '#fff';
    (scene.paths || []).forEach((d) => g.stroke(new Path2D(d)));
    (scene.fills || []).forEach((d) => g.fill(new Path2D(d)));
    (scene.layers || []).forEach(([op, d]) => {
      g.globalCompositeOperation = op === 'cut' ? 'destination-out' : 'source-over';
      g.fill(new Path2D(d), 'evenodd');
    });
    g.globalCompositeOperation = 'source-over';
    if (scene.picture) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(scene.picture, 0, 0, S, S);
    }

    const data = g.getImageData(0, 0, S, S).data;
    const pool = [];
    const add = (x, y, tone, weight) => { for (let w = 0; w < weight; w++) pool.push(x, y, tone); };
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const o = (y * S + x) * 4;
        if (data[o + 3] <= (scene.picture ? 200 : 140)) continue;
        const lum = data[o] + data[o + 1] + data[o + 2];
        if (!scene.picture) add(x, y, LIT, lum > 600 ? 2 : 1);
        else if (lum < 180) add(x, y, DARK, 6);
        else if (lum > 560) add(x, y, BARE, 1);
        else add(x, y, LIT, 2);
      }
    }
    const count = pool.length / 3;
    const idx = new Uint32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;

    const out = new Float32Array(n * 2);
    const shade = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const m = i % count;
      if (i < count) {
        const r = m + Math.floor(Math.random() * (count - m));
        const t = idx[m]; idx[m] = idx[r]; idx[r] = t;
      }
      const p = idx[m] * 3;
      const nx = (pool[p] + Math.random()) / S - 0.5;
      const ny = (pool[p + 1] + Math.random()) / S - 0.5;
      out[i * 2] = nx;
      out[i * 2 + 1] = ny;
      const t = Math.min(0.999, Math.max(0, (nx + ny) * 0.8 + 0.5 + (Math.random() - 0.5) * 0.25));
      shade[i] = { [LIT]: Math.floor(t * SHADES), [DARK]: SHADES - 1, [BARE]: NO_INK }[pool[p + 2]];
    }
    return { out, shade };
  }

  /* ---------- layout ---------- */
  function layout() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(r.width * dpr);
    H = Math.round(r.height * dpr);
    canvas.width = W;
    canvas.height = H;
    cx = W / 2;
    cy = H / 2;
    size = Math.min(W, H) * 0.74;
  }

  function init() {
    layout();
    N = window.innerWidth < 900 ? 2600 : 4200;

    targets = [];
    shades = [];
    SCENES.forEach((s) => {
      const { out, shade } = sample(s.image && !s.picture ? SCENES[0] : s, N);
      targets.push(out);
      shades.push(shade);
    });

    px = new Float32Array(N); py = new Float32Array(N);
    vx = new Float32Array(N); vy = new Float32Array(N);
    seed = new Float32Array(N); psize = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      seed[i] = Math.random();
      psize[i] = (0.5 + Math.random() * 0.45) * dpr;
      const a = Math.random() * Math.PI * 2;
      const r = size * (0.5 + Math.random() * 0.6);
      px[i] = cx + Math.cos(a) * r;
      py[i] = cy + Math.sin(a) * r;
    }
  }

  function letters(word, className) {
    return [...word].map((c, k) => {
      const s = document.createElement('span');
      s.className = className;
      s.style.setProperty('--k', k);
      s.textContent = c;
      return s;
    });
  }

  function fitHeadline() {
    const host = document.createElement('span');
    host.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:nowrap';
    title.append(host);
    const em = parseFloat(getComputedStyle(title).fontSize);
    const width = (el) => { host.replaceChildren(el); return el.getBoundingClientRect().width / em; };
    const line = (text) => Object.assign(document.createElement('span'), { textContent: text, style: 'display:inline-block' });
    const word = (text) => { const w = rotor.cloneNode(false); w.append(...letters(text, 'ch')); return w; };
    const fixed = [...title.querySelectorAll('.hero__line')].filter((l) => !l.contains(rotor)).map((l) => l.textContent.trim());
    const widest = Math.max(...fixed.map((t) => width(line(t))), ...SCENES.map((s) => width(word(s.word))));
    host.remove();
    hero.style.setProperty('--fit', widest.toFixed(3));
  }

  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

  let wordToken = 0;
  function setWord(scene, animate) {
    const token = ++wordToken;
    const build = () => {
      if (token !== wordToken) return;
      rotor.replaceChildren(...letters(scene.word, animate ? 'ch in' : 'ch'));
      rotor.dataset.product = scene.product;
      rotor.classList.remove('is-wiping');
    };
    const old = rotor.querySelectorAll('.ch');
    if (animate && old.length) {
      rotor.classList.add('is-wiping');
      old.forEach((s, k) => {
        s.classList.remove('in');
        s.style.setProperty('--k', k);
        s.classList.add('out');
      });
      setTimeout(build, 360 + old.length * 10);
    } else {
      build();
    }
  }

  let captionToken = 0;
  function setCaption(i, animate) {
    const token = ++captionToken;
    const s = SCENES[i];
    const apply = () => {
      if (token !== captionToken) return;
      numEl.textContent = String(i).padStart(2, '0');
      nameEl.textContent = s.name;
      fieldEl.textContent = s.field;
      caption.classList.remove('is-swapping');
    };
    if (animate) {
      caption.classList.add('is-swapping');
      setTimeout(apply, 360);
    } else {
      apply();
    }
  }

  const ticks = SCENES.map((s, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Show ${s.name}`);
    b.addEventListener('click', () => set({ scene: i }));
    ticksEl.appendChild(b);
    return b;
  });

  function set({ scene = current, play = playing }) {
    if (scene !== current) {
      palFrom = currentPalette();
      palTo = SCENES[scene];
      palT = 0;
      previous = current;
      current = scene;
      elapsed = 0;
      settle = SETTLE_MS;
      setWord(SCENES[scene], !reduceMotion);
      setCaption(scene, !reduceMotion);
    }
    playing = play;

    ticks.forEach((b, i) => {
      if (i === current) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
      b.classList.toggle('is-done', i < current);
    });
    ticksEl.style.setProperty('--fill', reduceMotion ? 1 : elapsed / HOLD_MS);
    pauseBtn.setAttribute('aria-pressed', String(!playing));
    indexLinks.forEach((a) => a.classList.toggle('is-lit', a.dataset.product === SCENES[current].product));

    if (reduceMotion) drawStatic();
    run();
  }

  function run() {
    if (visible && !document.hidden && !reduceMotion && (playing || settle > 0)) {
      if (!raf) raf = requestAnimationFrame(step);
    } else {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
    }
  }

  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function currentPalette() {
    const t = ease(palT);
    return { tint: mix(palFrom.tint, palTo.tint, t), ink: mix(palFrom.ink, palTo.ink, t) };
  }

  /* ---------- simulation ---------- */
  function step(now) {
    raf = 0;
    const dt = last ? Math.min(now - last, 50) : 0;
    last = now;
    settle = Math.max(0, settle - dt);
    if (playing) {
      elapsed += dt;
      if (elapsed >= HOLD_MS) set({ scene: (current + 1) % SCENES.length });
      ticksEl.style.setProperty('--fill', elapsed / HOLD_MS);
    }

    const since = SETTLE_MS - settle;
    palT = Math.min(1, since / BLEND_MS);
    const t = now / 1000;
    const sway = Math.sin(t * 0.5) * 0.12;
    const cosS = Math.cos(sway);
    const s = size * (1 + Math.sin(t * 0.8) * 0.008);
    const R = 70 * dpr, R2 = R * R;

    const A = targets[current], P = targets[previous];
    for (let i = 0; i < N; i++) {
      const T = since >= seed[i] * RELEASE_MS ? A : P;
      const sd = seed[i];
      const gx = cx + T[i * 2] * s * cosS + Math.sin(t * 1.3 + sd * 40) * 0.5 * dpr;
      const gy = cy + T[i * 2 + 1] * s + Math.cos(t * 1.1 + sd * 50) * 0.5 * dpr;

      const dx = gx - px[i], dy = gy - py[i];
      const k = 0.028 + sd * 0.03;
      let ax = dx * k, ay = dy * k;

      if (Math.abs(dx) + Math.abs(dy) > 30 * dpr) {
        const sw = (sd > 0.5 ? 1 : -1) * 0.0045;
        ax += -dy * sw;
        ay += dx * sw;
      }

      if (pointer.on) {
        const mx = px[i] - pointer.x, my = py[i] - pointer.y;
        const d2 = mx * mx + my * my;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 2.4 * dpr;
          ax += (mx / d) * f;
          ay += (my / d) * f;
        }
      }

      vx[i] = (vx[i] + ax) * 0.84;
      vy[i] = (vy[i] + ay) * 0.84;
      px[i] += vx[i];
      py[i] += vy[i];
    }

    draw(since);
    run();
  }

  function draw(since) {
    ctx.clearRect(0, 0, W, H);
    const pal = currentPalette();
    const A = shades[current], P = shades[previous];
    const TAU = Math.PI * 2;

    const off = WASH_SHIFT_PX * dpr;
    const wash = 2.9 * dpr;
    ctx.fillStyle = rgb(pal.tint);
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      ctx.moveTo(px[i] + off + wash, py[i] + off);
      ctx.arc(px[i] + off, py[i] + off, wash, 0, TAU);
    }
    ctx.fill();

    for (let b = 0; b < SHADES; b++) {
      const u = b / (SHADES - 1);
      ctx.fillStyle = rgb(mix(pal.ink, INK, u * 0.85));
      const grow = 0.9 + u * 1.1;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const band = since >= seed[i] * RELEASE_MS ? A[i] : P[i];
        if (band !== b) continue;
        const r = psize[i] * grow;
        ctx.moveTo(px[i] + r, py[i]);
        ctx.arc(px[i], py[i], r, 0, TAU);
      }
      ctx.fill();
    }
  }

  function drawStatic() {
    for (let i = 0; i < N; i++) {
      px[i] = cx + targets[current][i * 2] * size;
      py[i] = cy + targets[current][i * 2 + 1] * size;
    }
    palFrom = palTo = SCENES[current];
    palT = 1;
    settle = 0;
    draw(Infinity);
  }

  /* ---------- events ---------- */
  pauseBtn.addEventListener('click', () => set({ play: !playing }));

  stage.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * dpr;
    pointer.y = (e.clientY - r.top) * dpr;
    pointer.on = true;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { pointer.on = false; });

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldCx = cx, oldCy = cy, oldSize = size;
      layout();
      if (oldSize) {
        const k = size / oldSize;
        for (let i = 0; i < N; i++) {
          px[i] = cx + (px[i] - oldCx) * k;
          py[i] = cy + (py[i] - oldCy) * k;
        }
      }
      if (!raf) drawStatic();
    }, 120);
  }

  /* ---------- boot ---------- */
  init();
  SCENES.forEach((s, i) => {
    if (!s.image) return;
    const picture = new Image();
    picture.onload = () => {
      s.picture = picture;
      const { out, shade } = sample(s, N);
      targets[i] = out;
      shades[i] = shade;
      if (i === current && !raf) drawStatic();
    };
    picture.src = s.image;
  });
  setWord(SCENES[0], false);
  setCaption(0, false);
  document.fonts.ready.then(fitHeadline);
  pauseBtn.hidden = reduceMotion;

  if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(stage);
  else window.addEventListener('resize', onResize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      run();
    }, { threshold: 0 }).observe(hero);
  }
  document.addEventListener('visibilitychange', run);

  set({ play: !reduceMotion });
})();
