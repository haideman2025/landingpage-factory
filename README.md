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

## Deploy LP lên Cloudflare
Xem `references/deploy-and-tracking.md`. Tóm tắt: cài Node.js → `wrangler login` → giải nén DEPLOY KIT → bấm đúp `deploy.bat` (Windows) hoặc `./deploy.sh` (Mac/Linux).

## Lưu ý
- Không commit API key / token vào repo.
- Model mặc định: text `gemini-2.5-pro`, ảnh `gemini-2.5-flash-image`. Bấm "Liệt kê model" trong app để chọn đúng tên model tài khoản bạn có.
