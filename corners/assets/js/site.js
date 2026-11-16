import { mountSavorly } from './instruments/savorly.js';
import { mountMorse } from './instruments/morse.js';
import { mountMesh } from './instruments/mesh.js';
import { mountIncant } from './instruments/incant.js';
import { mountMixer } from './instruments/mixer.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const INSTRUMENTS = {
  savorly: mountSavorly,
  morse: mountMorse,
  mesh: mountMesh,
  incant: mountIncant,
  mixer: mountMixer,
};

function trackZones() {
  const bar = document.querySelector('[data-bar]');
  const mark = document.querySelector('[data-mark]');
  const nowN = document.querySelector('[data-now-n]');
  const nowT = document.querySelector('[data-now-t]');
  const zones = [...document.querySelectorAll('[data-zone]')];
  let current = null;
  let queued = false;

  const update = () => {
    queued = false;
    const line = bar.offsetHeight;
    const zone = zones.find((z) => {
      const r = z.getBoundingClientRect();
      return r.top <= line && r.bottom > line;
    }) || zones[0];
    if (zone === current) return;
    current = zone;
    bar.dataset.tone = zone.dataset.tone;
    mark.dataset.corner = zone.dataset.corner || 'tr';
    nowN.textContent = zone.dataset.n;
    nowT.textContent = zone.dataset.label;
  };
  const queue = () => {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  update();
}

function cycleHero() {
  const word = document.querySelector('[data-hero-word]');
  const swap = document.querySelector('[data-swap]');
  const rooms = [...document.querySelectorAll('[data-plan] [data-word]')];
  let index = 0;
  let turns = 0;
  let timer = 0;
  let swapTimer = 0;
  let hovering = false;
  let focused = false;
  let visible = true;

  const paint = (i, animate) => {
    const room = rooms[i];
    index = i;
    rooms.forEach((el) => el.toggleAttribute('data-active', el === room));
    const apply = () => {
      word.classList.remove('is-out');
      word.textContent = room.dataset.word;
      word.dataset.tone = room.dataset.tone;
    };
    clearTimeout(swapTimer);
    if (!animate || reduced.matches) { apply(); return; }
    word.classList.add('is-out');
    swapTimer = setTimeout(() => {
      apply();
      word.classList.add('is-pre');
      void word.offsetWidth;
      word.classList.remove('is-pre');
    }, 420);
  };

  const schedule = () => {
    clearTimeout(timer);
    if (hovering || focused || !visible || reduced.matches || document.hidden || turns >= rooms.length) return;
    timer = setTimeout(() => {
      turns++;
      paint((index + 1) % rooms.length, true);
      schedule();
    }, 2600);
  };

  rooms.forEach((el, i) => {
    const show = () => { clearTimeout(timer); if (i !== index) paint(i, true); };
    el.addEventListener('pointerenter', () => { hovering = true; show(); });
    el.addEventListener('pointerleave', () => { hovering = false; schedule(); });
    el.addEventListener('focusin', () => { focused = true; show(); });
    el.addEventListener('focusout', () => { focused = false; schedule(); });
  });
  swap.addEventListener('pointerenter', () => { hovering = true; clearTimeout(timer); });
  swap.addEventListener('pointerleave', () => { hovering = false; schedule(); });
  document.addEventListener('visibilitychange', schedule);
  reduced.addEventListener('change', schedule);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; schedule(); }).observe(swap);

  paint(0, false);
  schedule();
}

function wireCopyButtons() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('span');
    const idle = label.textContent;
    let timer = 0;
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        label.textContent = 'Copied';
      } catch {
        label.textContent = 'Copy failed';
      }
      btn.toggleAttribute('data-done', true);
      clearTimeout(timer);
      timer = setTimeout(() => { label.textContent = idle; btn.removeAttribute('data-done'); }, 1800);
    });
  });
}

function mountInstruments() {
  const live = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      const handle = live.get(entry.target);
      if (!handle) continue;
      if (entry.isIntersecting) { entry.target.toggleAttribute('data-running', true); handle.start?.(); }
      else { entry.target.removeAttribute('data-running'); handle.stop?.(); }
    }
  }, { rootMargin: '120px 0px' });

  document.querySelectorAll('[data-instrument]').forEach((el) => {
    const mount = INSTRUMENTS[el.dataset.instrument];
    if (!mount) return;
    try {
      live.set(el, mount(el, { reduced }) || {});
      el.toggleAttribute('data-mounted', true);
      io.observe(el);
    } catch (err) {
      console.warn(`The ${el.dataset.instrument} instrument could not start.`, err);
    }
  });
}

trackZones();
cycleHero();
wireCopyButtons();
mountInstruments();
