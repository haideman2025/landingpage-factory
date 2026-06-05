const SHEETS = 'https://sheets.googleapis.com/v4';
const DRIVE = 'https://www.googleapis.com/drive/v3';

const HEADER = ['Thoi gian', 'Landing Page', 'Ho ten', 'SDT', 'Dia chi', 'Mui', 'So luong', 'Ma don'];

async function gj(token, url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
    },
  });
  const text = await r.text();
  const data = text ? JSON.parse(text) : {};
  if (!r.ok) {
    const err = new Error((data.error && data.error.message) || `Google ${r.status}`);
    err.status = r.status; err.data = data;
    throw err;
  }
  return data;
}

// Create a leads spreadsheet in the user's Drive (drive.file scope), add the header row,
// and share edit access with the owner's Service Account so the relay can append rows.
export async function createLeadSheet(token, brand, saEmail) {
  const title = (brand || 'Landing Page') + ' — Leads';
  const ss = await gj(token, `${SHEETS}/spreadsheets`, {
    method: 'POST',
    body: JSON.stringify({ properties: { title }, sheets: [{ properties: { title: 'Orders' } }] }),
  });
  const sheetId = ss.spreadsheetId;

  await gj(token, `${SHEETS}/spreadsheets/${sheetId}/values/Orders!A1:append?valueInputOption=RAW`, {
    method: 'POST',
    body: JSON.stringify({ values: [HEADER] }),
  });

  if (saEmail) {
    await gj(token, `${DRIVE}/files/${sheetId}/permissions`, {
      method: 'POST',
      body: JSON.stringify({ role: 'writer', type: 'user', emailAddress: saEmail }),
    });
  }

  return { sheetId, url: ss.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}` };
}

// Write CAPI config as key/value rows into a "Config" tab (created if missing), so the
// /api/lead relay can read tokens server-side via the Service Account.
export async function writeConfig(token, sheetId, config) {
  // Ensure the Config sheet/tab exists (ignore "already exists" errors).
  await gj(token, `${SHEETS}/spreadsheets/${sheetId}:batchUpdate`, {
    method: 'POST',
    body: JSON.stringify({ requests: [{ addSheet: { properties: { title: 'Config' } } }] }),
  }).catch(() => {});

  const rows = Object.keys(config)
    .filter((k) => config[k] != null && config[k] !== '')
    .map((k) => [k, String(config[k])]);
  if (!rows.length) return { written: 0 };

  await gj(token, `${SHEETS}/spreadsheets/${sheetId}/values/Config!A1:B${rows.length}?valueInputOption=RAW`, {
    method: 'PUT',
    body: JSON.stringify({ values: rows }),
  });
  return { written: rows.length };
}
