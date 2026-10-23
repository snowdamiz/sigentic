/* ==========================================================================
   Sigentic Labs — hero "sigil"
   A particle field that morphs between glyphs for each field we build in,
   kept in sync with the rotating headline word.
   ========================================================================== */
(() => {
  'use strict';

  const hero = document.querySelector('[data-hero]');
  if (!hero) return;

  const canvas = hero.querySelector('.hero__canvas');
  const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
  if (!ctx) return;

  const stage = hero.querySelector('[data-stage]');
  const rotator = hero.querySelector('[data-rotator]');
  const ticksEl = hero.querySelector('[data-stage-ticks]');
  const frame = hero.querySelector('.stage-frame');
  const numEl = hero.querySelector('[data-stage-num]');
  const fieldEl = hero.querySelector('[data-stage-field]');
  const productEl = hero.querySelector('[data-stage-product]');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Glyphs live on a 100×100 grid — same paths as the SVG sprite in index.html. */
  const dot = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;

  const SCENES = [
    {
      word: 'what’s next.',
      field: 'Sigentic Labs',
      product: 'What’s next',
      a: [221, 255, 177],
      b: [189, 247, 95],
      stroke: 1,
      paths: [],
      // Reuse the same filled Seed artwork as the navigation and footer.
      fills: [...document.querySelectorAll('#i-logo path')].map((path) => path.getAttribute('d')),
    },
    {
      word: 'the kitchen.',
      field: 'Cooking',
      product: 'Savorly',
      a: [255, 190, 104],
      b: [255, 92, 60],
      // The Savorly chef-hat mark (apps/mobile/assets/brand-mark.svg), drawn on its own viewBox.
      box: [7, 0, 280],
      layers: [
        ['fill', 'M 85.831 20.955 C 65.669 24.652, 45.830 36.276, 34.458 51.055 C 9.377 83.650, 15.946 126.429, 49.476 148.856 C 53.525 151.564, 57.339 153.946, 57.953 154.151 C 59.191 154.564, 64.133 176.704, 72.500 219.328 C 78.831 251.576, 79.162 252.633, 83.601 254.750 C 86.704 256.229, 87.612 256.141, 100.192 253.130 C 136.586 244.421, 173.514 239.126, 211.242 237.204 C 234.454 236.022, 234.111 236.426, 236.494 207.500 C 237.400 196.500, 238.447 185.087, 238.821 182.137 L 239.500 176.774 245.641 174.553 C 262.741 168.366, 274 152.296, 274 134.076 C 274 97.310, 231.041 75.219, 195.603 93.762 C 181.257 101.268, 169.814 115.068, 157.842 139.300 L 150.826 153.500 151.287 144.500 C 152.136 127.972, 160.941 111.485, 174.287 101.436 C 177.704 98.862, 181.063 96.539, 181.750 96.272 C 184.884 95.054, 181.877 81.641, 175.513 68.445 C 164.497 45.606, 145.812 30.068, 120.826 22.967 C 112.610 20.632, 93.563 19.537, 85.831 20.955'],
        ['cut', 'M 194.007 154.593 C 189.800 156.417, 186.305 159.549, 184.409 163.193 C 182.316 167.216, 184.201 167.414, 190.039 163.785 C 194.353 161.103, 196.456 160.487, 202.370 160.175 C 210.025 159.770, 211.397 159.199, 210.478 156.803 C 209.041 153.059, 200.262 151.881, 194.007 154.593 M 131.453 169.326 C 123.795 172.277, 117.639 178.262, 115.575 184.763 C 114.495 188.166, 116.686 187.544, 121.539 183.071 C 126.496 178.502, 132.078 175.451, 137.261 174.479 C 142.040 173.582, 143.614 171.757, 141.463 169.606 C 139.609 167.751, 135.815 167.645, 131.453 169.326'],
        ['cut', 'M 192.500 174.608 C 179.597 181.672, 178.079 201.815, 189.871 209.495 C 196.729 213.962, 203.946 213.321, 209.501 207.750 C 216.078 201.155, 217.317 190.314, 212.548 181.093 C 209.082 174.391, 198.907 171.100, 192.500 174.608 M 132.500 187.164 C 119.027 194.597, 116.868 213.696, 128.497 222.566 C 136.357 228.561, 147.522 226.071, 152.764 217.154 C 158.318 207.707, 155.631 193.025, 147.420 187.951 C 143.896 185.773, 135.796 185.346, 132.500 187.164'],
        ['fill', 'M 201.180 178.283 C 198.885 181.049, 198.109 184.810, 199.096 188.385 C 201.327 196.465, 210.615 197.376, 213.306 189.778 C 214.157 187.376, 212.109 182, 210.343 182 C 209.540 182, 209.172 181.530, 209.527 180.956 C 211.387 177.948, 203.543 175.435, 201.180 178.283 M 140.455 191.455 C 133.904 198.005, 141.030 210.612, 149.455 207.379 C 153.839 205.697, 154.859 197.065, 150.922 194.958 C 149.866 194.393, 149.316 193.339, 149.639 192.499 C 150.007 191.538, 149.278 190.676, 147.537 190.014 C 143.773 188.583, 143.212 188.697, 140.455 191.455'],
      ],
    },
    {
      word: 'private chats.',
      field: 'Private messaging',
      product: 'Morse',
      a: [128, 180, 255],
      b: [47, 107, 234],
      // The Morse mark: a dot and a dash, cropped tight from its 1024 tile.
      box: [212, 212, 600],
      layers: [
        ['fill', 'M 248 392 A 88 88 0 1 1 424 392 A 88 88 0 1 1 248 392 Z'],
        ['fill', 'M 336 544 H 688 A 88 88 0 0 1 688 720 H 336 A 88 88 0 0 1 336 544 Z'],
      ],
    },
    {
      word: 'the backend.',
      field: 'Programming language',
      product: 'Mesh',
      a: [150, 248, 208],
      b: [31, 190, 125],
      stroke: 7,
      // The Mesh mark: three nodes around a hub.
      paths: ['M50 17L88.1 83L11.9 83Z', 'M50 61L50 17', 'M50 61L88.1 83', 'M50 61L11.9 83'],
      fills: [dot(50, 17, 9), dot(88.1, 83, 9), dot(11.9, 83, 9), dot(50, 61, 11)],
    },
    {
      word: 'game makers.',
      field: 'Game engine',
      product: 'Incant',
      a: [196, 182, 255],
      b: [110, 75, 240],
      // The Incant wisp, traced on a 512 grid, with its eyes cut out.
      box: [0, 0, 512],
      layers: [
        ['fill', 'M323 12C336.4 10.5 351.6 15.9 363.9 21C396.6 34.5 429.9 59.5 432.4 97.6C433.2 109.7 430.4 122.7 424 133.1C414 149.5 398.2 160.4 382.3 170.5C365.5 181.2 349.4 192.5 351.9 214.9C353.7 229.9 365.8 243.1 375.9 253.3C394.1 271.8 415 287.8 425.5 312.3C431.9 327.1 433 343.3 431.6 359.1C426.6 415.6 385.9 457.8 337.3 482.7C322.8 490.1 306.6 498.2 290.3 500C293.1 496.4 296.2 493 298.1 488.7C305.9 471.3 291.1 460.2 276 455.9C263.6 452.4 250.5 451.2 237.8 449.4C224.1 447.4 210.6 444.7 197.1 441.5C141.8 428 95.9 394.7 81.8 337.4C78.2 322.8 77.5 306.6 79.6 291.7C89.2 221.8 146 168.9 210.2 145.6C244.9 133.1 296.8 123.6 326.2 103.8C364.2 78.2 363.6 34.4 323 12Z'],
        ['cut', 'M246 291.6C231.4 291.7 225.1 308.3 223.6 320.3C220.6 343.1 228 370.1 245.2 385.9C249.9 390.3 255.8 393.8 262.4 393.8C277.1 393.9 283.5 377.9 285.3 365.7C288.2 345.2 282.2 323.1 269.7 306.6C264.2 299.3 255.9 291.4 246 291.6ZM140.7 269.3C132.2 271.3 128.3 281.7 126.9 289.3C123.4 307.3 125.7 326.2 133.8 342.7C137.3 349.9 145.4 360.8 154.8 358.8C163.2 357 167.8 346.7 169.3 339.2C172.9 321.2 170.6 301.3 162 285C158 277.5 150.6 266.9 140.7 269.3Z'],
      ],
    },
    {
      word: 'every phone.',
      field: 'Mobile platform',
      product: 'Mixer',
      a: [255, 172, 124],
      b: [255, 120, 73],
      // Flick, Mixer's fox. Its brand ships the fox only as raster art, so the
      // outline comes from the image's alpha and its eyes and nose are cut out.
      image: 'assets/img/work/mixer-flick.webp',
    },
  ];

  const HOLD = 4200;          // ms each glyph is shown
  const BUCKETS = 7;          // colour bands across each glyph
  const DUST = 110;

  let dpr = 1, W = 0, H = 0;
  let cx = 0, cy = 0, size = 0;
  let N = 0;
  let targets = [];           // per-scene Float32Array(N*2), normalised −0.5..0.5
  let bands = [];             // per-scene Uint8Array(N) colour band
  let px, py, vx, vy, seed, psize, release;
  let dust;

  let current = 0, previous = 0;
  let palFrom = SCENES[0], palTo = SCENES[0], palT = 1, palStart = 0;
  let elapsed = 0, last = 0, raf = 0, running = false, visible = true;
  let pointer = { x: -1e5, y: -1e5, on: false };
  let par = { x: 0, y: 0 };

  /* ---------- sampling ---------- */
  function sample(scene, n) {
    const S = 220;
    const [bx, by, bs] = scene.box || [0, 0, 100];
    const k = S / bs;
    const off = document.createElement('canvas');
    off.width = off.height = S;
    const g = off.getContext('2d', { willReadFrequently: true });
    g.setTransform(k, 0, 0, k, -bx * k, -by * k);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.lineWidth = scene.stroke || 1;
    g.strokeStyle = g.fillStyle = '#fff';
    (scene.paths || []).forEach((d) => g.stroke(new Path2D(d)));
    (scene.fills || []).forEach((d) => g.fill(new Path2D(d)));
    // Ordered layers: 'fill' adds shape, 'cut' removes it (eyes, holes).
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
    for (let y = 0; y < S; y++) {
      for (let x = 0; x < S; x++) {
        const o = (y * S + x) * 4;
        if (data[o + 3] <= 140) continue;
        // in a picture, dark features (eyes, nose) stay empty, like the cut-outs above
        if (scene.picture && data[o] + data[o + 1] + data[o + 2] < 180) continue;
        pool.push(x, y);
      }
    }
    const count = pool.length / 2;
    const idx = new Uint32Array(count);
    for (let i = 0; i < count; i++) idx[i] = i;

    const out = new Float32Array(n * 2);
    const band = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const m = i % count;
      if (i < count) {
        const r = m + Math.floor(Math.random() * (count - m));
        const t = idx[m]; idx[m] = idx[r]; idx[r] = t;
      }
      const p = idx[m];
      const nx = (pool[p * 2] + Math.random()) / S - 0.5;
      const ny = (pool[p * 2 + 1] + Math.random()) / S - 0.5;
      out[i * 2] = nx;
      out[i * 2 + 1] = ny;
      const t = Math.min(0.999, Math.max(0, (nx + ny) * 0.75 + 0.5));
      band[i] = Math.floor(t * BUCKETS);
    }
    return { out, band };
  }

  /* ---------- layout ---------- */
  function layout() {
    const hr = hero.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(hr.width * dpr);
    H = Math.round(hr.height * dpr);
    canvas.width = W;
    canvas.height = H;

    const sx = sr.left - hr.left + sr.width / 2;
    const sy = sr.top - hr.top + sr.height / 2;
    cx = sx * dpr;
    cy = sy * dpr;
    size = Math.min(sr.width, sr.height) * 0.86 * dpr;

    hero.style.setProperty('--sx', `${sx}px`);
    hero.style.setProperty('--sy', `${sy}px`);
  }

  function init() {
    layout();
    N = window.innerWidth < 900 ? 1300 : 2300;

    targets = [];
    bands = [];
    SCENES.forEach((s) => {
      const { out, band } = sample(s.image && !s.picture ? SCENES[0] : s, N);
      targets.push(out);
      bands.push(band);
    });

    px = new Float32Array(N); py = new Float32Array(N);
    vx = new Float32Array(N); vy = new Float32Array(N);
    seed = new Float32Array(N); psize = new Float32Array(N);
    release = new Float32Array(N);

    const now = performance.now();
    for (let i = 0; i < N; i++) {
      seed[i] = Math.random();
      psize[i] = (0.9 + Math.random() * 1.15) * dpr;
      if (reduceMotion) {
        px[i] = cx + targets[0][i * 2] * size;
        py[i] = cy + targets[0][i * 2 + 1] * size;
      } else {
        // start as a loose cloud around the stage, then gather into the mark
        const a = Math.random() * Math.PI * 2;
        const r = size * (0.55 + Math.random() * 0.9);
        px[i] = cx + Math.cos(a) * r;
        py[i] = cy + Math.sin(a) * r * 0.8;
      }
      release[i] = now + 250 + seed[i] * 900;
    }

    dust = new Float32Array(DUST * 4);
    for (let i = 0; i < DUST; i++) {
      dust[i * 4] = Math.random() * W;
      dust[i * 4 + 1] = Math.random() * H;
      dust[i * 4 + 2] = (0.6 + Math.random() * 1.2) * dpr;
      dust[i * 4 + 3] = Math.random();
    }
  }

  /* ---------- headline + labels ---------- */
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  function setWord(scene, animate) {
    if (!rotator) return;
    const build = () => {
      rotator.textContent = '';
      const chars = [...scene.word];
      chars.forEach((c, k) => {
        const s = document.createElement('span');
        s.className = animate ? 'ch in' : 'ch';
        s.style.setProperty('--k', k);
        s.style.color = rgb(mix(scene.a, scene.b, chars.length > 1 ? k / (chars.length - 1) : 0));
        s.textContent = c;
        rotator.appendChild(s);
      });
    };
    const old = rotator.querySelectorAll('.ch');
    if (animate && old.length) {
      old.forEach((s, k) => {
        s.classList.remove('in');
        s.style.setProperty('--k', k);
        s.classList.add('out');
      });
      setTimeout(build, 360 + old.length * 12);
    } else {
      build();
    }
  }

  function setLabels(i, animate) {
    const s = SCENES[i];
    const apply = () => {
      if (numEl) numEl.textContent = String(i + 1).padStart(2, '0');
      if (fieldEl) fieldEl.textContent = s.field;
      if (productEl) productEl.textContent = s.product;
      frame && frame.classList.remove('is-swapping');
    };
    if (animate && frame) {
      frame.classList.add('is-swapping');
      setTimeout(apply, 380);
    } else {
      apply();
    }
    hero.style.setProperty('--glow-a', rgb(s.a));
    hero.style.setProperty('--glow-b', rgb(s.b));
    hero.dataset.scene = i; // highlights the matching product in the hero index
  }

  function buildTicks() {
    if (!ticksEl) return;
    ticksEl.style.setProperty('--dur', `${HOLD}ms`);
    SCENES.forEach((s, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.title = s.field;
      b.addEventListener('click', () => goTo(i));
      ticksEl.appendChild(b);
    });
  }

  function paintTicks() {
    if (!ticksEl) return;
    [...ticksEl.children].forEach((b, i) => {
      b.classList.remove('is-active');
      b.classList.toggle('is-done', i < current);
    });
    const active = ticksEl.children[current];
    if (active) {
      void active.offsetWidth; // restart the CSS fill
      active.classList.add('is-active');
    }
  }

  function goTo(i) {
    if (i === current) return;
    const now = performance.now();
    previous = current;
    current = i;
    palFrom = currentPalette();
    palTo = SCENES[i];
    palT = 0;
    palStart = now;
    for (let j = 0; j < N; j++) release[j] = now + seed[j] * 650;
    elapsed = 0;
    setWord(SCENES[i], true);
    setLabels(i, true);
    paintTicks();
  }

  function currentPalette() {
    return { a: mix(palFrom.a, palTo.a, ease(palT)), b: mix(palFrom.b, palTo.b, ease(palT)) };
  }
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- simulation ---------- */
  function step(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(now - (last || now), 50);
    last = now;
    elapsed += dt;
    if (elapsed >= HOLD) goTo((current + 1) % SCENES.length);

    palT = Math.min(1, (now - palStart) / 1100);
    const t = now / 1000;

    // gentle parallax + sway
    const tx0 = pointer.on ? (pointer.x / W - 0.5) * 18 * dpr : 0;
    const ty0 = pointer.on ? (pointer.y / H - 0.5) * 12 * dpr : 0;
    par.x += (tx0 - par.x) * 0.04;
    par.y += (ty0 - par.y) * 0.04;
    const sway = Math.sin(t * 0.55) * 0.22;
    const cosS = Math.cos(sway);
    const breathe = 1 + Math.sin(t * 0.9) * 0.012;
    const s = size * breathe;
    const R = 80 * dpr, R2 = R * R;

    const A = targets[current], P = targets[previous];
    for (let i = 0; i < N; i++) {
      const T = now >= release[i] ? A : P;
      const sd = seed[i];
      const gx = cx + par.x + T[i * 2] * s * cosS + Math.sin(t * 1.3 + sd * 40) * 0.7 * dpr;
      const gy = cy + par.y + T[i * 2 + 1] * s + Math.cos(t * 1.1 + sd * 50) * 0.7 * dpr;

      let dx = gx - px[i], dy = gy - py[i];
      const k = 0.028 + sd * 0.03;
      let ax = dx * k, ay = dy * k;

      // swirl while travelling
      const far = Math.abs(dx) + Math.abs(dy);
      if (far > 30 * dpr) {
        const sw = (sd > 0.5 ? 1 : -1) * 0.0045;
        ax += -dy * sw;
        ay += dx * sw;
      }

      // pointer repulsion
      if (pointer.on) {
        const mx = px[i] - pointer.x, my = py[i] - pointer.y;
        const d2 = mx * mx + my * my;
        if (d2 < R2 && d2 > 0.01) {
          const d = Math.sqrt(d2);
          const f = (1 - d / R) * 2.6 * dpr;
          ax += (mx / d) * f;
          ay += (my / d) * f;
        }
      }

      vx[i] = (vx[i] + ax) * 0.84;
      vy[i] = (vy[i] + ay) * 0.84;
      px[i] += vx[i];
      py[i] += vy[i];
    }

    draw(now, t);
    raf = requestAnimationFrame(step);
  }

  function draw(now, t) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    // ambient dust
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    for (let i = 0; i < DUST; i++) {
      const o = i * 4;
      const y = (dust[o + 1] - t * 6 * dpr * (0.4 + dust[o + 3])) % H;
      const yy = y < 0 ? y + H : y;
      const x = dust[o] + Math.sin(t * 0.3 + dust[o + 3] * 10) * 12 * dpr;
      const sz = dust[o + 2];
      ctx.rect(x, yy, sz, sz);
    }
    ctx.fill();

    const pal = currentPalette();
    const A = bands[current], P = bands[previous];
    for (let b = 0; b < BUCKETS; b++) {
      const c = mix(pal.a, pal.b, (b + 0.5) / BUCKETS);
      // soft halo pass
      ctx.fillStyle = rgb(c, 0.05);
      ctx.beginPath();
      for (let i = 0; i < N; i += 5) {
        const band = now >= release[i] ? A[i] : P[i];
        if (band !== b) continue;
        const z = psize[i] * 4;
        ctx.rect(px[i] - z / 2, py[i] - z / 2, z, z);
      }
      ctx.fill();
      // core pass
      ctx.fillStyle = rgb(c, 0.82);
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const band = now >= release[i] ? A[i] : P[i];
        if (band !== b) continue;
        const z = psize[i];
        ctx.rect(px[i] - z / 2, py[i] - z / 2, z, z);
      }
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function drawStatic() {
    for (let i = 0; i < N; i++) {
      px[i] = cx + targets[current][i * 2] * size;
      py[i] = cy + targets[current][i * 2 + 1] * size;
    }
    palT = 1;
    draw(performance.now() + 1e6, 0);
  }

  function start() {
    if (running || reduceMotion) return;
    running = true;
    last = 0;
    ticksEl && ticksEl.classList.remove('is-paused');
    raf = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    ticksEl && ticksEl.classList.add('is-paused');
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---------- events ---------- */
  hero.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * dpr;
    pointer.y = (e.clientY - r.top) * dpr;
    pointer.on = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.on = false; });

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const oldCx = cx, oldCy = cy, oldSize = size;
      layout();
      // re-seat particles relative to the new stage
      if (oldSize) {
        const k = size / oldSize;
        for (let i = 0; i < N; i++) {
          px[i] = cx + (px[i] - oldCx) * k;
          py[i] = cy + (py[i] - oldCy) * k;
        }
        for (let i = 0; i < DUST; i++) {
          dust[i * 4] = Math.random() * W;
          dust[i * 4 + 1] = Math.random() * H;
        }
      }
      if (reduceMotion || !running) drawStatic();
    }, 120);
  }

  /* ---------- boot ---------- */
  buildTicks();
  init();
  SCENES.forEach((s, i) => {
    if (!s.image) return;
    const picture = new Image();
    picture.onload = () => {
      s.picture = picture;
      const { out, band } = sample(s, N);
      targets[i] = out;
      bands[i] = band;
    };
    picture.src = s.image;
  });
  setWord(SCENES[0], false);
  setLabels(0, false);
  palFrom = palTo = SCENES[0];
  palT = 1;

  if (reduceMotion) {
    ticksEl && (ticksEl.hidden = true);
    drawStatic();
  } else {
    paintTicks();
    palStart = performance.now();
  }

  if ('ResizeObserver' in window) {
    new ResizeObserver(onResize).observe(hero);
  } else {
    window.addEventListener('resize', onResize);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !document.hidden) start(); else stop();
    }, { threshold: 0 }).observe(hero);
  } else {
    start();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (visible) start();
  });
})();
