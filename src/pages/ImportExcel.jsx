import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { parseExcel } from '../utils/excelParser.js';

const IMG = /\.(jpe?g|png)$/i;
const MAX_EXCEL_BYTES = 10 * 1024 * 1024;

export default function ImportExcel() {
  const { students, photos, dispatch, getPhoto } = useApp();
  const [msg, setMsg] = useState(null);
  const [mode, setMode] = useState('replace');

  const onExcel = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > MAX_EXCEL_BYTES) {
      setMsg({ t: 'danger', m: `That file is ${(f.size / 1048576).toFixed(1)} MB. Spreadsheets over 10 MB are rejected.` });
      return;
    }
    try {
      const r = await parseExcel(await f.arrayBuffer());
      if (!r.students.length) {
        setMsg({ t: 'danger', m: 'No student rows were found in the first sheet.' });
        return;
      }
      dispatch({ type: mode === 'replace' ? 'SET_STUDENTS' : 'APPEND_STUDENTS', students: r.students });
      const nPics = Object.keys(r.embedded).length;
      if (nPics) dispatch({ type: 'ASSIGN_PHOTOS', map: r.embedded });
      const warn = r.missingColumns.length ? ` Columns not found: ${r.missingColumns.map((c) => c.toUpperCase()).join(', ')}.` : '';
      const pics = nPics ? ` Found ${nPics} photographs embedded in the spreadsheet and attached them.` : '';
      setMsg({ t: r.missingColumns.length ? 'warning' : 'success', m: `Imported ${r.students.length} students from "${f.name}".${pics}${warn}` });
    } catch (err) {
      setMsg({ t: 'danger', m: `Could not read that file: ${err.message}` });
    }
  };

  const onPhotos = (e) => {
    const files = [...e.target.files].filter((f) => IMG.test(f.name));
    const skipped = e.target.files.length - files.length;
    e.target.value = '';
    if (files.length) dispatch({ type: 'ADD_PHOTOS', files });
    setMsg({ t: skipped ? 'warning' : 'success', m: `Added ${files.length} photographs.${skipped ? ` Ignored ${skipped} non-JPG/PNG files.` : ''}` });
  };

  const missing = students.filter((s) => !getPhoto(s));
  const photoCount = Object.keys(photos).length;

  return (
    <>
      <h3 className="mb-3">Import Excel &amp; Photographs</h3>
      {msg && <div className={`alert alert-${msg.t}`}>{msg.m}</div>}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card stat-card p-3 h-100">
            <h6>1. Student spreadsheet (.xlsx / .xls)</h6>
            <p className="small text-muted">Columns are recognised by header: CLASS, ADMISSION, NAME, BLOOD, DOB, PARENT, CELL, BUS, ADDRESS, PHOTO.</p>
            <div className="mb-2">
              <label className="me-3"><input type="radio" checked={mode === 'replace'} onChange={() => setMode('replace')} /> Replace current students</label>
              <label><input type="radio" checked={mode === 'append'} onChange={() => setMode('append')} /> Add to current students</label>
            </div>
            <input className="form-control" type="file" accept=".xlsx,.xls" onChange={onExcel} />
            <div className="mt-2 small">Currently loaded: <b>{students.length}</b> students</div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card stat-card p-3 h-100">
            <h6>2. Student photographs (JPG, JPEG, PNG)</h6>
            <p className="small text-muted">Select many files, or a whole folder. Files are matched to the PHOTO column by filename, ignoring case.</p>
            <label className="form-label small mb-1">Select files</label>
            <input className="form-control mb-2" type="file" multiple accept="image/jpeg,image/png" onChange={onPhotos} />
            <label className="form-label small mb-1">Or select a folder</label>
            <input className="form-control" type="file" multiple webkitdirectory="" directory="" onChange={onPhotos} />
            <div className="mt-2 small">
              Photos loaded: <b>{photoCount}</b>
              {photoCount > 0 && <button className="btn btn-sm btn-link text-danger" onClick={() => dispatch({ type: 'CLEAR_PHOTOS' })}>Clear photos</button>}
            </div>
          </div>
        </div>
      </div>

      {students.length > 0 && (
        <div className="card stat-card p-3 mt-3">
          <h6>Photo match: {students.length - missing.length} matched, {missing.length} missing</h6>
          {missing.length > 0 && photoCount > 0 && (
            <div className="alert alert-warning py-2 small mb-2">
              {missing.length} students have no matching photograph. Fix them in <a href="#/records">Student Records</a>.
            </div>
          )}
          {missing.length > 0 && (
            <div className="small text-muted" style={{ maxHeight: 140, overflow: 'auto' }}>
              {missing.slice(0, 60).map((s) => `${s.name || '(no name)'} → ${s.photo || '(no filename)'}`).join(' • ')}
              {missing.length > 60 && ` … and ${missing.length - 60} more`}
            </div>
          )}
        </div>
      )}
    </>
  );
}
