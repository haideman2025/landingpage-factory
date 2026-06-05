# Auto Google Sheet for COD Leads — Design

**Date:** 2026-06-05 · **Status:** Approved
**Builds on:** OAuth deploy feature; same browser + Vercel-functions architecture.

## Problem
Each generated LP has a COD form that POSTs leads to `SHEET_ENDPOINT`. Today the user
must manually create a Google Sheet, paste Apps Script, deploy a Web App, and copy the
`/exec` URL into the tool. Goal: a one-click **"Kết nối Google & tạo Sheet"** that
auto-creates the Sheet and wires the form to it — zero manual setup.

## Decisions (locked)
- **Scope:** leads for the tool's own generated LPs (not LadiPage.vn).
- **Google login:** optional **"Kết nối Google"** button (not whole-app gate). App still
  works with just the Gemini key.
- **Write-back mechanism:** Service-Account relay (Option C). The browser creates the
  Sheet with the user's `drive.file` token and shares edit access with the owner's
  Service Account. Public LP forms POST to `/api/lead?s=<sheetId>`; the backend appends
  rows using the Service Account. **No per-user token is stored server-side.**
- **OAuth scope:** `openid email profile drive.file` only — `drive.file` is non-sensitive,
  avoiding Google's restricted-scope verification gauntlet.
- **Zero dependencies:** SA JWT signed with `node:crypto` (RS256). No `googleapis` npm.

## Architecture
```
Browser (tool)                         Vercel functions
─────────────                          ─────────────────
[Kết nối Google] ──popup──────────────► /api/auth/google  → Google consent (drive.file)
   ◄── token + saEmail (postMessage) ── /api/auth/google/callback
createLeadSheet(token):
  Sheets API create + header row
  Drive API: share sheet → SA as writer
  set #sheet = OAUTH_BASE/api/lead?s=<id>

Deployed LP (public)
────────────────────
COD form ──POST url-encoded (no-cors)─► /api/lead?s=<sheetId>
                                          → google-sa: sign JWT → SA token
                                          → Sheets values.append (SA is editor)
```

## Owner one-time setup (Google Cloud)
1. OAuth Client (Web) → redirect `…/api/auth/google/callback`; consent scopes
   `openid email profile drive.file` → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
2. Enable Google Sheets API + Drive API.
3. Service Account → JSON key → `GOOGLE_SA_EMAIL`, `GOOGLE_SA_PRIVATE_KEY` (keep `\n`).
4. Vercel env vars: the 4 above.

## Files
- `api/auth/google.js`, `api/auth/google/callback.js` — Google OAuth (reuse `_lib/oauth.js`).
- `api/_lib/google-sa.js` — `buildSignedJWT`, `getSAAccessToken`, `appendRow` (Node).
- `api/lead.js` — public relay: parse form body → append row via SA.
- `src/google/sheets.js` — `createLeadSheet(token, brand, saEmail)`.
- `src/google/connect-init.js` — wire the button, set `#sheet`.
- `src/deploy/oauth-client.js` — `parseOAuthMessage` also returns `saEmail`.
- `index.html` — button + status next to the Sheet-endpoint field + module script.

## Data flow detail
- Header row: `Thoi gian, Landing Page, Ho ten, SDT, Dia chi, Mui, So luong`.
- LP form already sends `lp, name, phone, address, qty, ts` url-encoded. Relay maps these
  into the row; `fav`/`Mui` left blank if absent. `/api/lead` **always returns 200 fast**
  so the form never blocks, even on error (lead loss tolerated over UX freeze).

## Error handling / edge cases
- OAuth state mismatch → 400. Token expired → re-login (sessionStorage cache cleared).
- Sheet create fails → status shows error, `#sheet` left untouched (user can paste manual).
- SA not shared / wrong sheetId → relay catches, returns 200 (no row written).
- CORS: `/api/lead` sets `Access-Control-Allow-Origin: *`; url-encoded POST avoids preflight.

## Limits / phasing
- **Phase 1 (this):** SA relay, drive.file, zero-dep JWT.
- **Phase 2:** per-user tokens if Sheets write quota (SA-wide) ever bottlenecks at scale;
  optional whole-app Google login.

## Success criteria
User clicks "Kết nối Google" → authorizes (drive.file) → a Sheet appears in their Drive →
the endpoint field auto-fills → after deploy, COD submissions on the live LP land as rows
in that Sheet, with no manual Apps Script work.
