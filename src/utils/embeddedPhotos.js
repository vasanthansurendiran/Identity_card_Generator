import JSZip from 'jszip';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 3000;
const MIME = { jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png' };

const dirname = (p) => p.slice(0, p.lastIndexOf('/') + 1);

function resolve(baseDir, target) {
  if (target.startsWith('/')) return target.slice(1);
  const parts = (baseDir + target).split('/');
  const out = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

const parseXml = (text) => new DOMParser().parseFromString(text, 'application/xml');
const byLocal = (node, name) => [...node.getElementsByTagNameNS('*', name)];

async function readText(zip, path) {
  const f = zip.file(path);
  return f ? f.async('string') : null;
}

/**
 * Pictures placed over cells in the first sheet (Excel "Insert > Picture").
 * Returns a Map of 0-based sheet row -> Blob, taking the picture whose top-left
 * corner is in `photoCol` (0-based), or any column when photoCol is -1.
 */
export async function extractEmbeddedPhotos(arrayBuffer, photoCol = -1) {
  const result = new Map();
  let zip;
  try { zip = await JSZip.loadAsync(arrayBuffer); } catch { return result; } // .xls etc. have no zip container

  const wbRels = await readText(zip, 'xl/_rels/workbook.xml.rels');
  const wb = await readText(zip, 'xl/workbook.xml');
  if (!wbRels || !wb) return result;
  const firstSheet = byLocal(parseXml(wb), 'sheet')[0];
  const rid = firstSheet?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id')
    || firstSheet?.getAttribute('r:id');
  const sheetRel = byLocal(parseXml(wbRels), 'Relationship').find((r) => r.getAttribute('Id') === rid);
  if (!sheetRel) return result;
  const sheetPath = resolve('xl/', sheetRel.getAttribute('Target'));

  const sheetRelsXml = await readText(zip, `${dirname(sheetPath)}_rels/${sheetPath.split('/').pop()}.rels`);
  if (!sheetRelsXml) return result;
  const drawingRel = byLocal(parseXml(sheetRelsXml), 'Relationship').find((r) => /\/drawing$/.test(r.getAttribute('Type') || ''));
  if (!drawingRel) return result;
  const drawingPath = resolve(dirname(sheetPath), drawingRel.getAttribute('Target'));

  const drawingXml = await readText(zip, drawingPath);
  const drawingRelsXml = await readText(zip, `${dirname(drawingPath)}_rels/${drawingPath.split('/').pop()}.rels`);
  if (!drawingXml || !drawingRelsXml) return result;
  const imageTargets = {};
  for (const r of byLocal(parseXml(drawingRelsXml), 'Relationship')) {
    imageTargets[r.getAttribute('Id')] = resolve(dirname(drawingPath), r.getAttribute('Target'));
  }

  const doc = parseXml(drawingXml);
  const anchors = [...byLocal(doc, 'oneCellAnchor'), ...byLocal(doc, 'twoCellAnchor')];
  for (const a of anchors.slice(0, MAX_IMAGES)) {
    const from = byLocal(a, 'from')[0];
    const col = +byLocal(from, 'col')[0]?.textContent;
    const row = +byLocal(from, 'row')[0]?.textContent;
    if (!Number.isInteger(col) || !Number.isInteger(row)) continue;
    if (photoCol >= 0 && col !== photoCol) continue;
    if (result.has(row)) continue;
    const blip = byLocal(a, 'blip')[0];
    const embedId = blip?.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'embed') || blip?.getAttribute('r:embed');
    const imgPath = imageTargets[embedId];
    const mime = MIME[(imgPath || '').split('.').pop().toLowerCase()];
    const file = imgPath && mime ? zip.file(imgPath) : null;
    if (!file) continue;
    const bytes = await file.async('uint8array');
    if (bytes.length > MAX_IMAGE_BYTES) continue;
    result.set(row, new Blob([bytes], { type: mime }));
  }
  return result;
}
