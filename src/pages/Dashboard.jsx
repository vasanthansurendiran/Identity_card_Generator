import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Dashboard() {
  const { students, getPhoto, generated } = useApp();
  const withPhoto = students.filter((s) => getPhoto(s)).length;
  const stats = [
    ['Total students', students.length, 'primary'],
    ['With photographs', withPhoto, 'success'],
    ['Missing photographs', students.length - withPhoto, 'danger'],
    ['ID cards generated', generated.length, 'info'],
  ];
  return (
    <>
      <h3 className="mb-3">Dashboard</h3>
      <div className="row g-3">
        {stats.map(([label, n, c]) => (
          <div className="col-6 col-lg-3" key={label}>
            <div className="card stat-card p-3">
              <div className="text-muted small">{label}</div>
              <div className={`num text-${c}`}>{n}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="card stat-card p-3 mt-4">
        <h6>Quick start</h6>
        <ol className="mb-0">
          <li>Set the school details in <a href="#/settings">School Settings</a> (logo, address, academic year, signature).</li>
          <li>Upload the student sheet in <a href="#/import">Import Excel</a>, then upload all photographs.</li>
          <li>Review and fix records in <a href="#/records">Student Records</a>; check cards in <a href="#/preview">ID Card Preview</a>.</li>
          <li>Download PNG/JPG cards, a ZIP, or A4 print sheets in <a href="#/generate">Generate ID Cards</a>.</li>
        </ol>
      </div>
      <p className="text-muted small mt-3">
        Privacy: student records and photographs are processed only inside this browser tab and are cleared when you close or reload it.
      </p>
    </>
  );
}
