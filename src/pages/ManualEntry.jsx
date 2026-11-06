import React, { useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import StudentForm from '../components/StudentForm.jsx';
import { downloadOne } from '../utils/cardExport.js';

export default function ManualEntry() {
  const { dispatch, settings, getPhoto, students } = useApp();
  const [last, setLast] = useState(null);
  const [fmt, setFmt] = useState('png');
  const [busy, setBusy] = useState(false);

  const save = (s, file) => {
    const student = { ...s, id: crypto.randomUUID() };
    dispatch({ type: 'ADD_STUDENT', student });
    if (file) dispatch({ type: 'ASSIGN_PHOTO', id: student.id, file });
    setLast(student.id);
  };

  const lastStudent = students.find((s) => s.id === last);
  const gen = async () => {
    setBusy(true);
    try {
      await downloadOne(lastStudent, getPhoto(lastStudent), settings, fmt, 2);
      dispatch({ type: 'MARK_GENERATED', ids: [lastStudent.id] });
    } finally { setBusy(false); }
  };

  return (
    <>
      <h3 className="mb-3">Manual Entry</h3>
      <div className="card stat-card p-3">
        <StudentForm onSave={save} submitLabel="Add Student" />
      </div>
      {lastStudent && (
        <div className="alert alert-success mt-3 d-flex flex-wrap align-items-center gap-2">
          <span>Added <b>{lastStudent.name || 'student'}</b>. It now appears in Student Records.</span>
          <select className="form-select form-select-sm w-auto" value={fmt} onChange={(e) => setFmt(e.target.value)}>
            <option value="png">PNG</option><option value="jpg">JPG</option>
          </select>
          <button className="btn btn-sm btn-success" disabled={busy} onClick={gen}>{busy ? 'Generating…' : 'Generate ID Card'}</button>
        </div>
      )}
    </>
  );
}
