const DISHES = [
  {
    id: 'chicken', name: 'Lemon roast chicken', color: 'var(--c1)',
    steps: [
      { kind: 'prep', min: 10, text: 'Season the chicken and tuck the lemon inside.' },
      { kind: 'cook', min: 60, text: 'Into a 425°F oven.' },
      { kind: 'rest', min: 15, text: 'Out of the oven. Rest it under foil.' },
    ],
  },
  {
    id: 'potatoes', name: 'Crispy potatoes', color: 'var(--c2)',
    steps: [
      { kind: 'cook', min: 15, text: 'Boil until a knife slides in.' },
      { kind: 'prep', min: 5, text: 'Drain, smash flat, oil and salt.' },
      { kind: 'cook', min: 35, text: 'Roast on the top rack.' },
    ],
  },
  {
    id: 'beans', name: 'Charred green beans', color: 'var(--c3)',
    steps: [
      { kind: 'prep', min: 5, text: 'Trim the beans.' },
      { kind: 'cook', min: 8, text: 'Char in a hot pan, then add the garlic.' },
    ],
  },
  {
    id: 'sauce', name: 'Pan sauce', color: 'var(--c4)',
    steps: [
      { kind: 'prep', min: 2, text: 'Pour the fat off the roasting tin.' },
      { kind: 'cook', min: 8, text: 'Reduce the juices with stock and butter.' },
    ],
  },
];

const DEMO_SECONDS = 16;

const clock = (m) => {
  const day = ((Math.round(m) % 1440) + 1440) % 1440;
  const h = Math.floor(day / 60);
  const mm = String(day % 60).padStart(2, '0');
  return `${h % 12 || 12}:${mm} ${h < 12 ? 'am' : 'pm'}`;
};
const span = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} m` : ''}`.trim() : `${m} m`);

function plan(serve, on) {
  const steps = [];
  const dishes = DISHES.filter((d) => on.has(d.id)).map((d) => {
    const total = d.steps.reduce((sum, s) => sum + s.min, 0);
    let at = serve - total;
    const placed = d.steps.map((s) => {
      const step = { ...s, dish: d, start: at, end: at + s.min };
      at += s.min;
      steps.push(step);
      return step;
    });
    return { ...d, total, start: serve - total, steps: placed };
  });
  steps.sort((a, b) => a.start - b.start || a.end - b.end);
  const first = Math.min(serve - 15, ...dishes.map((d) => d.start));
  const from = Math.floor(first / 15) * 15;
  return { serve, from, dishes, steps };
}

const LABEL = { idle: 'Run cook mode', running: 'Pause cook mode', paused: 'Resume cook mode', done: 'Cook it again' };

