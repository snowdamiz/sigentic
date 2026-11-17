const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

const syncMotion = () => root.classList.toggle('has-motion', !reduced.matches);
syncMotion();
reduced.addEventListener('change', syncMotion);

const io = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    entry.target.classList.add('is-in');
    io.unobserve(entry.target);
  }
}, { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
