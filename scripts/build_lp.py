# -*- coding: utf-8 -*-
"""High-Converting LP Factory — generator.
- Copy hiển thị: tiếng Việt CÓ DẤU đầy đủ.
- Prompt ảnh: TIẾNG ANH chi tiết + Brand Visual DNA (CONFIG['brand_dna_en']) + product reference.
- Output: ./out/<slug>.html + ./out/index.html
Sửa CONFIG + ANGLES cho ngành hàng khác rồi chạy: python3 build_lp.py
"""
import os, html as _h
HERE=os.path.dirname(os.path.abspath(__file__))
OUT=os.path.join(HERE,"out_plus"); os.makedirs(OUT,exist_ok=True)

# ================= CONFIG (sửa cho từng ngành) =================
CONFIG=dict(
  brand="ONIIZ",
  product="Combo 3 Bọt Vệ Sinh Nam ONIIZ PLUS — Masculine Foam Plus 145ml (Beachy · Juicy · Milky)",
  price_old="597.000đ", price_new="429.000đ", save="168.000đ", save_pct="-28%",
  pixel_id="2171460696601031",
  hotline="092.3939.338", email="contact@oniiz.com",
  company="CÔNG TY TNHH DEMAN",
  gift="Freeship toàn quốc + quà bí mật",
  # Brand Visual DNA (TIẾNG ANH) — nối vào MỌI prompt + hiển thị để dán vào LP-Image-Studio
  brand_dna_en=("BRAND VISUAL DNA: modern masculine Vietnamese men's personal-care brand; "
    "premium cinematic photoreal style; clean confident young Vietnamese/Korean men 22-32; "
    "soft directional lighting with gentle rim light; shallow depth of field; "
    "refined color grading; subtle water/foam texture; consistent across all images."),
  # product reference instruction
  product_ref_en="Use the attached product reference image(s); keep the exact packaging, label, logo and bottle colors of the product.",
)

