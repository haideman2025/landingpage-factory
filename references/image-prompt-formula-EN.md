# Image Prompt Formula (English) — Nano Banana Pro 2 / Gemini 3 Pro Image

All image prompts in the generated LPs are ENGLISH and follow this structure. Keep it consistent so the bulk image tool produces on-brand, high-quality, deployable assets.

## Per-slot prompt structure
```
[SCENE: who + where + what action] .
Lighting: [lighting setup] .
Camera/lens: [e.g. 85mm f/1.8, shallow depth of field] .
Color palette: [palette words / hex] .
Mood: [emotional tone] .
Aspect ratio [4:5 | 16:9 | 1:1], vertical composition for a mobile landing page, leave clean negative space for text overlay .
Photoreal, high-resolution advertising quality, realistic skin/texture and water/foam detail, beautifully separated background .
[PRODUCT REFERENCE INSTRUCTION] .
[BRAND VISUAL DNA] .
Negative: no on-image text or typography, no watermark, no distorted hands/fingers, no other brand logos, no NSFW.
```

## Brand Visual DNA (paste into the tool's "add to every prompt" field)
A single English paragraph that locks visual identity across ALL images:
- subject demographic (age, look, ethnicity)
- photographic style (cinematic / editorial / clinical / lifestyle)
- lighting signature (soft directional + rim, high-key clinical, moody low-key...)
- color grading + palette
- recurring texture (foam, water droplets, matte skin...)
- "consistent across all images"

Example (men's care):
> modern masculine Vietnamese men's personal-care brand; premium cinematic photoreal style; clean confident young Vietnamese/Korean men 22-32; soft directional lighting with gentle rim light; shallow depth of field; refined color grading; subtle water/foam texture; consistent across all images.

For another industry, rewrite this paragraph (e.g. skincare = bright K-beauty clinical; F&B = warm appetizing food photography; course = aspirational lifestyle classroom). Set it in `CONFIG['brand_dna_en']` in build_lp.py.

## Product reference
Always include: "Use the attached product reference image(s); keep the exact packaging, label, logo and bottle colors of the product." In the tool, upload 1–5 clean product shots. Gemini 3 Pro Image supports up to 14 reference images and keeps subject/label consistency.

## Slot types generated per LP
hero (4:5) · agitate (16:9) · product trio (1:1) · 3 scent/variant macros (4:5) · routine step ×3 (16:9) · before (1:1) · after (1:1) · case-study portrait (4:5) · video poster (16:9) · UGC ×6 (1:1).

## Quality tips
- Keep ONE Brand DNA across the whole site → coherent look.
- Use the real product photo as reference → correct packaging every time.
- For text-heavy hero/offer slides, prefer generating clean background + add HTML text overlay (don't bake text into the image).
- Export JPEG ~0.85 quality (tool does this) for fast-loading, SEO-friendly assets.
