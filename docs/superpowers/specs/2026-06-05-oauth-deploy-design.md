# Landing Page Factory — OAuth Deploy to GitHub + Vercel

**Date:** 2026-06-05
**Status:** Approved design, pending implementation plan
**Owner:** haideman2025

## Problem

Landing Page Factory is a browser-only tool (single `index.html`) that generates
high-converting landing pages. Today the only "deploy" path is downloading a ZIP
with `deploy.bat`/`deploy.sh`/`deploy.ps1` that runs `wrangler` locally to push to
Cloudflare Pages. This is too technical for a commercial, all-audience product.

We want end users to deploy their generated landing pages to **their own** GitHub +
Vercel + custom domain, directly from the tool, via one-click "Connect" buttons.

## Goals

- One-click **Connect GitHub** and **Connect Vercel** (OAuth, no token pasting by end users).
- After generating LPs, user clicks **Deploy** → site is pushed to their GitHub repo,
  deployed to their Vercel account, and attached to their custom domain.
- Multi-tenant: each customer uses **their own** GitHub + Vercel accounts. The product
  owner's backend only brokers OAuth login — it never stores or touches customer content.
- Keep the existing Cloudflare ZIP path as a fallback.

## Non-Goals (Phase 1)

- Git-integration auto-redeploy on `git push` (Phase 2).
- Server-side token storage / backend proxying of API calls (Phase 2 hardening).
- Per-LP separate repos/domains — Phase 1 is **1 site = 1 repo = 1 project = 1 domain**.
- Managing multiple sites / deploy history dashboard (Phase 2).

## Decisions (locked)

| Decision | Choice |
|---|---|
| Auth model | OAuth "Connect" buttons (not token paste) |
| Hosting | Everything on Vercel — static tool + Serverless Functions backend |
| Deploy granularity | 1 site = 1 repo = 1 Vercel project = 1 domain |
| Token storage | In browser `sessionStorage` (MVP); cleared on tab close |
| Vercel deploy method | Direct file deploy (`POST /v13/deployments`), not Git import |

## Architecture

```
yourtool.vercel.app
├─ FRONTEND (index.html, enhanced)
│   • generates LPs (existing)
│   • Deploy wizard: Connect GitHub → Push → Connect Vercel → Deploy → Domain
│   • calls GitHub API + Vercel API directly from browser (both support CORS)
│
└─ BACKEND (4 Vercel Serverless Functions under /api)
    • /api/auth/github          → 302 redirect to GitHub OAuth authorize
    • /api/auth/github/callback → exchange code → access_token, return to browser
    • /api/auth/vercel          → 302 redirect to Vercel OAuth authorize
    • /api/auth/vercel/callback → exchange code → access_token, return to browser
    • holds GITHUB_CLIENT_SECRET + VERCEL_CLIENT_SECRET (env vars only)
```

The backend's only responsibility is the OAuth code→token exchange (which requires the
client secret). All content operations (create repo, push files, deploy, add domain)
happen in the browser against the user's own access tokens.

## Owner one-time setup (credentials)

### GitHub OAuth App
- Register at `github.com/settings/developers` → New OAuth App
- Homepage URL: `https://yourtool.vercel.app`
- Authorization callback URL: `https://yourtool.vercel.app/api/auth/github/callback`
- Requested scope: `repo` (create repo + push, including private)
- Yields: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

### Vercel Integration
- Create at `vercel.com/dashboard` → Integrations → Create (Developer)
- Redirect URL: `https://yourtool.vercel.app/api/auth/vercel/callback`
- Scopes: project create/read, deployment create, domain add
- Yields: `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET`

### Vercel environment variables
```
GITHUB_CLIENT_ID
GITHUB_CLIENT_SECRET
VERCEL_CLIENT_ID
VERCEL_CLIENT_SECRET
OAUTH_REDIRECT_BASE = https://yourtool.vercel.app
```
Secrets live ONLY here. Never committed; never sent to the browser.

> Security note: the GitHub client secret shared during design must be **regenerated**
> in the GitHub OAuth App settings before go-live (it was exposed in chat).