# ================= CSS (rút gọn từ v3, nhãn UI tiếng Việt có dấu) =================
CSS=r"""
:root{--bg:#0b0d11;--s1:#13171e;--s2:#1b212b;--ink:#f3f6fa;--mut:#98a2b2;--acc:__ACC__;--acc2:__ACC2__;--line:#262d39;--ok:#46d6a8}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--ink);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;line-height:1.62;-webkit-font-smoothing:antialiased;padding-bottom:78px;overflow-x:hidden}
.wrap{max-width:560px;margin:0 auto;position:relative}
section{padding:40px 18px;position:relative}
h1{font-size:32px;font-weight:900;letter-spacing:-.5px;line-height:1.18}h2{font-size:24px;font-weight:800;line-height:1.2}h3{font-size:16px}
.eyebrow{color:var(--acc);font-size:12px;font-weight:800;letter-spacing:1.6px;text-transform:uppercase;margin-bottom:10px;display:inline-block}
p{color:#d6dce6;font-size:15.5px}.mut{color:var(--mut)}.center{text-align:center}.sp{height:14px}
.btn{display:inline-block;width:100%;text-align:center;background:linear-gradient(135deg,var(--acc),var(--acc2));color:#0c0f08;font-weight:900;font-size:16.5px;padding:17px;border-radius:14px;border:none;cursor:pointer;text-decoration:none;box-shadow:0 12px 30px -8px var(--acc);position:relative;overflow:hidden}
.btn:after{content:"";position:absolute;top:0;left:-120%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.45),transparent);transform:skewX(-20deg);animation:sheen 3.4s infinite}
@keyframes sheen{0%{left:-120%}55%,100%{left:130%}}
.btn.ghost{background:transparent;border:1.6px solid var(--acc);color:var(--acc);box-shadow:none}.btn.ghost:after{display:none}
.marq{background:linear-gradient(90deg,var(--acc),var(--acc2));color:#0c0f08;font-weight:800;font-size:12.5px;white-space:nowrap;overflow:hidden;padding:8px 0}
.marq span{display:inline-block;padding-left:100%;animation:mq 17s linear infinite}@keyframes mq{to{transform:translateX(-100%)}}
.nav{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;padding:11px 18px;background:rgba(11,13,17,.82);backdrop-filter:blur(10px);border-bottom:1px solid var(--line)}
.logo{font-weight:900;letter-spacing:3px;font-size:19px}.logo b{color:var(--acc)}.nav .mini{font-size:11px;color:var(--mut)}
.media{position:relative;width:100%;border-radius:16px;overflow:hidden;border:1px solid var(--line);background:var(--s1)}
.media svg.bg{position:absolute;inset:0;width:100%;height:100%}
.media .cap{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:8px;align-items:flex-end;justify-content:space-between}
.media .chip{background:rgba(0,0,0,.6);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.14);color:#eef2f7;font-size:10.5px;line-height:1.35;padding:6px 9px;border-radius:9px;max-width:74%}
.media .chip b{color:var(--acc2)}
.pcopy{flex:none;background:var(--acc);color:#0c0f08;border:none;border-radius:8px;padding:6px 10px;font-size:11px;font-weight:800;cursor:pointer}.pcopy.done{background:#2f6bff;color:#fff}
.play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.play i{width:64px;height:64px;border-radius:50%;background:var(--acc);display:flex;align-items:center;justify-content:center;color:#0c0f08;font-size:26px;font-style:normal;animation:pulse 2.2s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--acc) 70%,transparent)}70%{box-shadow:0 0 0 22px transparent}100%{box-shadow:0 0 0 0 transparent}}
.dna{background:var(--s2);border:1px dashed var(--acc);border-radius:12px;padding:12px;font-size:11.5px;color:#cfd6df;position:relative}.dna b{color:var(--acc)}.dna .pcopy{position:absolute;top:8px;right:8px}
.hero{text-align:center;padding-top:30px;background:radial-gradient(130% 70% at 50% -10%,var(--s2),var(--bg) 70%)}
.hero h1 .hl{background:linear-gradient(120deg,var(--acc),var(--acc2));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero .sub{margin:13px 0 16px;color:#e7ecf3}
.price{display:inline-flex;align-items:baseline;gap:10px;margin:10px 0 14px}
.price .old{color:var(--mut);text-decoration:line-through}.price .new{font-size:36px;font-weight:900;color:var(--acc)}.price .save{background:#e0463b;color:#fff;font-size:12px;font-weight:800;padding:3px 8px;border-radius:6px;align-self:center}
.chips{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:14px}
.chiptrust{background:var(--s1);border:1px solid var(--line);border-radius:999px;padding:7px 13px;font-size:12px;font-weight:700}.chiptrust b{color:var(--acc)}
.reveal{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.2,.7,.2,1)}.reveal.in{opacity:1;transform:none}.d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}
.press{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:18px}.press .lg{background:var(--s1);border:1px solid var(--line);border-radius:8px;padding:7px 12px;font-size:12px;color:var(--mut);font-weight:700}
.pain{display:flex;gap:13px;align-items:flex-start;background:var(--s1);border:1px solid var(--line);border-radius:14px;padding:14px;margin-bottom:11px}.pain .x{width:26px;height:26px;flex:none;border-radius:50%;background:rgba(224,70,59,.16);color:#ff7a6e;display:flex;align-items:center;justify-content:center;font-weight:900}.pain b{color:#fff}
.fullq{position:relative;border-radius:18px;overflow:hidden;border:1px solid var(--line)}.fullq .ov{position:absolute;inset:0;display:flex;align-items:flex-end;background:linear-gradient(180deg,transparent,rgba(0,0,0,.72));padding:18px}.fullq .ov p{font-size:18px;font-weight:800;color:#fff;text-shadow:0 2px 12px #000}
.ing{display:flex;gap:13px;align-items:center;background:var(--s1);border:1px solid var(--line);border-radius:14px;padding:13px;margin-bottom:10px}.ing .ic{width:42px;height:42px;flex:none;border-radius:11px;background:color-mix(in srgb,var(--acc) 16%,transparent);display:flex;align-items:center;justify-content:center;font-weight:900;color:var(--acc)}.ing b{color:#fff;font-size:14.5px}.ing span{font-size:12.5px;color:var(--mut)}
.tabs{display:flex;gap:8px;margin:12px 0}.tab{flex:1;text-align:center;background:var(--s1);border:1px solid var(--line);border-radius:11px;padding:10px;font-weight:800;font-size:13px;cursor:pointer}.tab.on{background:color-mix(in srgb,var(--acc) 18%,transparent);border-color:var(--acc);color:var(--acc)}
.scpane{display:none}.scpane.on{display:block;animation:fade .4s}@keyframes fade{from{opacity:0;transform:translateY(8px)}to{opacity:1}}.scpane .role{color:var(--mut);font-size:13.5px;margin-top:8px}
.bgrid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-top:14px}.ben{background:var(--s1);border:1px solid var(--line);border-radius:14px;padding:15px;text-align:center}.ben .e{font-size:26px}.ben b{display:block;font-size:14px;margin:6px 0 3px}.ben span{font-size:12px;color:var(--mut)}
.step{display:flex;gap:13px;margin-bottom:14px}.step .no{width:34px;height:34px;flex:none;border-radius:50%;background:var(--acc);color:#0c0f08;font-weight:900;display:flex;align-items:center;justify-content:center}.step .b{flex:1}.step h3{margin-bottom:2px}.step .mm{margin-top:8px}
.ba{display:flex;gap:10px}.ba>div{flex:1}.ba .lbl{font-weight:800;font-size:13px;margin-bottom:6px}.ba .b1{color:#ff7a6e}.ba .b2{color:var(--ok)}
.stats{display:flex;gap:10px;margin-top:8px}.stat{flex:1;background:var(--s1);border:1px solid var(--line);border-radius:14px;padding:16px 6px;text-align:center}.stat .n{font-size:24px;font-weight:900;color:var(--acc)}.stat .l{font-size:11px;color:var(--mut)}
.case{background:var(--s1);border:1px solid var(--acc);border-radius:18px;padding:16px}.case .res{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.case .res span{background:color-mix(in srgb,var(--acc) 15%,transparent);color:var(--acc);font-size:11.5px;font-weight:800;padding:5px 10px;border-radius:999px}
.rate{display:flex;align-items:center;gap:14px;background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:15px}.rate .sc{font-size:36px;font-weight:900;color:var(--acc)}.stars{color:var(--acc)}
.caro{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:14px 0 4px}.caro::-webkit-scrollbar{height:0}.tcard{flex:0 0 84%;scroll-snap-align:center;background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:14px}.tcard .who{display:flex;align-items:center;gap:10px;margin-top:11px}.tcard .who b{font-size:14px}.tcard .who span{font-size:12px;color:var(--mut)}
.ugc{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:14px}
table.cmp{width:100%;border-collapse:collapse;font-size:13px;margin-top:12px}table.cmp th,table.cmp td{border:1px solid var(--line);padding:10px 8px;text-align:center}table.cmp th{background:var(--s2)}table.cmp td:first-child{text-align:left;color:#cfd6df}table.cmp .me{background:color-mix(in srgb,var(--acc) 15%,transparent);color:var(--acc);font-weight:800}.yes{color:var(--ok);font-weight:900}.no{color:#ff7a6e;font-weight:900}
.founder{display:flex;gap:14px;align-items:center;background:var(--s1);border:1px solid var(--line);border-radius:16px;padding:15px}.founder .av{width:60px;flex:none}
.cd{display:flex;gap:9px;justify-content:center;margin:14px 0}.cd .u{background:var(--s2);border:1px solid var(--line);border-radius:12px;padding:10px 13px;min-width:62px;text-align:center}.cd .u .n{font-size:25px;font-weight:900}.cd .u .l{font-size:10px;color:var(--mut);text-transform:uppercase}
.value{background:linear-gradient(135deg,var(--s2),var(--s1));border:1px solid var(--acc);border-radius:18px;padding:18px}.value .row{display:flex;justify-content:space-between;font-size:14.5px;padding:6px 0}.value .row.tot{border-top:1px dashed var(--line);margin-top:6px;padding-top:11px;font-weight:800;font-size:16px}.value .save{color:var(--acc);font-weight:800}.giftbox{margin-top:12px;background:var(--s2);border:1px dashed var(--acc);border-radius:12px;padding:12px;font-size:13.5px}.giftbox b{color:var(--acc)}
.form{background:var(--s1);border:1px solid var(--acc);border-radius:18px;padding:19px}.form label{display:block;font-size:12.5px;color:var(--mut);margin:11px 0 5px;font-weight:700}.form input,.form select{width:100%;background:#070809;border:1px solid var(--line);border-radius:11px;padding:14px;color:#fff;font-size:15px}.form input:focus,.form select:focus{outline:none;border-color:var(--acc)}
.micro{font-size:11.5px;color:var(--mut);margin-top:11px;text-align:center;line-height:1.55}.thanks{display:none;text-align:center;padding:26px 10px}.thanks .big{font-size:48px}
.guar{display:flex;gap:13px;background:color-mix(in srgb,var(--ok) 9%,transparent);border:1px solid color-mix(in srgb,var(--ok) 40%,transparent);border-radius:16px;padding:16px}.guar .ic{font-size:30px}.guar b{color:var(--ok)}
.faq{border:1px solid var(--line);border-radius:13px;margin-bottom:9px;overflow:hidden;background:var(--s1)}.faq summary{padding:15px;font-weight:700;cursor:pointer;font-size:14px;list-style:none;display:flex;justify-content:space-between;gap:10px}.faq summary::-webkit-details-marker{display:none}.faq summary:after{content:"+";color:var(--acc);font-weight:900}.faq[open] summary:after{content:"–"}.faq p{padding:0 15px 15px;font-size:13.5px}
.foot{background:#070809;color:var(--mut);font-size:12px;text-align:center;padding:26px 18px}.foot b{color:#cfd6df}
.sticky{position:fixed;bottom:0;left:0;right:0;z-index:50;background:rgba(11,13,17,.96);backdrop-filter:blur(10px);border-top:1px solid var(--line);padding:9px 14px;display:flex;align-items:center;gap:10px;max-width:560px;margin:0 auto}.sticky .p b{color:var(--acc);font-size:18px;font-weight:900}.sticky .p s{color:var(--mut);font-size:12px}.sticky .btn{margin:0;flex:1;padding:14px;font-size:15px}
.divider{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent);margin:0 18px}
"""

def svgbg(seed):
    return (f'<svg class="bg" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">'
            f'<defs><linearGradient id="g{seed}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".5"/><stop offset="1" stop-color="var(--acc2)" stop-opacity=".16"/></linearGradient></defs>'
            f'<rect width="400" height="400" fill="#10141b"/><rect width="400" height="400" fill="url(#g{seed})"/>'
            f'<circle cx="90" cy="80" r="120" fill="#fff" opacity=".05"/><circle cx="330" cy="320" r="90" fill="#000" opacity=".12"/>'
            f'<g opacity=".4"><rect x="168" y="182" width="64" height="44" rx="8" fill="none" stroke="#fff" stroke-width="3"/><circle cx="200" cy="204" r="12" fill="none" stroke="#fff" stroke-width="3"/><rect x="186" y="174" width="28" height="10" rx="3" fill="#fff"/></g></svg>')

