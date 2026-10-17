import './style.css';
import { chinaToday, addDays, generateCodes } from './codegen.js';

const form = document.getElementById('form');
const vinInput = document.getElementById('vin');
const dateInput = document.getElementById('date');
const errorEl = document.getElementById('error');
const resultsEl = document.getElementById('results');

dateInput.value = chinaToday();

vinInput.addEventListener('input', () => {
  vinInput.value = vinInput.value.replace(/\D/g, '').slice(0, 4);
});

const formatDate = (iso) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
    timeZone: 'UTC', weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  });

const offsetLabel = (offset) => (offset === 0 ? 'centre' : `shift ${offset > 0 ? '+' : ''}${offset}`);

function codeChip(code, label) {
  return `<button type="button" class="chip" data-code="${code}" title="Click to copy">
    <code>${code}</code><small>${label}</small></button>`;
}

function renderBlock(result, title, featured = false) {
  return `
    <div class="card result${featured ? ' featured' : ''}">
      ${featured ? '<span class="badge">Most likely to work</span>' : ''}
      <div class="result-head">
        <h2>${title}</h2>
        <span class="date">${formatDate(result.date)}</span>
      </div>
      <button type="button" class="main-code" data-code="${result.main}" title="Click to copy">
        <code>${result.main}</code><small>Main code (shift +1). Click to copy.</small>
      </button>
      <h3>Alternatives</h3>
      <div class="chips">${result.alternatives.map((a) => codeChip(a.code, offsetLabel(a.offset))).join('')}</div>
      <details><summary>SHA-256 hash</summary><code class="hash">${result.hash}</code></details>
    </div>`;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorEl.textContent = '';

  const vin = vinInput.value.trim();
  const date = dateInput.value;
  if (!/^\d{4}$/.test(vin)) {
    errorEl.textContent = 'Enter exactly 4 digits from the end of your VIN.';
    return;
  }
  if (!date) {
    errorEl.textContent = 'Pick a date.';
    return;
  }
  if (!window.crypto?.subtle) {
    errorEl.textContent = 'Your browser blocks hashing on this page. Open it over https.';
    return;
  }

  const [selected, before, after] = await Promise.all([
    generateCodes(vin, date),
    generateCodes(vin, addDays(date, -1)),
    generateCodes(vin, addDays(date, 1)),
  ]);

  const isToday = date === chinaToday();
  resultsEl.innerHTML =
    renderBlock(selected, isToday ? 'Today in China' : 'Selected date', true) +
    `<p class="hint">Didn't work? Try the day before and the day after:</p>` +
    renderBlock(before, 'Day before') +
    renderBlock(after, 'Day after');
  resultsEl.hidden = false;
  resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

resultsEl.addEventListener('click', async (e) => {
  const target = e.target.closest('[data-code]');
  if (!target) return;
  try {
    await navigator.clipboard.writeText(target.dataset.code);
    target.classList.add('copied');
    setTimeout(() => target.classList.remove('copied'), 1200);
  } catch {
    /* clipboard unavailable — user can still read the code */
  }
});
