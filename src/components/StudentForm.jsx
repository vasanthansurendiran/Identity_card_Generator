import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import ScaledCard from './ScaledCard.jsx';

const EMPTY = { class: '', admission: '', name: '', blood: '', dob: '', parent: '', cell: '', bus: '', address: '', photo: '' };

const FIELDS = [
  ['class', 'Class & Section', 'VI-B1'],
  ['admission', 'Admission Number', '26SS360'],
  ['name', 'Student Name', 'T.HARINI'],
  ['blood', 'Blood Group', 'B +ve'],
  ['dob', 'Date of Birth', '28.03.2016'],
  ['parent', 'Parent Name', 'M.TAMILARASAN'],
  ['cell', 'Contact Number', '9876543210'],
  ['bus', 'Bus Number', 'BUS NO: 05'],
];

/** Shared add/edit form. `initial` = existing student or null. Calls onSave(student, photoFile|null). */
export default function StudentForm({ initial, onSave, onCancel, submitLabel = 'Save' }) {
  const { settings, photos, overrides } = useApp();
  const [v, setV] = useState(initial || EMPTY);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) { setPreviewUrl(''); return undefined; }
    const u = URL.createObjectURL(file);
    setPreviewUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const existing = initial ? overrides[initial.id] || photos[String(initial.photo || '').toLowerCase()]?.url || '' : '';
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const photo = file && !v.photo ? file.name : v.photo;
        onSave({ ...v, photo }, file);
        if (!initial) { setV(EMPTY); setFile(null); e.target.reset(); }
      }}
    >
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="row g-2">
            {FIELDS.map(([k, label, ph]) => (
              <div className="col-sm-6" key={k}>
                <label className="form-label small mb-1">{label}</label>
                <input className="form-control" value={v[k]} onChange={set(k)} placeholder={ph} />
              </div>
            ))}
            <div className="col-12">
              <label className="form-label small mb-1">Address</label>
              <textarea className="form-control" rows={3} value={v.address} onChange={set('address')} />
            </div>
            <div className="col-sm-6">
              <label className="form-label small mb-1">Photo file name (matches bulk upload)</label>
              <input className="form-control" value={v.photo} onChange={set('photo')} placeholder="ID_C2375.JPG" />
            </div>
            <div className="col-sm-6">
              <label className="form-label small mb-1">Student Photograph</label>
              <input className="form-control" type="file" accept="image/jpeg,image/png" onChange={(e) => setFile(e.target.files[0] || null)} />
            </div>
          </div>
          <div className="mt-3 d-flex gap-2">
            <button className="btn btn-primary" type="submit">{submitLabel}</button>
            {onCancel && <button className="btn btn-outline-secondary" type="button" onClick={onCancel}>Cancel</button>}
          </div>
        </div>
        <div className="col-lg-5">
          <div className="small text-muted mb-1">Live preview</div>
          <ScaledCard student={v} photoUrl={previewUrl || existing} settings={settings} width={260} />
        </div>
      </div>
    </form>
  );
}
