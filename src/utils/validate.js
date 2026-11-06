const REQUIRED = [
  ['name', 'Name'],
  ['admission', 'Admission No'],
  ['class', 'Class'],
  ['dob', 'DOB'],
  ['blood', 'Blood group'],
  ['parent', 'Parent'],
  ['cell', 'Contact'],
  ['address', 'Address'],
];

/** Returns a list of human-readable warnings for a student. Missing bus is allowed (blank). */
export function validateStudent(s, hasPhoto) {
  const w = REQUIRED.filter(([k]) => !String(s[k] ?? '').trim()).map(([, label]) => `Missing ${label}`);
  if (!hasPhoto) w.push('Photo missing');
  return w;
}

export function cardFileBase(s) {
  const raw = `${s.admission || 'NOID'}_${s.name || 'student'}`;
  return raw.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
