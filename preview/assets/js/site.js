const reduced = matchMedia('(prefers-reduced-motion: reduce)');
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

root.classList.add('js');
syncMotion();
reduced.addEventListener('change', syncMotion);
glassNav();
reveal();
copyButtons();
