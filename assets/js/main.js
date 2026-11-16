(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;

  $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

  const nav = $('[data-nav]');
  const menu = $('[data-menu]');
  const toggle = $('[data-menu-toggle]');
  const behindMenu = $$('.skip, main, body > footer');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.style.overflow = open ? 'hidden' : '';
    behindMenu.forEach((el) => { el.inert = open; });
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
    } else {
      menu.classList.remove('is-open');
      setTimeout(() => { if (!menuOpen) menu.hidden = true; }, 300);
    }
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); toggle.focus(); } });
  window.addEventListener('resize', () => { if (menuOpen && window.innerWidth > 900) setMenu(false); });

  // The nav's product links appear once the hero's picker has scrolled under the nav. Pages without a picker show them at once.
  const picker = $('[data-picker]');
  const dock = (docked) => nav.classList.toggle('is-docked', docked);
  if (picker && hasIO) {
    new IntersectionObserver(([e]) => dock(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: `-${nav.offsetHeight}px 0px 0px 0px` }).observe(picker);
  } else {
    dock(true);
  }

  const sectionLinks = $$('[data-nav-products] a[href^="#"]');
  if (hasIO && sectionLinks.length) {
    const byId = new Map(sectionLinks.map((a) => [a.hash.slice(1), a]));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        const link = byId.get(e.target.id);
        if (e.isIntersecting) sectionLinks.forEach((l) => l.classList.toggle('is-active', l === link));
        else link.classList.remove('is-active');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    byId.forEach((_, id) => io.observe(document.getElementById(id)));
  }

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const revealEls = $$('[data-reveal]');
  if (hasIO && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  const toastEl = $('[data-toast]');
  let toastTimer = 0;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-shown');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-shown'), 2600);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (__) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  $$('[data-copy]').forEach((btn) => {
    const label = $('[data-copy-label]', btn);
    const idle = label.textContent;
    let timer = 0;
    btn.addEventListener('click', async () => {
      if (!(await copyText(btn.dataset.copy))) {
        showToast('Couldn’t reach the clipboard. Select the text to copy it.');
        return;
      }
      showToast(btn.dataset.copyToast);
      btn.classList.add('is-copied');
      label.textContent = 'Copied';
      clearTimeout(timer);
      timer = setTimeout(() => { btn.classList.remove('is-copied'); label.textContent = idle; }, 2200);
    });
  });

  // The newsletter has no backend yet: a valid address only shows the thank-you toast.
  const signup = $('[data-signup]');
  if (signup) {
    const input = $('input', signup);
    signup.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!input.checkValidity()) {
        showToast('Enter an email address to subscribe.');
        input.focus();
        return;
      }
      input.value = '';
      showToast('Thanks. We’ll write when something ships.');
    });
  }
})();
