---
name: high-converting-lp-factory
description: >-
  Nhà máy sản xuất hàng loạt landing page HTML chuyển đổi cao (dài ~20+ section, mobile-first, animation mượt) cho BẤT KỲ ngành hàng nào — DTC/mỹ phẩm/men's care/F&B/khoá học/dịch vụ/SaaS. Mỗi LP: copy tiếng Việt CÓ DẤU đầy đủ, form COD nối Google Sheet, Meta Pixel (PageView/ViewContent/Lead), và mỗi ô ảnh là 1 PROMPT TIẾNG ANH chi tiết cho Nano Banana Pro 2 (Gemini 3 Pro Image) kèm Brand Visual DNA để ảnh nhất quán toàn trang. Đi kèm tool LP-Image-Studio.html cho phép upload template + ảnh sản phẩm → tạo ảnh hàng loạt → tải ZIP (HTML + ảnh chuẩn SEO) deploy Cloudflare Pages, sẵn sàng chạy ads. Dùng skill này khi user nói: "tạo landing page chuyển đổi cao", "build LP hàng loạt", "LP COD deploy Cloudflare", "tạo 10/100 landing page", "LP cho ngành X", "sản xuất landing page chạy ads", "image prompt cho landing", hoặc cần nhân bản LP đa ngành để A/B test.
---

# High-Converting LP Factory

Sản xuất LP HTML chuyển đổi cao theo lô, mọi ngành. Đầu ra deploy thẳng Cloudflare Pages. Ảnh tạo hàng loạt bằng Nano Banana Pro 2 với prompt tiếng Anh + Brand Visual DNA nhất quán.

## Nguyên tắc bất biến (đọc trước khi tạo)
1. **Copy hiển thị = tiếng Việt CÓ DẤU đầy đủ.** Tuyệt đối không viết tiếng Việt không dấu trong nội dung người dùng đọc (headline, mô tả, FAQ, CTA). File luôn `<meta charset="UTF-8">`. Ghi file encoding utf-8. (Lỗi cũ: từng strip dấu — KHÔNG lặp lại.)
2. **Mọi prompt ảnh = TIẾNG ANH, chi tiết** theo công thức Nano Banana Pro 2 (xem `references/image-prompt-formula-EN.md`): scene + subject + composition + lighting + lens + color palette + mood + aspect ratio + "use attached product reference, keep packaging/label" + negative.
3. **Brand Visual DNA**: 1 đoạn prompt tiếng Anh mô tả phong cách hình ảnh thương hiệu (palette, lighting, mood, photographic style). Đoạn này được (a) nối vào CUỐI mọi prompt ảnh để mỗi ô tự đủ, và (b) hiển thị ở 1 hộp "Brand Visual DNA" đầu trang (HTML comment + box) để user dán vào ô "Add to every prompt" của LP-Image-Studio.
4. **Mỗi ô ảnh là `<figure class="media" style="aspect-ratio:R">` chứa `<button class="pcopy" data-p="FULL_ENGLISH_PROMPT">`** → để LP-Image-Studio quét tự động.
5. **Chuyển đổi cao**: ≥20 section đa định dạng, ≥6 CTA, sticky CTA, countdown, social proof, form COD ≤5 trường, FAQ, guarantee, pixel.

## Quy trình 5 bước

### Bước 1 — Intake (điền CONFIG)
Mở `scripts/build_lp.py`, sửa khối `CONFIG` ở đầu (hoặc tạo file JSON riêng):
- `brand`, `product`, `offer` (giá gốc/giá KM/quà), `currency`, `pixel_id`, `hotline`, `company`
- `brand_dna_en` — Brand Visual DNA tiếng Anh (palette hex, lighting, mood, photographic style, subject demographic)
- `angles[]` — mỗi angle: `slug, title, acc, acc2, ey, h1(html, CÓ DẤU), sub, pains[3], stitle, slead, proof, testi[3], case, ft, fs, angle_type` + tham số ảnh `subj, setting, surface` (mô tả tiếng Anh để ghép vào prompt)
Mỗi ngành hàng = 1 CONFIG. Có thể tạo 1 hoặc 100 angle.