## Deploy pipeline (per Deploy action)

1. **Connect GitHub** (if not connected): open `/api/auth/github` in a popup → user
   authorizes → callback returns `access_token` to the opener via `postMessage` →
   stored in `sessionStorage`.
2. **Push site to GitHub** (browser → GitHub REST API):
   - `POST /user/repos` → create `<brand>-lp` (private by default).
   - Push the whole `/site/` folder via the **Git Data API**: create a blob per file
     (HTML/text as `utf-8`, images as `base64`), build a tree, create a commit, update
     ref `heads/main`.
3. **Connect Vercel** (if not connected): popup `/api/auth/vercel` → returns Vercel token.
4. **Deploy to Vercel**: `POST /v13/deployments` with inline files (direct deploy, no
   Git import dependency). Poll deployment status until `READY`; show `*.vercel.app` URL.
5. **Attach custom domain**: user enters `theirdomain.com` →
   `POST /v10/projects/{id}/domains` → read required DNS records (A `76.76.21.21` or
   CNAME `cname.vercel-dns.com`) → display DNS setup instructions → poll
   `/domains/{domain}/config` until verified → live.

## Frontend UI

- New button **"🚀 Deploy lên domain của tôi"** next to the existing ZIP button (ZIP
  Cloudflare path retained as fallback).
- Opens a wizard panel with 4 steps showing live state:
  `① GitHub → ② Push → ③ Vercel → ④ Domain`, each with ✓ / spinner / error + retry.
- Failures halt at the failing step with a clear Vietnamese message.

## Project structure (target)

```
landingpage-factory/
├─ index.html                  # tool (adds deploy wizard module)
├─ api/                        # NEW — Vercel Serverless Functions
│   ├─ auth/github.js
│   ├─ auth/github/callback.js
│   ├─ auth/vercel.js
│   └─ auth/vercel/callback.js
├─ src/deploy/                 # NEW — isolated, testable deploy module
│   ├─ github.js               # create repo + push site
│   ├─ vercel.js               # deploy + domain
│   └─ wizard.js               # 4-step UI orchestration
├─ vercel.json                 # functions + headers config
├─ .env.example                # 5 env var names, NO real values
├─ .gitignore                  # ignores .env
└─ tools/ scripts/ references/ assets/ README.md SKILL.md   # unchanged
```

## Module boundaries

- `src/deploy/github.js` — input: `{token, repoName, files[]}`; output: `{owner, repo, commitSha}`.
  Depends only on `fetch` + GitHub REST. No UI.
- `src/deploy/vercel.js` — input: `{token, projectName, files[], domain?}`; output:
  `{deploymentUrl, domainStatus}`. No UI.
- `src/deploy/wizard.js` — orchestrates the two modules + OAuth popups, owns all DOM.
- `api/*` — pure OAuth code→token exchange; stateless; reads secrets from env.

Each unit is understandable and testable in isolation; secrets never cross into
frontend modules.

## Error handling / edge cases

- Repo name collision → suffix `-2`, `-3`, or prompt rename.
- Token expired / stale in sessionStorage → re-trigger Connect.
- Image blob exceeds GitHub size limits → warn + skip/compress.
- Domain already attached to another project → surface Vercel error verbatim + guidance.
- User cancels OAuth popup → wizard returns to idle, no partial state.
- GitHub/Vercel rate limits → exponential backoff retry + Vietnamese status message.

## Phasing

- **Phase 1 (MVP, shippable):** OAuth GitHub+Vercel, push repo, direct Vercel deploy,
  attach domain, wizard UI, Cloudflare ZIP fallback retained.
- **Phase 2:** Git-integration auto-redeploy; httpOnly cookie + backend proxy for tokens;
  multi-site management + deploy history.

## Success criteria

A non-technical user can: open the hosted tool → generate LPs → click Deploy →
authorize GitHub and Vercel via popups → enter their domain → follow DNS instructions →
see their landing pages live on their own domain, with the source in their own GitHub repo.
