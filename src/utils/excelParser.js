import * as XLSX from 'xlsx';

export const FIELDS = ['class', 'admission', 'name', 'blood', 'dob', 'parent', 'cell', 'bus', 'address', 'photo'];

const ALIASES = {
  class: ['class', 'class section', 'class and section', 'section', 'grade'],
  admission: ['admission', 'admission no', 'admission number', 'adm no', 'admno', 'admission id'],
  name: ['name', 'student name', 'student'],
  blood: ['blood', 'blood group', 'bloodgroup'],
  dob: ['dob', 'date of birth', 'birth date', 'birthdate'],
  parent: ['parent', 'parent name', 'father', 'father name', 'guardian'],
  cell: ['cell', 'contact', 'contact number', 'phone', 'mobile', 'parent contact', 'phone number'],
  bus: ['bus', 'bus no', 'bus number', 'transport'],
  address: ['address', 'residential address'],
  photo: ['photo', 'photo name', 'photograph', 'image', 'photo file', 'photo filename'],
};

const norm = (h) => String(h ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function mapHeader(h) {
  const n = norm(h);
  for (const f of FIELDS) if (ALIASES[f].includes(n)) return f;
  return null;
}

const pad = (n) => String(n).padStart(2, '0');

function cellToString(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) {
    if (isNaN(v)) return '';
    // use UTC parts: SheetJS builds dates at UTC midnight-ish for date-only cells
    return `${pad(v.getUTCDate())}.${pad(v.getUTCMonth() + 1)}.${v.getUTCFullYear()}`;
  }
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : String(v);
  return String(v).replace(/\s+/g, ' ').trim();
}

/** Parse an .xlsx/.xls ArrayBuffer into student records. Never throws on empty cells. */
export function parseExcel(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { students: [], missingColumns: FIELDS, unknownColumns: [], sheetName: '' };
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '', raw: true });

  const headers = rows.length ? Object.keys(rows[0]) : [];
  const headerMap = {};
  const unknownColumns = [];
  for (const h of headers) {
    const f = mapHeader(h);
    if (f && !Object.values(headerMap).includes(f)) headerMap[h] = f;
    else unknownColumns.push(h);
  }
  const found = Object.values(headerMap);
  const missingColumns = FIELDS.filter((f) => !found.includes(f));

  const students = [];
  for (const row of rows) {
    const s = Object.fromEntries(FIELDS.map((f) => [f, '']));
    for (const [h, f] of Object.entries(headerMap)) s[f] = cellToString(row[h]);
    if (FIELDS.every((f) => !s[f])) continue; // skip blank rows
    s.id = crypto.randomUUID();
    students.push(s);
  }
  return { students, missingColumns, unknownColumns, sheetName };
}
