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
