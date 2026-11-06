import React, { Suspense, lazy, useEffect, useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Pages load on demand so the first paint stays small.
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const ImportExcel = lazy(() => import('./pages/ImportExcel.jsx'));
const ManualEntry = lazy(() => import('./pages/ManualEntry.jsx'));
const StudentRecords = lazy(() => import('./pages/StudentRecords.jsx'));
const CardPreview = lazy(() => import('./pages/CardPreview.jsx'));
const GenerateCards = lazy(() => import('./pages/GenerateCards.jsx'));
const SchoolSettings = lazy(() => import('./pages/SchoolSettings.jsx'));

const PAGES = [
  ['dashboard', 'Dashboard', Dashboard],
  ['import', 'Import Excel', ImportExcel],
  ['manual', 'Manual Entry', ManualEntry],
  ['records', 'Student Records', StudentRecords],
  ['preview', 'ID Card Preview', CardPreview],
  ['generate', 'Generate ID Cards', GenerateCards],
  ['settings', 'School Settings', SchoolSettings],
];

// Hash routing keeps GitHub Pages refresh/deep links working with no server config.
const read = () => (window.location.hash.replace(/^#\/?/, '').split('?')[0] || 'dashboard');

export default function App() {
  const [page, setPage] = useState(read());
  useEffect(() => {
    const h = () => setPage(read());
    window.addEventListener('hashchange', h);
    return () => window.removeEventListener('hashchange', h);
  }, []);
  const Current = (PAGES.find((p) => p[0] === page) || PAGES[0])[2];
  return (
    <div className="app-shell">
      <nav className="sidebar">
        <h6>ID Card Generator</h6>
        {PAGES.map(([key, label]) => (
          <a key={key} href={`#/${key}`} className={page === key ? 'active' : ''}>{label}</a>
        ))}
        <div className="small px-3 mt-4" style={{ color: '#9aa5c4' }}>
          Data stays in your browser. Nothing is uploaded.
        </div>
      </nav>
      <main className="main">
        <ErrorBoundary key={page}>
          <Suspense fallback={<div className="text-muted p-3">Loading…</div>}><Current /></Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export const go = (key) => { window.location.hash = `#/${key}`; };