### Bước 2 — Generate
Chạy: `python3 scripts/build_lp.py` → xuất `out/<slug>.html` cho từng angle + `out/index.html`. Mỗi trang: copy VN có dấu, prompt ảnh tiếng Anh + Brand DNA, form COD→Sheet, pixel.

### Bước 3 — Tạo ảnh hàng loạt (LP-Image-Studio)
1. Deploy `tools/LP-Image-Studio.html` lên 1 origin https (Cloudflare Pages/Netlify/Live Server) — KHÔNG mở file:// (chặn CORS).
2. Dán Gemini API key (aistudio.google.com/apikey), model `gemini-3-pro-image-preview`.
3. Upload 1 file `.html` → tool quét hết ô ảnh + prompt tiếng Anh.
4. Upload 1–5 ảnh sản phẩm thật (nền sạch, rõ nhãn). Dán Brand Visual DNA vào ô "Add to every prompt".
5. Bấm "Tạo toàn bộ ảnh" → review → "Tạo lại" ô nào chưa ưng.
6. "Tải ZIP" → `index.html` (đã thay ô ảnh bằng `<img>` chuẩn SEO: alt, loading=lazy, aspect-ratio) + `assets/*.jpg`.

### Bước 4 — Nối form COD → Google Sheet + Pixel
- Tạo Google Sheet → Extensions → Apps Script → dán `assets/appsscript-Code.gs` → Deploy Web App (Anyone) → copy URL.
- Trong mỗi HTML, set `var SHEET_ENDPOINT="<url>";` (có thể sed hàng loạt).
- Pixel đã gắn sẵn (sửa `pixel_id` trong CONFIG). Submit form fire `Lead`.

### Bước 5 — Deploy Cloudflare Pages
Giải nén ZIP → `wrangler pages deploy . --project-name=<ten-project>` → URL `*.pages.dev`. Verify domain trong Meta Business Manager để pixel/AEM chuẩn. Gán từng URL làm đích nhóm quảng cáo (A/B đa angle).

## Section library (đa định dạng — xem references/section-library.md)
Hero · Press strip · Pain cards · Full-bleed quote · Solution · Mechanism + pH/feature bar · Scent/variant tabs · Benefits grid · How-to 3-step timeline · Before/After · Stat counters · Case study sâu · Testimonial carousel · Video · UGC grid · Comparison table · Founder note · Value+Gift · Countdown · COD form · Guarantee · FAQ accordion · Final CTA.

## Tiêu chí "đạt" trước khi giao
- [ ] Copy VN đủ dấu, không lỗi font.
- [ ] Mọi `data-p` là prompt tiếng Anh chi tiết + có Brand DNA + "use product reference".
- [ ] ≥20 section, ≥6 CTA, sticky CTA, countdown, FAQ, guarantee.
- [ ] Form COD ≤5 trường, fire Lead, POST tới SHEET_ENDPOINT.
- [ ] Pixel PageView + ViewContent + Lead.
- [ ] Mobile-first, animation reveal/counter mượt.
- [ ] LP-Image-Studio quét đúng số ô ảnh.

## Files
- `scripts/build_lp.py` — generator config-driven (sample: ONIIZ combo, 10 angle, VN có dấu, prompt EN).
- `tools/LP-Image-Studio.html` — tool tạo ảnh hàng loạt + ZIP.
- `references/image-prompt-formula-EN.md` — công thức prompt tiếng Anh + template Brand Visual DNA.
- `references/section-library.md` — thư viện section + khi nào dùng.
- `references/deploy-and-tracking.md` — Cloudflare deploy + Google Sheet + Pixel.
- `assets/appsscript-Code.gs` — Web App nhận đơn COD về Sheet.

---

## CẬP NHẬT v3 (bundle mới)

