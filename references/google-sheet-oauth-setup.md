# Bật "Kết nối Google & tạo Sheet tự động"

Cho phép user đăng nhập Google (quyền `drive.file`) → tool tự tạo Google Sheet trong
Drive của họ + tự nối form COD vào. Lead từ LP public được ghi vào Sheet qua **Service
Account của bạn** (không lưu token user). Bạn cài 1 lần trong Google Cloud Console.

## 1) OAuth Client (đăng nhập Google)
1. https://console.cloud.google.com → tạo/chọn 1 project.
2. **APIs & Services → OAuth consent screen**: External; thêm scope
   `openid`, `email`, `profile`, `.../auth/drive.file` (đều non-sensitive).
3. **Credentials → Create → OAuth client ID → Web application**
   - Authorized redirect URI: `https://landingpage-factory.vercel.app/api/auth/google/callback`
   - → lấy `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`

## 2) Bật API
**APIs & Services → Enable APIs**: bật **Google Sheets API** và **Google Drive API**.

## 3) Service Account (người ghi lead)
1. **IAM & Admin → Service Accounts → Create**.
2. Vào SA vừa tạo → **Keys → Add key → JSON** → tải file.
3. Trong file JSON lấy:
   - `client_email` → `GOOGLE_SA_EMAIL`
   - `private_key`  → `GOOGLE_SA_PRIVATE_KEY` (chuỗi dài có `\n`)

## 4) Env var trên Vercel (Settings → Environment Variables → Redeploy)
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_SA_EMAIL=...@...iam.gserviceaccount.com
GOOGLE_SA_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```
> `GOOGLE_SA_PRIVATE_KEY`: dán nguyên giá trị `private_key` trong JSON (giữ các `\n`).
> Code tự đổi `\n` thành xuống dòng thật khi ký.

## Luồng người dùng
Trong tool → ô "Google Sheet endpoint" → bấm **🔗 Kết nối Google & tạo Sheet tự động** →
đăng nhập Google → tool tạo Sheet + điền sẵn endpoint `…/api/lead?s=<id>` → tạo LP như
thường. Khách điền form COD trên LP → đơn tự đổ vào Sheet.

## Ghi chú
- Scope chỉ `drive.file` (non-sensitive) → thường không vướng vòng xác minh khắt khe của Google.
- Mọi lead ghi qua 1 Service Account: volume COD thường thì thoải mái; nếu sau này cực lớn
  (>60 ghi/phút) có thể chạm giới hạn ghi của Google — khi đó nâng cấp sang token per-user.
- Token Google của user chỉ dùng 1 lần trong trình duyệt để tạo Sheet (sessionStorage), không lưu server.