_mc=[0]
def media(prompt, ratio="1/1", video=False):
    _mc[0]+=1; seed=_mc[0]
    full=_h.escape(prompt.replace("\n"," "), quote=True)
    short=_h.escape(prompt.split(".")[0][:54])+"…"
    play='<div class="play"><i>&#9658;</i></div>' if video else ''
    return (f'<figure class="media reveal" style="aspect-ratio:{ratio}">{svgbg(seed)}{play}'
            f'<figcaption class="cap"><span class="chip"><b>EN prompt &middot; Copy:</b> {short}</span>'
            f'<button class="pcopy" data-p="{full}" onclick="cpp(this)">Copy</button></figcaption></figure>')

# ===== English Nano Banana Pro 2 prompt composer =====
def P(scene, lighting, lens, palette, ratio, mood, withprod=True):
    s=(f"{scene}. Lighting: {lighting}. Camera/lens: {lens}. Color palette: {palette}. Mood: {mood}. "
       f"Aspect ratio {ratio}, vertical composition for a mobile landing page, leave clean negative space for text overlay. "
       f"Cinematic photoreal STORYTELLING image, emotionally evocative, authentic candid human emotion that makes the viewer FEEL the moment (not a product-catalog shot), film-still aesthetic, advertising quality, realistic skin/texture, beautiful depth of field. ")
    s+=(CONFIG['product_ref_en']+" ") if withprod else "Do NOT show any product / bottle / packaging / logo in this image - pure emotional lifestyle storytelling. "
    s+=CONFIG['brand_dna_en']+" Negative: no on-image text or typography, no watermark, no distorted hands/fingers, no other brand logos, no NSFW content."
    return s

PRESS=["Tuổi Trẻ","Thanh Niên","VietnamNet","Tiền Phong","24h"]
LENS="85mm f/1.8, shallow depth of field, creamy bokeh"

