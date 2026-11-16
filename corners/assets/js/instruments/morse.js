const FILE = 'menu-final-v3.pdf';
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const hex = (bytes) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();

async function fingerprint(subtle, publicKey) {
  const raw = await subtle.exportKey('raw', publicKey);
  const digest = new Uint8Array(await subtle.digest('SHA-256', raw));
  return hex(digest.slice(0, 8)).match(/.{4}/g).join(' ');
}

const ecdh = (subtle) => subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
const derive = (subtle, privateKey, publicKey) =>
  subtle.deriveKey({ name: 'ECDH', public: publicKey }, privateKey, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);

export function mountMorse(root) {
  const $ = (sel) => root.querySelector(sel);
  const input = $('[data-msg]');
  const cipherOut = $('[data-cipher]');
  const servedOut = $('[data-served-fp]');
  const bubble = $('[data-bubble]');
  const fileIn = $('[data-file-in]');
  const witnesses = [...root.querySelectorAll('[data-witness-list] li')];
  const cheatBtn = $('[data-cheat]');
  const wire = $('.wire');
  const subtle = globalThis.crypto?.subtle;

  if (!subtle) {
    cipherOut.textContent = 'Web Crypto needs a secure (https) page.';
    bubble.textContent = input.value;
    return {};
  }

  let keys = null;
  let cheating = false;
  let run = 0;
  let debounce = 0;
  const ready = (async () => {
    const [you, alex, impostor] = await Promise.all([ecdh(subtle), ecdh(subtle), ecdh(subtle)]);
    keys = {
      you, alex, impostor,
      alexFp: await fingerprint(subtle, alex.publicKey),
      impostorFp: await fingerprint(subtle, impostor.publicKey),
    };
  })();

  async function send() {
    const mine = ++run;
    await ready;
    const served = cheating ? keys.impostor : keys.alex;
    const servedFp = cheating ? keys.impostorFp : keys.alexFp;
    servedOut.textContent = servedFp;
    wire.toggleAttribute('data-cheating', cheating);

    witnesses.forEach((w) => w.classList.remove('is-ok', 'is-bad'));
    witnesses.forEach((w, i) => setTimeout(() => {
      if (mine !== run) return;
      w.classList.add(servedFp === keys.alexFp ? 'is-ok' : 'is-bad');
    }, 140 * (i + 1)));

    if (servedFp !== keys.alexFp) {
      cipherOut.textContent = 'Nothing new. Your app refused to encrypt to a key the witnesses never saw.';
      bubble.textContent = 'Held back. The key the server offered for Alex doesn’t match what the witnesses recorded, so nothing was sent.';
      bubble.classList.add('is-held');
      fileIn.classList.add('is-held');
      return;
    }

    const text = input.value.trim() || '…';
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const sealKey = await derive(subtle, keys.you.privateKey, served.publicKey);
    const payload = enc.encode(JSON.stringify({ text, file: FILE }));
    const sealed = new Uint8Array(await subtle.encrypt({ name: 'AES-GCM', iv }, sealKey, payload));
    if (mine !== run) return;
    cipherOut.textContent = b64(new Uint8Array([...iv, ...sealed]));

    const openKey = await derive(subtle, keys.alex.privateKey, keys.you.publicKey);
    const opened = JSON.parse(dec.decode(await subtle.decrypt({ name: 'AES-GCM', iv }, openKey, sealed)));
    if (mine !== run) return;
    bubble.textContent = opened.text;
    bubble.classList.remove('is-held');
    fileIn.classList.remove('is-held');
    fileIn.querySelector('span').textContent = opened.file;
  }

  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(send, 180);
  });
  cheatBtn.addEventListener('click', () => {
    cheating = !cheating;
    cheatBtn.setAttribute('aria-pressed', String(cheating));
    send();
  });

  send().catch((err) => {
    cipherOut.textContent = 'This browser could not run the demo.';
    console.warn(err);
  });
  return {};
}
