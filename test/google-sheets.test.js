import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFetch } from './helpers.js';
import { createLeadSheet, writeConfig } from '../src/google/sheets.js';

test('createLeadSheet creates spreadsheet, writes header, shares with SA', async () => {
  const fx = installFetch([
    { body: { spreadsheetId: 'SS1', spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/SS1' } }, // create
    { body: { updates: { updatedRows: 1 } } }, // header append
    { body: { id: 'perm1' } }, // permission share
  ]);
  const out = await createLeadSheet('ya29.user', 'Oniiz', 'sa@proj.iam.gserviceaccount.com');
  fx.restore();
  assert.equal(out.sheetId, 'SS1');
  assert.match(out.url, /SS1/);
  // create call
  assert.match(fx.calls[0].url, /\/v4\/spreadsheets$/);
  assert.match(JSON.parse(fx.calls[0].opts.body).properties.title, /Oniiz — Leads/);
  // header append
  assert.match(fx.calls[1].url, /values\/Orders!A1:append/);
  // share with SA as writer
  assert.match(fx.calls[2].url, /drive\/v3\/files\/SS1\/permissions/);
  const perm = JSON.parse(fx.calls[2].opts.body);
  assert.equal(perm.role, 'writer');
  assert.equal(perm.emailAddress, 'sa@proj.iam.gserviceaccount.com');
});

test('createLeadSheet skips sharing when no SA email', async () => {
  const fx = installFetch([
    { body: { spreadsheetId: 'SS2', spreadsheetUrl: 'u' } },
    { body: {} },
  ]);
  const out = await createLeadSheet('ya29.user', 'Brand', '');
  fx.restore();
  assert.equal(out.sheetId, 'SS2');
  assert.equal(fx.calls.length, 2); // no permission call
});

test('writeConfig ensures Config tab then writes only non-empty key/value rows', async () => {
  const fx = installFetch([
    { body: {} },                 // batchUpdate addSheet
    { body: { updatedCells: 4 } }, // values PUT
  ]);
  const out = await writeConfig('ya29.user', 'SS3', { meta_pixel: 'PIX', meta_token: 'TOK', tiktok_pixel: '', empty: null });
  fx.restore();
  assert.equal(out.written, 2); // only meta_pixel + meta_token
  assert.match(fx.calls[0].url, /SS3:batchUpdate/);
  assert.match(fx.calls[1].url, /values\/Config!A1:B2/);
  assert.equal(fx.calls[1].opts.method, 'PUT');
});
