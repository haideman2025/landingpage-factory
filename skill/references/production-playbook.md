# Production Playbook v4 — đúc rút từ deploy thực chiến (ONIIZ 25 LP)

Các bài học BẮT BUỘC khi build + deploy LP COD chạy ads thật. Đọc trước khi giao.

## 1. Lead capture — lỗi #1 làm MẤT đơn
- LP từ generator thường để `var SHEET_ENDPOINT="";` (RỖNG) → form bấm "thành công" nhưng KHÔNG lưu đơn. Luôn kiểm tra trước khi deploy.
- Pattern chuẩn: đưa endpoint về 1 file dùng chung `site/lead-config.js`:
  `window.__LEAD_ENDPOINT__ = "https://script.google.com/macros/s/XXXX/exec";`
  và trong mỗi LP: `var SHEET_ENDPOINT=(window.__LEAD_ENDPOINT__||"");` + `<script src="/lead-config.js"></script>` ở head. Sửa 1 dòng = đổi endpoint toàn bộ LP.

## 2. Apps Script Web App — CẠM BẪY quyền sở hữu Sheet
- Web App "Execute as: Me". Nếu Sheet tạo bằng TÀI KHOẢN KHÁC (vd qua Drive connector account khác) → doPost lỗi "You do not have permission to access the requested document" → đơn rớt dù pixel vẫn đếm.
- FIX: tạo Sheet bằng CHÍNH account chạy script qua setup():
  `function setup(){var ss=SpreadsheetApp.create('LEADS');ss.getSheets()[0].appendRow(HEADERS);Logger.log('NEWID='+ss.getId());return ss.getId();}`
  rồi dán id vào `const SHEET_ID`.
- Deploy: New deployment → Web app → Execute as Me, Who has access ANYONE. Đổi code: Manage deployments → Edit → New version → URL /exec GIỮ NGUYÊN.

## 3. Tracking chuyển đổi đa nền tảng + value
- Tối thiểu PageView + ViewContent + conversion kèm eventID dedup.
- Ghi nhận CẢ Lead + Purchase, value = đơn giá × số lượng (đọc từ ô qty `1 (429.000đ)`). Helper __ORDERVAL + __fireConv bắn fbq Lead+Purchase + ttq SubmitForm/CompletePayment + gtag generate_lead/purchase, mỗi event 1 event_id (Lead=eid, Purchase='p_'+eid). Đẩy value vào payload Sheet.
- LƯU Ý: bắn Purchase lúc submit COD = đếm đơn CHƯA giao → số Purchase cao hơn thực giao.
- ttq/gtag chỉ gửi data thật khi gắn base TikTok Pixel + GA4 ở head.

## 4. Khối nội dung thương hiệu (KHÔNG để placeholder)
- Generator hay để rỗng `<h2></h2><p>""</p>` → phải fill. Kiểm tra `grep '>""</p>'`.
- 3 khối nhất quán toàn bộ LP: Câu chuyện thương hiệu (vision/mission), Câu chuyện Nhà sáng lập (tên founder cấu hình), Cam kết từ thương hiệu (4 cam kết từ Brand Values).
- Footer pháp lý đầy đủ (Nghị định 13 + Meta duyệt): tên cty, địa chỉ, hotline, email, MST/GPKD + 3 policy.

## 5. KOC video + UGC
- Carousel `.vcaro/.vslide` chứa 4-6 iframe `https://www.tiktok.com/embed/v2/VIDEO_ID` (aspect 9/16).
- UGC grid `.ugc` 3 cột ảnh vuông object-fit:cover lazy.

## 6. Animation nhẹ + icon động (AN TOÀN, có fallback)
- Reveal fade-up qua IntersectionObserver, body.lpx (JS thêm; lỗi JS → gỡ lpx → hiện đủ, không ẩn trắng), tôn trọng prefers-reduced-motion.
- Icon: class `lpfloat` float; nút CTA + shield bảo hành pulse.
- (xem snippet đầy đủ trong README cập nhật / phần CẬP NHẬT v4 của SKILL.md)

## 7. Form tăng CR
- ≤5 trường. Dưới nút: hàng trust 🚚 Free ship · 💵 COD · ↩️ Đổi trả 7 ngày · 🔒 Bảo mật · 📞 hotline.
- Nên có: tổng tiền tự cập nhật theo qty, combo 2/3, sticky CTA, countdown, social proof gần nút.

## 8. Deploy nhiều LP gọn
- Gộp nhiều bộ vào 1 project, phân nhóm theo PATH: `domain/insight-1/<slug>/` … 1 subdomain quản lý hết.
- `wrangler pages deploy site --project-name=NAME` (KHÔNG nhận token; user tự wrangler login).
- Custom domain: CF → Workers & Pages → project → Custom domains.
- Dùng URL production `name.pages.dev`, KHÔNG dùng URL preview có hash (ERR_SSL_VERSION_OR_CIPHER_MISMATCH).
- LP nằm sâu (path nhóm) → link policy/asset tuyệt đối `/privacy.html`, KHÔNG `../`.

## 9. Checklist deploy
- [ ] SHEET_ENDPOINT không rỗng (sheet đúng owner)
- [ ] Pixel PageView+ViewContent+Lead+Purchase+value+eventID
- [ ] 3 khối brand + footer pháp lý, không placeholder ""
- [ ] KOC video + UGC có nội dung
- [ ] Animation reveal + icon động (fallback)
- [ ] JS submit parse OK; test 1 đơn → đổ về Sheet
