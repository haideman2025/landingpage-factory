# Thu tiền trước (VietQR) + xác nhận thanh toán tự động

## 1) Hiện QR chuyển khoản trên LP (không cần backend)
Trong tool, điền: **Mã ngân hàng** (MB, VCB, TCB, ACB, BIDV…), **Số tài khoản**,
**Tên chủ tài khoản**. Khi tạo LP, mỗi trang hiện thêm khối **"Chuyển khoản giữ đơn"**
với mã QR VietQR (qua `img.vietqr.io`, miễn phí) đã điền sẵn:
- **Số tiền** = giá mới của sản phẩm
- **Nội dung CK** = mã đơn `DHxxxxxxx` sinh riêng cho mỗi khách (để đối soát)

Khách quét QR (app ngân hàng) → chuyển đúng số tiền + nội dung → xong. Mã đơn cũng được
gửi kèm khi khách điền form, lưu vào cột **"Ma don"** trong Sheet.

## 2) Tự xác nhận đã nhận tiền (tuỳ chọn — cần SePay miễn phí)
Để biết khách nào đã chuyển khoản:
1. Tạo tài khoản **SePay** (sepay.vn — có gói miễn phí) và liên kết ngân hàng của bạn.
2. Trong SePay → Webhooks → thêm webhook trỏ tới:
   `https://landingpage-factory.vercel.app/api/payment?s=<SHEET_ID>`
   (`<SHEET_ID>` lấy từ link Sheet mà tool tạo, phần giữa `/d/` và `/edit`).
3. Mỗi khi có tiền vào, SePay gọi webhook → tool ghi 1 dòng vào tab **"Payments"** của Sheet:
   thời gian · số tiền · nội dung · **mã đơn** (tự tách từ nội dung CK) · ngân hàng.

Đối soát: so **mã đơn** ở tab Orders (cột "Ma don") với tab Payments → biết đơn nào đã trả.

> Webhook không cần env var mới — dùng chung Service Account đã cấu hình cho Google Sheet.
> Casso cũng dùng được (payload tương tự: `content`, `transferAmount`, `transferType`).

## 3) Đa giao diện (template)
Ô **"Giao diện (template)"** chọn skin: Mặc định / Sáng / Shopee (cam) / TikTok Shop
(đen-hồng) / Hasaki (xanh). Đổi màu & phong cách toàn trang để A/B test nhiều "look" khác nhau.