# ===== 10 angle (copy VN CÓ DẤU; tham số ảnh tiếng Anh) =====
def A(**k): return k
V=[
 A(slug="01-dating-disaster",title="Đừng để buổi hẹn đổ bể vì điều khó nói",acc="#ff5a7a",acc2="#ffb36b",ey="Dating · The Confident Date",
   h1='Đừng để một buổi hẹn hoàn hảo<br><span class="hl">đổ bể vì điều khó nói</span>',
   sub="Đàn ông tinh tế luôn biết chăm sóc cơ thể — đặc biệt là vùng nhạy cảm. Tự tin trong khoảnh khắc gần nhau.",
   pey="Sự thật ngầm",ptitle="Bạn chỉn chu mọi thứ — trừ chỗ quan trọng nhất",plead="Từ đầu tóc tới giày bạn đều chăm, nhưng vùng nhạy cảm thì 'xài tạm'. Đến lúc gần nhau mới quê.",
   pains=["<b>Bí, ẩm, có mùi</b> dù đã tắm.","<b>Một lần ấn tượng mùi</b> là crush nhớ mãi.","<b>Ngại sát gần</b>, né khoảnh khắc tự nhiên."],
   agitq="Một khoảnh khắc 'quê' có thể khiến cô ấy không bao giờ gọi lại.",
   stitle="Bảo bối tự tin trong 30 giây",slead="Bọt vệ sinh nam ONIIZ — khử mùi mạnh, mát lạnh, dịu nhẹ. Sạch thơm, chủ động mọi lúc.",
   proof="400.000+ anh em tự tin hơn",
   testi=[("Hết nơm nớp mỗi lần gần người yêu.","Hoàng N.","27t, Hà Nội"),("Mùi cocktail mát lạnh, sảng khoái.","Duy K.","29t"),("Combo 3 mùi đổi vị, mê Milky.","Anh T.","24t")],
   case=("Từ khi dùng ONIIZ mình tự tin hẳn khi gần người yêu, không còn lo lắng về mùi. Buổi hẹn nào cũng thoải mái.","Hoàng Nam","27 tuổi, Hà Nội","Tự tin sau 1 tuần"),
   ft="Tinh tế từ chỗ không ai thấy",fs="Combo 3 mùi 429k · freeship + quà · COD.",angle="BA",
   subj="a stylish confident Vietnamese man, 27, in a crisp white shirt, neat hair",
   setting="a romantic candle-lit fine-dining restaurant at night, warm amber bokeh",
   surface="a dark wooden table beside a glass of red wine and a candle"),
 A(slug="02-her-pov",title="Con gái nhớ rõ mùi của bạn",acc="#e9b44c",acc2="#ffd98a",ey="Góc nhìn Nàng",
   h1='Con gái không nói,<br>nhưng họ <span class="hl">nhớ rõ mùi của bạn</span>',
   sub="Một thay đổi nhỏ, nàng cảm nhận ngay. Tôn trọng người mình thương bắt đầu từ chính mình.",
   pey="Điều nàng không nói",ptitle="Cô ấy cảm nhận, chỉ là không nỡ nói",plead="Bạn nghĩ tắm xong là xong. Nhưng vùng nhạy cảm bí mùi, người ấy cảm nhận được.",
   pains=["<b>Tắm rồi vẫn không chắc</b> vì thiếu bước chuyên biệt.","<b>Gần gũi nguội đi</b> vì điều tế nhị.","<b>Bạn không biết</b> mình đang mất điểm."],
   agitq="Sự gần gũi nguội đi không vì hết yêu — đôi khi chỉ vì điều tế nhị không ai dám nhắc.",
   stitle="Một thay đổi nhỏ, khác biệt lớn",slead="Bọt ONIIZ thơm dịu hương cocktail, sạch thoáng — nàng cảm nhận ngay từ lần đầu.",
   proof="Các nàng & các chàng nói gì",
   testi=[("Mua cho chồng, anh khen thơm.","Thu Hà","30t"),("Người yêu đổi sang dùng, thích hơn.","Mai L.","26t"),("Milky thơm béo, mình mê.","Ngọc A.","28t")],
   case=("Mình mua tặng bạn trai, ban đầu ngại nói nhưng sau khi anh dùng mình thấy dễ chịu hơn hẳn, gần gũi cũng thoải mái hơn nhiều.","Thu Hà","30 tuổi","Cả hai vui hơn"),
   ft="Tôn trọng người mình thương",fs="Combo 3 mùi 429k · COD toàn quốc.",angle="BA",
   subj="a young Vietnamese couple, the man handsome and the woman leaning on his shoulder",
   setting="a bright bedroom by the window in the morning, soft sheer curtains, gentle sunlight",
   surface="a bright bathroom shelf next to a white towel"),
 A(slug="03-gym-sweat",title="Sáu múi mà bốc mùi thì công cốc",acc="#ff3b30",acc2="#ff9a4d",ey="Gym · Performance",
   h1='Cày 6 múi mệt nghỉ —<br>đừng để <span class="hl">mùi phá hết</span>',
   sub="Mồ hôi sau tập là môi trường lý tưởng cho mùi và hăm. Xử lý đúng cách, sẵn sàng hiệp tiếp theo.",
   pey="Dân gym hiểu",ptitle="Tập hăng nhưng vệ sinh sau tập thì qua loa",plead="Mồ hôi + ma sát + ẩm ướt = thiên đường của mùi.",
   pains=["<b>Mùi sau gym</b> bám dù đã tắm vội.","<b>Hăm, ngứa</b> sau buổi tập nặng.","<b>Tự tin trên sàn</b> mà ngại phòng thay đồ."],
   agitq="Công sức 6 múi đổ sông chỉ vì một mùi khó chịu trong phòng thay đồ.",
   stitle="Làm sạch chuẩn cho người tập",slead="Bọt ONIIZ khử mùi mạnh, mát lạnh, dịu vùng nhạy cảm — bỏ túi gym là xong.",
   proof="Anh em tập luyện review",
   testi=[("Tập xong rửa sạch thơm hẳn.","Đạt PT","27t"),("Để chai trong túi gym, tiện.","Kiên N.","24t"),("Dân đá bóng rất cần.","Hoàng B.","26t")],
   case=("Là HLV mình ra mồ hôi cả ngày, dùng ONIIZ sau buổi tập giúp khử mùi hiệu quả, học viên không còn e ngại khi đứng gần.","Tiến Đạt","27 tuổi, HLV gym","Hết ngại sau tập"),
   ft="Vệ sinh tốt = phong độ tốt",fs="Combo 3 mùi 429k · cho người năng động · COD.",angle="BA",
   subj="a muscular Vietnamese man 25-30 in a tank top with light sweat",
   setting="a modern gym / locker room with dumbbells, dramatic high-contrast lighting",
   surface="a gym bench next to a towel and dumbbells"),
 A(slug="04-scent-cocktail",title="Một hớp cocktail mát lạnh",acc="#ff6f91",acc2="#ffd36b",ey="Scent-led · Mùi Cocktail",
   h1='Một hớp cocktail mát lạnh<br>cho <span class="hl">vùng nhạy cảm</span>',
   sub="Bọt siêu mịn, mát lạnh sảng khoái, hương cocktail thơm không đùa được — rửa tới đâu thích tới đó.",
   pey="Trải nghiệm mùi",ptitle="Bạn xứng đáng một mùi 'có gu' hơn",plead="Mùi xà phòng nhạt, hắc — không hợp đàn ông.",
   pains=["<b>Mùi xà phòng nhạt nhẽo</b>.","<b>Thơm áo quần</b> mà vùng kín 'tậm tịt'.","<b>Chưa từng thấy sảng khoái</b> khi vệ sinh."],
   agitq="Sao phải chịu mùi nhạt nhẽo khi có thể có cảm giác mát lạnh cocktail mỗi ngày?",
   stitle="Bọt siêu mịn — mát lạnh — 3 mùi",slead="Mới rửa trên tay đã thấy mát, thơm dễ chịu. Combo cho bạn thử trọn cả 3.",
   proof="Anh em 'nghiện' mùi này",
   testi=[("Mới rửa đã mát, mê Beachy.","Phúc T.","23t"),("Milky béo ngọt, có gu.","Long N.","22t"),("Juicy mát lạnh, mùa hè đỉnh.","Tiến D.","27t")],
   case=("Mình là đứa thích thơm, dùng qua nhiều loại. ONIIZ Juicy là mùi mình mê nhất — mát lạnh, sảng khoái, thơm lâu mà không gắt.","Minh Phúc","23 tuổi","Mê cả 3 mùi"),
   ft="Chọn mùi của bạn",fs="Combo 3 mùi 429k · Beachy/Juicy/Milky · COD.",angle="BA",
   subj="the three product bottles as hero, or a young man's hand holding one bottle",
   setting="a vibrant studio splash scene with tropical fruit and crushed ice",
   surface="a bed of crushed ice with water droplets and fresh fruit"),
 A(slug="05-science-ph",title="Đừng dùng sữa tắm cho vùng nhạy cảm",acc="#4d7cff",acc2="#7ad0ff",ey="Khoa học · pH",
   h1='Dùng sữa tắm cho "thằng em"<br>là <span class="hl">sai lầm 90%</span> mắc',
   sub="Da vùng nhạy cảm mỏng, pH riêng. Cần sản phẩm chuyên biệt cân bằng pH, không phải xà phòng kiềm mạnh.",
   pey="Điều ít ai biết",ptitle="Càng 'rửa mạnh' càng phản tác dụng",plead="Xà phòng kiềm mạnh làm khô, mất cân bằng pH — khiến vùng nhạy cảm dễ mùi hơn.",
   pains=["<b>Khô rát, bí bách</b> vì dùng sai.","<b>Mùi quay lại nhanh</b> dù rửa kỹ.","<b>Mất cân bằng pH</b> âm ỉ."],
   agitq="Mỗi ngày dùng sai là một ngày vùng da nhạy cảm bị tấn công bởi kiềm mạnh.",
   stitle="Thiết kế riêng cho vùng nhạy cảm",slead="Bọt ONIIZ: cân bằng pH, dưỡng ẩm, hỗ trợ kháng khuẩn, khử mùi — dịu nhẹ hằng ngày.",
   proof="Anh em da nhạy cảm review",
   testi=[("Da dễ kích ứng, dùng không bị rát.","Đức M.","33t"),("Hết khô rát, khô thoáng.","Sơn Đ.","30t"),("Sạch dịu, không gắt.","Hưng V.","28t")],
   case=("Da mình nhạy cảm, trước dùng sữa tắm thì rát, chuyển sang ONIIZ thì dịu hẳn, không còn khô rát, sạch thoáng cả ngày.","Đức Minh","33 tuổi","Hết khô rát"),
   ft="Chăm đúng, tự tin đúng",fs="Combo 3 mùi 429k · dịu nhẹ · COD.",angle="SCI",
   subj="a clean-skinned Korean-looking man, close-up face/shoulder",
   setting="a clean white K-beauty dermatology studio, minimal props",
   surface="a clean white surface with a minimalist lab-style background"),
 A(slug="06-self-love",title="Yêu bản thân từ chỗ không ai thấy",acc="#46d6a8",acc2="#9be7c4",ey="Self-love · Tự tin",
   h1='Yêu bản thân thật sự là<br>chăm <span class="hl">cả chỗ không ai thấy</span>',
   sub="Tự tin không diễn cho ai — nó bắt đầu từ cách bạn đối xử với chính mình mỗi sáng.",
   pey="Sự thật nhẹ nhàng",ptitle="Bạn chăm da, tóc, body — nhưng quên vùng nhạy cảm",plead="Tự tin chưa trọn vì còn cảm giác 'chưa sạch hẳn'.",
   pains=["<b>Cảm giác chưa sạch hẳn</b> khiến bạn ngại.","<b>Bỏ quên vùng nhạy cảm</b> trong routine.","<b>Tự tin chưa trọn</b> dù chăm bề ngoài."],
   agitq="Bạn đầu tư cho bề ngoài nhưng quên mất điều khiến mình thực sự thoải mái.",
   stitle="Một bước nhỏ mỗi ngày",slead="Bọt ONIIZ — 30 giây mỗi sáng, sạch thơm, bạn thấy khác từ bên trong.",
   proof="Anh em chăm bản thân nói gì",
   testi=[("Thành thói quen, sáng nào cũng tự tin.","Sơn T.","30t"),("Chăm sóc tử tế, dễ chịu.","Khoa Đ.","32t"),("Mùi nhẹ, rất thích.","Vinh Q.","29t")],
   case=("Từ khi thêm bước này vào routine sáng, mình thấy sạch sẽ và tự tin hơn hẳn, ngày mới bắt đầu nhẹ nhàng.","Thanh Sơn","30 tuổi","Thói quen mới"),
   ft="Yêu bản thân là một lựa chọn",fs="Combo 3 mùi 429k · COD toàn quốc.",angle="BA",
   subj="a relaxed man 28-32 in a white tee with a calm, peaceful expression",
   setting="a minimalist bright bathroom with a green plant and soft daylight",
   surface="a wooden shelf next to a towel and a small plant"),
 A(slug="07-glowup-30d",title="30 ngày nâng cấp tự tin",acc="#f0a830",acc2="#ffce6b",ey="Glow-up · 30 ngày",
   h1='30 ngày để<br><span class="hl">nâng cấp</span> sự tự tin',
   sub="Glow-up không chỉ da với tóc. Nâng cấp cả chỗ riêng tư nhất — mỗi ngày 30 giây.",
   pey="Khoảnh khắc nhận ra",ptitle="Bạn đã quen với 'chưa đủ tự tin'",plead="Đổi tóc, mua đồ mới — nhưng cảm giác bí bách vẫn còn đó.",
   pains=["<b>Tuần này như tuần trước</b>.","<b>Muốn thay đổi</b> mà không biết bắt đầu.","<b>Thử lẻ tẻ</b>, không hệ thống."],
   agitq="Mỗi ngày trôi qua không thay đổi là một ngày bạn kém tự tin hơn bạn có thể.",
   stitle="1 combo = hệ thống 30 ngày",slead="Đủ 3 mùi đổi vị cho cả tháng. Mỗi sáng 30 giây, sau 30 ngày nhìn lại sẽ khác.",
   proof="Họ đã thay đổi",
   testi=[("Tuần 1 sạch thơm, tuần 4 tự tin.","Hải Đ.","27t"),("Giờ sáng nào cũng làm.","Minh T.","23t"),("Bạn bè bảo nhìn tươi hẳn.","Cường V.","31t")],
   case=("Mình thử thách 30 ngày, tuần đầu đã thấy sạch thơm, hết tháng thì tự tin hẳn — bạn gái còn khen.","Hải Đăng","27 tuổi","30 ngày thay đổi"),
   ft="Thay đổi không bao giờ là muộn",fs="Bắt đầu hôm nay · combo 429k · COD.",angle="BA",
   subj="a dynamic young man 23-28, modern style, confident split before/after vibe",
   setting="a moody studio with amber accent light, motivational tone",
   surface="a dark surface next to a 30-day calendar"),
 A(slug="08-vs-soap",title="Bọt vệ sinh vs Xà phòng",acc="#c6ff3a",acc2="#e6ff8f",ey="So sánh · Education",
   h1='Sữa tắm vs Bọt vệ sinh nam<br><span class="hl">khác biệt mà ít ai biết</span>',
   sub="Cùng là 'làm sạch' nhưng dùng sữa tắm cho vùng nhạy cảm khác xa bọt chuyên biệt.",
   pey="Giáo dục nhanh",ptitle="Dùng sai mỗi ngày = hại mỗi ngày",plead="Sữa tắm kiềm mạnh, hương hắc, làm khô.",
   pains=["<b>Sữa tắm làm khô rát</b>.","<b>Mùi hắc</b>, không hợp.","<b>Mùi quay lại nhanh</b>."],
   agitq="Bạn sẽ ngạc nhiên khi biết cái mình dùng hằng ngày đang phản tác dụng.",
   stitle="Dùng đúng thứ vùng nhạy cảm cần",slead="Bọt ONIIZ siêu mịn, pH cân bằng, dưỡng ẩm, khử mùi — chuyển sang dùng đúng ngay.",
   proof="Anh em chuyển sang nói gì",
   testi=[("Bỏ sữa tắm cho vùng kín, dễ chịu hẳn.","Nam P.","28t"),("Khác biệt rõ.","Tuấn A.","31t"),("Biết sớm thì đỡ khổ.","Quang L.","25t")],
   case=("Trước mình dùng đại sữa tắm, hay bị khô. Sau khi hiểu ra và chuyển sang bọt chuyên biệt, khác biệt thấy rõ chỉ sau vài ngày.","Nam Phong","28 tuổi","Khác biệt rõ rệt"),
   ft="Dùng đúng cái cần dùng",fs="Combo 3 mùi 429k · tiết kiệm 168k · COD.",angle="CMP",
   subj="a man's hand placing the ONIIZ bottle next to an old bar of soap",
   setting="a graphic comparison studio on a dark background with neon accents",
   surface="a dark surface with soap on one side and the bottle on the other"),
 A(slug="09-gift-nudge",title="Nhắc khéo chàng không làm chàng tự ái",acc="#f6d68a",acc2="#ffe7a8",ey="Quà tặng · Cho Nàng",
   h1='Cách nhắc khéo chàng<br>mà <span class="hl">không làm chàng tự ái</span>',
   sub="Có những điều khó nói trực tiếp — hãy để món quà nói thay. Tinh tế mà hiệu quả.",
   pey="Dành cho Nàng",ptitle="Nói thẳng thì sợ chàng tự ái",plead="Bạn yêu chàng, nhưng ước chàng tinh tế hơn.",
   pains=["<b>Khó nói trực tiếp</b> chuyện tế nhị.","<b>Im lặng thì khó chịu</b>.","<b>Nói thẳng dễ căng</b>."],
   agitq="Yêu thương đúng cách là quan tâm mà không làm đối phương tổn thương.",
   stitle="Bộ quà tinh tế — chàng thích, bạn vui",slead="Combo 3 mùi đóng gói đẹp, kèm lời nhắn — chàng dùng thấy thích.",
   proof="Người tặng & người nhận",
   testi=[("Tặng nhẹ nhàng, anh ấy thích.","Linh Đ.","26t"),("Hộp đẹp khỏi gói.","Mai A.","29t"),("Được tặng, dùng ghể luôn.","Tuấn","28t")],
   case=("Mình tặng sinh nhật bạn trai, hộp rất đẹp nên khỏi gói. Anh thích, dùng khen thơm — mà mình cũng được điều mình mong.","Khánh Linh","26 tuổi","Tặng trúng ý"),
   ft="Yêu là quan tâm điều nhỏ nhất",fs="Combo 3 mùi 429k tặng chàng · COD.",angle="BA",
   subj="a woman's hands offering a gift box, or an elegant gift box as hero",
   setting="a bright wooden table with flowers and a ribbon, elegant feminine soft styling",
   surface="a bright wooden table with flowers and a greeting card"),
 A(slug="10-summer-heat",title="Mát lạnh giải cứu mùa nóng",acc="#2fd6c0",acc2="#7af0dd",ey="Mùa nóng · Bí bách",
   h1='Mùa nóng là<br><span class="hl">thiên đường của mùi</span>',
   sub="Nóng + ẩm + mồ hôi = vùng nhạy cảm bí bách, bốc mùi. Bọt ONIIZ mát lạnh giải cứu tức thì.",
   pey="Mùa hè ai cũng dính",ptitle="Trời nóng, 'thằng em' dễ tố cáo nhất",plead="Ngồi lâu, quần bó, trời nóng — bí, ngứa, ẩm cả ngày.",
   pains=["<b>Bí bách, ẩm ướt</b> cả ngày hè.","<b>Mùi nặng hơn</b> khi trời nóng.","<b>Bứt rứt, ngại gần</b> người khác."],
   agitq="Cái nóng mùa hè biến mỗi giờ thành thử thách giữ cho bạn tự tin.",
   stitle="Mát lạnh sảng khoái tức thì",slead="Bọt ONIIZ khử mùi, khô thoáng, cảm giác mát lạnh ngay — vũ khí sống sót mùa nóng.",
   proof="Anh em mùa hè review",
   testi=[("Rửa xong mát lạnh, sạch cả ngày.","Bảo T.","25t"),("Hết bí bách khi đi nắng.","Hùng D.","30t"),("Juicy mùa nóng cực hợp.","Phong N.","27t")],
   case=("Mùa hè Sài Gòn nóng kinh khủng, từ khi dùng ONIIZ mình thấy mát lạnh sảng khoái cả ngày, hết cảnh bí bách khó chịu.","Bảo Trân","25 tuổi","Mát lạnh cả ngày"),
   ft="Mát lạnh, tự tin cả mùa hè",fs="Combo 3 mùi 429k · COD toàn quốc.",angle="BA",
   subj="a young man in summer outdoors feeling refreshed and cool",
   setting="a fresh bright summer scene with cool blue tones, ice and water",
   surface="a bed of ice with water droplets"),
]

