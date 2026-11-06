import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { downloadZip, downloadSheets } from '../utils/cardExport.js';
import { computeLayout } from '../utils/sheetLayout.js';

export default function GenerateCards() {
  const { students, selected, getPhoto, settings, dispatch } = useApp();
  const [scope, setScope] = useState('all');
  const [fmt, setFmt] = useState('png');
  const [quality, setQuality] = useState(2);
  const [perSheet, setPerSheet] = useState(10);
  const [sheetFmt, setSheetFmt] = useState('pdf');
  const [margin, setMargin] = useState(8);
  const [gap, setGap] = useState(4);
  const [prog, setProg] = useState(null);
  const [msg, setMsg] = useState(null);
  const cancel = useRef(false);

  const list = useMemo(
    () => (scope === 'selected' ? students.filter((s) => selected.includes(s.id)) : students),
    [scope, students, selected]
  );
  const layout = useMemo(() => computeLayout(perSheet, settings.cardWidthMm, { margin, gap }), [perSheet, settings.cardWidthMm, margin, gap]);
  const noPhoto = list.filter((s) => !getPhoto(s)).length;
  const busy = !!prog;

  const run = async (fn) => {
    if (!list.length) { setMsg({ t: 'warning', m: 'No students to generate. Import or select some first.' }); return; }
    cancel.current = false;
    setMsg(null);
    setProg({ n: 0, total: list.length });
    try {
      const res = await fn((n, total) => setProg({ n, total }));
      const done = res.done || res;
      dispatch({ type: 'MARK_GENERATED', ids: done });
      setMsg({ t: cancel.current ? 'warning' : 'success', m: cancel.current ? `Cancelled after ${done.length} cards.` : `Done: ${done.length} cards generated.` });
    } catch (e) {
      console.error(e);
      setMsg({ t: 'danger', m: `Generation failed: ${e.message || e}` });
    } finally { setProg(null); }
  };

  return (
    <>
      <h3 className="mb-3">Generate ID Cards</h3>
      <div className="card stat-card p-3 mb-3">
        <h6>Which students?</h6>
        <div className="mb-1">
          <label className="me-3"><input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} /> All ({students.length})</label>
          <label><input type="radio" checked={scope === 'selected'} onChange={() => setScope('selected')} /> Selected only ({selected.length}) — choose in <a href="#/records">Student Records</a></label>
        </div>
        {noPhoto > 0 && <div className="alert alert-warning py-2 small mb-0 mt-2">{noPhoto} of these students have no photograph; their cards will show “NO PHOTO”.</div>}
      </div>

      {msg && <div className={`alert alert-${msg.t}`}>{msg.m}</div>}
      {prog && (
        <div className="mb-3">
          <div className="progress" style={{ height: 22 }}>
            <div className="progress-bar" style={{ width: `${(prog.n / prog.total) * 100}%` }}>{prog.n} / {prog.total}</div>
          </div>
          <button className="btn btn-sm btn-outline-danger mt-2" onClick={() => { cancel.current = true; }}>Cancel</button>
        </div>
      )}

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card stat-card p-3 h-100">
            <h6>Individual cards (ZIP of images)</h6>
            <div className="d-flex gap-2 flex-wrap mb-2">
              <select className="form-select w-auto" value={fmt} onChange={(e) => setFmt(e.target.value)}>
                <option value="png">PNG</option><option value="jpg">JPG</option>
              </select>
              <select className="form-select w-auto" value={quality} onChange={(e) => setQuality(+e.target.value)}>
                <option value={1}>Standard (1083×1693)</option>
                <option value={2}>High (2166×3386)</option>
              </select>
            </div>
            <p className="small text-muted">Files are named like <code>26SS360_T_HARINI.{fmt}</code>.</p>
            <button className="btn btn-primary" disabled={busy || !list.length}
              onClick={() => run(async (p) => ({ done: await downloadZip(list, getPhoto, settings, fmt, quality, p, () => cancel.current) }))}>
              Download ZIP ({list.length} cards)
            </button>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card stat-card p-3 h-100">
            <h6>Print sheets (A4)</h6>
            <div className="row g-2">
              <div className="col-4">
                <label className="form-label small mb-1">Cards per sheet</label>
                <input type="number" min={1} max={30} className="form-control" value={perSheet} onChange={(e) => setPerSheet(Math.max(1, Math.min(30, +e.target.value || 1)))} />
              </div>
              <div className="col-4">
                <label className="form-label small mb-1">Margin (mm)</label>
                <input type="number" min={0} max={30} className="form-control" value={margin} onChange={(e) => setMargin(Math.max(0, +e.target.value || 0))} />
              </div>
              <div className="col-4">
                <label className="form-label small mb-1">Gap (mm)</label>
                <input type="number" min={0} max={20} className="form-control" value={gap} onChange={(e) => setGap(Math.max(0, +e.target.value || 0))} />
              </div>
            </div>
            <div className="small mt-2">
              Layout: <b>{layout.cols} × {layout.rows}</b> grid, each card {layout.cardW.toFixed(1)} × {layout.cardH.toFixed(1)} mm
              {layout.shrunk ? <span className="text-warning-emphasis"> — scaled to {(layout.scale * 100).toFixed(0)}% of true size so {perSheet} fit</span> : ' (true size)'}.
              {' '}Sheets: <b>{Math.ceil(list.length / perSheet) || 0}</b>
            </div>
            <div className="d-flex gap-2 mt-2">
              <select className="form-select w-auto" value={sheetFmt} onChange={(e) => setSheetFmt(e.target.value)}>
                <option value="pdf">PDF</option><option value="png">PNG</option><option value="jpg">JPG</option>
              </select>
              <button className="btn btn-primary" disabled={busy || !list.length}
                onClick={() => run((p) => downloadSheets(list, getPhoto, settings, perSheet, sheetFmt, { margin, gap }, p, () => cancel.current))}>
                Download sheets
              </button>
            </div>
            <p className="small text-muted mt-2 mb-0">Sheets are 300 dpi with thin cut guides. Multiple PNG/JPG pages are zipped.</p>
          </div>
        </div>
      </div>
    </>
  );
}
