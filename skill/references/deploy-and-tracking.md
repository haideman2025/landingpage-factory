# Deploy Cloudflare + Tracking (Sheet + Pixel)

## A. Google Sheet nhận đơn COD
1. Tạo Google Sheet → Extensions → Apps Script → dán `assets/appsscript-Code.gs` → Save.
2. Deploy → New deployment → Web app → Execute as: Me · Who has access: **Anyone** → Deploy → Authorize.
3. Copy Web app URL (`https://script.google.com/macros/s/.../exec`).
4. Set vào mỗi LP: `var SHEET_ENDPOINT="<url>";`. Gắn hàng loạt:
```
# Linux/Mac, trong thư mục out/
sed -i 's#var SHEET_ENDPOINT="";#var SHEET_ENDPOINT="<URL>";#' *.html
```
(Windows PowerShell: `(Get-Content f.html) -replace 'SHEET_ENDPOINT="";','SHEET_ENDPOINT="<URL>";' | Set-Content f.html`)

## B. Meta Pixel
- Sửa `CONFIG['pixel_id']` trong build_lp.py trước khi generate.
- Đã gắn: PageView (load), ViewContent (cuộn 50%), Lead (submit form).
- Verify domain `*.pages.dev` (hoặc domain riêng) trong Meta Business Manager → cấu hình 8 event ưu tiên, đặt Lead/Purchase lên đầu.

## C. Tạo ảnh hàng loạt
- Deploy `tools/LP-Image-Studio.html` lên https (xem mục D) → mở qua link.
- API key Gemini (aistudio.google.com/apikey), model `gemini-3-pro-image-preview`.
- Upload từng LP `.html` → quét prompt → upload ảnh sản phẩm + dán Brand DNA → tạo → tải ZIP (HTML + assets).

## D. Deploy Cloudflare Pages
```
npm i -g wrangler
wrangler login
# giải nén ZIP của từng LP (hoặc gộp nhiều LP vào 1 thư mục: out/<slug>.html + assets dùng chung)
wrangler pages deploy . --project-name=<ten-project>
```
- Ra URL `https://<project>.pages.dev`. Từng LP: `/<slug>.html` hoặc deploy mỗi LP 1 project.
- Gắn domain riêng: Pages → Custom domains.

## E. Quy trình sản xuất hàng loạt (tóm tắt)
CONFIG (ngành/sản phẩm) → `python3 build_lp.py` → ra N HTML (VN có dấu, prompt EN) → LP-Image-Studio tạo ảnh từng LP → ZIP → gắn SHEET_ENDPOINT → `wrangler pages deploy` → verify pixel → chạy ads A/B theo URL.
