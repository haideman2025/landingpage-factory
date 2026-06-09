# 🤖 LP Ops Agent — Toolkit vận hành hàng loạt landing page
Học từ skill design-landingpage-vip-v2 (noti.vn). Biến "hàng chục LP zip" thành hệ test-tìm-winner: 1 nơi gom data + deploy nhanh + link UTM chạy ads.

## Luồng tổng
LP (gắn snippet) → DATA HUB (1 Google Sheet theo lp_id) → Winner Dashboard. Song song: batch deploy CF/Vercel + UTM Link Builder.

## File
1. **1-tracking-snippet.html** — dán trước `</body>` mỗi LP. Thay `__LP_ID__` + `__WEBHOOK__`. Thu fbc/fbp/ttclid/ttp/ip/ua/event_id + UTM + lp_id, bắn pixel Meta+TikTok (chung event_id để dedup) và POST 1 payload. Trong form submit gọi `LP_SUBMIT({name,phone,address,qty})`.
2. **2-appsscript-Unified.gs** — 1 Google Sheet trung tâm cho MỌI LP, dedup theo event_id. Deploy Web App → lấy URL /exec làm `__WEBHOOK__` (chế độ Sheet-only, không CAPI).
3. **3-n8n-capi-workflow.json** — import vào n8n. Webhook → hash SHA-256 → **Meta CAPI + TikTok Events API** (dedup event_id) → append Sheet. Đây là chế độ full CAPI (chính xác nhất). Thay =PIXEL_ID= =META_TOKEN= =TT_TOKEN= =TT_PIXEL= =SHEET_ID=. Dùng URL webhook n8n làm `__WEBHOOK__`.
4. **4-policy-generator.py** — sinh 3 trang chính sách Nghị định 13 cho mỗi LP: `python3 4-policy-generator.py "Tên DN" email sđt "meta+tiktok" ./site/<slug>`.
5. **5-deploy-cloudflare.sh / 5-deploy-vercel.sh** — để cạnh thư mục `site/` (mỗi LP 1 folder con) → chạy 1 lệnh deploy cả bộ. CF: `./5-deploy-cloudflare.sh ten-project`. Vercel: `./5-deploy-vercel.sh`.
6. **6-UTM-Link-Builder.html** — sinh link ads cho từng LP × nền tảng (UTM chuẩn) + export CSV.
7. **7-Winner-Dashboard.html** — dán link Google Sheet (Publish to web → CSV) → gom lead theo lp_id → gợi ý SCALE/KILL.

## Chọn chế độ tracking
- **Có n8n** → dùng #3 (full Meta+TikTok CAPI, dedup, match-rate cao). `__WEBHOOK__` = webhook n8n.
- **Không có backend** → dùng #2 (Apps Script, chỉ lưu Sheet, KHÔNG CAPI). `__WEBHOOK__` = URL /exec.

## Tích hợp với LP Factory Studio
Phase 2 (kế tiếp): nhúng thẳng snippet #1 + lp_id + auto-sinh policy #4 vào renderer của LP Factory Studio, để mỗi LP tải về đã chuẩn CAPI + Nghị định 13.
