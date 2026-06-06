# 🏭 Landing Page Factory

Công cụ all-in-one biến **một ý tưởng / kịch bản video win** thành **hàng loạt landing page chuyển đổi cao** — chạy hoàn toàn trên trình duyệt, không cần backend.

Nhập insight + thông tin sản phẩm → AI viết copy (đa ngôn ngữ, theo brand guideline + mục tiêu chiến dịch + tệp khách hàng) → tạo ảnh hàng loạt bằng **Google AI Studio (Gemini / Nano Banana)** → sửa copy & ảnh từng section + carousel video KOC → preview → tải **DEPLOY KIT** deploy Cloudflare 1-click.

## Tính năng
- **AI thiết kế LP đa ngôn ngữ** (Việt, Anh, Thái, Indo, Filipino, Malay, Trung) — copy bám insight, hook-first.
- **Phân tích chiến dịch**: mục tiêu + thông điệp + tệp khách hàng mục tiêu → ảnh & copy khớp đối tượng.
- **Brand guideline**: nhập text hoặc upload **PDF / DOCX / TXT / MD** (tự trích nội dung).
- **Tạo ảnh hàng loạt** qua Gemini image API, chạy song song + retry, giữ đúng bao bì từ ảnh tham chiếu.
- **Editor**: sửa copy từng section, sửa mô tả & tạo lại ảnh từng ô, dán link **YouTube/TikTok** → carousel video review KOC.
- **Preview** LP hoàn thiện trước khi tải.
- **DEPLOY KIT**: xuất ZIP gồm `site/` + `deploy.bat` / `deploy.sh` (wrangler) → deploy cả bộ LP lên Cloudflare Pages.
- Mỗi LP: form COD → Google Sheet (Apps Script) + Meta Pixel (PageView / Lead).

## Dùng nhanh
1. Mở `index.html` (nên host qua https — GitHub Pages / Cloudflare — để gọi API ổn định).
2. Dán **Gemini API key** ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)). Key chỉ lưu trên máy bạn (localStorage), gửi trực tiếp tới Google.
3. Nhập ý tưởng + sản phẩm + chiến dịch → **AI thiết kế Landing Page**.
4. Upload ảnh sản phẩm → **Tạo ảnh + Build**.
5. Sửa / Preview từng LP → **Tải DEPLOY KIT**.

## Cấu trúc
```
index.html                  # LP Factory Studio (ứng dụng chính)
tools/LP-Image-Studio.html  # tool tạo ảnh cho template HTML có sẵn
scripts/build_lp.py         # generator LP (config-driven, dùng offline)
references/                 # công thức prompt ảnh EN, thư viện section, hướng dẫn deploy
assets/appsscript-Code.gs   # Apps Script nhận đơn COD vào Google Sheet
SKILL.md                    # mô tả skill high-converting-lp-factory
```

## Thu tiền trước (VietQR) + đa giao diện
- **VietQR**: điền ngân hàng + số TK + tên → mỗi LP hiện QR chuyển khoản (số tiền + mã đơn
  riêng từng khách). Xác nhận thanh toán tự động qua webhook SePay → tab `Payments` của Sheet.
  Xem `references/payment-sepay-setup.md`.
- **Đa template**: chọn skin Mặc định / Sáng / Shopee / TikTok Shop / Hasaki để A/B test nhiều "look".

## Tối ưu quảng cáo: Server-side CAPI + chống bot + tuân thủ pháp lý
- **Meta CAPI + TikTok Events API (server-side)**: điền Meta CAPI token / TikTok Pixel+token →
  khi khách submit, server bắn conversion với `event_id` trùng pixel browser (**dedup**), hash
  SHA-256 SĐT/email. Giảm CPL, match rate cao. Token lưu trong tab `Config` của Sheet (Drive
  của bạn), `/api/lead` đọc qua Service Account — không lưu trên server tool.
- **Sự kiện + giá trị chuyển đổi**: chọn loại sự kiện (mặc định **Purchase**) + mã tiền tệ (VND).
  Khi điền form, cả pixel browser lẫn CAPI bắn `Purchase` kèm **value = giá KM × số lượng** +
  `currency` (cùng `event_id` để dedup). TikTok → `CompletePayment`, GA4 → `purchase` (có value).
- **Honeypot + lọc SĐT** ở `/api/lead` → chặn fake lead làm hỏng lookalike.
- **Nghị định 13/2023**: mỗi bộ LP tự kèm `privacy.html` + `terms.html` (khai báo tracking +
  thông tin doanh nghiệp), LP có link footer. Điền Tên công ty / email / SĐT trong tool.

## Lưu đơn COD vào Google Sheet (tự động)
Trong app, ô "Google Sheet endpoint" → bấm **🔗 Kết nối Google & tạo Sheet tự động** →
đăng nhập Google (quyền `drive.file`) → tool tự tạo Sheet trong Drive của bạn và nối form
COD vào. Khách đặt hàng → đơn tự đổ vào Sheet. Chủ tool cài một lần theo
`references/google-sheet-oauth-setup.md`. (Vẫn dán tay URL Apps Script được nếu thích.)

## Deploy LP lên Cloudflare / Vercel
Bấm **⬇️ Tải DEPLOY KIT** → giải nén → deploy thư mục `site/` (vd: `npx vercel deploy site`
hoặc `wrangler pages deploy site`). Xem `references/deploy-and-tracking.md`.
Xem `references/deploy-and-tracking.md`. Tóm tắt: cài Node.js → `wrangler login` → giải nén DEPLOY KIT → bấm đúp `deploy.bat` (Windows) hoặc `./deploy.sh` (Mac/Linux).

## Lưu ý
- Không commit API key / token vào repo.
- Model mặc định: text `gemini-2.5-pro`, ảnh `gemini-2.5-flash-image`. Bấm "Liệt kê model" trong app để chọn đúng tên model tài khoản bạn có.
