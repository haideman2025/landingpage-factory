# Bật tính năng Deploy 1-chạm (Vercel)

Tính năng này cho người dùng OAuth-connect tài khoản Vercel **của họ** và deploy
landing page lên link chạy ads ngay (`*.vercel.app`), tên miền riêng là tùy chọn.
Mặc định flow là **Vercel-only** (ít thao tác nhất). GitHub là tùy chọn (xem cuối file).

## Bắt buộc: 1) Vercel Integration
1. Vào https://vercel.com/dashboard → **Integrations → Create** (Developer settings)
2. Redirect URL: `https://landingpage-factory.vercel.app/api/auth/vercel/callback`
3. Scopes: project (create/read), deployment (create), domain (add)
4. Copy **Client ID** + **Client Secret**

## Bắt buộc: 2) Vercel Environment Variables
Project → Settings → Environment Variables → thêm rồi **Redeploy**:
```
VERCEL_CLIENT_ID=<từ Integration ở trên>
VERCEL_CLIENT_SECRET=<từ Integration ở trên>
OAUTH_REDIRECT_BASE=https://landingpage-factory.vercel.app
```
> Đổi `landingpage-factory.vercel.app` thành domain thật của tool nếu khác.

Sau khi Redeploy: user bấm **🚀 Deploy — lấy link ngay** → đăng nhập Vercel (popup) →
có link `*.vercel.app` chạy ads ngay. Nhập tên miền riêng (tùy chọn) → tool hiện bản
ghi DNS để gắn.

## Tùy chọn: GitHub (lưu source + version control)
Chỉ cần nếu sau này bật `withGitHub` trong wizard. Khi đó thêm:
1. GitHub OAuth App tại https://github.com/settings/developers → New OAuth App
   - Callback URL: `https://landingpage-factory.vercel.app/api/auth/github/callback`
   - Scope: `repo`
2. Env var: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

## Mẹo: gắn tên miền riêng cực nhanh
Nếu user trỏ **nameserver** của domain về Vercel **một lần** (theo hướng dẫn Vercel khi
Add Domain), thì mọi lần sau gắn domain/subdomain là **tức thì, không cần thêm record thủ công**.
Còn nếu giữ DNS ở nhà cung cấp cũ: thêm bản ghi tool hiện ra (A `76.76.21.21` cho root,
hoặc CNAME `cname.vercel-dns.com` cho subdomain) rồi đợi vài phút.

## Bảo mật
- Secret **chỉ** sống ở Vercel env var — không bao giờ commit, không gửi ra browser.
- Token người dùng giữ trong `sessionStorage` trình duyệt họ (xoá khi đóng tab); lần
  deploy sau trong cùng phiên không phải đăng nhập lại.
