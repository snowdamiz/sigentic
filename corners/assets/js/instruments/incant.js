const VW = 400;
const VH = 300;
const GROUND = 250;
const LEDGE = { x: 214, w: 92, y: 182 };
const GRAVITY = 980;
const BASE_JUMP = 50;
const SPOTS = [{ x: 92, y: 236 }, { x: 260, y: 166 }, { x: 350, y: 236 }];

const SKIES = {
  noon: { top: '#5ea8ec', bottom: '#cfe7f6', disc: '#fff4b8', discAt: [318, 64], far: '#a9d0b0', near: '#6fae7a', ground: '#5d8f4b', soil: '#3f6334', ledge: '#8a5a3c', stars: 0 },
  dusk: { top: '#2e2463', bottom: '#f39a5b', mid: '#c4557a', disc: '#ffd27a', discAt: [300, 176], far: '#7a4477', near: '#4d2f5a', ground: '#3b2a48', soil: '#2a1d36', ledge: '#5c3a52', stars: 0.25 },
  night: { top: '#070b26', bottom: '#243266', disc: '#f3f0e8', discAt: [76, 58], far: '#1d2a5c', near: '#141c43', ground: '#111734', soil: '#0b1026', ledge: '#2a3360', stars: 1 },
};

const ASKS = [
  { id: 'dusk', label: 'Make it dusk', key: 'sky', to: 'dusk', code: (f, t) => `set world.sky\n  "${f}" -> "${t}"` },
  { id: 'crystals', label: 'Add three crystals', key: 'crystals', to: true, code: () => `add level.crystal × 3\n  at (92, 236) (260, 166) (350, 236)` },
  { id: 'jump', label: 'Make the jump higher', key: 'jump', to: 1.6, code: (f, t) => `set player.jumpHeight\n  ${f.toFixed(1)} -> ${t.toFixed(1)}` },
  { id: 'drone', label: 'Add a patrolling drone', key: 'drone', to: true, code: () => `add level.drone\n  patrol x 60 … 340 at y 132` },
  { id: 'night', label: 'Make it night', key: 'sky', to: 'night', code: (f, t) => `set world.sky\n  "${f}" -> "${t}"` },
];

function playtest(scene, key) {
  if (key === 'crystals' || key === 'jump') {
    if (!scene.crystals) return { ok: true, text: scene.jump >= 1.5 ? 'The player now clears the ledge.' : 'Jump height changed.' };
    const reach = SPOTS.filter((s) => s.y > 200 || scene.jump >= 1.5).length;
    return reach === SPOTS.length
      ? { ok: true, text: `All ${SPOTS.length} crystals are reachable.` }
      : { ok: false, text: `${reach} of ${SPOTS.length} crystals are reachable. The one on the ledge needs a higher jump.`, hint: 'jump' };
  }
  if (key === 'drone') return { ok: true, text: 'The player can get past the drone.' };
  return { ok: true, text: 'The scene renders and the level is still playable.' };
}

