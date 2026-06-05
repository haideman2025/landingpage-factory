# Bật tính năng Deploy 1-chạm (GitHub + Vercel)

Tính năng này cho người dùng OAuth-connect tài khoản GitHub + Vercel **của họ** và
deploy landing page lên domain của họ. Bạn (chủ tool) cần đăng ký 2 OAuth app một lần.

## 1) GitHub OAuth App
1. Vào https://github.com/settings/developers → **New OAuth App**
2. Homepage URL: `https://YOURTOOL.vercel.app`
3. Authorization callback URL: `https://YOURTOOL.vercel.app/api/auth/github/callback`
4. Tạo xong → copy **Client ID**, bấm **Generate a new client secret** → copy secret
5. Scope mặc định khi user authorize: `repo`

## 2) Vercel Integration
1. Vào https://vercel.com/dashboard → **Integrations → Create**
2. Redirect URL: `https://YOURTOOL.vercel.app/api/auth/vercel/callback`
3. Scopes: project (create/read), deployment (create), domain (add)
4. Copy **Client ID** + **Client Secret**

## 3) Vercel Environment Variables (Project → Settings → Environment Variables)
```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
VERCEL_CLIENT_ID=...
VERCEL_CLIENT_SECRET=...
OAUTH_REDIRECT_BASE=https://YOURTOOL.vercel.app
```
Redeploy sau khi thêm env var.

## Luồng người dùng cuối
Mở tool đã host → tạo LP → bấm **🚀 Connect & Deploy** → đăng nhập GitHub + Vercel
(popup) → nhập domain → làm theo bản ghi DNS hiện ra → site live trên domain của họ,
source nằm trong repo GitHub của họ.

## Bảo mật
- Secret **chỉ** sống ở Vercel env var — không bao giờ commit, không bao giờ gửi ra browser.
- Nếu một secret từng bị lộ (paste nhầm chỗ công khai), bấm **Generate a new client secret** để xoay.
- Token người dùng giữ trong `sessionStorage`/RAM của trình duyệt họ, xoá khi đóng tab.
