import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import ScaledCard from '../components/ScaledCard.jsx';
import { validateStudent } from '../utils/validate.js';
import { downloadOne } from '../utils/cardExport.js';

function idFromHash() {
  const m = window.location.hash.match(/id=([^&]+)/);
  return m ? m[1] : null;
}

export default function CardPreview() {
  const { students, getPhoto, settings, dispatch, generated } = useApp();
  const [idx, setIdx] = useState(() => Math.max(0, students.findIndex((s) => s.id === idFromHash())));
  const [fmt, setFmt] = useState('png');
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  const s = students[Math.min(idx, students.length - 1)];
  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? students.map((x, i) => [x, i]).filter(([x]) => `${x.name} ${x.admission}`.toLowerCase().includes(t)).slice(0, 8) : [];
  }, [q, students]);

  if (!s) return (<><h3>ID Card Preview</h3><div className="alert alert-info">No students to preview. <a href="#/import">Import some first.</a></div></>);

  const warn = validateStudent(s, !!getPhoto(s));
  const gen = async () => {
    setBusy(true);
    try { await downloadOne(s, getPhoto(s), settings, fmt, 2); dispatch({ type: 'MARK_GENERATED', ids: [s.id] }); }
    finally { setBusy(false); }
  };

  return (
    <>
      <h3 className="mb-3">ID Card Preview</h3>
      <div className="row g-3">
        <div className="col-auto">
          <div className="preview-stage"><ScaledCard student={s} photoUrl={getPhoto(s)} settings={settings} width={380} /></div>
        </div>
        <div className="col" style={{ minWidth: 260 }}>
          <div className="d-flex gap-2 mb-2 align-items-center">
            <button className="btn btn-outline-secondary" disabled={idx <= 0} onClick={() => setIdx(idx - 1)}>‹ Prev</button>
            <span>{idx + 1} / {students.length}</span>
            <button className="btn btn-outline-secondary" disabled={idx >= students.length - 1} onClick={() => setIdx(idx + 1)}>Next ›</button>
          </div>
          <div className="position-relative mb-3">
            <input className="form-control" placeholder="Jump to student…" value={q} onChange={(e) => setQ(e.target.value)} />
            {matches.length > 0 && (
              <div className="list-group position-absolute w-100" style={{ zIndex: 5 }}>
                {matches.map(([x, i]) => (
                  <button key={x.id} className="list-group-item list-group-item-action py-1" onClick={() => { setIdx(i); setQ(''); }}>{x.name} · {x.admission}</button>
                ))}
              </div>
            )}
          </div>
          <h5 className="mb-1">{s.name}</h5>
          <div className="text-muted mb-2">{s.admission} · {s.class}</div>
          {warn.length > 0
            ? <div className="alert alert-warning py-2 small">{warn.join(' · ')}</div>
            : <div className="alert alert-success py-2 small">All fields present.</div>}
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <select className="form-select w-auto" value={fmt} onChange={(e) => setFmt(e.target.value)}>
              <option value="png">PNG</option><option value="jpg">JPG</option>
            </select>
            <button className="btn btn-success" disabled={busy} onClick={gen}>{busy ? 'Generating…' : generated.includes(s.id) ? 'Regenerate & download' : 'Generate & download'}</button>
            <a className="btn btn-outline-primary" href="#/records">Edit in records</a>
          </div>
        </div>
      </div>
    </>
  );
}
