# Thiết kế: Tài khoản người dùng + Lưu trữ tự động cho LP-Factory-Studio

- Ngày: 2026-06-11
- Repo: `haideman2025/landingpage-factory` (deploy Vercel: `landingpage-factory.vercel.app`)
- Trạng thái: Đã duyệt thiết kế, chờ viết plan triển khai.

## 1. Mục tiêu

Cho phép người dùng đăng nhập bằng tài khoản và **tự động lưu toàn bộ dữ liệu tạo sinh** của
LP-Factory-Studio lên tài khoản đó, để:

- Không mất tài nguyên tạo sinh khi refresh / đổi máy / xoá cache.
- Xem lại lịch sử các project đã tạo.
- Mở lại để chỉnh sửa.
- Tải về (ZIP) bất cứ lúc nào.

## 2. Quyết định nền tảng (đã chốt)

| Quyết định | Lựa chọn |
|---|---|
| Phạm vi | Multi-tenant ngay từ đầu (cách ly dữ liệu theo user bằng RLS); chỉ mình dùng giai đoạn đầu, mở đăng ký công khai sau. |
| Backend | **Supabase** — Auth + Postgres + Storage trong một dịch vụ. |
| Đăng nhập | **Google OAuth + Email magic-link** (Supabase Auth). |
| Gemini API key | **BYOK theo tài khoản** — mỗi user lưu key riêng (mã hoá), theo user qua mọi thiết bị. |
| Phạm vi auto-save | **Toàn bộ** — config + copy + tất cả ảnh AI (ảnh lưu lên Storage). |

## 3. Hiện trạng (cơ sở để thiết kế)

- Tool chạy **hoàn toàn client-side** trong `LP-Factory-Studio.html` (~874 dòng): gọi thẳng Gemini API
  (bằng key người dùng) để sinh config landing page (JSON), ảnh AI, và bundle HTML/ZIP tải về (JSZip).
- Backend hiện tại chỉ là vài serverless function Vercel trong `/api` (`lead.js`, `payment.js`,
  `auth/google*`). Đã có **khung Google OAuth sẵn** với scope `openid email profile drive.file`.
- **State runtime** (chính là "tài nguyên tạo sinh" cần lưu):
  - `CFG` — config chung: brand, product, price, lang, dna, bundles, scents, details, compare,
    heroStats, stats, trustBadges… + API key.
  - `ANGLES` / `UI` — copy đã sinh.
  - `LPS[]` — mỗi landing page: `lp.a` (angle/copy + `ads[]`), `lp.slots` (định nghĩa ảnh:
    scene/ratio/prompt/name), `lp.b64` (`{slotKey: base64 JPEG}` — ảnh LP), `lp.adB64`
    (`{ad0..ad4: base64 JPEG}` — ảnh quảng cáo).
  - `UGC[]` — ảnh UGC upload (b64/url).
- **Hiện chỉ persist localStorage**: `lpf_key` (API key) + `lpf_templates`. Mọi thứ khác mất khi
  refresh. Download ZIP được dựng client-side từ state → **không cần lưu ZIP, chỉ cần lưu state**
  rồi dựng lại khi cần.
- Ước tính dung lượng: ảnh base64 JPEG (quality 0.86), ~20 ảnh/LP, tới ~10 LP/project →
  một project có thể 40–100MB. → Bắt buộc tách ảnh ra object storage, không nhét vào DB row.

## 4. Kiến trúc

Giữ nguyên kiến trúc client-heavy. Thêm **một lớp persistence mỏng** bằng Supabase, sửa code
render/edit hiện có ở mức tối thiểu.

```
Trình duyệt (LP-Factory-Studio)
   │  vẫn gọi Gemini trực tiếp để tạo sinh (như cũ)
   ├─ Supabase Auth  → đăng nhập (Google + email magic-link)
   ├─ Postgres        → config + copy + lịch sử (nhẹ, query nhanh)   [RLS theo user]
   └─ Storage         → ảnh AI (.jpg)                                [bucket riêng tư]
```

## 5. Mô hình dữ liệu (Postgres, RLS `user_id = auth.uid()`)

- **`profiles`**: `id` (= auth user id, PK), `email`, `display_name`, `gemini_key_enc` (mã hoá),
  `settings` jsonb, `created_at`. RLS: chỉ chủ sở hữu đọc/ghi.
- **`projects`**: `id` uuid PK, `user_id`, `title`, `brand`, `product`, `status`,
  `config` jsonb *(CFG không chứa key + ANGLES + UI + slots/ads text — KHÔNG chứa bytes ảnh)*,
  `thumbnail_path` text, `created_at`, `updated_at`.
- **`project_images`**: `id`, `project_id`, `user_id`, `lp_index` int, `slot_key` text,
  `kind` enum(`lp`,`ad`,`ugc`), `storage_path` text, `content_hash` text, `created_at`.
  (Index `content_hash` để bỏ qua upload trùng.)
