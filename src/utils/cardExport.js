import React from 'react';
import { createRoot } from 'react-dom/client';
import { toPng, toJpeg } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import IdCard from '../components/IdCard.jsx';
import { CARD_W, CARD_H, A4, computeLayout, composePage } from './sheetLayout.js';
import { cardFileBase } from './validate.js';

const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

async function waitForImages(root) {
  await Promise.all(
    [...root.querySelectorAll('img')].map((i) =>
      i.complete ? (i.decode ? i.decode().catch(() => {}) : null) : new Promise((r) => { i.onload = i.onerror = r; })
    )
  );
  if (document.fonts?.ready) await document.fonts.ready;
}

function dataUrlToBlob(dataUrl) {
  const [head, b64] = dataUrl.split(',');
  const mime = head.match(/:(.*?);/)[1];
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

/** One hidden full-size render host reused for every card in a batch. */
export function createRenderer() {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-20000px;top:0;width:${CARD_W}px;height:${CARD_H}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  return {
    /** returns data URL */
    async render(student, photoUrl, settings, { format = 'png', pixelRatio = 1 } = {}) {
      root.render(React.createElement(IdCard, { student, photoUrl, settings }));
      await frame();
      await waitForImages(host);
      await frame();
      const node = host.firstChild;
      const opts = { width: CARD_W, height: CARD_H, pixelRatio, backgroundColor: '#ffffff', cacheBust: false };
      return format === 'jpg' ? toJpeg(node, { ...opts, quality: 0.95 }) : toPng(node, opts);
    },
    dispose() {
      root.unmount();
      host.remove();
    },
  };
}

function uniqueName(base, ext, used) {
  let name = `${base}.${ext}`;
  let n = 2;
  while (used.has(name)) name = `${base}_${n++}.${ext}`;
  used.add(name);
  return name;
}

/** Download a single student's card. */
export async function downloadOne(student, photoUrl, settings, format, pixelRatio) {
  const r = createRenderer();
  try {
    const url = await r.render(student, photoUrl, settings, { format, pixelRatio });
    saveAs(dataUrlToBlob(url), `${cardFileBase(student)}.${format}`);
  } finally {
    r.dispose();
  }
}

/** Generate many cards into one ZIP. getPhoto(student) -> url. */
export async function downloadZip(students, getPhoto, settings, format, pixelRatio, onProgress, shouldCancel) {
  const zip = new JSZip();
  const used = new Set();
  const r = createRenderer();
  const done = [];
  try {
    for (let i = 0; i < students.length; i++) {
      if (shouldCancel?.()) break;
      const s = students[i];
      const url = await r.render(s, getPhoto(s), settings, { format, pixelRatio });
      zip.file(uniqueName(cardFileBase(s), format, used), dataUrlToBlob(url));
      done.push(s.id);
      onProgress?.(i + 1, students.length);
    }
  } finally {
    r.dispose();
  }
  if (done.length) {
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, `id-cards-${format}.zip`);
  }
  return done;
}

/** N cards per A4 sheet. outFormat: png | jpg | pdf. */
export async function downloadSheets(students, getPhoto, settings, perSheet, outFormat, opts, onProgress, shouldCancel) {
  const layout = computeLayout(perSheet, settings.cardWidthMm, opts);
  const r = createRenderer();
  const pageBlobs = [];
  const pdf = outFormat === 'pdf' ? new (await import('jspdf')).default({ unit: 'mm', format: 'a4' }) : null;
  const done = [];
  let pageNo = 0;
  try {
    for (let start = 0; start < students.length; start += perSheet) {
      if (shouldCancel?.()) break;
      const chunk = students.slice(start, start + perSheet);
      const imgs = [];
      for (const s of chunk) {
        imgs.push(await r.render(s, getPhoto(s), settings, { format: 'png', pixelRatio: 1 }));
        done.push(s.id);
        onProgress?.(done.length, students.length);
      }
      const canvas = await composePage(imgs, layout);
      pageNo++;
      if (pdf) {
        if (pageNo > 1) pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4.w, A4.h);
      } else {
        const mime = outFormat === 'jpg' ? 'image/jpeg' : 'image/png';
        const blob = await new Promise((res) => canvas.toBlob(res, mime, 0.95));
        pageBlobs.push({ name: `sheet_${String(pageNo).padStart(2, '0')}.${outFormat}`, blob });
      }
    }
  } finally {
    r.dispose();
  }
  if (pdf && pageNo) pdf.save('id-card-sheets.pdf');
  else if (pageBlobs.length === 1) saveAs(pageBlobs[0].blob, pageBlobs[0].name);
  else if (pageBlobs.length > 1) {
    const zip = new JSZip();
    pageBlobs.forEach((p) => zip.file(p.name, p.blob));
    saveAs(await zip.generateAsync({ type: 'blob' }), `id-card-sheets-${outFormat}.zip`);
  }
  return { done, layout, pages: pageNo };
}
