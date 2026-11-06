# School Student ID Card Generator

Browser-only React + Vite app: import an Excel of students, bulk-upload photos, preview/edit, and export ID cards as PNG/JPG, a ZIP, or N-per-A4 print sheets (PNG/JPG/PDF).

## Run locally
```
npm install
npm run dev        # http://localhost:5173
npm run build
```

## Deploy to GitHub Pages
1. Push to a GitHub repo (branch `main`).
2. Repo Settings → Pages → Source: **GitHub Actions**.
3. `.github/workflows/deploy.yml` builds with `VITE_BASE=/<repo-name>/` and publishes. Hash routing means refresh/deep links work.

## Excel columns
`CLASS, ADMISSION, NAME, BLOOD, DOB, PARENT, CELL, BUS, ADDRESS, PHOTO` (matched by header, case-insensitive; common aliases accepted). Photos are matched to the PHOTO column by filename, ignoring case.

## Privacy
Everything runs in the browser. No student data or photos are uploaded or stored (no localStorage); closing the tab clears it. `.gitignore` excludes `*.xlsx`, `sample/`, `private/`, photo folders. Only commit source and non-sensitive design assets (`public/assets`).

## Customising the card
School name, address, year, logo, signature, colours and print size are in **School Settings**. The card layout is `src/components/IdCard.jsx` + `IdCard.css` (1083×1693 design units).

## Security notes
- Dependencies: SheetJS is installed from the official cdn.sheetjs.com tarball (the npm package is outdated and has known advisories). Re-check with `npm audit` after updates.
- Production builds ship a Content-Security-Policy (no remote scripts, images or requests).
- Imported settings files are whitelisted and validated; Excel uploads over 10 MB are rejected.
- GitHub Actions are pinned to commit SHAs.