export function mountSavorly(root, { reduced }) {
  const $ = (sel) => root.querySelector(sel);
  const chart = $('[data-chart]');
  const list = $('[data-steps]');
  const serveOut = $('[data-serve-out]');
  const cookBtn = $('[data-cook]');
  const cookLabel = cookBtn.querySelector('span');
  const cookIcon = cookBtn.querySelector('use');
  const speakBtn = $('[data-speak]');
  const dishBox = $('[data-dishes]');
  const say = $('[data-say]');

  const on = new Set(DISHES.map((d) => d.id));
  let serve = 19 * 60 + 30;
  let meal = plan(serve, on);
  let mode = 'idle';
  let t = meal.from;
  let speak = false;
  let started = new Set();
  let raf = 0;
  let last = 0;

  const toggles = DISHES.map((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dish-toggle';
    b.style.setProperty('--dc', d.color);
    b.setAttribute('aria-pressed', 'true');
    b.textContent = d.name;
    b.addEventListener('click', () => {
      on.has(d.id) ? on.delete(d.id) : on.add(d.id);
      b.setAttribute('aria-pressed', String(on.has(d.id)));
      toggles.forEach((btn, i) => {
        btn.disabled = on.size === 1 && on.has(DISHES[i].id);
        btn.title = btn.disabled ? 'A meal needs at least one dish' : '';
      });
      replan();
    });
    dishBox.append(b);
    return b;
  });

  const pct = (m) => ((m - meal.from) / (meal.serve - meal.from)) * 100;
  const stepKey = (s) => `${s.dish.id}-${s.start}`;
  const voice = 'speechSynthesis' in window ? speechSynthesis : null;

  function drawChart() {
    const every = meal.serve - meal.from > 120 ? 30 : 15;
    const ticks = [];
    for (let m = meal.from; m < meal.serve; m += every) ticks.push(m);
    chart.innerHTML = `
      <div class="meal-rows">${meal.dishes.map((d) => `
        <div class="meal-row" style="--dc:${d.color}">
          <p class="meal-row-name">${d.name}<small>${span(d.total)} · start ${clock(d.start)}</small></p>
          <div class="meal-track">${d.steps.map((s, i) => `<span class="seg seg-${s.kind}" data-seg="${d.id}-${i}" style="left:${pct(s.start)}%;width:calc(${pct(s.end) - pct(s.start)}% - 2px)"></span>`).join('')}</div>
        </div>`).join('')}
        <div class="meal-over">
          ${ticks.map((m) => `<span class="meal-tick" style="left:${pct(m)}%"><span>${clock(m).slice(0, -3)}</span></span>`).join('')}
          <span class="meal-serve-line"><span>Serve</span></span>
          <span class="meal-head" data-head></span>
        </div>
      </div>
      <p class="meal-legend"><span><i class="seg-prep"></i>Prep</span><span><i class="seg-cook"></i>Cook</span><span><i class="seg-rest"></i>Rest</span></p>`;
  }

  function row(s, right, cls = '') {
    return `<div class="step ${cls}"><span class="step-t">${clock(s.start)}</span><span class="step-dot" style="--dc:${s.dish.color}"></span><span class="step-x"><b>${s.dish.name}.</b> ${s.text}</span><span class="step-left">${right}</span></div>`;
  }

  function drawSteps() {
    if (mode === 'idle') {
      list.innerHTML = meal.dishes.map((d) => d.steps[0]).sort((a, b) => a.start - b.start).map((s) => row(s, 'start')).join('');
      return;
    }
    if (t >= meal.serve) {
      list.innerHTML = `<div class="step is-now"><span class="step-t">${clock(meal.serve)}</span><span class="step-dot" style="--dc:var(--ink)"></span><span class="step-x"><b>Dinner is ready.</b> Every dish finished together.</span><span class="step-left">serve</span></div>`;
      return;
    }
    list.innerHTML = meal.steps.filter((s) => s.end > t).slice(0, 4).map((s) => (s.start <= t
      ? row(s, `${Math.ceil(s.end - t)} min left`, 'is-now')
      : row(s, `in ${Math.ceil(s.start - t)} min`))).join('');
  }

  function drawLive() {
    const head = chart.querySelector('[data-head]');
    if (head) head.style.left = `${Math.min(100, pct(t))}%`;
    meal.dishes.forEach((d) => d.steps.forEach((s, i) => {
      chart.querySelector(`[data-seg="${d.id}-${i}"]`)?.classList.toggle('is-now', mode !== 'idle' && s.start <= t && t < s.end);
    }));
    if (mode === 'idle') return;
    for (const s of meal.steps) {
      if (s.start > t || started.has(stepKey(s))) continue;
      started.add(stepKey(s));
      say.textContent = `${clock(s.start)}. ${s.dish.name}. ${s.text}`;
      if (speak) voice.speak(new SpeechSynthesisUtterance(`${s.dish.name}. ${s.text}`));
    }
  }

  function setMode(next) {
    mode = next;
    cookLabel.textContent = reduced.matches && next === 'paused' ? 'Next step' : LABEL[next];
    cookIcon.setAttribute('href', next === 'running' ? '#i-pause' : '#i-play');
    chart.toggleAttribute('data-cooking', next !== 'idle');
    cancelAnimationFrame(raf);
    if (next === 'running') {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    drawLive();
    drawSteps();
  }

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const minute = Math.floor(t);
    t += dt * ((meal.serve - meal.from) / DEMO_SECONDS);
    if (t >= meal.serve) {
      t = meal.serve;
      setMode('done');
      say.textContent = `Dinner is ready at ${clock(meal.serve)}.`;
      return;
    }
    drawLive();
    if (Math.floor(t) !== minute) drawSteps();
    raf = requestAnimationFrame(frame);
  }

  function rewind() {
    t = meal.from;
    started = new Set();
    voice?.cancel();
  }

  function replan() {
    meal = plan(serve, on);
    serveOut.textContent = clock(serve);
    rewind();
    drawChart();
    setMode('idle');
  }

  cookBtn.addEventListener('click', () => {
    if (mode === 'idle' || mode === 'done') rewind();
    if (reduced.matches) {
      const next = meal.steps.find((s) => s.start > t);
      t = next ? next.start : meal.serve;
      setMode(t >= meal.serve ? 'done' : 'paused');
      return;
    }
    setMode(mode === 'running' ? 'paused' : 'running');
  });

  root.querySelectorAll('[data-serve]').forEach((b) => b.addEventListener('click', () => {
    serve = Math.max(17 * 60, Math.min(22 * 60, serve + Number(b.dataset.serve)));
    replan();
  }));

  if (voice) {
    speakBtn.hidden = false;
    speakBtn.addEventListener('click', () => {
      speak = !speak;
      speakBtn.setAttribute('aria-pressed', String(speak));
      if (!speak) voice.cancel();
    });
  }

  replan();

  return {
    stop() {
      if (mode === 'running') setMode('paused');
      voice?.cancel();
    },
  };
}
