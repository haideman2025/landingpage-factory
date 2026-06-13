# Viral Blueprint — Bố cục LP thích ứng theo format thắng (Approach B)

- Ngày: 2026-06-13
- Bối cảnh: tiếp nối `2026-06-11-coreviral-upgrade-analysis.md`. COREVIRAL đã điều khiển **copy** (phễu 5 lớp) + **5 góc ad**. Lần này điều khiển **BỐ CỤC LP**: layout tự thích ứng theo "format thắng" của từng góc, đẩy "vũ khí" của format lên trên + above-the-fold = đúng cú hook 0–3s.
- Quyết định brainstorm: (1) **AI tự gán blueprint** cho mỗi LP theo insight; (2) mức render = **sắp xếp lại + nhấn mạnh section CÓ SẴN** (giữ nguyên components, renderer thành data-driven). Phase 2 (sau): nâng tư duy tạo ảnh toàn bộ slot + rubric chấm điểm ảnh.

## 1. Mục tiêu & phi-mục tiêu

**Mục tiêu**
- Mỗi góc LP được gán 1 trong **5 Viral Blueprint** → quyết định thứ tự + nhấn mạnh các section.
- Above-the-fold (hero) + ảnh hero đi theo blueprint (hook đúng format).
- Renderer trở thành **data-driven theo thứ tự**, có **fallback** về thứ tự hiện tại → hành vi cũ không đổi nếu thiếu blueprint.

**Phi-mục tiêu (KHÔNG làm lần này)**
- Không thêm loại section mới.
- Không đổi JSON schema hiện có ngoài việc THÊM 1 field `blueprint` (additive).
- Không đụng tư duy tạo ảnh cho các slot ngoài hero (để Phase 2).
- Không thêm bảng điểm Viral Score (đó là Approach C).

## 2. 5 Viral Blueprint (key → vũ khí đẩy lên)

| key | Format COREVIRAL | Above-the-fold hook | Section "vũ khí" đẩy lên |
|---|---|---|---|
| `insight_pain` | Insight / Nỗi đau | hero UGC "đúng là mình", KHÔNG sản phẩm | Nỗi đau + Khoét sâu (story-agitate) ngay sau hero |
| `experiment` | Thử nghiệm / Thử thách | hero đang TEST sản phẩm, overlay "Thử X ngày" | Before/After + Cơ chế (story) lên đầu |
| `ranking` | Xếp hạng / So sánh / Chấm điểm | hero kiểu "VS"/scoreboard | Bảng So sánh + USP lên section 2–3 |
| `ugc_reaction` | Reaction / POV / UGC thật | hero ảnh review/phản ứng khách thật | Review carousel + UGC + Video KOC lên giữa-trên |
| `offer_fomo` | Offer / FOMO | hero deal-forward, overlay "−X% / cháy hàng" | Giá+Quà+Đếm ngược + Số liệu lên sớm |

Mọi blueprint vẫn render ĐỦ section ở phần sau; **form đặt hàng luôn nằm sau khi cảm xúc đã chín** (sau social proof + offer). Section rỗng (vd compare/scent/stats không có dữ liệu) tự render thành chuỗi rỗng — không ảnh hưởng.

## 3. Kiến trúc (3 phần)

### A. Prompt `genConfigs` (rủi ro thấp, additive)
- Thêm vào schema `angles[i]`: `"blueprint": "<one of: insight_pain|experiment|ranking|ugc_reaction|offer_fomo>"`.
- Chỉ dẫn AI: **chọn blueprint hợp nhất theo insight/cách thể hiện** của góc đó; viết `ey`/`h1` + scene ảnh `images.hero` đúng phong cách hook của blueprint (đã có sẵn hướng dẫn hero UGC — bổ sung nhánh theo blueprint).
- Nếu có `window.SEED` (winning insight có "cách thể hiện"), ưu tiên map từ đó.

### B. Refactor `renderLP` thành data-driven
- Tách phần body (dòng 627–647) thành **map `SEC`** các khối có tên: `hero, trust, herostats, pain, story, cta1, scent, features, beforeafter, stats, compare, reviews, koc, video, closing, offer, order, guarantee, faq, footerhero, cta2`.
- `DEFAULT_ORDER` = đúng thứ tự hiện tại (giữ hành vi cũ 1:1).
- `BLUEPRINTS[key].order` = mảng hoán vị của TOÀN BỘ section key (không bỏ sót cái nào — chỉ đổi vị trí).
- Body = `(BLUEPRINTS[a.blueprint]?.order || DEFAULT_ORDER).map(k => SEC[k]).join('')`.
- `footer`, `sticky`, các `<script>`/modal giữ nguyên ngoài vùng sắp xếp.
- Giữ nguyên các anchor `#features #reviews #offer #faq #order` (mọi section vẫn tồn tại → nav hoạt động).

### C. Phản hồi UI (nhỏ, tùy chọn)
- Hiện nhãn blueprint trên mỗi card LP ở grid (`renderLPgrid`) để user thấy AI đã chọn format nào. Chỉ đọc, không tương tác.

## 4. Data flow
```
genConfigs (AI) → angles[i].blueprint  (+ hero scene/eyebrow/h1 theo blueprint)
        │
        ▼
renderLP(lp) → chọn BLUEPRINTS[blueprint].order (fallback DEFAULT_ORDER)
        │
        ▼
body = order.map(k => SEC[k]).join('')   // cùng components, khác thứ tự
```

## 5. An toàn & test
- **Fallback bất biến:** thiếu/không hợp lệ `blueprint` → DEFAULT_ORDER = render y hệt hiện tại. LP cũ (đã lưu) không vỡ.
- **Không bỏ sót section:** mỗi `order` là hoán vị đủ 21 key → verify bằng test "mỗi order chứa đúng tập key của DEFAULT_ORDER".
- **Verify thủ công:** Preview 1 LP cho mỗi blueprint, xác nhận thứ tự đúng + không section nào biến mất + form vẫn ở sau proof.
- **1 commit/phần** (A, B, C) để dễ revert; auto-push main theo flow.

## 6. Rủi ro
- Refactor 1 hàm lớn trong file 190KB → giữ template từng khối NGUYÊN VĂN khi tách (chỉ cắt-dán vào biến có tên), không sửa nội dung khối ở bước B.
- Một số thứ tự đẩy section cảm xúc (pain) xuống — không banish xuống cuối với blueprint không phải insight; đặt vị trí giữa hợp lý.
