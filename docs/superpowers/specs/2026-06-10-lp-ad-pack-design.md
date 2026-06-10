# LP Factory Studio — Ad Pack per Landing Page (v5)

**Date:** 2026-06-10
**Status:** Implemented

## Goal
Each generated landing page (each "angle") ships with **1 Ad Pack = 5 full Meta/TikTok ad creative sets**: Primary text + Headline + Description + CTA + 1 dedicated ad image. Ad copy is generated automatically with the LP; ad images are generated on demand per LP. Preview as a Facebook-feed mockup inside the app.

All work lives in the single self-contained `LP-Factory-Studio.html` (static, deployed on Vercel), matching the existing one-file pattern — no build step, no extra module.

## Decisions (from brainstorming)
- **Ad set shape:** full Meta ad — `primary`, `headline`, `desc`, `cta` (+ `cta_meta` enum), `image` (EN scene), `concept` (EN label).
- **5 angles per pack, fixed order:** (1) pain/hook, (2) benefit/transformation, (3) social proof/UGC, (4) offer/urgency, (5) curiosity question.
- **Ad images:** dedicated, freshly generated (not LP-image crops). Optimized for **mobile + FB/TikTok feed** via `AP()` prompt (vertical, single focal subject, thumb-stopping, clean text-overlay space, no on-image text).
- **Image ratio selector** (`#adratio`): 4:5 (FB/IG feed, default) · 9:16 (TikTok/Reels/Stories) · 1:1.
- **Generation timing:** copy auto in `genConfigs()`; ad images on demand via per-LP button (cost control). Preview works immediately using LP images as fallback.
- **Preview:** Facebook feed mockup (page avatar, Sponsored, primary text, image, link card with headline/desc/CTA, copy buttons).
- **Export (all three):** clipboard copy per field · `ads.json` + `ad-images/` in ZIP (downloadLP + downloadAll) · standalone self-contained `adpack-<slug>.html`.

## Data model
- `angle.ads[]` — 5 objects `{concept, primary, headline, desc, cta, cta_meta, image}` (added to the `genConfigs()` JSON schema/prompt).
- `lp.adSlots{ad0..ad4}` — `{scene, ratio, prompt, name}` built by `buildAdSlots(a)`.
- `lp.adB64{ad0..ad4}` — generated ad image base64.

## Key functions (in `LP-Factory-Studio.html`)
- `adRatio()` · `AP(scene,ratio)` · `buildAdSlots(a)` — ad image prompt + slots.
- `genAdImages(li)` — concurrent generation of the 5 ad images (reuses `genImage()` retry/backoff). `regenAd(i,j)` — single set.
- `adCard()` / `adCardStatic()` / `previewAds(li)` — FB-feed mockup; `adCopy()` — clipboard.
- `adsJson(lp)` / `adImagesToZip()` / `downloadAdPack(i)` — exports. Wired into `downloadLP` + `downloadAll`.
- Editor: Ad Pack group in `edExtras()` (edit 5 sets + per-set regen + thumbnail).
- LP grid card: `🎯 Ảnh ad` (genAdImages) and `📢 Ad Pack` (previewAds) buttons + `#lpadst{i}` status.

## Update — reuse LP images for ad creatives (same day)
Per user: instead of always paying to generate dedicated ad images, let the user **pick up to 10 images from the LP's own library** (section images + uploaded UGC + any AI ad images) — each picked image becomes a separate ad creative, auto-paired with one of the 5 copy sets (cycled), copy changeable per creative. Keeps emotional continuity with the LP and avoids extra API cost. The AI "generate dedicated ad image" path is kept (hybrid).

- New `lp.adCreatives[]` = `{imgRef, copyIdx}`. `imgRef` namespaces: `lp:<slotKey>`, `ugc:<i>`, `ai:<adKey>`.
- `lpImagePool(lp)` builds the picker grid; `pickAdImages`/`_adPickToggle`/`confirmAdPicks` (max 10) manage selection.
- `resolveCreativeSrc` (data URL for preview/standalone) + `resolveCreativePath` (ZIP path) resolve a ref. ZIP files already exist: `assets/<key>.jpg` (LP), `assets/ugc-N.jpg`, `ad-images/ad-N.jpg` (AI).
- `previewAds` renders creatives when present (each card: image + copy-set `<select>` + remove), else falls back to the 5 copy sets. `creativeCard` + shared `fbAdHTML`/`copyBox` builders.
- `genAdImages` seeds `adCreatives` from freshly generated AI images if empty. `adsJson` + `downloadAdPack` emit creatives when present (with `copy_set`), else the 5-set fallback.
- Editor ad group gains a **📌 Chọn ảnh LP** button.

## Verification
- `node --check` on the extracted app script: pass.
- Logic harness (stubbed globals): buildAdSlots/AP/adDomain/adImgSrc/adCard/adCardStatic/adsJson/adImagesToZip/downloadAdPack all produce correct output; ad-image filenames map `ad0→ad-1.jpg`; `ads.json` image is `null` until generated.
- Existing suite: 50/50 pass.
- Creative-mode harness (12 checks): lpImagePool / resolveCreativeSrc / resolveCreativePath (lp/ugc/ai) / creativeCard / adsJson with creatives (copy_set + correct image paths) / fallback / downloadAdPack / confirmAdPicks DOM-order — all pass. `node --check` re-confirmed.
