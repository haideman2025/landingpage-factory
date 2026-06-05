// VietQR helpers. The img.vietqr.io image API renders a scannable bank-transfer QR with
// no API key. Browser + Node safe (pure).

// Parse a price string like "299.000đ" / "1,290,000 VND" into an integer amount, or null.
export function parseAmount(priceStr) {
  if (priceStr == null) return null;
  const digits = String(priceStr).replace(/[^0-9]/g, '');
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// Build the img.vietqr.io URL for a transfer QR.
export function buildVietQRUrl({ bank, account, accountName, amount, note, template = 'compact2' }) {
  if (!bank || !account) return '';
  let url = `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(account)}-${encodeURIComponent(template)}.png`;
  const params = [];
  if (amount) params.push('amount=' + encodeURIComponent(amount));
  if (note) params.push('addInfo=' + encodeURIComponent(note));
  if (accountName) params.push('accountName=' + encodeURIComponent(accountName));
  if (params.length) url += '?' + params.join('&');
  return url;
}

// A short, human-typable order code used as the transfer note so payments can be reconciled.
export function genOrderCode(rand) {
  const r = rand != null ? rand : Math.random();
  return 'DH' + Math.floor(r * 1e9).toString(36).toUpperCase().slice(0, 7);
}

// Extract an order code (DH....) from a free-text bank transfer description.
export function extractOrderCode(content) {
  if (!content) return null;
  const m = String(content).toUpperCase().match(/DH[0-9A-Z]{4,8}/);
  return m ? m[0] : null;
}