Skill nay kèm thêm:
- **tools/LP-Factory-Studio.html (v3)** — tool all-in-one: nhập ý tưởng/script → AI viết copy đa ngôn ngữ theo brand guideline (upload PDF/DOCX/TXT/MD) + mục tiêu chiến dịch + tệp khách hàng → tạo ảnh hàng loạt (model ảnh chọn được, mặc định Nano Banana Flash; text mặc định gemini-2.5-pro, có nút liệt kê model) → editor sửa copy/ảnh từng section + carousel video KOC → preview → tải DEPLOY KIT (site/ + deploy.bat/.sh).
- **lp-ops/** — LP Ops Agent toolkit: tracking snippet (fbc/fbp/ttclid/ttp/ip/ua/event_id + UTM + lp_id), Apps Script unified Sheet (dedup event_id), n8n dual-CAPI (Meta + TikTok) workflow, policy-generator Nghị định 13, deploy CF + Vercel, UTM Link Builder, Winner Dashboard.
- **LP-Deploy-Agent-Prompt.md** — system prompt cho con agent nhận link ZIP → audit → deploy Cloudflare/Vercel → hướng dẫn custom domain.

### INVARIANTS bổ sung (áp dụng khi build LP):
- Copy tiếng Việt CÓ DẤU; mọi prompt ảnh tiếng ANH; KHÔNG hiện hộp Brand DNA trên trang; hero/agitate/before là ảnh kể chuyện cảm xúc KHÔNG sản phẩm.
- Tracking chuẩn: pixel chỉ ở frontend, token CAPI ở backend (n8n/webhook); pixel + CAPI chung event_id để dedup.
- Mỗi LP gắn lp_id + UTM capture → đổ về 1 Google Sheet trung tâm để tìm winner.
- Mỗi LP kèm 3 trang chính sách Nghị định 13 (dùng lp-ops/4-policy-generator.py).

### ROADMAP chưa làm (Phase 2/3):
- Phase 2: nhúng thẳng CAPI snippet + lp_id + auto-policy vào generator build_lp.py / renderer LP Factory Studio.
- Phase 3: thư viện multi-template (Shopee/TikTok Shop/Coolmate/long-form), bộ SVG icon inline, Design System Extractor.

---

## CẬP NHẬT v4 (production-hardened — đúc rút từ deploy thực chiến 25 LP)

Xem chi tiết + code snippet trong `references/production-playbook.md`. Tóm tắt invariants BẮT BUỘC mới:

1. **Lead capture không được rỗng.** Endpoint đưa về `site/lead-config.js` dùng chung (`window.__LEAD_ENDPOINT__`); LP đọc `var SHEET_ENDPOINT=(window.__LEAD_ENDPOINT__||"")`. Kiểm tra `SHEET_ENDPOINT=""` trước khi deploy = lỗi mất đơn #1.
2. **Apps Script Sheet phải do CHÍNH account chạy Web App sở hữu** (dùng `SpreadsheetApp.create()` trong `setup()`), nếu không sẽ lỗi "You do not have permission" và rớt đơn. Web app: Execute as Me + Anyone; đổi code thì Deploy → New version (URL /exec giữ nguyên).
3. **Tracking đầy đủ:** PageView + ViewContent + **Lead + Purchase** (mỗi event 1 event_id dedup) + ttq + gtag, **kèm value = đơn giá × số lượng**, value cũng ghi vào Sheet. Helper `__ORDERVAL`/`__fireConv` (xem playbook §3).
4. **Không để placeholder rỗng** ở khối Câu chuyện thương hiệu / Nhà sáng lập / Cam kết — fill từ Brand Guideline; founder name cấu hình được. Footer pháp lý đầy đủ (tên cty, địa chỉ, hotline, email, MST/GPKD) cho Nghị định 13 + Meta duyệt.
5. **KOC video section** (carousel TikTok embed 9/16) + **UGC grid** là chuẩn.
6. **Animation an toàn:** section reveal fade-up qua IntersectionObserver với `body.lpx` + fallback chống ẩn trắng trang + `prefers-reduced-motion`; icon động (`lpfloat`) + pulse CTA/shield (playbook §6).
7. **Deploy nhiều bộ LP** gộp 1 project, phân nhóm theo PATH (`/insight-1/<slug>/`), 1 subdomain. Luôn dùng URL production `*.pages.dev` (URL preview có hash bị lỗi SSL). LP nằm sâu → dùng link tuyệt đối `/privacy.html`.

### Tiêu chí "đạt" bổ sung v4
- [ ] lead-config.js có endpoint thật; Sheet đúng owner; test 1 đơn đổ về Sheet.
- [ ] Pixel bắn Lead + Purchase + value + eventID (Meta) + ttq + gtag.
- [ ] 0 placeholder `>""</p>`; đủ 3 khối brand + footer pháp lý.
- [ ] Có KOC video + UGC + animation reveal + icon động (kèm fallback).

## CẬP NHẬT v5 (tool render Storytelling Image-Led)
`tools/LP-Factory-Studio.html` nâng cấp render LP sang **kể chuyện ảnh-dẫn full-bleed, mobile-first**: header sticky + marquee, các màn hero/agitate/solution/before-after/story là ảnh full-bleed có text overlay (scrim), scent-strip 3 ảnh, reveal-on-scroll, footer công ty. Tracking: PageView + ViewContent + **Lead + Purchase + value** (event_id dedup) sẵn CAPI. Pipeline gen ảnh (key chạy local trong trình duyệt) + editor + DEPLOY KIT giữ nguyên.

## CẬP NHẬT v6 (Input Pack ingest — nhiều insight → nhiều LP cùng lúc)
`tools/LP-Factory-Studio.html` thêm **dropzone Upload INPUT PACK (.html)** — nhận file chiến lược từ agent insight (schema: 1 khối DÙNG CHUNG brand/giá/pixel/goal/Brand-DNA + N khối LP, mỗi LP có *insight/script win + thông điệp + chân dung khách*). Parser tự fill toàn bộ config dùng chung + nạp N insight → bước "AI thiết kế" sinh **đúng 1 LP/insight, giữ nguyên hook/insight/message/audience**, rồi gen ảnh + DEPLOY KIT như cũ → phát triển nhiều LP cho nhiều insight trong 1 lần. Cũng hỗ trợ upload brand guideline PDF/DOCX/TXT/MD.

## CẬP NHẬT v7 (Phase 2 — tracking chuẩn CAPI + auto-policy nhúng thẳng renderer) ✅
`LP-Factory-Studio.html` (bản root repo) nhúng thẳng Phase 2 roadmap vào renderer — mỗi LP tải về đã **sẵn sàng chạy ads, không cần dán tay**:
- **lp_id ổn định** (slug) gắn vào mọi LP + payload → gom winner theo lp_id ở data hub.
- **TikTok Pixel** (ô config mới, tuỳ chọn) chạy song song Meta Pixel; submit bắn `SubmitForm` + `CompletePayment` (TikTok) và `Lead` + `Purchase` (Meta) **chung event_id để dedup** với CAPI.
- **Capture đầy đủ** khớp schema data hub (`lp-ops/2-appsscript-Unified.gs`): utm_source/medium/campaign/content/term, fbclid/ttclid, fbp/fbc/ttp, ip (Cloudflare trace → ipify fallback), referrer, ua, url. Payload POST JSON tới webhook (n8n full-CAPI) hoặc Apps Script (/exec Sheet-only).
- **Auto 3 trang chính sách Nghị định 13** (`chinh-sach-bao-mat/dieu-khoan-su-dung/chinh-sach-thanh-toan.html`) sinh kèm mỗi LP trong DEPLOY KIT + **link ở footer**; danh sách bên-thứ-ba tự thêm Meta/TikTok theo pixel đã bật.
- **Field thông tin doanh nghiệp** (tên pháp lý, email, hotline, địa chỉ, MST) cho footer hợp lệ + chính sách; Input Pack tự nạp các field này.
- Mã tiền tệ ISO suy ra tự động cho Pixel (đ→VND, $→USD, ฿→THB...). Fix bug cookie-reader cũ (regex `\s` bị nuốt qua 2 lớp template) → đọc đúng fbp/fbc. Đã verify bằng test render headless (22 check) + test hành vi cookie-reader.

## CẬP NHẬT v8 (Phase 3 — multi-skin + SVG icon inline + Design System Extractor) ✅
`LP-Factory-Studio.html` thêm 3 năng lực để **nhân variant nhanh + đồng bộ thương hiệu** (đúng triết lý CRO "nhiều hook thắng"):
- **Multi-skin selector** (ô config 🎨): 4 phong cách đều nền tối an toàn — `default` (storytelling, accent theo AI), `shopee` (cam), `tiktok` (cyan/magenta), `royal` (xanh tím premium). Đổi 1 click → ra bộ LP khác tông để A/B. LPCSS đã tokenize (`--bg/--s1/--s2/--line/--acc/--acc2`), `skinTokens()` cấp palette; chỉ đổi accent + tông nền (giữ chữ sáng → không vỡ layout).
- **Bộ SVG icon inline (no CDN)**: `ICONS`+`svgi()` thay emoji ở badge tin cậy (truck/cash/return/lock) + khiên bảo hành → sắc nét, đồng nhất mọi thiết bị, không phụ thuộc font emoji.
- **Design System Extractor**: nút "Trích bảng màu thương hiệu" → canvas quantize ảnh brand/sản phẩm đã upload → 6 màu chủ đạo + 2 accent, hiện swatch và **tự nối vào ô Brand Visual DNA** để AI gen ảnh bám đúng màu brand.
- Verify: test render headless toàn bộ skin (no `__TOKEN__` leak, accent/bg đúng từng skin) + smoke test gộp Phase 2+3 (tất cả xanh).

Roadmap Phase 2 & Phase 3 trong tool **đã hoàn tất**. (Generator `scripts/build_lp.py` vẫn ở bản cũ — có thể port các invariant này sang sau nếu cần batch ngoài tool.)

## CẬP NHẬT v9 (5 nâng cấp theo yêu cầu vận hành thực tế) ✅
`LP-Factory-Studio.html`:
1. **Cào video TikTok bằng APIFY**: ô nhập APIFY token + nút "Cào video TikTok theo insight" → mỗi LP tự sinh keyword từ insight/sản phẩm (`lpKeyword()`) → gọi actor `clockworks~tiktok-scraper` (run-sync-get-dataset-items) → chèn 5–10 link TikTok vào KOC carousel của đúng LP đó. (Chạy local trong trình duyệt bằng token người dùng; tốn credit APIFY; có thể vướng CORS tuỳ tài khoản → có báo lỗi rõ.)
2. **Style ảnh thật hơn**: viết lại `P()` + Brand DNA mặc định sang "authentic real-life / smartphone candid / documentary-UGC realism", bỏ vibe studio bóng bẩy giả; thêm negative chống gloss/retouch/model.
3. **UGC = upload (bỏ AI)**: bỏ slot AI ugc1-6; thêm dropzone upload tối đa 10 ảnh (`UGC[]`) → hiển thị **carousel scroll-snap mượt**, lưu vào DEPLOY KIT (`assets/ugc-N.jpg`, cờ `ASSETMODE` chọn data-url khi preview / path khi zip).
4. **Video sản phẩm = YouTube**: bỏ slot ảnh AI 16/9; thêm ô link YouTube → `ytEmbed()` nhúng iframe 16/9 (hỗ trợ cả TikTok) vào section đánh giá.
5. **Header nav + bỏ CTA trùng**: header giờ là logo + nav cuộn ngang (Lợi ích/Đánh giá/Ưu đãi/FAQ/Đặt hàng) trỏ tới section có `id` (scroll-margin chống che bởi header sticky); bỏ nút CTA ở header (đã lặp ở dưới). Kèm tinh chỉnh responsive mobile (carousel touch, nav cuộn, no-scrollbar).
- Giảm ảnh AI 15→8 slot (nhanh/rẻ hơn). Verify: `node --check` + render test 5 tính năng + regression Phase 2/3 (tất cả xanh).

## CẬP NHẬT v10 (fix APIFY + thiết kế lại tỉ lệ ảnh) ✅
**A. Sửa nút APIFY (debug có hệ thống — bằng chứng curl):** đã xác minh APIFY API **không chặn CORS** (`Access-Control-Allow-Origin:*`, GET/POST, allow Content-Type/Authorization trên cả 3 endpoint runs/actor-runs/datasets). Root cause thật: (1) dùng `run-sync` → treo, không feedback; (2) input thiếu `searchSection:"/video"` (lấy từ input schema thật của actor) → cào không ra video phù hợp; (3) actor `clockworks/tiktok-scraper` trả phí ($45/th, có trial) — lỗi credit bị run-sync nuốt. **Fix:** viết lại sang **async** (`scrapeOne`: POST `/runs` → poll `/actor-runs/{id}` mỗi 3s, hiện status+giây+statusMessage → GET `/datasets/{id}/items`), input đúng (`searchQueries`+`searchSection:/video`+`videoSearchSorting:MOST_RELEVANT`+`resultsPerPage`), dedup link, tổng kết trung thực (ok/fail + lỗi gần nhất), và khi 0 LP thì hướng dẫn kiểm tra token/credit/trial. Unit test mock (start→poll→items + case FAILED hiện statusMessage) xanh.
**B. Thiết kế lại tỉ lệ ảnh + giảm chữ trên ảnh:** chuẩn hoá ratio portrait đồng bộ (agitate 16/9→4/5, product 1/1→4/5; before/after giữ 1/1 cho split 2 cột); **bỏ chữ thừa khỏi ảnh** — `slead` của section product chuyển từ overlay-trên-ảnh xuống text band sạch bên dưới; thêm slot ảnh mới **`closing`** (real-life "after/result" cảm xúc, không sản phẩm) cho màn kết thay vì lặp lại ảnh hero. Ảnh AI 8→9 slot. Verify render test + regression toàn bộ (xanh).

## CẬP NHẬT v11 (Section USP + Câu chuyện mùi hương tương tác) ✅
Thêm **section USP mạnh nhất** + **scent-story tương tác** cho `LP-Factory-Studio.html`:
- AI JSON sinh thêm (dùng chung 1 sản phẩm): `usp:{title,lead,badge}` (khác biệt #1) + `scents:[3×{name,top,heart,base,origin,payoff}]` (tháp hương + nguồn gốc + payoff cảm xúc, theo ngôn ngữ LP; suy từ product/brand guideline). Thêm slot ảnh `usp` (ảnh dramatize USP). Ảnh AI 9→10.
- **Section USP** mới (badge + title + lead + ảnh signature, responsive 1 cột→2 cột).
- **Scent strip giờ bấm được**: mỗi hương mở **modal câu chuyện mùi hương** mượt — ảnh lớn + tên + **tháp hương Hương đầu/giữa/cuối** + nguồn gốc + payoff in nghiêng; điều hướng ‹ ›/dots/phím/Esc/click-nền; transition fade-slide. Dữ liệu `SCENTS` nhúng vào LP (img = data-url khi preview, path khi zip); hàm openScent/closeScent/navScent trong runtime LP. Graceful: không có dữ liệu hương → ẩn section USP + scent strip không bấm.
- Verify: render test 12 case (có/không dữ liệu hương) + regression toàn bộ (xanh).

## CẬP NHẬT v12 (4 tinh chỉnh trải nghiệm) ✅
1. **APIFY cào theo HASHTAG thương hiệu/sản phẩm**: thêm ô "Hashtag cào TikTok" (mặc định = slug thương hiệu); đổi từ search-query sang **`hashtags`** của actor. Cào **1 run duy nhất** rồi **chia đều (staggered slice ~5-8 video/LP)** cho mọi LP → nhanh & rẻ hơn nhiều so với chạy mỗi LP 1 run. `ttHashtags()` + `scrapeHashtag()`.
2. **Ảnh UGC bấm xem full**: mỗi ảnh UGC `onclick=openImg()` → mở **lightbox** ảnh lớn.
3. **Video review bấm xem dễ**: KOC carousel đổi từ iframe nhúng nhỏ → **card có thumbnail + nút ▶** (YouTube lấy thumbnail thật); bấm mở **lightbox player lớn** (YT 16/9, TikTok 9/16). Lightbox dùng chung cho ảnh + video; đóng bằng nút/Esc/click nền, dừng video khi đóng.
4. **Logo header gọn**: chỉ hiển thị phần thương hiệu chính (cắt trước dấu " - " / "|" / "•"…), font nhỏ + ellipsis + max-width 42%, nav co giãn (flex) → không chiếm quá nhiều chỗ.
- Verify: node --check + test 10 case (card video, hashtag distribute, lightbox, logo) + regression toàn bộ (xanh).

## CẬP NHẬT v13 (tái thiết kế layout: full-bleed storytelling + mobile-only) ✅
Theo yêu cầu "toàn bộ hình ảnh là background, kể chuyện liền mạch, chỉ hiển thị mobile trên cả điện thoại lẫn desktop":
- **Khung mobile-only**: bọc toàn bộ nội dung trong cột `.lpapp` (max-width 480px, căn giữa, nền `#06070a` bao quanh, box-shadow như khung điện thoại); sticky CTA constrain trong cột (left:50%+translateX) và **bỏ ẩn-trên-desktop** → desktop xem y như mobile. Không đặt overflow:hidden để giữ sticky header.
- **Mọi ảnh thành full-bleed scene** (object-fit cover + scrim + text overlay), tỉ lệ portrait 4/5 đồng bộ: USP-band → full-bleed scene; **3 hương → 3 scene full-bleed bấm mở câu chuyện** (`.scent-scene` + `.scent-cta`, thay strip thumbnail); **Before/After → 2 scene full-bleed xếp dọc** (thay split 2 thumbnail). ~11 scene full-bleed nối tiếp liền mạch.
- Sửa tái dùng ảnh để không lặp 3 lần: story dùng `closing`, màn kết dùng lại `hero` (bookend), `after` chỉ ở Before/After.
- Giữ nguyên: tracking/CAPI, form COD, policy ND13, modal câu chuyện hương, lightbox UGC/video, APIFY hashtag, các band chức năng (pains/benefits/stats/offer/form/faq — không có ảnh nên giữ dạng text band trong cột).
- Verify: node --check + render structure test (cột lpapp, USP full-bleed, 3 scent scene tappable, before/after scene, hero bookend, sticky, modal/lightbox intact, tracking) + regression (xanh).

## CẬP NHẬT v14 (fix tỉ lệ ảnh + ép nhân vật đúng thị trường) ✅
- **Tỉ lệ ảnh chuẩn (bất kể model)**: `toJpeg(url,ratio)` giờ **center-crop cover về đúng tỉ lệ đích** trên canvas (helper `rnum`); `genImage` truyền slot ratio vào → mọi file ảnh lưu/đưa vào DEPLOY KIT luôn đúng khung (vì nhiều model ảnh bỏ qua/400 `imageConfig.aspectRatio` rồi fallback ra ảnh vuông). SLOTDEFS before/after sửa 1/1→4/5 để đồng bộ với scene full-bleed. UGC upload gọi `toJpeg` không ratio → giữ nguyên (không crop).
- **Nhân vật đúng ngôn ngữ/thị trường**: `marketPeople()` map `CFG.lang` → quốc tịch (Vietnamese/Thai/Indonesian/Filipino/Malaysian/Chinese; English/US = không ép). `PEOPLE()` chèn "LOCAL CASTING: every person MUST be authentic local <X>…" vào **mọi prompt ảnh** + thêm negative "no people of a different ethnicity than <X>"; `audience_visual` của AI cũng được nhắc đặt đúng sắc tộc thị trường.
- Verify: node --check + test rnum/marketPeople/PEOPLE/P()/slot-ratio + test toán crop `toJpeg` (vuông→4/5 crop cạnh, dọc→4/5 crop trên-dưới, không ratio→không crop) — xanh.

## CẬP NHẬT v15 (fix section trùng + bake sẵn data ONIIZ) ✅
1. **Fix lỗi section lặp**: nhiều section (Vì sao chọn / Đánh giá / Ưu đãi / Đặt hàng) render eyebrow và h2 BẰNG NHAU (cùng 1 giá trị L()/a.proof) → chữ hiện 2 lần. Thêm helper `hdr(eb,head)` chỉ render eyebrow khi khác h2 (so sánh không phân biệt hoa/thường + khoảng trắng); thay 4 cặp header trùng bằng `hdr()`. Reviews giờ: kicker "Khách nói gì" + h2 = a.proof (1 lần).
2. **Bake sẵn toàn bộ data mẫu ONIIZ** vào form (value/nội dung): brand "ONIIZ — The Masculine Lab", product Combo 3 mùi Peachy/Juicy/Milky, giá 597→429 (-28%), pixel, công ty "Công ty TNHH Deman", email contact@oniiz.com, hotline 092 39 39 338, địa chỉ Vạn Phúc Hà Đông, MST 0109087760, YouTube video sản phẩm, hashtag "oniiz, masculinefoam", thông điệp "Tự tin từ bên trong - sạch thơm cả ngày", tệp khách hàng + insight/script mẫu (HOOK/DEMO/USP/TRẤN AN/CTA). Mở tool là sẵn sàng demo ONIIZ.
- Verify: node --check + test hdr (dup→h2 only, distinct→both, case/space-insensitive) + render (proof 1 lần, features không lặp) + grep defaults + regression (xanh).

## CẬP NHẬT v16 (upload chi tiết sản phẩm + form đặt hàng upsell combo) ✅
1. **Upload file chi tiết sản phẩm**: refactor parsing thành `extractFileText()` + `parseInto()` dùng chung (PDF qua pdf.js, DOCX qua mammoth, TXT/MD trực tiếp); thêm textarea `#pdetail` + dropzone `#dropDetail` (PDF/DOCX/TXT/MD) → `parseDetail()`. CFG.pdetail được nhúng vào prompt AI ("PRODUCT DETAILS — base copy/benefits/FAQ/USP/scent notes on these real features/ingredients") để AI viết sát thực.
2. **Form đặt hàng "không thể cưỡng lại" + upsell**: thêm **offer-stack** (✓ -28%+freeship, ✓ COD kiểm hàng, ✓ đổi trả 7 ngày, 🎁 mua combo tặng quà); **3 combo radio-card** (1/2/3 chai) tính giá tự động từ đơn giá (2 chai ×0.93, 3 chai ×0.85, làm tròn nghìn), hiện giá gốc gạch + giá combo + tiết kiệm + 🎁 quà + badge "PHỔ BIẾN/TIẾT KIỆM NHẤT", mặc định chọn 2-chai; **tổng tiền động** (qty+bval cập nhật khi đổi combo) + CTA pulse + dòng urgency. Tracking Lead/Purchase + payload value giờ dùng **giá combo thực** (`f.bval`) thay vì đơn giá×qty. Copy qua L() (fallback VN, localize được).
- Verify: node --check + render test (offerbox, 3 card, giá 798k/1.094k, gạch 858k/1.287k, hidden qty/bval, ordtot/bigcta/urg, runtime bundle handler, submit dùng bval) + regression (xanh).

## CẬP NHẬT v17 (avatar + nhiều review + section sản phẩm chuyên sâu) ✅
1. **Review dày + avatar**: AI sinh **8 review đa dạng** (thay 3); mỗi review có **avatar chữ-cái màu** (`avatarColor()` hash tên → gradient HSL, `avInitial()` lấy chữ đầu) — không tốn gen ảnh.
2. **Tự tạo section thông tin sản phẩm chuyên sâu** khi có upload dữ liệu: AI sinh `details[]` (3-5 mục {title, body} về thành phần/cơ chế/tính năng/chứng nhận, **bám strictly vào PRODUCT DETAILS đã upload**; rỗng nếu không có). Render = **1 scene full-bleed `ingredients`** (ảnh cận cảnh thành phần/kết cấu) + band các **thẻ `.detcard`**. Slot ảnh `ingredients` chỉ được tạo khi có details (buildSlots động) → không tốn gen cho sản phẩm không upload data. Làm dày nội dung + tăng uy tín.
- Verify: node --check + test (avInitial/avatarColor, 6 review → 6 avatar, detail section + ingredients scene khi có data, không có data → không slot/không section, avatar vẫn chạy) + regression (xanh).
