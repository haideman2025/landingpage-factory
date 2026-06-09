# V5 — Premium Image-Led Conversion Kit

Bộ code tái dùng, đúc kết từ batch ONIIZ Cá Voi (storytelling LP, FB→COD men's care). Mục tiêu: **ảnh dẫn dắt, chữ ít nhưng đắt, tracking đầy đủ, mượt từ trên xuống**. Mọi LP v5 phải đạt checklist cuối file.

> Triết lý (học từ spotless.vn): hero & các scene "desire" = **sản phẩm là nhân vật chính** (CGI điện ảnh, ít/không có người). Người thật **chỉ** xuất hiện ở: UGC video, before/after, review. Chữ chiếm **< 20%** diện tích ảnh toàn trang — mỗi scene chỉ 1 eyebrow + 1 headline ngắn + tối đa 1 dòng.

---

## 1. Layout scene image-led (full-bleed + caption đáy)

```html
<section class="scene reveal"><img src="assets/hero.jpg" alt="" loading="eager">
  <div class="scrim"></div>
  <div class="cap bottom">
    <span class="eb">EYEBROW NGẮN</span>
    <h1>Headline ≤ 2 dòng <span class="hl">điểm nhấn</span></h1>
    <p>Tối đa 1 dòng phụ.</p>
  </div>
</section>
```

```css
.scene{position:relative;width:100%;min-height:88vh;display:flex;overflow:hidden}
.scene>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.scrim{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.58),rgba(0,0,0,.30) 38%,rgba(0,0,0,.50) 72%,rgba(11,13,17,.98))}
.cap{position:relative;z-index:2;margin:auto;max-width:520px;padding:6.5vh 20px;text-align:center;
  background:radial-gradient(125% 115% at 50% 55%,rgba(0,0,0,.52),rgba(0,0,0,0) 68%)}
.cap.bottom{margin:auto auto 0;padding-bottom:10vh}
.eb{display:inline-block;letter-spacing:3.5px;text-transform:uppercase;font-size:10.5px;font-weight:800;color:var(--acc);
  background:color-mix(in srgb,var(--acc) 14%,transparent);border:1px solid color-mix(in srgb,var(--acc) 45%,transparent);
  padding:6px 13px;border-radius:99px;margin-bottom:10px}
.cap h1{font-size:clamp(20px,4.6vw,31px);font-weight:900;line-height:1.18;text-shadow:0 2px 8px rgba(0,0,0,.72)}
.cap h2{font-size:clamp(18px,4.1vw,27px);font-weight:900;line-height:1.2;text-shadow:0 2px 8px rgba(0,0,0,.72)}
.cap p{font-size:clamp(13px,3.2vw,16px);line-height:1.55;margin:10px auto 0;max-width:44ch;text-shadow:0 2px 10px rgba(0,0,0,.9)}
@media(max-width:560px){.scene{min-height:78vh}.cap{padding:5.5vh 18px}.cap.bottom{padding-bottom:8vh}}
```

**LỖI KINH ĐIỂN — chữ gradient bị "dợ/nhoè":** `.hl` là chữ `color:transparent` (background-clip:text). KHÔNG bao giờ phủ `text-shadow` lên nó (bóng hiện sau chữ trong suốt → ma/nhoè). Dùng `drop-shadow` bám nét chữ:
```css
.cap .hl{text-shadow:none !important;-webkit-text-fill-color:transparent;
  filter:drop-shadow(0 1px 3px rgba(0,0,0,.8)) drop-shadow(0 0 1px rgba(0,0,0,.5))}
```

---

## 2. Flow FX — animation mượt từ trên xuống (thanh tiến trình + reveal + CTA shine + ken-burns)

Dán 1 lần trước `</body>`. Tự gắn `.fx` cho text/lưới/CTA, có observer riêng + safety reveal; tôn trọng `prefers-reduced-motion`.

```html
<style id="flowfx">
#fxbar{position:fixed;top:0;left:0;height:3px;width:0;z-index:300;background:linear-gradient(90deg,var(--acc),var(--acc2,#7CDB6A));box-shadow:0 0 10px var(--acc);transition:width .12s linear}
.fx{opacity:0;transform:translateY(26px);will-change:opacity,transform}
.fx-in{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.22,.61,.36,1),transform .7s cubic-bezier(.22,.61,.36,1)}
.fx-d1{transition-delay:.07s}.fx-d2{transition-delay:.14s}.fx-d3{transition-delay:.21s}.fx-d4{transition-delay:.28s}
@keyframes fxshine{0%{left:-60%}55%,100%{left:140%}}
.btn{position:relative;overflow:hidden}
.btn:not(.ghost)::after{content:'';position:absolute;top:0;left:-60%;width:42%;height:100%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);animation:fxshine 3.6s ease-in-out infinite;pointer-events:none}
@keyframes fxpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.022)}}
.btn:not(.ghost){animation:fxpulse 2.8s ease-in-out infinite}
.btn:hover{transform:translateY(-2px) scale(1.012)}
@keyframes fxken{from{transform:scale(1.08)}to{transform:scale(1)}}
.scene.in>img{animation:fxken 10s ease-out both}
html{scroll-behavior:smooth}
@media(prefers-reduced-motion:reduce){.fx,.fx-in{opacity:1!important;transform:none!important}.btn:not(.ghost),.btn:not(.ghost)::after,.scene.in>img{animation:none!important}}
</style>
<script id="flowfxjs">
(function(){if(document.getElementById('fxbar'))return;
var bar=document.createElement('div');bar.id='fxbar';document.body.appendChild(bar);
var H=document.documentElement;function prog(){var sc=H.scrollTop||document.body.scrollTop;var mx=(H.scrollHeight-H.clientHeight)||1;bar.style.width=(sc/mx*100)+'%';}
addEventListener('scroll',prog,{passive:true});prog();
var rm=matchMedia('(prefers-reduced-motion:reduce)').matches;
var sel='.band h2,.band>p,.eyebrow,.ben,.detcard,.tcard,.hxcell,.stat,.price,.btn,.pain,.ttcard,.bgrid>div';
[].slice.call(document.querySelectorAll(sel)).forEach(function(el){if(!el.classList.contains('reveal')&&!el.closest('.scene'))el.classList.add('fx');});
document.querySelectorAll('.bgrid,.detlist,.caro,.ttwrap,.hxgrid,.stats').forEach(function(g){[].slice.call(g.children).forEach(function(c,i){if(c.classList.contains('fx'))c.classList.add('fx-d'+Math.min(i+1,4));});});
if(rm){document.querySelectorAll('.fx').forEach(function(e){e.classList.add('fx-in')});return;}
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('fx-in');io.unobserve(x.target);}})},{threshold:.12,rootMargin:'0px 0px -7% 0px'});
document.querySelectorAll('.fx').forEach(function(e){io.observe(e)});
setTimeout(function(){document.querySelectorAll('.fx:not(.fx-in)').forEach(function(e){if(e.getBoundingClientRect().top<innerHeight*1.1)e.classList.add('fx-in')})},400);
addEventListener('load',function(){setTimeout(function(){document.querySelectorAll('.fx:not(.fx-in)').forEach(function(e){if(e.getBoundingClientRect().top<innerHeight)e.classList.add('fx-in')})},5000);});
})();
</script>
```

---

## 3. Trust stats mở rộng (số chạy) — dưới hero

```html
<section class="band hxband"><div class="hxgrid">
  <div class="hxcell reveal"><div class="hxic">🏆</div><div class="hxnum">TOP 1</div><div class="hxdesc">Bọt vệ sinh nam bán chạy trên <b>TikTok Shop &amp; Shopee</b></div></div>
  <div class="hxcell reveal"><div class="hxic">👥</div><div class="hxnum"><span data-count="400" data-suf="K+">0</span></div><div class="hxdesc"><b>khách hàng</b> tin tưởng &amp; đồng hành</div></div>
  <div class="hxcell reveal"><div class="hxic">⭐</div><div class="hxnum"><span data-count="5" data-dec="1">0</span></div><div class="hxdesc">điểm <b>đánh giá</b> trung bình mọi nền tảng</div></div>
</div></section>
```
```css
.hxgrid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;max-width:640px;margin:0 auto}
.hxcell{background:linear-gradient(160deg,var(--s2),color-mix(in srgb,var(--acc) 14%,var(--s2)));border:1px solid var(--line);border-radius:16px;padding:16px 12px;text-align:center;box-shadow:0 6px 20px rgba(0,0,0,.18)}
.hxic{font-size:26px;margin-bottom:6px}.hxnum{font-size:26px;font-weight:800;color:var(--acc)}.hxdesc{font-size:12px;color:#cfd6df;margin-top:6px;line-height:1.42}
.hxgrid .hxcell:nth-child(2){transition-delay:.12s}.hxgrid .hxcell:nth-child(3){transition-delay:.24s}
@media(max-width:560px){.hxgrid{gap:7px}.hxcell{padding:12px 6px}.hxnum{font-size:19px}.hxic{font-size:21px}.hxdesc{font-size:10px}}
```
Counter hỗ trợ **thập phân** (cho 5.0) — dùng `data-dec`:
```js
function cup(el){var t=+el.dataset.count,suf=el.dataset.suf||'',dec=+el.dataset.dec||0,st=null;function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/1400,1);var v=p*t;el.textContent=(dec?v.toFixed(dec):(v>=1000?Math.floor(v).toLocaleString():Math.floor(v)))+suf;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
```

---

## 4. Video TikTok review — nhúng player chính thức (HIỆN THUMBNAIL GỐC)

**CẤM dùng `tiktok.com/embed/v2/<id>` trong iframe** (bị chặn, không phát). Dùng **player v1** — nó tự hiển thị ảnh cover gốc + nút play:

```html
<section class="band"><span class="eyebrow">Review Thật Từ TikTok</span>
  <h2>Khách Hàng Nói Gì Trên TikTok</h2>
  <p class="mut" style="text-align:center">👆 Vuốt ngang &amp; chạm để xem</p>
  <div class="ttwrap">
    <!-- 1 card / video, thay <ID> -->
    <div class="ttcard"><iframe src="https://www.tiktok.com/player/v1/<ID>" loading="lazy" allow="fullscreen;encrypted-media;picture-in-picture" allowfullscreen scrolling="no" title="Review"></iframe></div>
  </div>
</section>
```
```css
.ttwrap{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:6px 2px 12px;-webkit-overflow-scrolling:touch}
.ttwrap::-webkit-scrollbar{height:0}
.ttcard{flex:0 0 80%;max-width:300px;scroll-snap-align:center;border-radius:14px;overflow:hidden;border:1px solid var(--line);background:#000;aspect-ratio:9/16}
.ttcard iframe{width:100%;height:100%;border:0;display:block}
@media(min-width:760px){.ttcard{flex:0 0 31%}}
```
Lấy `<ID>` từ URL: `tiktok.com/@user/video/<ID>`. Đặt ngay **sau khối Reviews**.

---

## 5. Badge an toàn (xử lý phản đối #1) + neo giá theo ngày

Đặt `.certrow` ngay **dưới CTA hero** và **sát form**. `.perday` ngay sau mỗi `.price`.
```html
<div class="certrow"><span>🔒 COD – trả khi nhận</span><span>✅ Chính hãng</span><span>↩️ Đổi trả 7 ngày</span><span>🚚 Freeship toàn quốc</span></div>
<div class="perday">≈ 4.770đ/ngày · 1 combo dùng ~3 tháng</div>
```
```css
.certrow{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-top:12px}
.certrow span{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:#e8edf3;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.16);border-radius:99px;padding:6px 11px;backdrop-filter:blur(4px);text-shadow:0 1px 3px rgba(0,0,0,.6)}
.perday{margin-top:6px;font-size:12.5px;color:var(--acc);font-weight:800;text-align:center}
```

---

## 6. Form COD → Sheet (BẮT BUỘC form-encoded + 19 cột + Lead & Purchase)

> **Bug data-loss kinh điển:** POST `Content-Type: application/json` + `JSON.stringify` → Apps Script đọc `e.parameter` rỗng → CHỈ ghi được timestamp. **Luôn dùng `x-www-form-urlencoded` + `URLSearchParams`.** Tên field phải KHỚP HEADERS của Apps Script.

```js
function ck(n){var v=('; '+document.cookie).split('; '+n+'=');return v.length===2?v.pop().split(';').shift():''}
function gp(k){try{return new URLSearchParams(location.search).get(k)||''}catch(e){return ''}}
form.addEventListener('submit',function(e){e.preventDefault();var f=e.target;
var eid='lead-'+Date.now()+'-'+Math.random().toString(16).slice(2,10);
var q=parseInt(f.qty.value)||1;var val=UNIT_PRICE*q;var CUR=CURRENCY||'VND';
try{if(window.fbq){fbq('track','Lead',{value:val,currency:CUR,content_name:LP_NAME},{eventID:eid});
                   fbq('track','Purchase',{value:val,currency:CUR,content_name:LP_NAME},{eventID:'p_'+eid});}}catch(x){}
var oc=(Date.now().toString(36)+Math.random().toString(36).slice(2)).toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
var data={ts:new Date().toISOString(),order_code:oc,lp:LP_NAME,ev:'Purchase',value:val,currency:CUR,
  name:f.name.value,phone:f.phone.value,address:f.address.value,qty:String(q),eid:eid,
  fbp:ck('_fbp'),fbc:ck('_fbc')||(gp('fbclid')?('fb.1.'+Date.now()+'.'+gp('fbclid')):''),ttp:ck('_ttp'),
  utm_source:gp('utm_source'),utm_medium:gp('utm_medium'),utm_campaign:gp('utm_campaign'),src:location.href,website:location.hostname};
fetch(SHEET_ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:new URLSearchParams(data)});
});
```
Apps Script (Code.gs) đọc `e.parameter` theo HEADERS — cột thừa tự bỏ qua:
```js
const HEADERS=['timestamp','order_code','lp','ev','value','currency','name','phone','address','qty','eid','fbp','fbc','ttp','utm_source','utm_medium','utm_campaign','src','website'];
function doPost(e){var sh=SpreadsheetApp.openById(SHEET_ID).getSheets()[0];if(sh.getLastRow()===0)sh.appendRow(HEADERS);
var p=(e&&e.parameter)?e.parameter:{};sh.appendRow(HEADERS.map(function(k){return k==='timestamp'?(p.ts||new Date().toISOString()):(p[k]||'');}));
return ContentService.createTextOutput(JSON.stringify({ok:true})).setMimeType(ContentService.MimeType.JSON);}
```
**Lưu ý:** Web App phải **execute-as chính tài khoản SỞ HỮU Sheet** (tạo Sheet bằng `SpreadsheetApp.create()` trong cùng account), nếu không sẽ "You do not have permission" → rớt đơn.

---

## ✅ Checklist v5 (mọi LP phải đạt trước khi deploy)
- [ ] Ảnh full-bleed dẫn dắt; **chữ < 20%** diện tích; mỗi scene ≤ 1 eyebrow + 1 H + 1 dòng.
- [ ] Hero & scene desire = **sản phẩm** (CGI điện ảnh); người thật chỉ ở UGC/before-after/review.
- [ ] `.hl` dùng `drop-shadow` (không text-shadow) — không nhoè.
- [ ] Flow FX (thanh tiến trình + reveal + CTA shine) + `prefers-reduced-motion`.
- [ ] Trust stats số chạy dưới hero; badge an toàn dưới CTA + cạnh form; neo giá đ/ngày.
- [ ] Video TikTok **player/v1** (thumbnail gốc) sau khối Reviews.
- [ ] Form **form-encoded 19 cột**; bắn **Lead + Purchase** (value = giá × qty, eid dedup) + ViewContent + PageView.
- [ ] 0 ảnh lỗi; mở mobile kiểm tra chữ nét, đọc rõ.