def angle_html(kind):
    if kind=="CMP":
        return ('<section><span class="eyebrow reveal">So sánh</span><h2 class="reveal">Sữa tắm vs Bọt ONIIZ</h2><table class="cmp reveal"><tr><th></th><th>Sữa tắm</th><th class="me">Bọt ONIIZ</th></tr><tr><td>Cân bằng pH</td><td class="no">✕</td><td class="me yes">✓</td></tr><tr><td>Khử mùi chuyên biệt</td><td class="no">✕</td><td class="me yes">✓</td></tr><tr><td>Dưỡng ẩm, không khô</td><td>~</td><td class="me yes">✓</td></tr><tr><td>Bọt mịn, mát lạnh</td><td class="no">✕</td><td class="me yes">✓</td></tr></table></section>')
    if kind=="SCI":
        return ('<section><span class="eyebrow reveal">Cơ chế</span><h2 class="reveal">4 việc bọt ONIIZ làm</h2><div class="bgrid"><div class="ben reveal"><b>1 · Khử mùi</b><span>tận gốc, không che lấp</span></div><div class="ben reveal d1"><b>2 · Cân bằng pH</b><span>vùng da nhạy cảm</span></div><div class="ben reveal d2"><b>3 · Dưỡng ẩm</b><span>hết khô rát</span></div><div class="ben reveal d3"><b>4 · Kháng khuẩn</b><span>khô thoáng cả ngày</span></div></div></section>')
    return ('<section><span class="eyebrow reveal">Tóm tắt</span><h2 class="reveal">3 lý do mua hôm nay</h2><div class="bgrid reveal"><div class="ben" style="text-align:left"><b style="color:var(--acc)">Tiết kiệm 168k</b><span>Combo rẻ hơn mua lẻ</span></div><div class="ben" style="text-align:left"><b style="color:var(--acc)">Freeship + quà</b><span>Ưu đãi có hạn</span></div><div class="ben" style="text-align:left"><b style="color:var(--acc)">COD an toàn</b><span>Kiểm hàng mới trả tiền</span></div><div class="ben" style="text-align:left"><b style="color:var(--acc)">Top 1 TikTok</b><span>400.000+ khách tin</span></div></div></section>')

