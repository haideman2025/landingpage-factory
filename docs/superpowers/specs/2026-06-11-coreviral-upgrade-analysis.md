# COREVIRAL → LP-Factory: Phân tích & Nâng cấp

- Ngày: 2026-06-11
- Nguồn: `COREVIRAL- Gửi EcomLegend.xlsx` (14 sheet) + CSV bộ từ khóa — khung 6 bước xây kênh TikTok ra đơn mà người dùng cung cấp.

## 1. COREVIRAL là gì (tóm tắt khung 6 bước)

1. **Xác định chiến lược & định dạng kênh**: Chiến lược (Thương hiệu / Ẩn thương hiệu / Nhân hiệu) × Định dạng (Kiến thức / Hình thức / Kết hợp) → Chủ đề × **Cách thể hiện** (thử thách, reaction, tip, so sánh, review, đồng cảm, kể chuyện, tình huống hài hước, vlog trải nghiệm…) → Ý tưởng chi tiết.
2. **Phân biệt Series**: nội dung thắng = **series lặp lại được** (cùng Chủ đề + Cách thể hiện). VD: phỏng vấn đường phố, chấm điểm món ăn theo quốc gia, đố vui đối kháng, hành trình mua xe.
3. **Keyword Brand & Insight Sale** *(quan trọng nhất cho copy LP)*:
   - **Keyword Brand** = 3–4 thông điệp cốt lõi (vd: Thoải mái/Thanh lịch/Chân thật/Ứng dụng cao — hoặc Nâng tầm/Đáng tiền/Thiết kế/Dịch vụ), mỗi thông điệp có tuyến nội dung chứng minh.
   - **Insight Sale = phễu tâm lý 5 lớp**: **NỖI ĐAU → RÀO CẢN → MONG ĐỢI → TỰ HÀO → THÚC ĐẨY (FOMO)**.
   - **Dấu ấn riêng (signature)**: phong cách quay, giọng nói, màu sắc, nhạc nền, tagline.
4. **Xây bộ từ khóa**: 9 danh mục — Sản phẩm, Phân khúc giá, Nhóm sở thích, Mục đích sử dụng cuối, Ngành hàng, Nghề nghiệp, Nhóm nhu cầu, Hình thức thể hiện → ≥30 keyword để phủ nội dung/research.
5. **Research nội dung viral**: tìm video ≥500k view / ≥35k tim / Top 20. Định dạng "Hình thức/Kết hợp" → lấy video nước ngoài (Douyin/TikTok US); "Hình thức" → Á Đông/VN. Dịch + ghi timestamp. **Loại nội dung tỷ lệ thắng cao: Series + Thử nghiệm / Thử thách / Xếp hạng / Chấm điểm.**
6. **Phân tích & liên kết**: mổ video thắng theo timestamp → tìm **đúng yếu tố viral** (không chung chung) → **nâng cấp** thành ý tưởng cho doanh nghiệp → chọn điểm áp dụng.

## 2. Bài học rút ra (áp dụng được cho LP-Factory)

| # | Bài học từ COREVIRAL | Ứng dụng vào LP-Factory |
|---|---|---|
| A | **Phễu Insight Sale 5 lớp** điều khiển toàn bộ tâm lý mua | Bắt copy LP đi đúng mạch NỖI ĐAU→RÀO CẢN→MONG ĐỢI→TỰ HÀO→THÚC ĐẨY, ánh xạ vào các field sẵn có (pains, reasons, before/after, testi/case, urgency/value_anchor). |
| B | **Hook 0–3s bằng text overlay** + nội dung "đúng là mình" (insight-led, không product-first) | Mỗi bộ ad mở đầu bằng overlay hook ngắn; hero/eyebrow đi theo insight. |
| C | **Định dạng thắng**: Thử nghiệm/Thử thách, Xếp hạng/So sánh/Chấm điểm, Reaction/POV tình huống, Series | Thay 5 angle ad chung chung bằng 5 định dạng đã được chứng minh ra đơn. |
| D | **Bộ từ khóa 9 danh mục** | Thêm "Insight Engine" sinh bộ từ khóa + nhóm nhu cầu/nghề nghiệp/sở thích để định hướng angle & nhắm đối tượng. |
| E | **Series / dấu ấn riêng** | Insight Engine gợi ý "signature" + tuyến series để LP/ad nhất quán thương hiệu. |
| F | **Quy trình research→phân tích→nâng cấp** | Insight Engine sinh các "winning insight" (chủ đề + cách thể hiện + insight) đổ thẳng vào pipeline SEED sẵn có của Studio. |

## 3. Kế hoạch nâng cấp (làm tuần tự, mỗi mục 1 commit)

1. **Nâng cấp 5 angle ad** trong `genConfigs` → 5 định dạng COREVIRAL (insight hook / thử nghiệm-thử thách / xếp hạng-so sánh-chấm điểm / reaction-POV-UGC / offer-FOMO), mỗi bộ mở bằng text-overlay hook 0–3s. *(Giữ nguyên schema JSON — chỉ đổi hướng dẫn, rủi ro thấp.)*
2. **Bake phễu Insight-Sale 5 lớp** vào chỉ dẫn sinh copy LP (ánh xạ field sẵn có). *(Giữ schema, rủi ro thấp.)*
3. **COREVIRAL Insight Engine** *(bổ sung, không đụng render hiện tại)*: 1 nút/panel sinh — Keyword Brand (3–4 thông điệp), phễu Insight Sale, bộ từ khóa 9 danh mục, dấu ấn riêng, và N "winning insight" (chủ đề + cách thể hiện) → nạp thẳng vào `window.SEED` để bước "AI thiết kế Landing Page" dùng.
4. (Sau, nếu cần) Nhập link video viral → tóm tắt/áp dụng (tận dụng research COREVIRAL).

## 4. Nguyên tắc an toàn
- Mục 1–2 chỉ sửa chỉ dẫn trong prompt, không đổi schema JSON → renderer cũ chạy nguyên. Mỗi thay đổi 1 commit, dễ revert.
- Mục 3 là tính năng cộng thêm, tách biệt, không ảnh hưởng luồng hiện có.
