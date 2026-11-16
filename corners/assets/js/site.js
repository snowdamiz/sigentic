import { mountSavorly } from './instruments/savorly.js';
import { mountMorse } from './instruments/morse.js';
import { mountMesh } from './instruments/mesh.js';
import { mountIncant } from './instruments/incant.js';
import { mountMixer } from './instruments/mixer.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const CORNERS = [
  { room: 'savorly', word: 'the stovetop.', swatch: 'var(--tomato)', ink: 'var(--ink)' },
  { room: 'morse', word: 'the group chat.', swatch: 'var(--cobalt)', ink: 'var(--chalk)' },
  { room: 'mesh', word: 'the server.', swatch: 'var(--lime)', ink: 'var(--ink)' },
  { room: 'incant', word: 'the game editor.', swatch: 'var(--violet)', ink: 'var(--chalk)' },
  { room: 'mixer', word: 'both app stores.', swatch: 'var(--pink)', ink: 'var(--ink)' },
];

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
    bar.dataset.tone = zone.dataset.zone;
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
  const word = document.querySelector('[data-word]');
  const swap = document.querySelector('[data-swap]');
  const rooms = new Map([...document.querySelectorAll('[data-plan] [data-for]')].map((el) => [el.dataset.for, el]));
  let index = 0;
  let timer = 0;
  let held = false;
  let visible = true;

  const paint = (i, animate) => {
    const c = CORNERS[i];
    index = i;
    rooms.forEach((el, key) => el.toggleAttribute('data-active', key === c.room));
    const apply = () => {
      word.textContent = c.word;
      word.style.setProperty('--sw', c.swatch);
      word.style.setProperty('--sw-ink', c.ink);
    };
    if (!animate || reduced.matches) { apply(); return; }
    word.classList.add('is-out');
    setTimeout(() => {
      word.classList.remove('is-out');
      word.classList.add('is-pre');
      apply();
      void word.offsetWidth;
      word.classList.remove('is-pre');
    }, 420);
  };

  const schedule = () => {
    clearTimeout(timer);
    if (held || !visible || reduced.matches || document.hidden) return;
    timer = setTimeout(() => { paint((index + 1) % CORNERS.length, true); schedule(); }, 2600);
  };

  rooms.forEach((el, key) => {
    const i = CORNERS.findIndex((c) => c.room === key);
    const enter = () => { held = true; clearTimeout(timer); if (i !== index) paint(i, true); };
    const leave = () => { held = false; schedule(); };
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    el.addEventListener('focusin', enter);
    el.addEventListener('focusout', leave);
  });
  swap.addEventListener('pointerenter', () => { held = true; clearTimeout(timer); });
  swap.addEventListener('pointerleave', () => { held = false; schedule(); });
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
