import React from 'react';
import { useApp, DEFAULT_SETTINGS } from '../context/AppContext.jsx';
import ScaledCard from '../components/ScaledCard.jsx';
import { sanitizeSettings } from '../utils/settingsSanitize.js';

const SAMPLE = { class: 'PRE-KG CHERRY', admission: '26KSVM071', name: 'S.P.AGAMITHRA', blood: 'A1B +ve', dob: '13.11.2023', parent: 'P.PRAVEENKUMAR', cell: '9080269510, 9655050576', bus: 'BUS NO: 9', address: '2/24,NORTH STREET, SENGAL,SENGAL(PO), K.R.PURAM,KARUR-639102.' };

const TEXT = [
  ['schoolName', 'School name (header)'],
  ['addressLine1', 'Address line 1'],
  ['addressLine2', 'Address line 2'],
  ['schoolPhone', 'School contact number'],
  ['title', 'Card heading'],
  ['academicYear', 'Academic year'],
  ['designation', 'Signatory designation'],
  ['footerText', 'Footer text (optional, e.g. printer credit)'],
];

export default function SchoolSettings() {
  const { settings: c, dispatch } = useApp();
  const set = (patch) => dispatch({ type: 'SET_SETTINGS', patch });
  const img = (key) => (e) => {
    const f = e.target.files[0];
    if (f) set({ [key]: URL.createObjectURL(f) });
  };
  const exportJson = () => {
    const { logo, signature, ...rest } = c; // images are not exported
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(rest, null, 2)], { type: 'application/json' }));
    a.download = 'school-settings.json';
    a.click();
  };
  const importJson = async (e) => {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 100 * 1024) { window.alert('Settings file is too large.'); return; }
    try {
      const clean = sanitizeSettings(JSON.parse(await f.text()));
      if (!Object.keys(clean).length) { window.alert('No valid settings found in that file.'); return; }
      set(clean);
    } catch { window.alert('Not a valid settings file.'); }
  };

  return (
    <>
      <h3 className="mb-3">School Settings</h3>
      <div className="row g-3">
        <div className="col-lg-7">
          <div className="card stat-card p-3">
            <div className="row g-2">
              {TEXT.map(([k, label]) => (
                <div className="col-sm-6" key={k}>
                  <label className="form-label small mb-1">{label}</label>
                  <input className="form-control" value={c[k]} onChange={(e) => set({ [k]: e.target.value })} />
                </div>
              ))}
              <div className="col-sm-4"><label className="form-label small mb-1">Header colour</label><input type="color" className="form-control form-control-color" value={c.headerColor} onChange={(e) => set({ headerColor: e.target.value })} /></div>
              <div className="col-sm-4"><label className="form-label small mb-1">Accent colour</label><input type="color" className="form-control form-control-color" value={c.accentColor} onChange={(e) => set({ accentColor: e.target.value })} /></div>
              <div className="col-sm-4"><label className="form-label small mb-1">Print width (mm)</label><input type="number" min={30} max={100} className="form-control" value={c.cardWidthMm} onChange={(e) => set({ cardWidthMm: +e.target.value || 54 })} /></div>
              <div className="col-sm-6"><label className="form-label small mb-1">School logo</label><input type="file" accept="image/*" className="form-control" onChange={img('logo')} /></div>
              <div className="col-sm-6"><label className="form-label small mb-1">Principal signature</label><input type="file" accept="image/*" className="form-control" onChange={img('signature')} /></div>
            </div>
            <div className="d-flex gap-2 mt-3 flex-wrap">
              <button className="btn btn-outline-secondary" onClick={() => set(DEFAULT_SETTINGS)}>Reset to defaults</button>
              <button className="btn btn-outline-primary" onClick={exportJson}>Export settings</button>
              <label className="btn btn-outline-primary mb-0">Import settings<input type="file" accept=".json" hidden onChange={importJson} /></label>
            </div>
            <p className="small text-muted mt-2 mb-0">Settings hold only school details (no student data). Changing them requires regenerating cards.</p>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="small text-muted mb-1">Preview with sample data</div>
          <ScaledCard student={SAMPLE} photoUrl="" settings={c} width={300} />
        </div>
      </div>
    </>
  );
}
