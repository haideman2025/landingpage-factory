#!/usr/bin/env bash
# Deploy 'site/' lên Vercel. Lần đầu: npm i -g vercel && vercel login
set -e; cd "$(dirname "$0")/site"
command -v vercel >/dev/null || npm i -g vercel
vercel deploy --prod --yes
