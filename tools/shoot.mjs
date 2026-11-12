#!/usr/bin/env node
/* Screenshots a page with headless Chrome over the DevTools protocol. No dependencies (Node 22+).

   node tools/shoot.mjs <url> <out.png> [options]

   --width 1440 --height 900   viewport in CSS pixels
   --scale 1                   device pixel ratio
   --mobile                    emulate a touch device
   --reduced-motion            emulate prefers-reduced-motion: reduce
   --wait 1200                 ms to settle after load, and after the scroll pass
   --full                      one image of the whole page
   --tiles                     one image per viewport height: out-01.png, out-02.png, ...
   --y 2400 | --selector "#lab"  capture the viewport at a scroll offset or at an element
   --eval "js"                 run an expression before capturing (prints its value)

   The page is scrolled top to bottom first, so scroll-triggered reveals have run.
   A navigation that fails or does not finish loading within 30 s, uncaught exceptions and console errors
   from the page (a 404 response among them) are printed to stderr and fail the run. */
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const argv = process.argv.slice(2);
const [url, out] = argv.filter((a, i) => !a.startsWith('--') && !(argv[i - 1] || '').match(/^--(width|height|scale|wait|y|selector|eval)$/));
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => { const i = argv.indexOf(`--${name}`); return i === -1 ? fallback : argv[i + 1]; };
if (!url || !out) {
  console.error('usage: node tools/shoot.mjs <url> <out.png> [--width n] [--height n] [--scale n] [--mobile] [--reduced-motion] [--wait ms] [--full | --tiles | --y n | --selector css] [--eval js]');
  process.exit(2);
}
const width = Number(opt('width', 1440));
const height = Number(opt('height', 900));
const scale = Number(opt('scale', 1));
const settle = Number(opt('wait', 1200));
const LOAD_TIMEOUT = 30000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = mkdtempSync(join(tmpdir(), 'shoot-'));
const chrome = spawn(CHROME, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
  '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--disable-extensions',
  `--window-size=${width},${height}`, 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

const endpoint = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) resolve(m[1]);
  });
  chrome.on('exit', (code) => reject(new Error(`Chrome exited (${code}) before DevTools was ready`)));
  setTimeout(() => reject(new Error('Timed out waiting for Chrome')), 20000);
});

const ws = new WebSocket(endpoint);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let nextId = 0;
const pending = new Map();
const waiters = new Map();
const pageErrors = [];
ws.onmessage = ({ data }) => {
  const msg = JSON.parse(data);
  if (msg.method === 'Runtime.exceptionThrown') pageErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') pageErrors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`.trim());
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(`${msg.error.message}`)) : resolve(msg.result);
  } else if (msg.method && waiters.has(msg.method)) {
    waiters.get(msg.method)(msg.params);
    waiters.delete(msg.method);
  }
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++nextId;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});
const once = (method) => new Promise((resolve) => waiters.set(method, resolve));

let failed = false;
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const page = (method, params) => send(method, params, sessionId);
  const run = async (expression) => {
    const { result, exceptionDetails } = await page('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(exceptionDetails.exception?.description || exceptionDetails.text);
    return result.value;
  };
  const shot = async (file, clip) => {
    const { data } = await page('Page.captureScreenshot', { format: 'png', captureBeyondViewport: Boolean(clip), ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    writeFileSync(file, Buffer.from(data, 'base64'));
    console.log(file);
  };

  await page('Page.enable');
  await page('Runtime.enable');
  await page('Log.enable');
  await page('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: flag('mobile') });
  if (flag('mobile')) await page('Emulation.setTouchEmulationEnabled', { enabled: true });
  if (flag('reduced-motion')) await page('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${url} did not finish loading within ${LOAD_TIMEOUT / 1000} s`)), LOAD_TIMEOUT); });
  const loaded = once('Page.loadEventFired');
  const { errorText } = await Promise.race([page('Page.navigate', { url }), timeout]);
  if (errorText) throw new Error(`could not load ${url}: ${errorText}`);
  await Promise.race([loaded, timeout]);
  clearTimeout(timer);
  await run('document.fonts.ready.then(() => true)');
  await sleep(settle);

  const pageHeight = () => run('Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)');
  const scrollTo = (y) => run(`window.scrollTo({ top: ${y}, behavior: 'instant' })`);
  for (let y = 0, h = await pageHeight(); y < h; y += Math.round(height * 0.6)) {
    await scrollTo(y);
    await sleep(120);
  }
  await scrollTo(0);
  await sleep(settle);

  const js = opt('eval');
  if (js) console.log(JSON.stringify(await run(js)));

  if (flag('full')) {
    await shot(out, { x: 0, y: 0, width, height: await pageHeight() });
  } else if (flag('tiles')) {
    const total = await pageHeight();
    for (let y = 0, n = 1; y < total; y += height, n++) {
      await scrollTo(y);
      await sleep(350);
      await shot(out.replace(/\.png$/, `-${String(n).padStart(2, '0')}.png`));
    }
  } else {
    const selector = opt('selector');
    if (selector) {
      await run(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'start', behavior: 'instant' })`);
      await sleep(settle);
    } else if (opt('y')) {
      await scrollTo(Number(opt('y')));
      await sleep(settle);
    }
    await shot(out);
  }
  if (pageErrors.length) {
    failed = true;
    pageErrors.forEach((e) => console.error(`page error: ${e}`));
  }
} catch (err) {
  failed = true;
  console.error(err.message);
} finally {
  ws.close();
  chrome.kill();
  await sleep(200);
  rmSync(profile, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);
