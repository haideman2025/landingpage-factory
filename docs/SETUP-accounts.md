# Kích hoạt tài khoản + lưu trữ (Supabase) — việc bạn cần tự bấm

Code đã sẵn sàng và deploy. Tính năng tài khoản **đang ngủ (fail-open)**: khi chưa cấu hình Supabase,
app chạy y như cũ (không có cổng đăng nhập). Làm xong 7 bước dưới đây là tài khoản + auto-save bật lên.

## 1. Tạo Supabase project
- Vào https://supabase.com → New project (region gần VN, vd Singapore).
- Ghi lại: **Project URL**, **anon public key**, **service_role key** (Settings → API).

## 2. Tạo bảng + RLS + trigger
- Supabase → SQL Editor → dán **mục 1–5** trong `db/schema.sql` → Run.
- Kiểm tra Table Editor có `profiles`, `projects`, `project_images`, `templates` (đều bật RLS — biểu tượng khiên).

## 3. Tạo bucket Storage + policy
- Storage → New bucket → tên `lp-assets`, để **Private** (bỏ tick public).
- Quay lại SQL Editor → dán **mục 6** trong `db/schema.sql` (các policy `storage.objects`) → Run.

## 4. Bật đăng nhập
- Authentication → Providers → **Email**: bật (magic link mặc định chạy).
- **Google**: bật, dán Google OAuth Client ID/Secret. Trong Google Cloud Console, thêm
  `https://<project-ref>.supabase.co/auth/v1/callback` vào Authorized redirect URIs.
- Authentication → URL Configuration → **Site URL** = `https://landingpage-factory.vercel.app`;
  thêm URL đó (và `http://localhost:3000` nếu test local) vào **Redirect URLs**.

## 5. Đặt biến môi trường trên Vercel
Vercel → Project → Settings → Environment Variables (Production + Preview + Development):
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon public key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
APP_ENC_KEY=<64 ký tự hex>
```
Tạo `APP_ENC_KEY`: chạy `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 6. Redeploy
Vercel → Deployments → Redeploy (để nạp env mới). Hoặc push 1 commit bất kỳ.

## 7. Kiểm tra
- Mở Studio → hiện **cổng đăng nhập** → đăng nhập Google → cổng biến mất.
- Bảng `profiles` có 1 dòng cho bạn.
- Nhập Gemini key + tick "Ghi nhớ" → đăng nhập máy khác thấy key tự điền (lấy từ `/api/key`, đã mã hoá trong DB).
- Tạo 1 LP + ảnh → ~4s sau header báo "Đã lưu • HH:MM"; `projects`/`project_images` có dữ liệu; Storage `lp-assets/...` có `.jpg`.
- Bấm "🗂️ Lịch sử" → thấy dự án → "Mở" nạp lại đầy đủ; "Tải" (nút có sẵn trong Studio) để tải ZIP; "Xoá" giải phóng dung lượng.

## Ghi chú
- Truy cập dữ liệu là client-direct tới Supabase dưới RLS (cách ly theo user). Chỉ Gemini key đi qua `/api/key` để mã hoá AES-256-GCM.
- Quản lý dung lượng: free tier 1GB, không tự nén/dọn — gần đầy thì tải về rồi xoá (thanh dung lượng cảnh báo ≥85%).
- Thiết kế: `docs/superpowers/specs/2026-06-11-lpf-user-accounts-storage-design.md` · Plan: `docs/superpowers/plans/2026-06-11-lpf-user-accounts-storage.md`