def page(c):
    _mc[0]=0
    p_hero=P(f"cinematic emotional storytelling hero, NO product visible: {c['subj']} at {c['setting']}, an authentic candid human moment that embodies quiet self-assured confidence and the emotional payoff the customer secretly wants, evocative film-still, atmosphere over posing",
             "soft cinematic key light with gentle rim light", LENS, "rich cinematic grade", "4:5", "aspirational, emotionally magnetic", withprod=False)
    p_agit=P(f"cinematic emotional storytelling, NO product visible: {c['subj']} caught in a quiet vulnerable self-conscious moment at {c['setting']}, body language hinting at the hidden insecurity/pain behind the surface, moody cinematic film-still that makes the viewer empathize",
             "moody low-key lighting for emotional depth", LENS, "desaturated cool melancholic grade", "16:9", "the unspoken pain", withprod=False)
    p_prod=P(f"premium product photography of the three ONIIZ bottles arranged on {c['surface']}, soft reflections, a few water droplets and fine foam",
             "soft studio light, gentle reflections", "100mm macro, f/8 deep focus", "clean, premium", "1:1", "clean, premium")
    p_r1=P(f"close-up POV of {c['subj']}'s hand pumping white micro-foam into the palm in a bright modern bathroom","natural window light",LENS,"clean, fresh","1:1","clean, everyday")
    p_r2=P(f"{c['subj']} gently applying soft cloud-like foam, slight steam, foggy bathroom mirror","soft natural light",LENS,"fresh, soothing","1:1","relaxed, refreshing")
    p_r3=P(f"{c['subj']} after use, towel in hand, fresh confident expression stepping out of the bathroom","bright natural light",LENS,"fresh, bright","1:1","confident, fresh")
    p_before=P(f"cinematic BEFORE state, NO product: {c['subj']} with a tense low-confidence uncomfortable expression, dull cool lifeless grade, visual storytelling of the problem","flat cool lighting",LENS,"cool grey, low energy","1:1","before - emotional low", withprod=False)
    p_after=P(f"{c['subj']} radiant and confident, warm bright grade, holding the product (AFTER state)","warm radiant lighting",LENS,"warm, vibrant","1:1","after - positive")
    p_case=P(f"authentic real portrait of {c['subj']} in natural window light, genuine satisfied expression, half-body","natural window light",LENS,"natural, trustworthy","4:5","authentic, credible")
    p_video=P(f"talking-head frame of {c['subj']} sitting and telling a story at {c['setting']}, authentic UGC vibe shot on a good phone","natural light","35mm, f/2.0","natural","16:9","relatable, trustworthy")
    p_founder=P("portrait of a 35-40 year-old Vietnamese male founder/expert in a smart blazer, dark branded office background","soft studio light","50mm, f/2.0","trustworthy neutral","1:1","authoritative, credible")
    def p_sc(name,props,col):
        return P(f"a single ONIIZ {name} bottle as hero surrounded by {props}, {col} colored splash/mist on a dark contrast background, artistic product macro","soft macro light","100mm macro, f/4",f"{col} accent","1:1","fresh, scent-evoking")
    def p_ugc(i):
        return P(f"customer-style phone photo: {c['subj']} holding/placing the ONIIZ bottle in an everyday spot (desk, bathroom shelf, gym bag), natural phone lighting, authentic UGC #{i}","natural phone light","phone camera, casual","natural","1:1","authentic, trustworthy")
    pains="\n".join([f'<div class="pain reveal d{min(i,3)}"><div class="x">✕</div><div>{p}</div></div>' for i,p in enumerate(c["pains"])])
    testi="\n".join([f'<div class="tcard"><div class="stars">★★★★★</div><p style="margin-top:8px;color:#e6ebf2">"{q}"</p><div class="who"><div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--acc),var(--acc2))"></div><div><b>{n}</b> <span>· {a}</span></div></div></div>' for q,n,a in c["testi"]])
    ugc="\n".join([media(p_ugc(i+1),"1/1") for i in range(6)])
    press="".join([f'<span class="lg">{x}</span>' for x in PRESS])
    cs=c["case"]; PX=CONFIG["pixel_id"]
    dna_box=(f'<div class="dna reveal"><b>🎨 Brand Visual DNA</b> — dán vào ô "Add to every prompt" của LP-Image-Studio để ảnh nhất quán:<br><span id="dna">{_h.escape(CONFIG["brand_dna_en"])}</span>'
             f'<button class="pcopy" data-p="{_h.escape(CONFIG["brand_dna_en"],quote=True)}" onclick="cpp(this)">Copy</button></div>')
    H=[]
    H.append(f'<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>{c["title"]} | {CONFIG["brand"]}</title><meta name="description" content="{c["sub"][:150]}">')
    H.append(f'<!-- BRAND VISUAL DNA (English, paste into LP-Image-Studio "add to every prompt"): {CONFIG["brand_dna_en"]} -->')
    H.append(f'<style>{CSS.replace("__ACC__",c["acc"]).replace("__ACC2__",c["acc2"])}</style></head><body><div class="wrap">')
    H.append(f'<div class="marq"><span>🚚 COD TOÀN QUỐC&nbsp;&nbsp;•&nbsp;&nbsp;✨ PHIÊN BẢN PLUS 145ML&nbsp;&nbsp;•&nbsp;&nbsp;🎁 {CONFIG["gift"].upper()}&nbsp;&nbsp;•&nbsp;&nbsp;⭐ TOP 1 TIKTOK SHOP&nbsp;&nbsp;•&nbsp;&nbsp;💸 TIẾT KIỆM {CONFIG["save"]}&nbsp;&nbsp;•&nbsp;&nbsp;</span></div>')
    H.append(f'<div class="nav"><div class="logo">{CONFIG["brand"]}</div><div class="mini">⭐ 5.0 · 400.000+ anh em</div></div>')
    H.append(f'<section class="hero"><span class="eyebrow">{c["ey"]}</span><h1>{c["h1"]}</h1><p class="sub">{c["sub"]}</p><div style="margin:16px 0">{media(p_hero,"4/5")}</div><div class="price"><span class="old">{CONFIG["price_old"]}</span><span class="new">{CONFIG["price_new"]}</span><span class="save">{CONFIG["save_pct"]}</span></div><a href="#order" class="btn">ĐẶT COMBO {CONFIG["price_new"]} — COD →</a><div class="chips"><span class="chiptrust">🏆 <b>Top 1</b> TikTok Shop</span><span class="chiptrust">👥 <b>400K+</b> khách</span><span class="chiptrust">⭐ <b>5.0</b></span></div></section>')
    H.append(f'<div class="press">{press}</div><div class="divider"></div>')
    H.append(f'<section><span class="eyebrow reveal">{c["pey"]}</span><h2 class="reveal">{c["ptitle"]}</h2><p class="reveal d1 mut" style="margin:8px 0 14px">{c["plead"]}</p>{pains}</section>')
    H.append(f'<section><div class="fullq reveal" style="aspect-ratio:16/9">{media(p_agit,"16/9")}<div class="ov"><p>"{c["agitq"]}"</p></div></div></section>')
    H.append(f'<section><span class="eyebrow reveal">Giải pháp</span><h2 class="reveal">{c["stitle"]}</h2><p class="reveal d1" style="margin:8px 0 14px">{c["slead"]}</p>{media(p_prod,"1/1")}<div class="sp"></div><a href="#order" class="btn ghost reveal">XEM COMBO 3 MÙI →</a></section>')
    H.append('<section><span class="eyebrow reveal">3 mùi nâng cấp</span><h2 class="reveal">Chọn gu của bạn</h2><div class="tabs reveal"><div class="tab on" data-t="0">Beachy</div><div class="tab" data-t="1">Juicy</div><div class="tab" data-t="2">Milky</div></div><div class="reveal">'
     f'<div class="scpane on">{media(p_sc("Beachy","peach, orange and lemongrass","warm peach-orange"),"4/5")}<div class="role"><b style="color:var(--acc)">Beachy</b> — Đào · cam · sả: tươi mát, ngọt ngào, năng động.</div></div>'
     f'<div class="scpane">{media(p_sc("Juicy","tropical fruit: pineapple, passion fruit, citrus","tropical pink-orange"),"4/5")}<div class="role"><b style="color:var(--acc)">Juicy</b> — Trái cây nhiệt đới: cuốn hút, thanh mát, trẻ trung.</div></div>'
     f'<div class="scpane">{media(p_sc("Milky","vanilla, coconut milk and cream","creamy white-beige"),"4/5")}<div class="role"><b style="color:var(--acc)">Milky</b> — Vani · sữa dừa: béo ngọt, ấm áp, có gu.</div></div></div></section>')
    H.append('<section><span class="eyebrow reveal">Vì sao chọn ONIIZ</span><h2 class="reveal">4 lý do khó chối</h2><div class="bgrid"><div class="ben reveal"><div class="e">💧</div><b>Khử mùi mạnh</b><span>Sạch sâu cả ngày</span></div><div class="ben reveal d1"><div class="e">⚖️</div><b>Dịu nhẹ · pH</b><span>Không khô rát</span></div><div class="ben reveal d2"><div class="e">🍸</div><b>Thơm cocktail</b><span>Mát lạnh sảng khoái</span></div><div class="ben reveal d3"><div class="e">✨</div><b>Tự tin gần gũi</b><span>Chủ động mọi lúc</span></div></div></section>')
    H.append(f'<section><span class="eyebrow reveal">Cách dùng</span><h2 class="reveal">3 bước — 30 giây mỗi sáng</h2><div class="reveal" style="margin-top:14px"><div class="step"><div class="no">1</div><div class="b"><h3>Lấy bọt</h3><div class="mut" style="font-size:13px">Nhấn 1-2 pump ra lòng bàn tay.</div><div class="mm">{media(p_r1,"16/9")}</div></div></div><div class="step"><div class="no">2</div><div class="b"><h3>Massage nhẹ</h3><div class="mut" style="font-size:13px">Thoa đều vùng nhạy cảm, massage 20-30 giây.</div><div class="mm">{media(p_r2,"16/9")}</div></div></div><div class="step"><div class="no">3</div><div class="b"><h3>Rửa sạch</h3><div class="mut" style="font-size:13px">Rửa lại với nước, lau khô — sạch thơm tự tin.</div><div class="mm">{media(p_r3,"16/9")}</div></div></div></div></section>')
    H.append(f'<section><span class="eyebrow reveal">Khác biệt</span><h2 class="reveal">Trước &amp; sau</h2><div class="ba reveal" style="margin-top:14px"><div><div class="lbl b1">TRƯỚC</div>{media(p_before,"1/1")}</div><div><div class="lbl b2">SAU</div>{media(p_after,"1/1")}</div></div></section>')
    H.append('<section><div class="stats"><div class="stat reveal"><div class="n" data-count="400000" data-suf="+">0</div><div class="l">Khách 4 năm</div></div><div class="stat reveal d1"><div class="n" data-count="12000" data-suf="+">0</div><div class="l">Đánh giá</div></div><div class="stat reveal d2"><div class="n" data-count="98" data-suf="%">0</div><div class="l">Hài lòng</div></div></div></section>')
    H.append(f'<section><span class="eyebrow reveal">Câu chuyện thật</span><h2 class="reveal">{cs[1]}, {cs[2]}</h2><div class="case reveal" style="margin-top:12px">{media(p_case,"4/5")}<p style="margin-top:12px;color:#e6ebf2">"{cs[0]}"</p><div class="res"><span>{cs[3]}</span><span>Tự tin hơn</span><span>Đã dùng 30+ ngày</span></div></div></section>')
    H.append(f'<section><span class="eyebrow reveal">Khách nói gì</span><h2 class="reveal">{c["proof"]}</h2><div class="rate reveal" style="margin-top:12px"><div class="sc">4.9</div><div><div class="stars">★★★★★</div><div class="mut" style="font-size:12px">12.000+ đánh giá · 98% hài lòng</div></div></div><div class="caro">{testi}</div><div class="sp"></div>{media(p_video,"16/9",True)}<p class="mut reveal" style="font-size:12.5px;text-align:center;margin-top:14px">Ảnh thật anh em gửi về (UGC)</p><div class="ugc">{ugc}</div></section>')
    H.append(angle_html(c["angle"]))
    H.append(f'<section><span class="eyebrow reveal">Thương hiệu</span><h2 class="reveal">Vì sao 400.000+ anh em tin {CONFIG["brand"]}</h2><div class="founder reveal" style="margin-top:12px"><div class="av">{media(p_founder,"1/1")}</div><div><p style="font-size:14px">"Chúng tôi làm {CONFIG["brand"]} vì tin rằng đàn ông xứng đáng được chăm sóc tử tế — kể cả chỗ riêng tư nhất."</p><div class="mut" style="font-size:12.5px;margin-top:6px">— Đội ngũ {CONFIG["brand"]} / {CONFIG["company"].replace("CÔNG TY TNHH ","")}</div></div></div></section>')
    H.append(f'<section class="center"><span class="eyebrow reveal">Ưu đãi có hạn</span><h2 class="reveal">Combo + quà kết thúc sau</h2><div class="cd reveal"><div class="u"><div class="n" id="cd-h">22</div><div class="l">Giờ</div></div><div class="u"><div class="n" id="cd-m">00</div><div class="l">Phút</div></div><div class="u"><div class="n" id="cd-s">00</div><div class="l">Giây</div></div></div><div class="value reveal" style="text-align:left"><div class="row"><span>3 chai mua lẻ</span><span>{CONFIG["price_old"]}</span></div><div class="row"><span>Combo 3 mùi</span><span class="save">{CONFIG["price_new"]}</span></div><div class="row tot"><span>Bạn tiết kiệm</span><span class="save">{CONFIG["save"]} ({CONFIG["save_pct"]})</span></div><div class="giftbox">🎁 <b>Mua combo — {CONFIG["gift"]}</b> · COD kiểm tra hàng trước khi trả tiền.</div></div></section>')
    H.append(f'<section id="order"><span class="eyebrow">Đặt hàng COD</span><h2>Để lại thông tin — shop gọi trong 15 phút</h2><form class="form" style="margin-top:14px" id="codForm"><label>Họ tên *</label><input name="name" required placeholder="Nguyễn Văn A"><label>Số điện thoại *</label><input name="phone" type="tel" required pattern="^0[0-9]{{9}}$" placeholder="09xxxxxxxx"><label>Địa chỉ nhận hàng *</label><input name="address" required placeholder="Số nhà, đường, phường/xã, quận, tỉnh"><label>Mùi yêu thích (combo đủ 3)</label><select name="fav"><option>Cả 3 mùi</option><option>Beachy</option><option>Juicy</option><option>Milky</option></select><label>Số lượng</label><select name="qty"><option>1 combo ({CONFIG["price_new"]})</option><option>2 combo</option><option>3 combo</option></select><div class="sp"></div><button class="btn" type="submit">🛒 ĐẶT COMBO {CONFIG["price_new"]} — COD</button><div class="micro">🔒 Bảo mật · Giao toàn quốc · <b>Kiểm tra hàng trước khi trả tiền</b> · {CONFIG["gift"]}</div></form><div class="thanks" id="thanks"><div class="big">✅</div><h2>Đặt hàng thành công!</h2><p class="mut" style="margin-top:8px">Shop gọi xác nhận trong 15 phút.</p></div></section>')
    H.append('<section><div class="guar reveal"><div class="ic">🛡️</div><div><b>Yên tâm tuyệt đối.</b> COD toàn quốc — kiểm tra hàng trước khi thanh toán. Không ưng, không nhận.</div></div></section>')
    H.append('<section><span class="eyebrow">Hỏi &amp; đáp</span><h2>Câu hỏi thường gặp</h2><div class="sp"></div><details class="faq"><summary>Mùi có nồng không?</summary><p>Thơm hương cocktail, dịu và mát — không gắt.</p></details><details class="faq"><summary>Dùng vùng nhạy cảm an toàn?</summary><p>Công thức dịu nhẹ, cân bằng pH, dưỡng ẩm — dùng hằng ngày.</p></details><details class="faq"><summary>Combo gồm gì?</summary><p>3 chai Masculine Foam Plus 145ml: Beachy, Juicy, Milky.</p></details><details class="faq"><summary>Bao lâu nhận hàng?</summary><p>Nội thành 1-2 ngày, tỉnh 2-4 ngày. Shop gọi xác nhận trước khi giao.</p></details><details class="faq"><summary>Thanh toán thế nào?</summary><p>COD — nhận hàng kiểm tra rồi mới trả tiền.</p></details></section>')
    H.append(f'<section class="center hero"><h2 class="reveal">{c["ft"]}</h2><p class="reveal d1 sub">{c["fs"]}</p><a href="#order" class="btn reveal d2">ĐẶT COMBO {CONFIG["price_new"]} NGAY →</a></section>')
    H.append(f'<div class="foot"><b>{CONFIG["company"]}</b> · {CONFIG["brand"]}<br>Hotline {CONFIG["hotline"]} · {CONFIG["email"]}<br><span style="opacity:.6">© 2026 {CONFIG["brand"]} · Đã thông báo Bộ Công Thương</span></div></div>')
    H.append(f'<div class="sticky"><div class="p"><b>{CONFIG["price_new"]}</b> <s>{CONFIG["price_old"]}</s></div><a href="#order" class="btn">ĐẶT NGAY →</a></div>')
    H.append(f'<script>var SHEET_ENDPOINT="";var LP_NAME="{c["title"]}";</script>')
    H.append("<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','"+PX+"');fbq('track','PageView');</script>")
    H.append('<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id='+PX+'&ev=PageView&noscript=1"/></noscript>')
    H.append(r"""<script>
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}})},{threshold:.12});
document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
function cup(el){var t=+el.dataset.count,suf=el.dataset.suf||'',st=null;function step(ts){if(!st)st=ts;var p=Math.min((ts-st)/1400,1);var v=Math.floor(p*t);el.textContent=(v>=1000?v.toLocaleString('vi-VN'):v)+suf;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);}
var io2=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){cup(x.target);io2.unobserve(x.target);}})},{threshold:.6});document.querySelectorAll('[data-count]').forEach(function(el){io2.observe(el)});
var vc=false;window.addEventListener('scroll',function(){if(vc)return;if((window.scrollY+window.innerHeight)/document.body.scrollHeight>.5){vc=true;try{fbq('track','ViewContent');}catch(e){}}},{passive:true});
(function(){var end=Date.now()+22*3600*1000;function t(){var d=Math.max(0,end-Date.now()),h=Math.floor(d/3.6e6),m=Math.floor(d%3.6e6/6e4),s=Math.floor(d%6e4/1e3);var H=document.getElementById('cd-h');if(!H)return;H.textContent=String(h).padStart(2,'0');document.getElementById('cd-m').textContent=String(m).padStart(2,'0');document.getElementById('cd-s').textContent=String(s).padStart(2,'0');}t();setInterval(t,1000);})();
document.querySelectorAll('.tab').forEach(function(tb){tb.addEventListener('click',function(){var i=+tb.dataset.t;document.querySelectorAll('.tab').forEach(function(x){x.classList.remove('on')});tb.classList.add('on');var ps=document.querySelectorAll('.scpane');ps.forEach(function(x){x.classList.remove('on')});ps[i].classList.add('on');});});
function cpp(b){navigator.clipboard.writeText(b.dataset.p).then(function(){var o=b.textContent;b.textContent='OK';b.classList.add('done');setTimeout(function(){b.textContent=o;b.classList.remove('done')},1300)})}
document.getElementById('codForm').addEventListener('submit',function(e){e.preventDefault();var f=e.target;var data={lp:LP_NAME,name:f.name.value,phone:f.phone.value,address:f.address.value,fav:f.fav.value,qty:f.qty.value,ts:new Date().toISOString()};try{fbq('track','Lead',{content_name:LP_NAME,value:429000,currency:'VND'});}catch(x){}function done(){f.style.display='none';var th=document.getElementById('thanks');th.style.display='block';th.scrollIntoView({behavior:'smooth'});}if(SHEET_ENDPOINT){fetch(SHEET_ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(data)}).then(done).catch(done);}else{done();}return false;});
</script></body></html>""")
    return "".join(H)

