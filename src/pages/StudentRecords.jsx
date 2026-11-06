import React, { useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import StudentForm from '../components/StudentForm.jsx';
import { validateStudent } from '../utils/validate.js';
import { downloadOne } from '../utils/cardExport.js';

const PAGE = 50;

export default function StudentRecords() {
  const { students, selected, dispatch, getPhoto, settings } = useApp();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [onlyIssues, setOnlyIssues] = useState(false);
  const assignFor = useRef(null);
  const fileInput = useRef(null);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return students
      .map((s) => ({ s, warn: validateStudent(s, !!getPhoto(s)) }))
      .filter(({ s, warn }) => (!onlyIssues || warn.length) &&
        (!t || [s.name, s.admission, s.class, s.parent].some((v) => String(v).toLowerCase().includes(t))));
  }, [students, q, onlyIssues, getPhoto]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const view = rows.slice(cur * PAGE, cur * PAGE + PAGE);
  const allSel = rows.length > 0 && rows.every(({ s }) => selected.includes(s.id));

  const one = async (s) => {
    setBusyId(s.id);
    try { await downloadOne(s, getPhoto(s), settings, 'png', 2); dispatch({ type: 'MARK_GENERATED', ids: [s.id] }); }
    finally { setBusyId(null); }
  };

  return (
    <>
      <h3 className="mb-3">Student Records</h3>
      <div className="d-flex flex-wrap gap-2 mb-2 align-items-center">
        <input className="form-control w-auto" style={{ minWidth: 240 }} placeholder="Search name, admission, class…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} />
        <label className="small"><input type="checkbox" checked={onlyIssues} onChange={(e) => setOnlyIssues(e.target.checked)} /> Only records with warnings</label>
        <span className="text-muted small ms-auto">{rows.length} of {students.length} shown · {selected.length} selected</span>
      </div>

      {students.length === 0 ? (
        <div className="alert alert-info">No students yet. Use <a href="#/import">Import Excel</a> or <a href="#/manual">Manual Entry</a>.</div>
      ) : (
        <div className="table-wrap">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th><input type="checkbox" checked={allSel} onChange={() => dispatch({ type: 'SET_SELECTED', ids: allSel ? [] : rows.map(({ s }) => s.id) })} /></th>
                <th>Name</th><th>Admission</th><th>Class</th><th>Photo</th><th>Warnings</th><th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {view.map(({ s, warn }) => {
                const hasPhoto = !!getPhoto(s);
                const other = warn.filter((w) => w !== 'Photo missing');
                return (
                  <tr key={s.id}>
                    <td><input type="checkbox" checked={selected.includes(s.id)} onChange={() => dispatch({ type: 'TOGGLE_SELECT', id: s.id })} /></td>
                    <td>{s.name || <em className="text-danger">—</em>}</td>
                    <td>{s.admission}</td>
                    <td>{s.class}</td>
                    <td>
                      {hasPhoto ? <img src={getPhoto(s)} alt="" style={{ width: 28, height: 34, objectFit: 'cover', borderRadius: 3 }} /> : <span className="badge text-bg-danger">Missing</span>}
                    </td>
                    <td className="small text-warning-emphasis">{other.join(', ')}</td>
                    <td className="text-end text-nowrap">
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => setEdit(s)}>Edit</button>
                      <a className="btn btn-sm btn-outline-secondary me-1" href={`#/preview?id=${s.id}`}>Preview</a>
                      <button className="btn btn-sm btn-outline-dark me-1" onClick={() => { assignFor.current = s.id; fileInput.current.click(); }}>{hasPhoto ? 'Replace photo' : 'Assign photo'}</button>
                      <button className="btn btn-sm btn-outline-success me-1" disabled={busyId === s.id} onClick={() => one(s)}>{busyId === s.id ? '…' : 'Download'}</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => { if (window.confirm(`Delete ${s.name || 'this student'}?`)) dispatch({ type: 'DELETE_STUDENT', id: s.id }); }}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="d-flex gap-2 align-items-center mt-2">
          <button className="btn btn-sm btn-outline-secondary" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Prev</button>
          <span className="small">Page {cur + 1} / {pages}</span>
          <button className="btn btn-sm btn-outline-secondary" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
        </div>
      )}

      <input ref={fileInput} type="file" accept="image/jpeg,image/png" hidden
        onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f && assignFor.current) dispatch({ type: 'ASSIGN_PHOTO', id: assignFor.current, file: f }); }} />

      {edit && (
        <div className="modal-backdrop-custom" onMouseDown={(e) => { if (e.target === e.currentTarget) setEdit(null); }}>
          <div className="modal-box">
            <h5>Edit student</h5>
            <StudentForm initial={edit} submitLabel="Save changes" onCancel={() => setEdit(null)}
              onSave={(s, file) => { dispatch({ type: 'UPDATE_STUDENT', student: s }); if (file) dispatch({ type: 'ASSIGN_PHOTO', id: s.id, file }); setEdit(null); }} />
          </div>
        </div>
      )}
    </>
  );
}
