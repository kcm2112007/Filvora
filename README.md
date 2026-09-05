# Filvora (single-file build)

The same 25 working file tools as the full Filvora site, packaged as a
single `index.html` + `style.css` + `script.js` instead of separate pages
per tool. Everything still runs entirely in the browser — no backend, no
build step, no npm/Node.js.

This is a lighter alternative to the multi-page version: one file to
upload, one URL, tools load into the same page instead of navigating to
separate HTML files.

## How it works

- `index.html` shows a searchable grid of all 25 tools on load.
- Tapping a tool loads its markup and logic into the page (only one
  tool's code is ever active at a time, so there's no conflict between
  tools) and updates the URL hash (e.g. `#compress-image`) so the back
  button and reloads work as expected.
- PDF tools load `pdf-lib` and ZIP tools load `JSZip` from a CDN
  on demand — only when you actually open one of those tools, not on
  every page load.

## 1. Upload to GitHub

1. Create a new repository on GitHub (Public, for free GitHub Pages hosting).
2. Click **Add file → Upload files** and drag in `index.html`,
   `README.md`, and the entire `assets/` folder (keep the folder
   structure — `assets/css/`, `assets/js/`, `assets/images/branding/`).
3. Commit the changes.

## 2. Enable GitHub Pages

1. Go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then **Save**.
4. Your site will be live at `https://<username>.github.io/<repository>/`
   within a minute or two.

All paths in this project are relative, so it works correctly at any
repository name or subdirectory without edits.

## 3. Updating the site

Edit `index.html`, `assets/css/style.css`, or `assets/js/script.js`
directly on GitHub, or re-upload replacement files. Every commit to the
branch selected in Pages settings redeploys automatically.

## What's included

- 25 working tools: PDF (merge, split, extract/delete/reorder pages,
  rotate, view/remove metadata), Image (compress, resize, crop, rotate,
  JPG/PNG/WebP conversion, view/remove EXIF), File info (size, type,
  MIME, hash), Document (TXT to PDF), Archive (ZIP create/extract).
- Logo and full favicon set in `assets/images/branding/`.
- Light/dark theme toggle (saved to `localStorage`).

## What's intentionally left out of this build

This single-file version trades a few things for simplicity, compared
to the full multi-page site:

- No individual SEO page per tool (one page can't rank for 25 different
  search terms the way 25 separate pages can).
- No sitemap.xml, robots.txt, 404.html, or service worker/offline support.
- No About/Contact/Privacy/Terms pages.

If you want those, use the full multi-page Filvora build instead — this
one is meant for a quick, single-file deployment.