cards=[]
for c in V:
    open(os.path.join(OUT,f"{c['slug']}.html"),"w",encoding="utf-8").write(page(c)); cards.append(c); print("wrote",c["slug"])
idx='<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>'+CONFIG["brand"]+' — LP Factory</title><style>body{margin:0;background:#0b0d11;color:#f3f6fa;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:28px 16px;line-height:1.6}.wrap{max-width:820px;margin:0 auto}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:14px;margin-top:18px}a.c{display:block;background:#13171e;border:1px solid #262d39;border-radius:14px;padding:16px;text-decoration:none;color:#f3f6fa}.t{font-size:14px;font-weight:700;margin-top:6px}.b{font-size:11px;font-weight:800;text-transform:uppercase}</style></head><body><div class="wrap"><h1>'+CONFIG["brand"]+' — '+str(len(cards))+' Landing Page</h1><p style="color:#98a2b2">Copy VN có dấu · prompt ảnh tiếng Anh + Brand DNA · form COD→Sheet · pixel '+CONFIG["pixel_id"]+'.</p><div class="g">'
for c in cards: idx+=f'<a class="c" href="{c["slug"]}.html" style="border-color:{c["acc"]}44"><div class="b" style="color:{c["acc"]}">{c["ey"]}</div><div class="t">{c["title"]}</div></a>'
idx+='</div></div></body></html>'
open(os.path.join(OUT,"index.html"),"w",encoding="utf-8").write(idx)
print("DONE",len(cards),OUT)
