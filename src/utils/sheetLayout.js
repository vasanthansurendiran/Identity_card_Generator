export const A4 = { w: 210, h: 297 };
export const DPI = 300;
export const PX_PER_MM = DPI / 25.4;
export const CARD_W = 1083;
export const CARD_H = 1693;
export const ASPECT = CARD_H / CARD_W;

/**
 * Pick the grid that lets `n` cards sit on one A4 sheet as large as possible,
 * never larger than the true print size (trueWidthMm).
 */
export function computeLayout(n, trueWidthMm, { margin = 8, gap = 4 } = {}) {
  n = Math.max(1, Math.floor(n) || 1);
  const availW = A4.w - 2 * margin;
  const availH = A4.h - 2 * margin;
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols);
    const w = Math.min((availW - (cols - 1) * gap) / cols, ((availH - (rows - 1) * gap) / rows) / ASPECT);
    if (w > 0 && (!best || w > best.w)) best = { cols, rows, w };
  }
  const cardW = Math.min(best.w, trueWidthMm);
  const cardH = cardW * ASPECT;
  const gridW = best.cols * cardW + (best.cols - 1) * gap;
  const gridH = best.rows * cardH + (best.rows - 1) * gap;
  return {
    n, cols: best.cols, rows: best.rows, cardW, cardH, gap, margin,
    x0: (A4.w - gridW) / 2, y0: (A4.h - gridH) / 2,
    shrunk: best.w < trueWidthMm,
    scale: cardW / trueWidthMm,
  };
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
}

/** Compose one A4 page canvas (300 dpi) from card data-URLs. Returns the canvas. */
export async function composePage(cardDataUrls, layout) {
  const W = Math.round(A4.w * PX_PER_MM);
  const H = Math.round(A4.h * PX_PER_MM);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (let i = 0; i < cardDataUrls.length; i++) {
    const img = await loadImage(cardDataUrls[i]);
    const col = i % layout.cols;
    const row = Math.floor(i / layout.cols);
    const x = (layout.x0 + col * (layout.cardW + layout.gap)) * PX_PER_MM;
    const y = (layout.y0 + row * (layout.cardH + layout.gap)) * PX_PER_MM;
    const w = layout.cardW * PX_PER_MM;
    const h = layout.cardH * PX_PER_MM;
    ctx.drawImage(img, x, y, w, h);
    ctx.strokeStyle = '#bbb'; // thin cut guide
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
  }
  return canvas;
}
