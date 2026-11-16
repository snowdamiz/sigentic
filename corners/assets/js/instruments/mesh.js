const NODES = [
  { id: 'node-1', city: 'nyc' },
  { id: 'node-2', city: 'sfo' },
  { id: 'node-3', city: 'ams' },
  { id: 'node-4', city: 'sgp' },
];
const COLS = 6;
const ROWS = 3;
const SLOT_ORDER = [7, 2, 16, 10, 0, 13, 5, 9, 15, 3, 11, 6, 14, 1, 8, 17, 4, 12];
const TARGET_ACTORS = 14;
const MOVE_MS = 700;

const ease = (x) => 1 - Math.pow(1 - x, 3);

export function mountMesh(root, { reduced }) {
  const canvas = root.querySelector('[data-fleet]');
  const ctx = canvas.getContext('2d');
  const controls = root.querySelector('[data-nodes]');
  const stat = Object.fromEntries([...root.querySelectorAll('[data-stat]')].map((el) => [el.dataset.stat, el]));
  const announce = root.querySelector('[data-announce]');
  const css = getComputedStyle(root);
  const ACCENT = css.getPropertyValue('--accent').trim() || '#cff25a';
  const WARN = getComputedStyle(document.documentElement).getPropertyValue('--tomato').trim() || '#f2552c';
  const FG = '241, 238, 230';

  const nodes = NODES.map((n) => ({ ...n, up: true, rect: { x: 0, y: 0, w: 0, h: 0 }, btn: null }));
  let actors = [];
  let messages = [];
  let seq = 0;
  let restarts = 0;
  let delivered = 0;
  let W = 0;
  let H = 0;
  let raf = 0;
  let last = 0;
  let clock = 0;
  let sinceMsg = 0;
  let sinceChurn = 0;
  let sinceStats = 0;
  let hover = null;

  const upNodes = () => nodes.filter((n) => n.up);
  const load = (node) => actors.filter((a) => a.node === node && a.phase !== 'exit').length;
  const leastLoaded = () => upNodes().sort((a, b) => load(a) - load(b))[0];
  const freeSlot = (node) => {
    const used = new Set(actors.filter((a) => a.node === node).map((a) => a.slot));
    return SLOT_ORDER.find((i) => !used.has(i)) ?? 0;
  };
  const slotPos = (node, slot) => {
    const { x, y, w, h } = node.rect;
    const ix = x + 18;
    const iy = y + 38;
    const iw = w - 36;
    const ih = h - 54;
    const c = slot % COLS;
    const r = Math.floor(slot / COLS);
    return { x: ix + (iw / (COLS - 1)) * c, y: iy + (ih / (ROWS - 1)) * r };
  };
  const pos = (a) => {
    const to = slotPos(a.node, a.slot);
    if (a.phase !== 'move') return to;
    const k = ease(Math.min(1, (clock - a.t0) / MOVE_MS));
    return { x: a.fx + (to.x - a.fx) * k, y: a.fy + (to.y - a.fy) * k };
  };

  function spawn(node, phase = 'born') {
    const a = { id: ++seq, node, slot: freeSlot(node), phase, t0: clock, pulse: 0, fx: 0, fy: 0, at: 0 };
    actors.push(a);
    return a;
  }

  function layout() {
    const r = canvas.getBoundingClientRect();
    W = r.width;
    H = r.height;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = 12;
    const gap = 10;
    const nw = (W - pad * 2 - gap) / 2;
    const nh = (H - pad * 2 - gap) / 2;
    nodes.forEach((n, i) => {
      n.rect = { x: pad + (i % 2) * (nw + gap), y: pad + Math.floor(i / 2) * (nh + gap), w: nw, h: nh };
    });
    draw();
  }

  function setNode(node, up) {
    if (node.up === up) return;
    if (!up && upNodes().length === 1) return;
    node.up = up;
    if (!up) {
      const lost = actors.filter((a) => a.node === node && a.phase !== 'exit');
      lost.forEach((a, i) => {
        const p = pos(a);
        a.phase = 'down';
        a.fx = p.x;
        a.fy = p.y;
        a.at = clock + 380 + i * 110;
      });
      say(`${node.id} in ${node.city} unplugged. Its ${lost.length} actors are restarting on the other nodes.`);
    } else {
      say(`${node.id} in ${node.city} is back. New work will be placed there.`);
    }
    if (reduced.matches) settle();
    syncStats();
    if (!raf) draw();
  }

  function settle() {
    for (const a of actors) {
      if (a.phase === 'down') restart(a);
      if (a.phase === 'move' || a.phase === 'born') a.phase = 'run';
    }
    draw();
  }

  function restart(a) {
    const target = leastLoaded();
    const p = { x: a.fx, y: a.fy };
    a.node = target;
    a.slot = -1;
    a.slot = freeSlot(target);
    a.phase = 'move';
    a.fx = p.x;
    a.fy = p.y;
    a.t0 = clock;
    restarts++;
  }

  function say(text) { if (announce) announce.textContent = text; }

  function syncButtons() {
    const alone = upNodes().length === 1;
    for (const n of nodes) {
      n.btn.setAttribute('aria-pressed', String(!n.up));
      n.btn.disabled = n.up && alone;
      n.btn.title = n.btn.disabled ? 'Keep one node running' : '';
      n.btn.querySelector('span').textContent = n.up ? `Running · ${load(n)} actors` : 'Unplugged';
    }
  }

  function syncStats() {
    stat.actors.textContent = actors.filter((a) => a.phase === 'run' || a.phase === 'born').length;
    stat.restarts.textContent = restarts;
    stat.delivered.textContent = delivered.toLocaleString('en-US');
    syncButtons();
  }

  function step(dt) {
    clock += dt;
    sinceMsg += dt;
    sinceChurn += dt;
    sinceStats += dt;

    const live = actors.filter((a) => a.phase === 'run');
    if (sinceMsg > 110 && live.length > 1 && messages.length < 36) {
      sinceMsg = 0;
      const from = live[(Math.random() * live.length) | 0];
      let to = live[(Math.random() * live.length) | 0];
      if (to === from) to = live[(live.indexOf(from) + 1) % live.length];
      messages.push({ from, to, p: 0, bend: (Math.random() - 0.5) * 0.6, fx: 0, fy: 0, started: false });
    }

    if (sinceChurn > 1500) {
      sinceChurn = 0;
      if (live.length > 3) {
        const gone = live[(Math.random() * live.length) | 0];
        gone.phase = 'exit';
        gone.t0 = clock;
      }
      const count = actors.filter((a) => a.phase !== 'exit').length;
      if (count < TARGET_ACTORS) spawn(leastLoaded());
    }

    for (const a of actors) {
      if (a.phase === 'down' && clock >= a.at) restart(a);
      else if (a.phase === 'move' && clock - a.t0 >= MOVE_MS) a.phase = 'run';
      else if (a.phase === 'born' && clock - a.t0 >= 400) a.phase = 'run';
      a.pulse = Math.max(0, a.pulse - dt / 500);
    }
    actors = actors.filter((a) => !(a.phase === 'exit' && clock - a.t0 > 420));

    for (const m of messages) {
      if (!actors.includes(m.to)) {
        const alt = actors.filter((a) => a.phase === 'run');
        m.to = alt[(Math.random() * alt.length) | 0] || m.to;
      }
      if (!m.started) {
        const p = pos(m.from);
        m.fx = p.x;
        m.fy = p.y;
        m.started = true;
      }
      const waiting = m.to.phase === 'down';
      m.p = Math.min(waiting ? 0.55 : 1, m.p + dt / 900);
      if (m.p >= 1) {
        m.done = true;
        delivered++;
        m.to.pulse = 1;
      }
    }
    messages = messages.filter((m) => !m.done);

    if (sinceStats > 250) { sinceStats = 0; syncStats(); }
  }

  function drawNode(n) {
    const { x, y, w, h } = n.rect;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fillStyle = n.up ? `rgba(${FG}, .035)` : 'rgba(242, 85, 44, .06)';
    ctx.fill();
    ctx.lineWidth = n === hover ? 1.6 : 1;
    ctx.strokeStyle = n.up ? `rgba(${FG}, ${n === hover ? 0.55 : 0.2})` : `rgba(242, 85, 44, ${n === hover ? 0.9 : 0.55})`;
    if (!n.up) ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
    if (!n.up) {
      ctx.clip();
      ctx.strokeStyle = 'rgba(242, 85, 44, .12)';
      ctx.lineWidth = 1;
      for (let i = -h; i < w; i += 10) {
        ctx.beginPath();
        ctx.moveTo(x + i, y + h);
        ctx.lineTo(x + i + h, y);
        ctx.stroke();
      }
    }
    ctx.restore();

    ctx.font = '500 10px "Martian Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(${FG}, .8)`;
    ctx.fillText(`${n.id} · ${n.city}`, x + 14, y + 17);
    ctx.textAlign = 'right';
    ctx.fillStyle = n.up ? ACCENT : WARN;
    ctx.fillText(n.up ? 'up' : 'unplugged', x + w - 24, y + 17);
    ctx.beginPath();
    ctx.arc(x + w - 15, y + 17, 3, 0, Math.PI * 2);
    ctx.fill();
    if (n === hover) {
      ctx.fillStyle = `rgba(${FG}, .5)`;
      ctx.fillText(n.up ? (upNodes().length === 1 ? 'keep one node up' : 'click to unplug') : 'click to plug in', x + w - 14, y + h - 12);
    }
    ctx.textAlign = 'left';
  }

  function draw() {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = `rgba(${FG}, .07)`;
    for (let gx = 9; gx < W; gx += 18) for (let gy = 9; gy < H; gy += 18) ctx.fillRect(gx, gy, 1, 1);

    nodes.forEach(drawNode);

    const r = Math.max(3.5, Math.min(7, nodes[0].rect.w / 34));

    for (const m of messages) {
      const a = { x: m.fx, y: m.fy };
      const b = pos(m.to);
      const cx = (a.x + b.x) / 2 - (b.y - a.y) * m.bend;
      const cy = (a.y + b.y) / 2 + (b.x - a.x) * m.bend;
      ctx.strokeStyle = `rgba(${FG}, .07)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo(cx, cy, b.x, b.y);
      ctx.stroke();
      const t = ease(m.p);
      const px = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * cx + t * t * b.x;
      const py = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * cy + t * t * b.y;
      ctx.fillStyle = m.to.phase === 'down' ? WARN : `rgb(${FG})`;
      ctx.beginPath();
      ctx.arc(px, py, 2.1, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const a of actors) {
      const p = a.phase === 'down' ? { x: a.fx, y: a.fy } : pos(a);
      let alpha = 1;
      let scale = 1;
      if (a.phase === 'born') scale = ease(Math.min(1, (clock - a.t0) / 400));
      if (a.phase === 'exit') alpha = 1 - Math.min(1, (clock - a.t0) / 420);
      ctx.globalAlpha = alpha;
      if (a.phase === 'down') {
        ctx.strokeStyle = WARN;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      } else {
        if (a.pulse > 0) {
          ctx.strokeStyle = ACCENT;
          ctx.globalAlpha = alpha * a.pulse * 0.6;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r + (1 - a.pulse) * 8, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = alpha;
        }
        ctx.fillStyle = a.phase === 'move' ? `rgb(${FG})` : ACCENT;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    const dt = Math.min(50, now - last);
    last = now;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  nodes.forEach((n) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'node-btn';
    b.setAttribute('aria-label', `Unplug ${n.id} in ${n.city}`);
    b.innerHTML = `<b>${n.id} · ${n.city}</b><span></span>`;
    b.addEventListener('click', () => setNode(n, !n.up));
    n.btn = b;
    controls.append(b);
  });

  const nodeAt = (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    return nodes.find((n) => x >= n.rect.x && x <= n.rect.x + n.rect.w && y >= n.rect.y && y <= n.rect.y + n.rect.h) || null;
  };
  canvas.addEventListener('pointermove', (e) => { hover = nodeAt(e); if (!raf) draw(); });
  canvas.addEventListener('pointerleave', () => { hover = null; if (!raf) draw(); });
  canvas.addEventListener('click', (e) => { const n = nodeAt(e); if (n) setNode(n, !n.up); });

  new ResizeObserver(layout).observe(canvas);
  layout();
  nodes.forEach((n, i) => { for (let k = 0; k < (i < 2 ? 4 : 3); k++) spawn(n, 'run'); });
  syncStats();
  draw();

  return {
    start() {
      if (raf || reduced.matches) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
