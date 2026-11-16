const PLANTS = [
  { id: 'fern', name: 'Boston fern', every: 'Every 2 days', color: '#3f8f4f', watered: true },
  { id: 'monstera', name: 'Monstera', every: 'Every week', color: '#24735f', watered: true },
  { id: 'basil', name: 'Basil', every: 'Every day', color: '#7aa63f', watered: false },
  { id: 'pilea', name: 'Pilea', every: 'Every 5 days', color: '#5d9a6a', watered: true },
  { id: 'snake', name: 'Snake plant', every: 'Every 2 weeks', color: '#4b6a45', watered: false },
];

const STEP_MS = 650;
const list = new Intl.ListFormat('en', { type: 'conjunction' });

export function mountMixer(root, { reduced }) {
  const lists = {
    ios: root.querySelector('[data-list="ios"]'),
    android: root.querySelector('[data-list="android"]'),
  };
  const progress = [...root.querySelectorAll('[data-progress]')];
  const versions = [...root.querySelectorAll('[data-ver]')];
  const screens = [...root.querySelectorAll('.phone-screen')];
  const shipBtn = root.querySelector('[data-ship]');
  const tamper = root.querySelector('[data-tamper]');
  const steps = [...root.querySelectorAll('[data-update] li')];
  const msg = root.querySelector('[data-update-msg]');
  const phones = root.querySelector('[data-phones]');
  const picks = [...root.querySelectorAll('[data-pick]')];
  steps.forEach((li) => li.insertAdjacentHTML('beforeend', '<span class="sr-only" data-step-state></span>'));

  const plants = PLANTS.map((p) => ({ ...p }));
  let version = '1.0.0';
  let update = 'idle';
  let timers = [];

  const rowClass = { ios: 'ios-row', android: 'and-row' };
  const switchClass = { ios: 'ios-switch', android: 'and-switch' };

  for (const os of Object.keys(lists)) {
    lists[os].innerHTML = plants.map((p) => `
      <li class="${rowClass[os]}">
        <span class="plant-ic" style="background:${p.color}" aria-hidden="true"></span>
        <label for="${os}-${p.id}"><span class="p-name">${p.name}</span><span class="p-sub">${p.every}</span></label>
        <input class="${switchClass[os]}" type="checkbox" role="switch" id="${os}-${p.id}" data-plant="${p.id}">
      </li>`).join('');
  }
  const inputs = [...root.querySelectorAll('[data-plant]')];
  inputs.forEach((input) => input.addEventListener('change', () => {
    plants.find((p) => p.id === input.dataset.plant).watered = input.checked;
    render();
  }));

  function reminderText() {
    const left = plants.filter((p) => !p.watered).map((p) => p.name);
    if (!left.length) return 'Everything is watered. Next check tomorrow at 9:00.';
    if (left.length > 2) return `${left.length} plants still need water today.`;
    return `${list.format(left)} ${left.length === 1 ? 'still needs' : 'still need'} water today.`;
  }

  function render() {
    inputs.forEach((input) => { input.checked = plants.find((p) => p.id === input.dataset.plant).watered; });
    const n = plants.filter((p) => p.watered).length;
    progress.forEach((el) => { el.textContent = `${n} of ${plants.length} watered`; });
    versions.forEach((el) => { el.textContent = `Version ${version}`; });
    screens.forEach((screen) => {
      let note = screen.querySelector('.reminder');
      if (version === '1.0.0') { note?.remove(); return; }
      if (!note) {
        note = document.createElement('p');
        note.className = 'reminder';
        screen.querySelector('ul').after(note);
      }
      note.innerHTML = `<b>Reminder.</b> ${reminderText()}`;
    });
  }

  function paintSteps(states) {
    steps.forEach((li, i) => {
      li.classList.toggle('is-ok', states[i] === 'ok');
      li.classList.toggle('is-bad', states[i] === 'bad');
      li.querySelector('[data-step-state]').textContent = { ok: ', done', bad: ', failed' }[states[i]] || '';
    });
  }

  function setMessage(text, tone = '') {
    msg.textContent = text;
    msg.className = `update-msg${tone ? ` is-${tone}` : ''}`;
  }

  function reset() {
    timers.forEach(clearTimeout);
    timers = [];
    version = '1.0.0';
    update = 'idle';
    paintSteps([]);
    shipBtn.removeAttribute('aria-disabled');
    shipBtn.textContent = 'Ship a signed fix';
    tamper.disabled = false;
    setMessage('The fix adds a watering reminder to both apps without a new store build.');
    render();
  }

  function ship() {
    if (update === 'shipping') return;
    if (update === 'applied' || update === 'refused') { reset(); return; }
    update = 'shipping';
    shipBtn.setAttribute('aria-disabled', 'true');
    tamper.disabled = true;
    const tampered = tamper.checked;
    const plan = tampered ? ['ok', 'ok', 'bad'] : ['ok', 'ok', 'ok', 'ok'];
    const gap = reduced.matches ? 0 : STEP_MS;
    plan.forEach((_, i) => {
      timers.push(setTimeout(() => {
        paintSteps(plan.slice(0, i + 1));
        if (i < plan.length - 1) return;
        shipBtn.removeAttribute('aria-disabled');
        if (tampered) {
          update = 'refused';
          shipBtn.textContent = 'Start over';
          setMessage('The signature didn’t match, so both phones threw the update away and kept running 1.0.0.', 'bad');
        } else {
          update = 'applied';
          version = '1.0.1';
          shipBtn.textContent = 'Roll back to 1.0.0';
          setMessage('Both phones checked the signature and switched to 1.0.1. Toggle a plant to see the reminder follow.', 'ok');
          render();
        }
      }, gap * (i + 1)));
    });
    setMessage(tampered ? 'Someone swapped a byte on the way…' : 'Signing 1.0.1 and sending it to both phones…');
  }

  shipBtn.addEventListener('click', ship);
  picks.forEach((btn) => btn.addEventListener('click', () => {
    phones.dataset.show = btn.dataset.pick;
    picks.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  }));
  render();
  return {};
}
