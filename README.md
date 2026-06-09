# Landing Page Factory

Bộ công cụ build landing page chuyển đổi cao cho ONIIZ / The Masculine Lab.

## Nội dung
- `LP-Factory-Studio.html` — tool all-in-one (mở bằng Chrome): nhập key Gemini (chạy local trong trình duyệt), upload **Input Pack (.html chiến lược)** → tự fill config + sinh nhiều LP cho nhiều insight, gen ảnh storytelling, tải DEPLOY KIT (Cloudflare).
- `skill/` — skill `high-converting-lp-factory` đầy đủ (SKILL.md, scripts, tools, lp-ops, references, assets) để cài vào Cowork (Settings → Capabilities).

## Tính năng mới
- Render **kể chuyện ảnh-dẫn full-bleed**, mobile-first, header/footer.
- Tracking: PageView + ViewContent + **Lead + Purchase + value** (event_id dedup), sẵn CAPI.
- **Input Pack ingest**: 1 file HTML chiến lược → nhiều landing page cho nhiều insight cùng lúc.

> Ảnh tạo bằng Gemini chạy trong trình duyệt (key người dùng tự nhập, không lưu ở repo).
