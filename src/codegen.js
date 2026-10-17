// Engineering-menu code algorithm (shared Changan/Deepal head unit platform):
//   hash = SHA-256(last4VIN + MM + DD)  (hex)
//   code = 8 hex chars of hash starting at index (day + 1)
// Neighbouring offsets are offered as fallbacks.

const CODE_LENGTH = 8;
const MAIN_OFFSET = 1;
const ALT_OFFSETS = [-2, -1, 0, 2];

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

const pad2 = (n) => String(n).padStart(2, '0');

// Today's date in China (Asia/Shanghai) as YYYY-MM-DD — the head unit uses China time.
export function chinaToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(new Date());
}

// Adds days to a YYYY-MM-DD string without local-timezone drift.
export function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
}

export async function generateCodes(vin4, isoDate) {
  const [, month, day] = isoDate.split('-').map(Number);
  const hash = await sha256Hex(vin4 + pad2(month) + pad2(day));

  const slice = (offset) => {
    const start = day + offset;
    return start >= 0 && start + CODE_LENGTH <= hash.length
      ? hash.slice(start, start + CODE_LENGTH)
      : null;
  };

  return {
    date: isoDate,
    hash,
    main: slice(MAIN_OFFSET),
    alternatives: ALT_OFFSETS.map((offset) => ({ offset, code: slice(offset) })).filter((a) => a.code),
  };
}
