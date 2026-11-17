const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const root = document.documentElement;

function syncMotion() {
  root.classList.toggle('has-motion', !reduced.matches);
}

function glassNav() {
  const nav = document.querySelector('[data-nav]');
  const update = () => nav.classList.toggle('is-scrolled', scrollY > 8);
  addEventListener('scroll', update, { passive: true });
  update();
}

function reveal() {
  const items = document.querySelectorAll('[data-reveal]');
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  items.forEach((el) => io.observe(el));
}

function magnifyDock() {
  const dock = document.querySelector('[data-dock]');
  const apps = [...dock.querySelectorAll('.dock-app')];
  const reach = 150;
  const grow = 0.45;
  const rest = () => apps.forEach((a) => a.style.setProperty('--s', 1));
  dock.addEventListener('pointermove', (e) => {
    if (reduced.matches || !finePointer.matches) return;
    for (const a of apps) {
      const r = a.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      a.style.setProperty('--s', (1 + grow * Math.max(0, 1 - d / reach) ** 2).toFixed(3));
    }
  });
  dock.addEventListener('pointerleave', rest);
}

function spotlight() {
  document.querySelectorAll('[data-spot]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });
}

function copyButtons() {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('span');
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
      timer = setTimeout(() => { label.textContent = 'Copy'; btn.removeAttribute('data-done'); }, 1800);
    });
  });
}

syncMotion();
reduced.addEventListener('change', syncMotion);
glassNav();
reveal();
magnifyDock();
spotlight();
copyButtons();
