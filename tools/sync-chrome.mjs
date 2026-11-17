// Every page carries its own copy of the nav and the footer, so the site needs no build step.
// Edit them here, then run: node tools/sync-chrome.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const write = (path, content) => writeFileSync(new URL(path, root), content);

const sections = [['apps', 'Work'], ['approach', 'Our approach'], ['about', 'About']];
const textPages = [['support.html', 'Support'], ['privacy.html', 'Privacy'], ['terms.html', 'Terms'], ['security.html', 'Security']];

// `home` prefixes links to the home page's sections and `files` prefixes links to other pages.
// The Worker serves 404.html at any missing URL, so its links must be absolute.
const pages = {
  'index.html': { home: '', files: '' },
  'support.html': { home: '/', files: '' },
  'privacy.html': { home: '/', files: '' },
  'terms.html': { home: '/', files: '' },
  'security.html': { home: '/', files: '' },
  '404.html': { home: '/', files: '/' },
};

const brand = ({ home }) => {
  const [href, label] = home ? ['/', 'home'] : ['#top', 'back to the top'];
  return `<a class="brand" href="${href}" aria-label="Sigentic Labs, ${label}">
      <svg class="brand-seed" viewBox="0 0 100 100" aria-hidden="true"><use href="#seed"/></svg>
      <span>Sigentic Labs</span>
    </a>`;
};
const sectionLinks = ({ home }, indent) =>
  sections.map(([id, label]) => `${indent}<a href="${home}#${id}">${label}</a>`).join('\n');
const pageLinks = ({ files }, current, indent) =>
  textPages.map(([file, label]) =>
    `${indent}<a href="${files}${file}"${file === current ? ' aria-current="page"' : ''}>${label}</a>`).join('\n');

const header = (site) => `<header class="nav" data-nav>
  <div class="wrap nav-in">
    ${brand(site)}
    <nav class="nav-links" aria-label="Main">
${sectionLinks(site, '      ')}
    </nav>
    <a class="nav-cta" href="${site.home}#contact">Get in touch</a>
  </div>
</header>`;

const footer = (site, current) => `<footer class="foot">
  <div class="wrap foot-in">
    ${brand(site)}
    <nav class="foot-links" aria-label="Footer">
${sectionLinks(site, '      ')}
${pageLinks(site, current, '      ')}
      <a class="nav-cta" href="${site.home}#contact">Get in touch</a>
    </nav>
  </div>
  <p class="wrap foot-base">© 2026 Sigentic Labs LLC.</p>
</footer>`;

for (const [page, site] of Object.entries(pages)) {
  let html = read(page);
  for (const [name, pattern, block] of [
    ['header', /<header class="nav" data-nav>[\s\S]*?<\/header>/g, header(site)],
    ['footer', /<footer class="foot">[\s\S]*?<\/footer>/g, footer(site, page)],
  ]) {
    if ([...html.matchAll(pattern)].length !== 1) throw new Error(`Expected one ${name} in ${page}`);
    html = html.replace(pattern, () => block);
  }
  write(page, html);
}
console.log(`Synced the nav and footer in ${Object.keys(pages).length} pages`);