export function mountIncant(root, { reduced }) {
  const canvas = root.querySelector('[data-game]');
  const ctx = canvas.getContext('2d');
  const hud = root.querySelector('[data-hud]');
  const asksBox = root.querySelector('[data-asks]');
  const proposalBox = root.querySelector('[data-proposal]');
  const historyBox = root.querySelector('[data-history]');
  const undoBtn = root.querySelector('[data-undo]');
  const redoBtn = root.querySelector('[data-redo]');

  const scene = { sky: 'noon', crystals: false, jump: 1, drone: false };
  const history = [];
  let cursor = 0;
  let pending = null;

  const player = { x: 40, y: GROUND, vx: 0, vy: 0, ground: true, face: 1, walk: 0, bonk: 0 };
  const drone = { x: 80, dir: 1, t: 0 };
  let got = new Set();
  let respawnAt = 0;
  const keys = new Set();
  let manualUntil = 0;
  let nextHop = 1.2;
  let time = 0;
  let raf = 0;
  let last = 0;
  let visible = false;
  let scale = 1;
  const stars = Array.from({ length: 40 }, (_, i) => ({ x: (i * 97) % VW, y: (i * 53) % 170, r: i % 5 === 0 ? 1.4 : 0.8 }));

  const buttons = ASKS.map((ask) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'ask';
    b.textContent = ask.label;
    b.addEventListener('click', () => propose(ask));
    asksBox.append(b);
    return b;
  });

  function propose(ask) {
    pending = { ask, from: scene[ask.key], to: ask.to };
    proposalBox.hidden = false;
    proposalBox.innerHTML = `<p class="proposal-k">Agent proposes</p><pre>${ask.code(pending.from, pending.to)}</pre><div class="proposal-btns"><button class="btn btn-ink btn-xs" type="button" data-allow>Allow</button><button class="btn btn-line btn-xs" type="button" data-deny>Deny</button></div>`;
    proposalBox.querySelector('[data-allow]').addEventListener('click', allow);
    proposalBox.querySelector('[data-deny]').addEventListener('click', deny);
    proposalBox.querySelector('[data-allow]').focus();
    sync();
  }

  function allow() {
    const { ask, from, to } = pending;
    pending = null;
    history.length = cursor;
    scene[ask.key] = to;
    if (ask.key === 'crystals') got = new Set();
    const proof = playtest(scene, ask.key);
    history.push({ ask, from, to, proof });
    cursor = history.length;
    showProof(proof);
    sync();
    paintOnce();
  }

  function deny() {
    pending = null;
    proposalBox.hidden = true;
    sync();
  }

  function showProof(proof) {
    proposalBox.hidden = false;
    proposalBox.innerHTML = `<p class="proposal-k">Play-tested</p><pre>${proof.text}</pre>${proof.hint ? '<div class="proposal-btns"><button class="btn btn-line btn-xs" type="button" data-hint>Ask for a higher jump</button></div>' : ''}`;
    proposalBox.querySelector('[data-hint]')?.addEventListener('click', () => propose(ASKS.find((a) => a.id === proof.hint)));
  }

  function undo() {
    if (!cursor) return;
    const h = history[--cursor];
    scene[h.ask.key] = h.from;
    proposalBox.hidden = true;
    sync();
    paintOnce();
  }

  function redo() {
    if (cursor >= history.length) return;
    const h = history[cursor++];
    scene[h.ask.key] = h.to;
    if (h.ask.key === 'crystals') got = new Set();
    proposalBox.hidden = true;
    sync();
    paintOnce();
  }

  function sync() {
    ASKS.forEach((ask, i) => { buttons[i].disabled = Boolean(pending) || scene[ask.key] === ask.to; });
    undoBtn.disabled = !cursor || Boolean(pending);
    redoBtn.disabled = cursor >= history.length || Boolean(pending);
    historyBox.innerHTML = history.length
      ? history.map((h, i) => `<li class="${i >= cursor ? 'is-undone' : ''}"><span class="h-n">#${i + 1}</span><span>${h.ask.code(h.from, h.to).split('\n')[0]}</span><span class="h-ok">${h.proof.ok ? 'tested' : 'flagged'}</span></li>`).reverse().join('')
      : '<li class="history-empty">No changes yet. Ask for one above.</li>';
    updateHud();
  }

  function updateHud() {
    hud.textContent = scene.crystals ? `Crystals ${got.size}/${SPOTS.length}` : 'No crystals yet';
  }

  undoBtn.addEventListener('click', undo);
  redoBtn.addEventListener('click', redo);

  const CONTROL = { ArrowLeft: 'left', a: 'left', ArrowRight: 'right', d: 'right', ArrowUp: 'jump', w: 'jump', ' ': 'jump' };
  canvas.addEventListener('keydown', (e) => {
    const k = CONTROL[e.key];
    if (!k) return;
    e.preventDefault();
    keys.add(k);
    manualUntil = time + 4;
    if (!raf) loop();
  });
  canvas.addEventListener('keyup', (e) => { const k = CONTROL[e.key]; if (k) keys.delete(k); });
  canvas.addEventListener('blur', () => keys.clear());

  function jump() {
    if (!player.ground) return;
    player.vy = -Math.sqrt(2 * GRAVITY * BASE_JUMP * scene.jump);
    player.ground = false;
  }

  function update(dt) {
    time += dt;
    const manual = time < manualUntil;
    let dir = 0;
    if (manual) {
      dir = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
      if (keys.has('jump')) jump();
    } else {
      dir = player.face;
      if (player.x > VW - 28) dir = player.face = -1;
      if (player.x < 28) dir = player.face = 1;
      nextHop -= dt;
      if (nextHop <= 0) { jump(); nextHop = 1.1 + Math.random() * 1.2; }
    }
    if (dir) player.face = dir;
    player.vx = dir * 78 + player.bonk * -player.face * 160;
    player.bonk = Math.max(0, player.bonk - dt * 3);
    player.x = Math.max(12, Math.min(VW - 12, player.x + player.vx * dt));
    player.walk += dir ? dt * 10 : 0;

    const prevY = player.y;
    player.vy += GRAVITY * dt;
    player.y += player.vy * dt;
    player.ground = false;
    const onLedge = player.x > LEDGE.x - 6 && player.x < LEDGE.x + LEDGE.w + 6;
    if (onLedge && player.vy >= 0 && prevY <= LEDGE.y && player.y >= LEDGE.y) { player.y = LEDGE.y; player.vy = 0; player.ground = true; }
    if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.ground = true; }

    if (scene.crystals) {
      SPOTS.forEach((s, i) => {
        if (!got.has(i) && Math.abs(player.x - s.x) < 14 && Math.abs(player.y - 12 - s.y) < 18) { got.add(i); updateHud(); }
      });
      if (got.size === SPOTS.length && !respawnAt) respawnAt = time + 1.6;
      if (respawnAt && time > respawnAt) { got = new Set(); respawnAt = 0; updateHud(); }
    }

    if (scene.drone) {
      drone.t += dt;
      drone.x += drone.dir * 52 * dt;
      if (drone.x > 340) drone.dir = -1;
      if (drone.x < 60) drone.dir = 1;
      const dy = 132 + Math.sin(drone.t * 2.4) * 8;
      if (Math.abs(player.x - drone.x) < 20 && Math.abs(player.y - 14 - dy) < 18 && !player.bonk) player.bonk = 1;
    }
  }

  function hills(color, base, amp, freq, phase) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VH);
    for (let x = 0; x <= VW; x += 8) ctx.lineTo(x, base - Math.sin(x * freq + phase) * amp - Math.sin(x * freq * 2.3 + phase) * amp * 0.35);
    ctx.lineTo(VW, VH);
    ctx.fill();
  }

  function render() {
    const sky = SKIES[scene.sky];
    const g = ctx.createLinearGradient(0, 0, 0, GROUND);
    g.addColorStop(0, sky.top);
    if (sky.mid) g.addColorStop(0.55, sky.mid);
    g.addColorStop(1, sky.bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);

    if (sky.stars) {
      ctx.fillStyle = '#ffffff';
      for (const s of stars) {
        ctx.globalAlpha = sky.stars * (0.5 + 0.5 * Math.sin(time * 2 + s.x));
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = sky.disc;
    ctx.beginPath();
    ctx.arc(sky.discAt[0], sky.discAt[1], scene.sky === 'night' ? 16 : 22, 0, Math.PI * 2);
    ctx.fill();
    if (scene.sky === 'night') {
      ctx.fillStyle = sky.top;
      ctx.beginPath();
      ctx.arc(sky.discAt[0] + 7, sky.discAt[1] - 5, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    hills(sky.far, 196, 16, 0.018, 1.2);
    hills(sky.near, 226, 12, 0.026, 3.1);

    ctx.fillStyle = sky.ground;
    ctx.fillRect(0, GROUND, VW, VH - GROUND);
    ctx.fillStyle = sky.soil;
    for (let x = 0; x < VW; x += 16) ctx.fillRect(x + ((x / 16) % 2) * 8, GROUND + 14, 8, 4);
    ctx.fillRect(0, GROUND + 30, VW, VH);

    ctx.fillStyle = sky.ledge;
    ctx.fillRect(LEDGE.x, LEDGE.y, LEDGE.w, 10);
    ctx.fillStyle = sky.ground;
    ctx.fillRect(LEDGE.x, LEDGE.y, LEDGE.w, 3);
    ctx.fillStyle = sky.soil;
    ctx.fillRect(LEDGE.x + 10, LEDGE.y + 10, 6, GROUND - LEDGE.y - 10);
    ctx.fillRect(LEDGE.x + LEDGE.w - 16, LEDGE.y + 10, 6, GROUND - LEDGE.y - 10);

    if (scene.crystals) {
      SPOTS.forEach((s, i) => {
        if (got.has(i)) return;
        const bob = Math.sin(time * 3 + i) * 2;
        ctx.save();
        ctx.translate(s.x, s.y + bob);
        ctx.fillStyle = '#ff9bcb';
        ctx.beginPath();
        ctx.moveTo(0, -9); ctx.lineTo(7, -1); ctx.lineTo(0, 9); ctx.lineTo(-7, -1); ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.75)';
        ctx.beginPath();
        ctx.moveTo(0, -9); ctx.lineTo(3, -1); ctx.lineTo(0, 2); ctx.lineTo(-3, -1); ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }

    if (scene.drone) {
      const dy = 132 + Math.sin(drone.t * 2.4) * 8;
      ctx.save();
      ctx.translate(drone.x, dy);
      ctx.fillStyle = '#141310';
      ctx.fillRect(-12, -5, 24, 10);
      ctx.fillStyle = '#f2552c';
      ctx.fillRect(-3, -2, 6, 4);
      ctx.fillStyle = 'rgba(20,19,16,.8)';
      const spin = Math.abs(Math.sin(time * 40)) * 9 + 3;
      ctx.fillRect(-14 - spin / 2, -9, spin, 2);
      ctx.fillRect(14 - spin / 2, -9, spin, 2);
      ctx.fillRect(-15, -8, 2, 4);
      ctx.fillRect(13, -8, 2, 4);
      ctx.restore();
    }

    const p = player;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.bonk) ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 40);
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath();
    ctx.ellipse(0, (p.ground ? 0 : GROUND - p.y), 10, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    const step = p.ground ? Math.sin(p.walk) * 2 : 0;
    ctx.fillStyle = '#141310';
    ctx.fillRect(-6, -6, 4, 6 + step);
    ctx.fillRect(2, -6, 4, 6 - step);
    ctx.fillStyle = '#f3f0e8';
    ctx.beginPath();
    ctx.roundRect(-10, -24, 20, 18, 5);
    ctx.fill();
    ctx.fillStyle = '#141310';
    ctx.beginPath();
    ctx.roundRect(-7 + p.face * 1.5, -20, 14, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#cff25a';
    ctx.fillRect(p.face > 0 ? 1 : -4, -18, 3, 4);
    ctx.fillStyle = '#141310';
    ctx.fillRect(-1, -30, 2, 6);
    ctx.fillStyle = '#ff9bcb';
    ctx.beginPath();
    ctx.arc(0, -31, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function fit() {
    const w = canvas.getBoundingClientRect().width;
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * 0.75 * dpr);
    scale = (w * dpr) / VW;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.imageSmoothingEnabled = false;
    render();
  }

  function paintOnce() { if (!raf) render(); }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    const animating = visible && (!reduced.matches || time < manualUntil);
    raf = animating ? requestAnimationFrame(frame) : 0;
  }

  function loop() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  new ResizeObserver(fit).observe(canvas);
  fit();
  sync();

  return {
    start() { visible = true; if (!reduced.matches) loop(); },
    stop() { visible = false; cancelAnimationFrame(raf); raf = 0; },
  };
}
