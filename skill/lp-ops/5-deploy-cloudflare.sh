#!/usr/bin/env bash
# Deploy cả thư mục 'site/' (mỗi LP 1 folder con) lên Cloudflare Pages 1 lần.
set -e; PROJECT="${1:-oniiz-lp}"
command -v wrangler >/dev/null || npm i -g wrangler
wrangler pages project create "$PROJECT" --production-branch=main 2>/dev/null || true
wrangler pages deploy "$(cd "$(dirname "$0")" && pwd)/site" --project-name="$PROJECT"
echo "DONE -> https://$PROJECT.pages.dev/<slug>/"
