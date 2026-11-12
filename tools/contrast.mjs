#!/usr/bin/env node
/* Checks the text-and-background colour pairs listed in `pairs` below, and the focus ring on each field,
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
const products = [...css.matchAll(/\[data-product='(\w+)'\]\s*\{([^}]*)\}/g)].map(([, name, body]) => {
  const own = props(body);
  return { name, ...Object.fromEntries(Object.entries(own).map(([k, v]) => [k, resolve(v, own)])) };
});
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

const BODY = 4.5, LARGE = 3, UI = 3;
const t = token;
const pairs = [
  [t('ink'), t('paper'), BODY, '--ink on --paper: body text, headings'],
  [t('ink-2'), t('paper'), BODY, '--ink-2 on --paper: ledes, descriptions'],
  [t('ink-3'), t('paper'), BODY, '--ink-3 on --paper: mono labels'],
  [t('ink'), t('paper-2'), BODY, '--ink on --paper-2: lab ledger names and titles'],
  [t('ink-2'), t('paper-2'), BODY, '--ink-2 on --paper-2: lab notes, legal-page note'],
  [t('ink-3'), t('paper-2'), BODY, '--ink-3 on --paper-2: labels in the ledger'],
  [t('paper'), t('ink'), BODY, '--paper on --ink: ink buttons, toast'],
  [t('ink'), t('lime'), BODY, '--ink on --lime: highlighted text, lime button, contact band'],
  [t('ink-2'), t('lime'), BODY, '--ink-2 on --lime: contact lede and labels'],
  [t('on-ink'), t('ink'), BODY, '--on-ink on --ink: principles and footer headings'],
  [t('on-ink-2'), t('ink'), BODY, '--on-ink-2 on --ink: principles and footer body'],
  [t('on-ink-3'), t('ink'), BODY, '--on-ink-3 on --ink: labels on ink'],
  [t('lime'), t('ink'), BODY, '--lime on --ink: tenet numerals, install prompt'],
  [t('code-type'), t('paper'), BODY, '--code-type on --paper: Mesh code types'],
  [t('code-num'), t('paper'), BODY, '--code-num on --paper: Mesh code numbers'],
  ...products.filter((p) => p.name !== 'seed').flatMap((p) => [
    [p['p-ink'], t('paper'), BODY, `${p.name} --p-ink on --paper: tagline italic, manifesto corner, code keywords`],
    [p['p-ink'], p['p-tint'], LARGE, `${p.name} --p-ink on --p-tint: hero word on its highlighter`],
    [p['p-on'], p['p-spot'], BODY, `${p.name} --p-on on --p-spot: plate captions and notes`],
  ]),
  ...products.filter((p) => p.name === 'seed').map((p) => [p['p-ink'], p['p-tint'], LARGE, 'seed --p-ink on --p-tint: hero word on its highlighter']),
];

const fields = [['paper', t('paper')], ['paper-2', t('paper-2')], ['ink', t('ink')], ['lime', t('lime')],
  ...products.filter((p) => p.name !== 'seed').map((p) => [`${p.name} spot`, p['p-spot']])];
const rings = fields.map(([name, bg]) => {
  const best = Math.max(ratio(t('ink'), bg), ratio(t('lime'), bg));
  return [best, UI, `focus ring on ${name} (best of ink ${ratio(t('ink'), bg).toFixed(2)}, lime ${ratio(t('lime'), bg).toFixed(2)})`];
});

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
