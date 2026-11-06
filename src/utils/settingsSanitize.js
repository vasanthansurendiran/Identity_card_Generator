const TEXT_KEYS = ['schoolName', 'addressLine1', 'addressLine2', 'schoolPhone', 'title', 'academicYear', 'designation', 'footerText'];
const COLOR_KEYS = ['headerColor', 'accentColor'];
const IMAGE_KEYS = ['logo', 'signature'];
const HEX = /^#[0-9a-fA-F]{6}$/;
// Images may only come from this page (bundled asset path, blob: from a file picker, or an embedded data: image).
const SAFE_IMAGE = /^(blob:|data:image\/(png|jpeg|gif|webp);base64,)/i;

/** Keep only known settings with valid values. Unknown keys and unsafe values are dropped. */
export function sanitizeSettings(input) {
  const out = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  for (const k of TEXT_KEYS) {
    if (typeof input[k] === 'string') out[k] = input[k].slice(0, 200);
  }
  for (const k of COLOR_KEYS) {
    if (typeof input[k] === 'string' && HEX.test(input[k])) out[k] = input[k];
  }
  for (const k of IMAGE_KEYS) {
    const v = input[k];
    if (typeof v === 'string' && (SAFE_IMAGE.test(v) || v === '')) out[k] = v;
  }
  const w = Number(input.cardWidthMm);
  if (Number.isFinite(w) && w >= 30 && w <= 100) out.cardWidthMm = w;
  return out;
}