- **`templates`**: `id`, `user_id`, `name`, `data` jsonb — migrate từ `localStorage.lpf_templates`.

RLS bật trên tất cả bảng; policy SELECT/INSERT/UPDATE/DELETE đều ràng buộc `user_id = auth.uid()`.

## 6. Storage

- Bucket riêng tư **`lp-assets`**.
- Đường dẫn: `{user_id}/{project_id}/{lp_index}/{slot_key}.jpg`
  (ad: `slot_key = ad0..ad4`; ugc: `lp_index = -1`, `slot_key = ugc{n}`).
- **Lưu**: decode b64 → upload JPEG (upsert theo path). Ghi `project_images` + `content_hash`.
- **Mở lại**: lấy signed URL → fetch về b64, gán lại `lp.b64`/`lp.adB64`/`UGC` →
  **logic render/edit/tải ZIP hiện có chạy nguyên không đổi**.

## 7. Auto-save (chống mất tài nguyên)

- Module `projectStore` bọc state global; mọi mutation (sinh config xong, sinh ảnh xong, sửa editor)
  đánh dấu project "dirty" + thời điểm.
- Lưu **debounce ~3–5s khi rảnh** + lưu khi `visibilitychange`/`beforeunload`:
  1. Upsert `projects.config` (JSON nhẹ) — nhanh.
  2. Diff ảnh theo `content_hash`: chỉ upload ảnh **mới/đổi**, không up lại toàn bộ mỗi lần.
- Header hiển thị trạng thái: `Đang lưu…` / `Đã lưu • HH:MM` / `Lỗi lưu — thử lại`.
- Tạo bản ghi `projects` ngay khi bắt đầu một phiên tạo mới (để có id ổn định cho path Storage).

## 8. Đăng nhập & API key

- Dùng **Supabase JS client** trong trình duyệt. Provider Google + email magic-link.
- **Cổng đăng nhập** trước khi vào Studio: nếu chưa đăng nhập → màn hình login; sau khi đăng nhập →
  "Tiếp tục dự án gần đây" hoặc "Tạo mới".
- Custom `/api/auth/google*` hiện tại: **giữ lại** để dành cho export Google Drive sau này
  (scope `drive.file`), nhưng **đăng nhập tài khoản dùng Supabase Auth** (đơn giản hơn).
- **BYOK key**: thay vì `localStorage.lpf_key`, lưu vào `profiles.gemini_key_enc` (mã hoá phía
  serverless trước khi ghi; chỉ trả về cho chính chủ khi cần gọi Gemini). Tự nạp khi đăng nhập.

## 9. Màn hình Lịch sử (Dashboard)

- View danh sách project: thẻ (thumbnail = ảnh hero, title, brand, số LP, thời gian sửa) +
  hành động: **Mở** (nạp vào Studio), **Tải ZIP**, **Nhân bản**, **Xoá**.
- "Mở" = nạp `config` + khôi phục ảnh từ Storage → Studio render & sửa & tải bình thường.
- Có thể là panel trong cùng `LP-Factory-Studio.html` hoặc trang `dashboard.html` riêng
  (quyết định lúc viết plan; ưu tiên panel để tái dụng state/JS sẵn có).

## 10. Bảo mật

- Truy cập dữ liệu chủ yếu **client-direct tới Supabase** bằng anon key + **RLS** (cách ly theo user)
  → tối thiểu code serverless.
- Mã hoá Gemini key ở serverless (không để plaintext rời server về client trừ chủ sở hữu).
- Bucket Storage để private, truy cập qua signed URL ngắn hạn.

## 11. Lộ trình triển khai (chia phase)

1. **Nền tảng**: tạo Supabase project, schema + RLS + bucket, bật Auth (Google + email),
   thêm Supabase client + màn hình đăng nhập (cổng vào Studio).
2. **Auto-save**: `projectStore` + debounce save config + upload ảnh lên Storage (diff theo hash) +
   chỉ báo trạng thái lưu. Chuyển BYOK key sang `profiles`.
3. **Dashboard Lịch sử**: list / mở / tải / nhân bản / xoá + migrate `localStorage.lpf_templates`.
4. **(Sau)** Mở đăng ký công khai, billing, managed key/proxy, export Google Drive.

GitHub đã connect sẵn (origin trỏ về repo) → commit code mới trực tiếp; deploy qua Vercel hiện có.

## 12. Ngoài phạm vi (YAGNI giai đoạn này)

- Billing / gói cước.
- Managed Gemini key + proxy hạn mức (để giai đoạn SaaS).
- Cộng tác nhiều người trên cùng project / phân quyền team.
- Export Google Drive (đã có scope, làm sau).
- Versioning/lịch sử chỉnh sửa từng project (chỉ giữ bản mới nhất ở giai đoạn này).
