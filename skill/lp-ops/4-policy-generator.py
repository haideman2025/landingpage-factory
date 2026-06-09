#!/usr/bin/env python3
# Sinh 3 trang chính sách Nghị định 13/2023 cho mỗi LP.
# Dùng: python3 4-policy-generator.py "Ten DN" "email@x.com" "0900..." "meta+tiktok" ./out_dir
import sys,os
name=sys.argv[1] if len(sys.argv)>1 else "Doanh nghiệp"
email=sys.argv[2] if len(sys.argv)>2 else "contact@example.com"
phone=sys.argv[3] if len(sys.argv)>3 else "0900000000"
track=sys.argv[4] if len(sys.argv)>4 else "meta+tiktok"
out=sys.argv[5] if len(sys.argv)>5 else "."
os.makedirs(out,exist_ok=True)
third=["Cloudflare (CDN/IP trace)","ipify (IP fallback)"]
if "meta" in track: third.append("Meta Platforms (Pixel + Conversions API)")
if "tiktok" in track: third.append("TikTok (Pixel + Events API)")
third.append("VietQR Solution (nếu có thanh toán)")
W="""<!DOCTYPE html><html lang=vi><head><meta charset=UTF-8><meta name=viewport content="width=device-width,initial-scale=1"><title>{t}</title>
<style>body{{font-family:-apple-system,Segoe UI,Arial;max-width:760px;margin:0 auto;padding:24px;line-height:1.6;color:#222}}h1{{font-size:22px}}h2{{font-size:16px;margin-top:20px}}a{{color:#0061ff}}</style></head><body>{b}
<hr><p style=font-size:13px;color:#666>{name} · {email} · {phone}</p></body></html>"""
def w(fn,t,b): open(os.path.join(out,fn),"w",encoding="utf-8").write(W.format(t=t,b=b,name=name,email=email,phone=phone))
bm="<h1>Chính sách bảo mật</h1><p>{n} cam kết bảo vệ dữ liệu cá nhân của bạn theo Nghị định 13/2023/NĐ-CP.</p><h2>1. Dữ liệu thu thập</h2><p>Họ tên, số điện thoại, địa chỉ giao hàng, và dữ liệu kỹ thuật (IP, user-agent, cookie quảng cáo fbp/fbc/ttclid) để đo lường hiệu quả quảng cáo.</p><h2>2. Mục đích</h2><p>Xử lý đơn hàng, chăm sóc khách hàng, và tối ưu quảng cáo.</p><h2>3. Bên thứ ba</h2><ul>{li}</ul><h2>4. Quyền của bạn</h2><p>Bạn có quyền truy cập, chỉnh sửa, xoá dữ liệu bằng cách liên hệ {e}.</p><h2>5. Lưu trữ &amp; bảo mật</h2><p>Dữ liệu được mã hoá khi truyền, lưu trên dịch vụ có bảo mật, chỉ nhân sự được uỷ quyền truy cập.</p>".format(n=name,e=email,li="".join("<li>%s</li>"%x for x in third))
dk="<h1>Điều khoản sử dụng</h1><h2>1. Chấp nhận</h2><p>Khi sử dụng website/landing page này, bạn đồng ý với các điều khoản dưới đây.</p><h2>2. Đặt hàng</h2><p>Đơn hàng được xác nhận qua điện thoại/tin nhắn. Giá và ưu đãi có thể thay đổi.</p><h2>3. Giao hàng &amp; COD</h2><p>Giao toàn quốc, kiểm tra hàng trước khi thanh toán (COD).</p><h2>4. Đổi trả</h2><p>Hỗ trợ đổi trả với sản phẩm lỗi trong thời hạn quy định.</p><h2>5. Liên hệ</h2><p>{e} · {p}</p>".format(e=email,p=phone)
tt="<h1>Chính sách thanh toán</h1><p>Hỗ trợ COD và chuyển khoản VietQR. Thông tin chuyển khoản hiển thị khi đặt hàng. Vui lòng ghi đúng nội dung để hệ thống xác nhận tự động.</p>"
w("chinh-sach-bao-mat.html","Chính sách bảo mật",bm)
w("dieu-khoan-su-dung.html","Điều khoản sử dụng",dk)
if "qr" in track or "pay" in track or True: w("chinh-sach-thanh-toan.html","Chính sách thanh toán",tt)
print("policies written to",out)
