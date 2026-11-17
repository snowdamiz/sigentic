const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const root = document.documentElement;

const syncMotion = () => root.classList.toggle('has-motion', !reduced.matches);
syncMotion();
reduced.addEventListener('change', syncMotion);

const reveal = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-in');
    reveal.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -8% 0px' });
for (const el of document.querySelectorAll('[data-reveal]')) {
  if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in');
  else reveal.observe(el);
}
root.classList.add('has-reveal');

const nav = document.querySelector('[data-nav]');
const onScroll = () => nav.classList.toggle('is-scrolled', scrollY > 4);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const links = new Map([...nav.querySelectorAll('.nav-links a')].map((a) => [a.hash.slice(1), a]));
const sections = [...document.querySelectorAll('main > section[id]')];
if (sections.some((s) => links.has(s.id))) {
  const current = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      links.forEach((a, id) => {
        if (id === entry.target.id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => current.observe(s));
}

const blocks = document.querySelector('[data-blocks]');
if (blocks) {
  const hero = blocks.closest('section');
  hero.addEventListener('pointermove', (e) => {
    if (reduced.matches || !finePointer.matches) return;
    const r = blocks.getBoundingClientRect();
    const px = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2)));
    const py = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 2)));
    blocks.style.setProperty('--px', px.toFixed(3));
    blocks.style.setProperty('--py', py.toFixed(3));
  });
  hero.addEventListener('pointerleave', () => {
    blocks.style.setProperty('--px', 0);
    blocks.style.setProperty('--py', 0);
  });
}
