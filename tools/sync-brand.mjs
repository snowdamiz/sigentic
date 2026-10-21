// The Seed SVG is the source for every inline mark and icon tile.
// Run after editing assets/img/logo.svg: node tools/sync-brand.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const write = (path, content) => writeFileSync(new URL(path, root), content);
const paths = [...read('assets/img/logo.svg').matchAll(/<path d="([^"]+)"\s*\/>/g)]
  .map((match) => match[1]);
if (paths.length !== 3) throw new Error('The Seed mark must contain three filled paths.');
const artwork = paths.map((d) => `        <path d="${d}"/>`).join('\n');
const symbol = `<symbol id="i-logo" viewBox="0 0 100 100" fill="currentColor">\n${artwork}\n      </symbol>`;

for (const page of ['index.html', 'privacy.html', 'terms.html', 'support.html', 'security.html', '404.html']) {
  const html = read(page);
  const match = /<symbol id="i-logo"[^>]*>[\s\S]*?<\/symbol>/g;
  if ([...html.matchAll(match)].length !== 1) throw new Error(`Expected one logo symbol in ${page}`);
  write(page, html.replace(match, symbol));
}

const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <title>Sigentic Labs — Seed</title>
  <rect width="100" height="100" rx="24" fill="#101214"/>
  <g fill="#bdf75f" transform="translate(50 50) scale(0.76) translate(-50 -50)">
${artwork}
  </g>
</svg>
`;
write('assets/img/logo-tile.svg', tile);
write('assets/img/favicon.svg', tile);
console.log(`Synced Seed artwork in ${fileURLToPath(root)}`);
