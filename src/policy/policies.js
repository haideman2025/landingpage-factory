// Decree 13/2023 (Nghị định 13/2023/NĐ-CP) compliant policy pages, generated per LP
// from the business info. Browser + Node safe (pure string builders).

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function page(title, bodyHtml) {
  return `<!doctype html><html lang="vi"><head><meta charset="UTF-8">`
    + `<meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${esc(title)}</title>`
    + `<style>body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:760px;margin:0 auto;padding:32px 18px;line-height:1.7;color:#1a1a1a}h1{font-size:24px}h2{font-size:18px;margin-top:24px}a{color:#0a58ca}small{color:#666}</style>`
    + `</head><body>${bodyHtml}</body></html>`;
}

// Returns the list of declared third-party processors based on which trackers are enabled.
export function declaredProcessors(biz) {
  const list = ['Cloudflare/Vercel (hạ tầng máy chủ)'];
  if (biz.pixel || biz.metaToken) list.push('Meta Platforms (Facebook Pixel / Conversions API)');
  if (biz.tiktokPixel) list.push('TikTok (Pixel / Events API)');
  if (biz.ga4) list.push('Google (Google Analytics 4)');
  if (biz.clarity) list.push('Microsoft (Clarity)');
  if (biz.sheet) list.push('Google (Google Sheets — lưu đơn hàng)');
  return list;
}

export function buildPrivacy(biz) {
  const b = biz || {};
  const name = b.company || b.brand || 'Doanh nghiệp';
  const procs = declaredProcessors(b).map((p) => `<li>${esc(p)}</li>`).join('');
  const body = `
<h1>Chính sách bảo mật</h1>
<p><small>Áp dụng cho: <b>${esc(name)}</b>. Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.</small></p>
<h2>1. Dữ liệu chúng tôi thu thập</h2>
<p>Khi bạn để lại thông tin đặt hàng, chúng tôi thu thập: họ tên, số điện thoại, địa chỉ giao hàng, và dữ liệu kỹ thuật (địa chỉ IP, trình duyệt, mã sự kiện quảng cáo) phục vụ giao hàng và đo lường quảng cáo.</p>
<h2>2. Mục đích sử dụng</h2>
<p>Liên hệ xác nhận và giao đơn hàng (COD); chăm sóc khách hàng; đo lường &amp; tối ưu hiệu quả quảng cáo.</p>
<h2>3. Bên thứ ba xử lý dữ liệu</h2>
<ul>${procs}</ul>
<h2>4. Lưu trữ &amp; bảo mật</h2>
<p>Dữ liệu được lưu trên dịch vụ điện toán đám mây có mã hóa, chỉ truy cập bởi người có thẩm quyền, và lưu trong thời gian cần thiết để xử lý đơn hàng.</p>
<h2>5. Quyền của bạn</h2>
<p>Bạn có quyền truy cập, chỉnh sửa, xóa hoặc yêu cầu ngừng xử lý dữ liệu cá nhân của mình bằng cách liên hệ chúng tôi.</p>
<h2>6. Liên hệ</h2>
<p>${esc(name)}${b.email ? ' — Email: ' + esc(b.email) : ''}${b.phone ? ' — ĐT: ' + esc(b.phone) : ''}.</p>`;
  return page('Chính sách bảo mật — ' + name, body);
}

export function buildTerms(biz) {
  const b = biz || {};
  const name = b.company || b.brand || 'Doanh nghiệp';
  const body = `
<h1>Điều khoản sử dụng</h1>
<p><small>Áp dụng cho: <b>${esc(name)}</b>.</small></p>
<h2>1. Đặt hàng &amp; thanh toán</h2>
<p>Đơn hàng được xác nhận qua điện thoại trước khi giao. Hình thức thanh toán: COD (thanh toán khi nhận hàng), trừ khi có thỏa thuận khác.</p>
<h2>2. Giao hàng</h2>
<p>Thời gian và phí giao hàng được thông báo khi xác nhận đơn. Vui lòng kiểm tra hàng khi nhận.</p>
<h2>3. Đổi/trả</h2>
<p>Chấp nhận đổi/trả với sản phẩm lỗi do nhà sản xuất trong thời gian quy định, còn nguyên tem/bao bì.</p>
<h2>4. Bảo mật thông tin</h2>
<p>Thông tin cá nhân được xử lý theo <a href="./privacy.html">Chính sách bảo mật</a>.</p>
<h2>5. Liên hệ</h2>
<p>${esc(name)}${b.email ? ' — Email: ' + esc(b.email) : ''}${b.phone ? ' — ĐT: ' + esc(b.phone) : ''}.</p>`;
  return page('Điều khoản sử dụng — ' + name, body);
}
