#!/usr/bin/env node
/* Checks the text-and-background colour pairs listed in `pairs` below, and the focus ring on each background,
   against WCAG AA. The colours come from the tokens in assets/css/styles.css (the :root block and the
   product token table), so a token change is rechecked. Each colour is taken at full strength: the tool
   finds no pairs on its own and cannot see opacity, so a new pairing needs a row here.

   node tools/contrast.mjs        exits 1 if any pair misses its minimum */
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/css/styles.css', import.meta.url), 'utf8');
const block = (start) => css.slice(start, css.indexOf('}', start));
const props = (text) => Object.fromEntries([...text.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

const root = props(block(css.indexOf(':root')));
const resolve = (value, scope = {}) => {
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (!ref) return value;
  return resolve(scope[ref[1]] ?? root[ref[1]], scope);
};
const products = [...css.matchAll(/^\[data-product='(\w+)'\]\s*\{([^}]*)\}/gm)].map(([, name, body]) => {
  const own = props(body);
  return { name, ...Object.fromEntries(Object.entries(own).map(([k, v]) => [k, resolve(v, own)])) };
});
const brands = products.filter((p) => p.name !== 'seed');
const token = (name) => {
  const v = resolve(root[name] ?? '');
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`--${name} is not a six-digit hex colour in styles.css`);
  return v;
};

const channel = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const BODY = 4.5, UI = 3;
const t = token;
const pairs = [
  [t('ink'), t('bg'), BODY, '--ink on --bg: body text, headings'],
  [t('ink'), t('bg-2'), BODY, '--ink on --bg-2: text in grey stages, About, the footer, the legal-page note'],
  [t('ink-2'), t('bg'), BODY, '--ink-2 on --bg: descriptions, ledes, the picker, nav links'],
  [t('ink-2'), t('bg-2'), BODY, '--ink-2 on --bg-2: descriptions in grey stages, footer links'],
  [t('ink-3'), t('bg-2'), BODY, '--ink-3 on --bg-2: the newsletter placeholder'],
  [t('ink-3'), t('bg'), BODY, '--ink-3 on --bg: legal-page contents numbers and bullets'],
  [t('on-ink'), t('ink'), BODY, '--on-ink on --ink: buttons, toast, skip link, avatar'],
  [t('code-text'), t('code-bg'), BODY, '--code-text on --code-bg: Mesh code'],
  [t('code-key'), t('code-bg'), BODY, '--code-key on --code-bg: Mesh keywords'],
  [t('code-type'), t('code-bg'), BODY, '--code-type on --code-bg: Mesh types'],
  [t('code-fn'), t('code-bg'), BODY, '--code-fn on --code-bg: Mesh function names'],
  [t('code-num'), t('code-bg'), BODY, '--code-num on --code-bg: Mesh numbers'],
  [t('code-dim'), t('code-bar'), BODY, '--code-dim on --code-bar: the code window title'],
  [t('code-text'), t('code-term'), BODY, '--code-text on --code-term: install command, Copy button'],
  [t('code-fn'), t('code-term'), BODY, '--code-fn on --code-term: install prompt'],
  [t('code-term'), t('code-fn'), BODY, '--code-term on --code-fn: Copy button once copied'],
  [t('ink'), t('lime'), BODY, '--ink on --lime: selected text'],
  [t('ink'), t('bg'), BODY, 'seed --p-ink (--ink) on --bg: the hero word on the first scene'],
  ...brands.flatMap((p) => [
    [p['p-ink'], t('bg'), BODY, `${p.name} --p-ink on --bg: links, the hero word`],
    [p['p-ink'], t('bg-2'), BODY, `${p.name} --p-ink on --bg-2: links in grey stages`],
    [t('on-ink'), p['p-ink'], BODY, `${p.name} --on-ink on --p-ink: product button`],
  ]),
];

const rings = [
  ...[{ name: 'default', 'p-ink': t('ink') }, ...brands].flatMap((p) => ['bg', 'bg-2'].map((bg) => [p['p-ink'], t(bg), `${p.name} focus ring (--p-ink) on --${bg}`])),
  ...['code-bg', 'code-term'].map((name) => [t('code-text'), t(name), `focus ring in the code window (--code-text) on --${name}`]),
].map(([ring, bg, use]) => [ratio(ring, bg), UI, use]);

let failed = 0;
const report = (r, min, use) => {
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}  (min ${min})  ${use}`);
};
pairs.forEach(([fg, bg, min, use]) => report(ratio(fg, bg), min, use));
rings.forEach(([r, min, use]) => report(r, min, use));
console.log(failed ? `${failed} pair(s) fail AA` : `all ${pairs.length + rings.length} pairs pass AA`);
process.exit(failed ? 1 : 0);
