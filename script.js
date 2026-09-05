/* =========================================================
   FILVORA — common.js
   Single-page build: shared utility functions used by
   every tool (file helpers, dropzone, toasts, icons).
   ========================================================= */
'use strict';

/* ---------------------------------------------------------
   Generic helpers
   --------------------------------------------------------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function formatBytes(bytes, decimals = 2) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes === 0) return '0 Bytes';
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  const i = Math.min(units.length - 1, Math.floor(Math.log(abs) / Math.log(1000)));
  if (i === 0) return `${sign}${abs.toLocaleString()} Bytes`;
  return `${sign}${(abs / Math.pow(1000, i)).toFixed(decimals)} ${units[i]}`;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = safeFilename(filename);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function safeFilename(name) {
  return String(name).replace(/[\/\\:*?"<>|\x00-\x1f]/g, '_').slice(0, 200) || 'download';
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
  });
}
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

function getExt(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}
function nameWithoutExt(name) {
  const ext = getExt(name);
  return ext ? name.slice(0, -(ext.length + 1)) : name;
}

/* Toasts — used for errors/success instead of raw alerts */
function toast(message, type = 'info', timeout = 4200) {
  let region = $('#toast-region');
  if (!region) {
    region = document.createElement('div');
    region.id = 'toast-region';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  region.appendChild(el);
  setTimeout(() => el.remove(), timeout);
}

/* Friendly, non-technical error message helper */
function friendlyError(err) {
  console.error(err);
  return (err && err.friendlyMessage) || 'Something went wrong while processing your file. Please try again.';
}

/* Status line markup used inside tool result panels (success/error/info) */
function statusHTML(kind, text) {
  const cls = { success: 'status-success', error: 'status-error', info: 'status-info' }[kind] || 'status-info';
  const glyph = { success: '✓', error: '⚠', info: 'ℹ' }[kind] || 'ℹ';
  return `<div class="status-line ${cls}">${glyph} ${escapeHtml(text)}</div>`;
}

/* ---------------------------------------------------------
   Reusable drag & drop upload component
   --------------------------------------------------------- */
function createDropzone(el, { multiple = false, accept = [], maxSizeMB = 200, onFiles } = {}) {
  const input = $('input[type=file]', el);
  const open = () => input.click();
  el.addEventListener('click', open);
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  input.addEventListener('change', () => handle(Array.from(input.files || [])));
  ['dragenter', 'dragover'].forEach(evt => el.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); el.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(evt => el.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); el.classList.remove('dragover'); }));
  el.addEventListener('drop', (e) => handle(Array.from(e.dataTransfer.files || [])));

  function validate(file) {
    if (accept.length) {
      const ext = getExt(file.name);
      const okType = accept.some(a => a.startsWith('.') ? a.slice(1) === ext : (file.type && file.type.match(a)));
      if (!okType) { toast(`"${file.name}" isn't a supported file type for this tool.`, 'error'); return false; }
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast(`"${file.name}" is larger than the ${maxSizeMB}MB limit supported here.`, 'error'); return false;
    }
    return true;
  }
  function handle(files) {
    const valid = files.filter(validate);
    if (!valid.length) return;
    onFiles(multiple ? valid : [valid[0]]);
  }
  return { open };
}

function fileChipListHTML(files, { removable = true } = {}) {
  if (!files.length) return '';
  return `<ul class="file-chip-list">${files.map((f, i) => `
    <li class="file-chip" data-idx="${i}">
      <span class="fc-name">${escapeHtml(f.name)}</span>
      <span class="fc-size">${formatBytes(f.size)}</span>
      ${removable ? `<button type="button" class="fc-remove" data-idx="${i}" aria-label="Remove ${escapeHtml(f.name)}">×</button>` : ''}
    </li>`).join('')}</ul>`;
}

/* ---------------------------------------------------------
   Icons — original line-icon set (no external icon library)
   --------------------------------------------------------- */
function svgIcon(inner, cls = '') {
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
const DOC_PATH = '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/>';
const ICONS = {
  'compress-image': '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 3v6H2M16 21v-6h6"/>',
  'resize-image': '<rect x="3" y="3" width="12" height="12" rx="1.5"/><path d="M17 7l4-4M17 3h4v4M15 21l6-6M21 17v4h-4"/>',
  'jpg-to-png': '<rect x="2" y="4" width="8" height="8" rx="1.2"/><rect x="14" y="12" width="8" height="8" rx="1.2"/><path d="M10 8h4M12 6l2 2-2 2"/>',
  'png-to-jpg': '<rect x="2" y="4" width="8" height="8" rx="1.2"/><rect x="14" y="12" width="8" height="8" rx="1.2"/><path d="M10 8h4M12 6l2 2-2 2"/>',
  'jpg-to-webp': '<rect x="2" y="4" width="8" height="8" rx="1.2"/><rect x="14" y="12" width="8" height="8" rx="1.2"/><path d="M10 8h4M12 6l2 2-2 2"/>',
  'webp-to-jpg': '<rect x="2" y="4" width="8" height="8" rx="1.2"/><rect x="14" y="12" width="8" height="8" rx="1.2"/><path d="M10 8h4M12 6l2 2-2 2"/>',
  'crop-image': '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  'rotate-image': '<path d="M3 12a9 9 0 1 1 3 6.7"/><path d="M3 18v-5h5"/>',
  'image-metadata-viewer': '<rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="8" cy="9" r="1.6"/><path d="M4 15l4.5-4.5L12 14l3-3 5 5"/><path d="M20 20.2v.1M20 17.5v2"/>',
  'remove-image-metadata': '<rect x="3" y="3" width="18" height="14" rx="2"/><circle cx="8" cy="9" r="1.6"/><path d="M4 15l4.5-4.5L12 14l3-3 5 5"/><path d="M16 19.5l4 4m0-4l-4 4"/>',
  'file-size-checker': '<path d="M4 3h11l5 5v13H4z"/><path d="M15 3v5h5"/><path d="M8 13h8M8 17h5"/>',
  'file-type-checker': DOC_PATH + '<circle cx="10" cy="15" r="3.2"/><path d="M12.3 17.3 15 20"/>',
  'mime-type-checker': DOC_PATH + '<path d="M8 13h5M8 16h3"/><circle cx="16" cy="16" r="1.1" fill="currentColor" stroke="none"/>',
  'hash-generator': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M8.5 11v9M12.5 11v9M6.5 13.5h8M6.5 17h8"/>',
  'merge-pdf': '<path d="M4 4h8l4 4v12H4z"/><path d="M12 4v4h4"/><path d="M4 10h4"/><path d="M15 15l3 3-3 3M18 18h-6"/>',
  'split-pdf': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M8 13v6M6 15l2-2 2 2M6 17l2 2 2-2"/>',
  'extract-pdf-pages': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M12 12v6M9.5 15.5 12 18l2.5-2.5"/>',
  'delete-pdf-pages': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M9 12l6 6M15 12l-6 6"/>',
  'reorder-pdf-pages': '<rect x="4" y="4" width="7" height="9" rx="1"/><rect x="13" y="11" width="7" height="9" rx="1"/><path d="M11 7l3-3m0 0 3 3m-3-3v6M13 17l-3 3m0 0-3-3m3 3v-6"/>',
  'rotate-pdf': '<path d="M6 2h9l6 6v14H6z"/><path d="M15 2v6h6"/><path d="M9 15a3.5 3.5 0 1 1 1.2 2.6"/><path d="M9 19v-3h3"/>',
  'pdf-metadata-viewer': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><circle cx="10" cy="14" r="3.1"/><path d="M10 12.7v.1M10 14v1.6"/>',
  'remove-pdf-metadata': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M8 12l4 4M12 12l-4 4"/>',
  'txt-to-pdf': DOC_PATH + '<path d="M8 12h5M8 15h6M8 18h4"/><path d="M16 3l3 3-6 6H10v-3z"/>',
  'zip-creator': '<path d="M4 4h16v16H4z"/><path d="M11 4v3M13 7v3M11 10v3M13 13v3"/><path d="M12 22v-3M9 19h6"/>',
  'zip-extractor': '<path d="M4 4h16v16H4z"/><path d="M11 4v3M13 7v3M11 10v3M13 13v3"/><path d="M12 15v6m0 0-2.5-2.5M12 21l2.5-2.5"/>',
};
const CATEGORY_ICONS = {
  'PDF Tools': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M8 13h1.5a1.5 1.5 0 0 1 0 3H8v3M13 13v6M13 16h2M17 13v6l2-3"/>',
  'Image Tools': '<rect x="3" y="4" width="18" height="14" rx="2"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="M4 16l4.5-4.5L12 15l3-3 5 5"/>',
  'Document Tools': DOC_PATH + '<path d="M8 12h8M8 15h8M8 18h5"/>',
  'File Tools': '<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M8.5 11v9M12.5 11v9M6.5 13.5h8M6.5 17h8"/>',
  'Archive Tools': '<path d="M4 4h16v16H4z"/><path d="M11 4v3M13 7v3M11 10v3M13 13v3"/>',
  'Media Tools': '<circle cx="12" cy="12" r="9"/><path d="M10 8.5l6 3.5-6 3.5z"/>',
};
function toolIcon(id, cls) { return svgIcon(ICONS[id] || DOC_PATH, cls); }
function categoryIcon(cat, cls) { return svgIcon(CATEGORY_ICONS[cat] || DOC_PATH, cls); }
const TOOLS = [
  { id:'compress-image', name:'Image Compressor', slug:'compress-image', category:'Image Tools', description:'Shrink JPG, PNG or WebP file size with an adjustable quality slider.', supportedFormats:['JPG','PNG','WebP'], popular:true, featured:true, clientSide:true },
  { id:'resize-image', name:'Image Resizer', slug:'resize-image', category:'Image Tools', description:'Resize an image to exact dimensions or by percentage.', supportedFormats:['JPG','PNG','WebP'], popular:true, featured:false, clientSide:true },
  { id:'jpg-to-png', name:'JPG to PNG', slug:'jpg-to-png', category:'Image Tools', description:'Convert a JPG photo to a lossless PNG file.', supportedFormats:['JPG'], popular:true, featured:false, clientSide:true },
  { id:'png-to-jpg', name:'PNG to JPG', slug:'png-to-jpg', category:'Image Tools', description:'Convert a PNG image to a smaller JPG file.', supportedFormats:['PNG'], popular:true, featured:false, clientSide:true },
  { id:'jpg-to-webp', name:'JPG to WebP', slug:'jpg-to-webp', category:'Image Tools', description:'Convert JPG photos to the smaller, modern WebP format.', supportedFormats:['JPG'], popular:false, featured:false, clientSide:true },
  { id:'webp-to-jpg', name:'WebP to JPG', slug:'webp-to-jpg', category:'Image Tools', description:'Convert WebP images back to the widely-supported JPG format.', supportedFormats:['WebP'], popular:false, featured:false, clientSide:true },
  { id:'crop-image', name:'Image Cropper', slug:'crop-image', category:'Image Tools', description:'Crop an image to the exact area you need.', supportedFormats:['JPG','PNG','WebP'], popular:false, featured:false, clientSide:true },
  { id:'rotate-image', name:'Image Rotator', slug:'rotate-image', category:'Image Tools', description:'Rotate or flip an image by 90°, 180° or 270°.', supportedFormats:['JPG','PNG','WebP'], popular:false, featured:false, clientSide:true },
  { id:'image-metadata-viewer', name:'Image Metadata Viewer', slug:'image-metadata-viewer', category:'Image Tools', description:'View the EXIF and file metadata stored inside a photo.', supportedFormats:['JPG','PNG','WebP'], popular:false, featured:false, clientSide:true },
  { id:'remove-image-metadata', name:'Image Metadata Remover', slug:'remove-image-metadata', category:'Image Tools', description:'Strip EXIF and location data from a photo before sharing it.', supportedFormats:['JPG','PNG','WebP'], popular:true, featured:false, clientSide:true },
  { id:'file-size-checker', name:'File Size Checker', slug:'file-size-checker', category:'File Tools', description:'Check a file\u2019s exact size in bytes, KB, MB and GB.', supportedFormats:['Any'], popular:false, featured:false, clientSide:true },
  { id:'file-type-checker', name:'File Type Checker', slug:'file-type-checker', category:'File Tools', description:'Identify a file\u2019s real type, extension and category.', supportedFormats:['Any'], popular:false, featured:false, clientSide:true },
  { id:'mime-type-checker', name:'MIME Type Checker', slug:'mime-type-checker', category:'File Tools', description:'Detect a file\u2019s MIME type for uploads and APIs.', supportedFormats:['Any'], popular:false, featured:false, clientSide:true },
  { id:'hash-generator', name:'Hash Generator', slug:'hash-generator', category:'File Tools', description:'Generate SHA-1, SHA-256 and SHA-512 hashes for any file.', supportedFormats:['Any'], popular:true, featured:false, clientSide:true },
  { id:'merge-pdf', name:'PDF Merger', slug:'merge-pdf', category:'PDF Tools', description:'Combine multiple PDF files into one document, in any order.', supportedFormats:['PDF'], popular:true, featured:true, clientSide:true },
  { id:'split-pdf', name:'PDF Splitter', slug:'split-pdf', category:'PDF Tools', description:'Split a PDF into separate files by page range.', supportedFormats:['PDF'], popular:true, featured:true, clientSide:true },
  { id:'extract-pdf-pages', name:'PDF Page Extractor', slug:'extract-pdf-pages', category:'PDF Tools', description:'Pull specific pages out of a PDF into a new file.', supportedFormats:['PDF'], popular:false, featured:false, clientSide:true },
  { id:'delete-pdf-pages', name:'PDF Page Deleter', slug:'delete-pdf-pages', category:'PDF Tools', description:'Remove specific pages from a PDF file.', supportedFormats:['PDF'], popular:false, featured:false, clientSide:true },
  { id:'reorder-pdf-pages', name:'PDF Page Reorder', slug:'reorder-pdf-pages', category:'PDF Tools', description:'Rearrange the page order of a PDF file.', supportedFormats:['PDF'], popular:false, featured:false, clientSide:true },
  { id:'rotate-pdf', name:'PDF Rotator', slug:'rotate-pdf', category:'PDF Tools', description:'Rotate one, several, or all pages in a PDF.', supportedFormats:['PDF'], popular:false, featured:false, clientSide:true },
  { id:'pdf-metadata-viewer', name:'PDF Metadata Viewer', slug:'pdf-metadata-viewer', category:'PDF Tools', description:'View a PDF\u2019s title, author, dates and page count.', supportedFormats:['PDF'], popular:false, featured:false, clientSide:true },
  { id:'remove-pdf-metadata', name:'PDF Metadata Remover', slug:'remove-pdf-metadata', category:'PDF Tools', description:'Clear the title, author and other metadata from a PDF.', supportedFormats:['PDF'], popular:false, featured:false, clientSide:true },
  { id:'txt-to-pdf', name:'TXT to PDF', slug:'txt-to-pdf', category:'Document Tools', description:'Turn a plain text file into a paginated PDF document.', supportedFormats:['TXT'], popular:false, featured:false, clientSide:true },
  { id:'zip-creator', name:'ZIP Creator', slug:'zip-creator', category:'Archive Tools', description:'Bundle multiple files into a single .zip archive.', supportedFormats:['Any'], popular:true, featured:false, clientSide:true },
  { id:'zip-extractor', name:'ZIP Extractor', slug:'zip-extractor', category:'Archive Tools', description:'Open a .zip archive and download the files inside.', supportedFormats:['ZIP'], popular:true, featured:false, clientSide:true },
];
/* =========================================================
   FILVORA — image-tools.js
   Canvas-based image processing shared by every image tool
   page: compress, resize, crop, rotate, convert, EXIF.
   Pure browser APIs — no external library needed.
   ========================================================= */
'use strict';

const MIME_BY_LABEL = { JPG: 'image/jpeg', JPEG: 'image/jpeg', PNG: 'image/png', WEBP: 'image/webp' };
const EXT_BY_MIME = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas export failed.')), mime, quality);
  });
}

/** Draw an <img> onto a fresh canvas at a given size (redrawing always
 *  strips any EXIF/metadata, since the canvas only ever holds pixels). */
function drawToCanvas(img, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

async function FilvoraImage_compress(file, quality, mime) {
  const { img, url } = await loadImage(file);
  const outMime = mime || (file.type === 'image/png' ? 'image/png' : 'image/jpeg');
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  const blob = await canvasToBlob(canvas, outMime, outMime === 'image/png' ? undefined : quality);
  URL.revokeObjectURL(url);
  return blob;
}

async function FilvoraImage_resize(file, { width, height, keepAspect = true }) {
  const { img, url } = await loadImage(file);
  let w = width, h = height;
  if (keepAspect) {
    const ratio = img.naturalWidth / img.naturalHeight;
    if (width && !height) h = Math.round(width / ratio);
    else if (height && !width) w = Math.round(height * ratio);
    else if (width && height) {
      // fit within box, preserving aspect
      const boxRatio = width / height;
      if (ratio > boxRatio) { w = width; h = Math.round(width / ratio); }
      else { h = height; w = Math.round(height * ratio); }
    }
  }
  w = Math.max(1, Math.round(w || img.naturalWidth));
  h = Math.max(1, Math.round(h || img.naturalHeight));
  const canvas = drawToCanvas(img, w, h);
  const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.92);
  URL.revokeObjectURL(url);
  return { blob, width: w, height: h };
}

async function FilvoraImage_convert(file, targetMime, quality = 0.92) {
  const { img, url } = await loadImage(file);
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  if (targetMime === 'image/jpeg') {
    // Flatten transparency onto white before encoding as JPG (JPG has no alpha channel).
    const ctx = canvas.getContext('2d');
    const flattened = document.createElement('canvas');
    flattened.width = canvas.width; flattened.height = canvas.height;
    const fctx = flattened.getContext('2d');
    fctx.fillStyle = '#fff';
    fctx.fillRect(0, 0, flattened.width, flattened.height);
    fctx.drawImage(canvas, 0, 0);
    const blob = await canvasToBlob(flattened, targetMime, quality);
    URL.revokeObjectURL(url);
    return blob;
  }
  const blob = await canvasToBlob(canvas, targetMime, quality);
  URL.revokeObjectURL(url);
  return blob;
}

async function FilvoraImage_rotate(file, degrees) {
  const { img, url } = await loadImage(file);
  const rad = (degrees * Math.PI) / 180;
  const swap = Math.abs(degrees % 180) === 90;
  const w = swap ? img.naturalHeight : img.naturalWidth;
  const h = swap ? img.naturalWidth : img.naturalHeight;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);
  const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.92);
  URL.revokeObjectURL(url);
  return blob;
}

async function FilvoraImage_crop(file, rect) {
  const { img, url } = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(rect.w));
  canvas.height = Math.max(1, Math.round(rect.h));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, rect.x, rect.y, rect.w, rect.h, 0, 0, canvas.width, canvas.height);
  const mime = file.type && file.type.startsWith('image/') ? file.type : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.92);
  URL.revokeObjectURL(url);
  return blob;
}

/** Strip metadata: redrawing to a canvas and re-encoding never carries
 *  EXIF/XMP/ICC chunks along, so this is a genuine, complete removal. */
async function FilvoraImage_stripMetadata(file) {
  const { img, url } = await loadImage(file);
  const canvas = drawToCanvas(img, img.naturalWidth, img.naturalHeight);
  const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  const blob = await canvasToBlob(canvas, mime, 0.95);
  URL.revokeObjectURL(url);
  return blob;
}

/* ---------------------------------------------------------
   Minimal EXIF reader (JPEG APP1 segment only). Reads the
   handful of tags people actually look for; it is not a
   full TIFF/EXIF implementation.
   --------------------------------------------------------- */
const EXIF_TAGS = {
  271: 'Make', 272: 'Model', 274: 'Orientation', 306: 'DateTime',
  36867: 'DateTimeOriginal', 40962: 'PixelXDimension', 40963: 'PixelYDimension',
  33434: 'ExposureTime', 33437: 'FNumber', 34855: 'ISO', 37386: 'FocalLength',
};
function FilvoraImage_readExif(arrayBuffer) {
  const view = new DataView(arrayBuffer);
  if (view.getUint16(0) !== 0xFFD8) return null; // not a JPEG
  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) {
      const segLen = view.getUint16(offset + 2);
      const exifStart = offset + 4;
      if (view.getUint32(exifStart) === 0x45786966) { // "Exif"
        return parseTiff(view, exifStart + 6);
      }
      offset += 2 + segLen;
    } else if ((marker & 0xFF00) !== 0xFF00) {
      break;
    } else if (marker === 0xFFDA) {
      break; // start of scan — no more metadata segments before pixel data
    } else {
      offset += 2 + view.getUint16(offset + 2);
    }
  }
  return null;
}
function parseTiff(view, tiffStart) {
  const little = view.getUint16(tiffStart) === 0x4949;
  const g16 = (o) => view.getUint16(o, little);
  const g32 = (o) => view.getUint32(o, little);
  const ifd0Offset = g32(tiffStart + 4);
  const tags = {};
  function readIFD(ifdOffset) {
    const count = g16(tiffStart + ifdOffset);
    let subIfdOffset = null;
    for (let i = 0; i < count; i++) {
      const entryOffset = tiffStart + ifdOffset + 2 + i * 12;
      const tagId = g16(entryOffset);
      const type = g16(entryOffset + 2);
      const numValues = g32(entryOffset + 4);
      const valueOffset = entryOffset + 8;
      const typeSize = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 9: 4, 10: 8 }[type] || 1;
      const totalSize = typeSize * numValues;
      const dataPos = totalSize <= 4 ? valueOffset : tiffStart + g32(valueOffset);
      if (tagId === 34665) { subIfdOffset = g32(valueOffset); continue; } // pointer to Exif SubIFD
      const name = EXIF_TAGS[tagId];
      if (!name) continue;
      if (type === 2) { // ASCII string
        let str = '';
        for (let j = 0; j < numValues - 1; j++) str += String.fromCharCode(view.getUint8(dataPos + j));
        tags[name] = str.trim();
      } else if (type === 3) { tags[name] = g16(dataPos); }
      else if (type === 4) { tags[name] = g32(dataPos); }
      else if (type === 5) { tags[name] = g32(dataPos) / (g32(dataPos + 4) || 1); }
    }
    return subIfdOffset;
  }
  try {
    const subIfdOffset = readIFD(ifd0Offset);
    if (subIfdOffset) readIFD(subIfdOffset);
  } catch (e) { /* truncated/unsupported — ignore */ }
  return Object.keys(tags).length ? tags : null;
}
/* =========================================================
   FILVORA — pdf-tools.js
   PDF manipulation for every /tools/*pdf* page. Built on
   pdf-lib (loaded via CDN on pages that need it) — no
   server upload, no pdf.js dependency (no page previews).
   window.PDFLib is provided by the pdf-lib script tag.
   ========================================================= */
'use strict';

function requirePdfLib() {
  if (typeof PDFLib === 'undefined') {
    const err = new Error('pdf-lib did not load');
    err.friendlyMessage = 'The PDF engine could not load (probably a network or ad-blocker issue). Please refresh and try again.';
    throw err;
  }
  return PDFLib;
}

async function FilvoraPdf_load(file) {
  const { PDFDocument } = requirePdfLib();
  const bytes = await readFileAsArrayBuffer(file);
  try {
    return await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  } catch (e) {
    const err = new Error('Could not read this PDF');
    err.friendlyMessage = 'This file couldn\u2019t be opened as a PDF. It may be corrupted, password-protected, or not actually a PDF.';
    throw err;
  }
}

async function FilvoraPdf_getInfo(file) {
  const doc = await FilvoraPdf_load(file);
  const fmt = (d) => (d instanceof Date && !isNaN(d) ? d.toLocaleString() : null);
  return {
    pageCount: doc.getPageCount(),
    title: doc.getTitle() || null,
    author: doc.getAuthor() || null,
    subject: doc.getSubject() || null,
    keywords: (doc.getKeywords() || '') || null,
    creator: doc.getCreator() || null,
    producer: doc.getProducer() || null,
    creationDate: fmt(doc.getCreationDate()),
    modificationDate: fmt(doc.getModificationDate()),
  };
}

function parsePageList(input, maxPage) {
  // Accepts "1,3,5-8" style input -> sorted unique array of 1-indexed page numbers
  const out = new Set();
  String(input).split(',').map(s => s.trim()).filter(Boolean).forEach(part => {
    const m = /^(\d+)\s*-\s*(\d+)$/.exec(part);
    if (m) {
      const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) if (i >= 1 && i <= maxPage) out.add(i);
    } else {
      const n = parseInt(part, 10);
      if (Number.isFinite(n) && n >= 1 && n <= maxPage) out.add(n);
    }
  });
  return [...out].sort((a, b) => a - b);
}

async function FilvoraPdf_merge(files) {
  const { PDFDocument } = requirePdfLib();
  const out = await PDFDocument.create();
  for (const file of files) {
    const src = await FilvoraPdf_load(file);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach(p => out.addPage(p));
  }
  return out.save();
}

async function FilvoraPdf_split(file, ranges) {
  const { PDFDocument } = requirePdfLib();
  const src = await FilvoraPdf_load(file);
  const results = [];
  for (const [from, to] of ranges) {
    const out = await PDFDocument.create();
    const indices = [];
    for (let p = from; p <= to; p++) indices.push(p - 1);
    const pages = await out.copyPages(src, indices);
    pages.forEach(p => out.addPage(p));
    results.push({ name: `pages-${from}-${to}.pdf`, bytes: await out.save() });
  }
  return results;
}

async function FilvoraPdf_extractPages(file, pageNumbers) {
  const { PDFDocument } = requirePdfLib();
  const src = await FilvoraPdf_load(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, pageNumbers.map(n => n - 1));
  pages.forEach(p => out.addPage(p));
  return out.save();
}

async function FilvoraPdf_deletePages(file, pageNumbers) {
  const { PDFDocument } = requirePdfLib();
  const src = await FilvoraPdf_load(file);
  const remove = new Set(pageNumbers);
  const keepIndices = src.getPageIndices().filter(i => !remove.has(i + 1));
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, keepIndices);
  pages.forEach(p => out.addPage(p));
  return out.save();
}

async function FilvoraPdf_reorderPages(file, newOrder) {
  const { PDFDocument } = requirePdfLib();
  const src = await FilvoraPdf_load(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, newOrder.map(n => n - 1));
  pages.forEach(p => out.addPage(p));
  return out.save();
}

async function FilvoraPdf_rotate(file, degrees, pageNumbers) {
  const { degrees: mkDegrees } = requirePdfLib();
  const doc = await FilvoraPdf_load(file);
  const targets = pageNumbers && pageNumbers.length ? pageNumbers : doc.getPageIndices().map(i => i + 1);
  targets.forEach(n => {
    const page = doc.getPage(n - 1);
    const current = page.getRotation().angle;
    page.setRotation(mkDegrees((current + degrees) % 360));
  });
  return doc.save();
}

async function FilvoraPdf_removeMetadata(file) {
  const doc = await FilvoraPdf_load(file);
  doc.setTitle('');
  doc.setAuthor('');
  doc.setSubject('');
  doc.setKeywords([]);
  doc.setCreator('');
  doc.setProducer('');
  return doc.save();
}
/* =========================================================
   FILVORA — archive-tools.js
   ZIP create/extract, built on JSZip (loaded via CDN on the
   zip-creator and zip-extractor pages).
   ========================================================= */
'use strict';

function requireJSZip() {
  if (typeof JSZip === 'undefined') {
    const err = new Error('JSZip did not load');
    err.friendlyMessage = 'The ZIP engine could not load (probably a network or ad-blocker issue). Please refresh and try again.';
    throw err;
  }
  return JSZip;
}

async function FilvoraZip_create(files, onProgress) {
  const Z = requireJSZip();
  const zip = new Z();
  files.forEach(f => zip.file(f.name, f));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (meta) => { if (onProgress) onProgress(meta.percent / 100); });
}

async function FilvoraZip_read(file) {
  const Z = requireJSZip();
  let zip;
  try {
    zip = await Z.loadAsync(file);
  } catch (e) {
    const err = new Error('Could not read this ZIP');
    err.friendlyMessage = 'This file couldn\u2019t be opened as a ZIP archive. It may be corrupted or in a different archive format.';
    throw err;
  }
  const entries = [];
  zip.forEach((relPath, entry) => {
    let size = null;
    try { size = entry._data ? entry._data.uncompressedSize : null; } catch (e) { size = null; }
    entries.push({ name: entry.name, isDir: entry.dir, size });
  });
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { zip, entries };
}

async function FilvoraZip_extractOne(zip, entryName) {
  return zip.file(entryName).async('blob');
}
/* =========================================================
   FILVORA — document-tools.js
   Plain text -> paginated PDF, built on pdf-lib.
   ========================================================= */
'use strict';

async function FilvoraDoc_txtToPdf(text, { fontSize = 11, pageSize = 'A4' } = {}) {
  const { PDFDocument, StandardFonts, rgb } = requirePdfLib();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const dims = pageSize === 'Letter' ? [612, 792] : [595.28, 841.89];
  const margin = 56;
  const lineHeight = fontSize * 1.4;
  const maxWidth = dims[0] - margin * 2;

  function wrapParagraph(paragraph) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (!words.length) return [''];
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(test, fontSize) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    return lines;
  }

  const rawLines = text.replace(/\r\n/g, '\n').split('\n');
  const allLines = [];
  rawLines.forEach(l => { wrapParagraph(l).forEach(w => allLines.push(w)); });

  let page = doc.addPage(dims);
  let y = dims[1] - margin;
  for (const line of allLines) {
    if (y < margin) { page = doc.addPage(dims); y = dims[1] - margin; }
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.08, 0.09, 0.12) });
    y -= lineHeight;
  }
  return doc.save();
}
/* =========================================================
   FILVORA — fileinfo-tools.js
   File size / type / MIME checkers and the hash generator.
   File API + Web Crypto only — no external library.
   ========================================================= */
'use strict';

const EXT_MAP = {
  jpg:['Image','image/jpeg'], jpeg:['Image','image/jpeg'], png:['Image','image/png'],
  gif:['Image','image/gif'], webp:['Image','image/webp'], svg:['Image','image/svg+xml'],
  bmp:['Image','image/bmp'], ico:['Image','image/x-icon'], avif:['Image','image/avif'],
  heic:['Image','image/heic'], tiff:['Image','image/tiff'],
  mp4:['Video','video/mp4'], mov:['Video','video/quicktime'], avi:['Video','video/x-msvideo'],
  mkv:['Video','video/x-matroska'], webm:['Video','video/webm'],
  mp3:['Audio','audio/mpeg'], wav:['Audio','audio/wav'], ogg:['Audio','audio/ogg'],
  m4a:['Audio','audio/mp4'], flac:['Audio','audio/flac'], aac:['Audio','audio/aac'],
  pdf:['Document','application/pdf'], doc:['Document','application/msword'],
  docx:['Document','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls:['Document','application/vnd.ms-excel'],
  xlsx:['Document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt:['Document','application/vnd.ms-powerpoint'],
  pptx:['Document','application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt:['Document','text/plain'], rtf:['Document','application/rtf'], csv:['Document','text/csv'],
  odt:['Document','application/vnd.oasis.opendocument.text'],
  zip:['Archive','application/zip'], rar:['Archive','application/vnd.rar'],
  '7z':['Archive','application/x-7z-compressed'], tar:['Archive','application/x-tar'], gz:['Archive','application/gzip'],
  html:['Code','text/html'], htm:['Code','text/html'], css:['Code','text/css'],
  js:['Code','text/javascript'], json:['Code','application/json'], xml:['Code','application/xml'],
  md:['Code','text/markdown'],
};
function categoryAndMime(name, browserType) {
  const ext = getExt(name);
  const entry = EXT_MAP[ext];
  const category = entry ? entry[0] : 'Other';
  const mime = browserType || (entry ? entry[1] : '') || 'application/octet-stream';
  return { category, mime, ext };
}

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hashFile(file, algo) {
  const buf = await readFileAsArrayBuffer(file);
  const digest = await crypto.subtle.digest(algo, buf);
  return bufferToHex(digest);
}
/* ---------------------------------------------------------
   Per-tool UI markup+logic and content, generated from the
   same source used for the multi-page build. Each entry in
   TOOL_BODIES is a self-contained HTML+<script> fragment;
   only one is ever in the DOM at a time (see showTool below),
   so their internal element IDs never collide with each other.
   --------------------------------------------------------- */
const TOOL_BODIES = {"compress-image": "\n<div class=\"panel\">\n  <h2>1. Choose an image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg,.png,.webp,image/*\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG, PNG, WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Compression settings</h2>\n  <div class=\"field\">\n    <label for=\"quality\">Quality: <span id=\"quality-val\">80</span>%</label>\n    <div class=\"range-row\"><input type=\"range\" id=\"quality\" min=\"10\" max=\"100\" value=\"80\"></div>\n  </div>\n  <div class=\"field\">\n    <label for=\"format\">Output format</label>\n    <select id=\"format\"><option value=\"keep\">Keep original format</option><option value=\"image/jpeg\">JPG</option><option value=\"image/png\">PNG</option></select>\n  </div>\n  <button class=\"btn accent\" id=\"run\" type=\"button\">Compress Image</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg','.jpeg','.png','.webp','image/'], maxSizeMB: 30, onFiles: (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    document.getElementById('options-panel').style.display = 'block';\n    document.getElementById('result-panel').style.display = 'none';\n  }});\n  document.getElementById('quality').addEventListener('input', (e) => { document.getElementById('quality-val').textContent = e.target.value; });\n  document.getElementById('run').addEventListener('click', async () => {\n    if (!file) return;\n    const btn = document.getElementById('run');\n    const resultPanel = document.getElementById('result-panel');\n    btn.disabled = true; btn.innerHTML = '<span class=\"spinner\"></span> Compressing\u2026';\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const quality = parseInt(document.getElementById('quality').value, 10) / 100;\n      const fmtChoice = document.getElementById('format').value;\n      const mime = fmtChoice === 'keep' ? (file.type || 'image/jpeg') : fmtChoice;\n      const blob = await FilvoraImage_compress(file, quality, mime);\n      const reduction = Math.max(0, Math.round((1 - blob.size / file.size) * 100));\n      const url = URL.createObjectURL(blob);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">Original size</span><span class=\"ri-value\">${formatBytes(file.size)}</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">Compressed size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">Reduction</span><span class=\"ri-value\">${reduction}%</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download Compressed Image</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-compressed.' + (mime === 'image/png' ? 'png' : 'jpg'), blob));\n      document.getElementById('again').addEventListener('click', resetTool);\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    } finally {\n      btn.disabled = false; btn.textContent = 'Compress Image';\n    }\n  });\n  function resetTool() { file = null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; document.getElementById('result-panel').style.display='none'; }\n})();\n</script>\n", "resize-image": "\n<div class=\"panel\">\n  <h2>1. Choose an image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg,.png,.webp,image/*\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG, PNG, WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. New dimensions</h2>\n  <p class=\"note\" id=\"orig-dims\" style=\"color:var(--ink-soft);font-size:.88rem\"></p>\n  <div class=\"field-row\">\n    <div class=\"field\"><label for=\"w\">Width (px)</label><input type=\"number\" id=\"w\" min=\"1\"></div>\n    <div class=\"field\"><label for=\"h\">Height (px)</label><input type=\"number\" id=\"h\" min=\"1\"></div>\n  </div>\n  <label class=\"check-row\"><input type=\"checkbox\" id=\"keep-aspect\" checked> Keep aspect ratio</label>\n  <button class=\"btn accent\" id=\"run\" type=\"button\" style=\"margin-top:1rem\">Resize Image</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, naturalW = 0, naturalH = 0;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg','.jpeg','.png','.webp','image/'], maxSizeMB: 30, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const { img, url } = await loadImage(file);\n    naturalW = img.naturalWidth; naturalH = img.naturalHeight;\n    URL.revokeObjectURL(url);\n    document.getElementById('orig-dims').textContent = `Original size: ${naturalW} \u00d7 ${naturalH} px`;\n    document.getElementById('w').value = naturalW;\n    document.getElementById('h').value = naturalH;\n    document.getElementById('options-panel').style.display = 'block';\n    document.getElementById('result-panel').style.display = 'none';\n  }});\n  document.getElementById('w').addEventListener('input', () => {\n    if (document.getElementById('keep-aspect').checked && naturalW) {\n      document.getElementById('h').value = Math.round(document.getElementById('w').value * (naturalH / naturalW));\n    }\n  });\n  document.getElementById('h').addEventListener('input', () => {\n    if (document.getElementById('keep-aspect').checked && naturalH) {\n      document.getElementById('w').value = Math.round(document.getElementById('h').value * (naturalW / naturalH));\n    }\n  });\n  document.getElementById('run').addEventListener('click', async () => {\n    if (!file) return;\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const width = parseInt(document.getElementById('w').value, 10);\n      const height = parseInt(document.getElementById('h').value, 10);\n      const { blob, width: w, height: h } = await FilvoraImage_resize(file, { width, height, keepAspect: document.getElementById('keep-aspect').checked });\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">New dimensions</span><span class=\"ri-value\">${w} \u00d7 ${h} px</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download Resized Image</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-resized.' + getExt(file.name), blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "jpg-to-png": "\n<div class=\"panel\">\n  <h2>1. Choose a JPG image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg', '.jpeg', 'image/'], maxSizeMB: 30, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const blob = await FilvoraImage_convert(file, 'image/png', 0.92);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">Output format</span><span class=\"ri-value\">PNG</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download PNG File</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '.png', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; resultPanel.style.display='none'; dz.querySelector('input').value=''; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "png-to-jpg": "\n<div class=\"panel\">\n  <h2>1. Choose a PNG image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".png\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PNG \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.png', 'image/'], maxSizeMB: 30, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const blob = await FilvoraImage_convert(file, 'image/jpeg', 0.92);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">Output format</span><span class=\"ri-value\">JPG</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download JPG File</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '.jpg', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; resultPanel.style.display='none'; dz.querySelector('input').value=''; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "jpg-to-webp": "\n<div class=\"panel\">\n  <h2>1. Choose a JPG image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg', '.jpeg', 'image/'], maxSizeMB: 30, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const blob = await FilvoraImage_convert(file, 'image/webp', 0.92);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">Output format</span><span class=\"ri-value\">WebP</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download WebP File</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '.webp', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; resultPanel.style.display='none'; dz.querySelector('input').value=''; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "webp-to-jpg": "\n<div class=\"panel\">\n  <h2>1. Choose a WebP image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".webp\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.webp', 'image/'], maxSizeMB: 30, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const blob = await FilvoraImage_convert(file, 'image/jpeg', 0.92);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">Output format</span><span class=\"ri-value\">JPG</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download JPG File</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '.jpg', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; resultPanel.style.display='none'; dz.querySelector('input').value=''; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "crop-image": "\n<div class=\"panel\">\n  <h2>1. Choose an image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg,.png,.webp,image/*\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG, PNG, WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"crop-panel\" style=\"display:none\">\n  <h2>2. Drag to select the crop area</h2>\n  <div id=\"crop-stage\" style=\"position:relative;max-width:100%;overflow:auto;border:1px solid var(--line);border-radius:10px;background:var(--paper-2);touch-action:none\">\n    <canvas id=\"crop-canvas\" style=\"display:block;max-width:100%;cursor:crosshair\"></canvas>\n    <div id=\"crop-rect\" style=\"position:absolute;border:2px solid var(--amber);background:rgba(184,132,42,.18);display:none;pointer-events:none\"></div>\n  </div>\n  <p class=\"note\" id=\"crop-readout\" style=\"color:var(--ink-soft);font-size:.85rem;margin-top:.6rem\">Drag on the image above to select the area you want to keep.</p>\n  <button class=\"btn accent\" id=\"run\" type=\"button\" style=\"margin-top:.6rem\" disabled>Crop Image</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, img = null, scale = 1, sel = null, dragging = false, startX = 0, startY = 0;\n  const dz = document.getElementById('dz');\n  const canvas = document.getElementById('crop-canvas');\n  const ctx = canvas.getContext('2d');\n  const rectEl = document.getElementById('crop-rect');\n  const runBtn = document.getElementById('run');\n\n  createDropzone(dz, { accept: ['.jpg','.jpeg','.png','.webp','image/'], maxSizeMB: 30, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const loaded = await loadImage(file);\n    img = loaded.img;\n    const maxW = Math.min(680, document.getElementById('crop-stage').clientWidth || 680);\n    scale = Math.min(1, maxW / img.naturalWidth);\n    canvas.width = Math.round(img.naturalWidth * scale);\n    canvas.height = Math.round(img.naturalHeight * scale);\n    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);\n    sel = null; rectEl.style.display = 'none'; runBtn.disabled = true;\n    document.getElementById('crop-panel').style.display = 'block';\n    document.getElementById('result-panel').style.display = 'none';\n  }});\n\n  function pos(e) {\n    const r = canvas.getBoundingClientRect();\n    const p = e.touches ? e.touches[0] : e;\n    return { x: p.clientX - r.left, y: p.clientY - r.top };\n  }\n  function startDrag(e) { dragging = true; const p = pos(e); startX = p.x; startY = p.y; e.preventDefault(); }\n  function moveDrag(e) {\n    if (!dragging) return;\n    const p = pos(e);\n    const x = Math.max(0, Math.min(startX, p.x)), y = Math.max(0, Math.min(startY, p.y));\n    const w = Math.min(canvas.width, Math.max(startX, p.x)) - x, h = Math.min(canvas.height, Math.max(startY, p.y)) - y;\n    sel = { x, y, w, h };\n    rectEl.style.display = 'block';\n    rectEl.style.left = x + 'px'; rectEl.style.top = y + 'px';\n    rectEl.style.width = w + 'px'; rectEl.style.height = h + 'px';\n    runBtn.disabled = w < 4 || h < 4;\n    document.getElementById('crop-readout').textContent = `Selection: ${Math.round(w/scale)} \u00d7 ${Math.round(h/scale)} px`;\n  }\n  function endDrag() { dragging = false; }\n  canvas.addEventListener('mousedown', startDrag);\n  canvas.addEventListener('mousemove', moveDrag);\n  window.addEventListener('mouseup', endDrag);\n  canvas.addEventListener('touchstart', startDrag, { passive: false });\n  canvas.addEventListener('touchmove', moveDrag, { passive: false });\n  canvas.addEventListener('touchend', endDrag);\n\n  runBtn.addEventListener('click', async () => {\n    if (!file || !sel || sel.w < 4 || sel.h < 4) return;\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const realRect = { x: sel.x / scale, y: sel.y / scale, w: sel.w / scale, h: sel.h / scale };\n      const blob = await FilvoraImage_crop(file, realRect);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\">\n          <div class=\"result-item\"><span class=\"ri-label\">Cropped size</span><span class=\"ri-value\">${Math.round(realRect.w)} \u00d7 ${Math.round(realRect.h)} px</span></div>\n          <div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div>\n        </div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download Cropped Image</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-cropped.' + getExt(file.name), blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; img=null; sel=null; document.getElementById('chip').innerHTML=''; document.getElementById('crop-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "rotate-image": "\n<div class=\"panel\">\n  <h2>1. Choose an image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg,.png,.webp,image/*\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG, PNG, WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Choose a rotation</h2>\n  <div class=\"btn-row\">\n    <button class=\"btn secondary\" data-deg=\"90\" type=\"button\">Rotate 90\u00b0 right</button>\n    <button class=\"btn secondary\" data-deg=\"180\" type=\"button\">Rotate 180\u00b0</button>\n    <button class=\"btn secondary\" data-deg=\"270\" type=\"button\">Rotate 90\u00b0 left</button>\n  </div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg','.jpeg','.png','.webp','image/'], maxSizeMB: 30, onFiles: (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    document.getElementById('options-panel').style.display = 'block';\n    document.getElementById('result-panel').style.display = 'none';\n  }});\n  document.querySelectorAll('#options-panel [data-deg]').forEach(btn => btn.addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const blob = await FilvoraImage_rotate(file, parseInt(btn.dataset.deg, 10));\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download Rotated Image</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-rotated.' + getExt(file.name), blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }));\n})();\n</script>\n", "image-metadata-viewer": "\n<div class=\"panel\">\n  <h2>Choose an image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg,.png,.webp,image/*\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG, PNG, WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg','.jpeg','.png','.webp','image/'], maxSizeMB: 30, onFiles: async (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<p class=\"note\">Reading metadata\u2026</p>';\n    try {\n      const { img, url } = await loadImage(file);\n      const dims = `${img.naturalWidth} \u00d7 ${img.naturalHeight} px`;\n      URL.revokeObjectURL(url);\n      const rows = [\n        ['File name', escapeHtml(file.name)],\n        ['File size', formatBytes(file.size)],\n        ['Dimensions', dims],\n        ['MIME type', escapeHtml(file.type || 'unknown')],\n      ];\n      let exif = null;\n      if (/jpe?g$/i.test(getExt(file.name))) {\n        const buf = await readFileAsArrayBuffer(file);\n        exif = FilvoraImage_readExif(buf);\n      }\n      let exifHtml = '';\n      if (exif) {\n        exifHtml = `<h3 style=\"font-size:.9rem;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);margin:1.2rem 0 .6rem\">EXIF data found</h3>` +\n          `<div class=\"result-grid\">${Object.entries(exif).map(([k,v]) => `<div class=\"result-item\"><span class=\"ri-label\">${escapeHtml(k)}</span><span class=\"ri-value\">${escapeHtml(String(v))}</span></div>`).join('')}</div>`;\n      } else {\n        exifHtml = `<p class=\"note\" style=\"margin-top:1rem\">No EXIF data was found in this file (common for PNG/WebP, or photos already stripped of metadata).</p>`;\n      }\n      resultPanel.innerHTML = `<h2>Metadata</h2><div class=\"result-grid\">${rows.map(([l,v]) => `<div class=\"result-item\"><span class=\"ri-label\">${l}</span><span class=\"ri-value\">${v}</span></div>`).join('')}</div>` + exifHtml;\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "remove-image-metadata": "\n<div class=\"panel\">\n  <h2>Choose an image</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop an image here\">\n    <input type=\"file\" accept=\".jpg,.jpeg,.png,.webp,image/*\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your image here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">JPG, PNG, WebP \u2022 up to 30MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.jpg','.jpeg','.png','.webp','image/'], maxSizeMB: 30, onFiles: async (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const blob = await FilvoraImage_stripMetadata(file);\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready \u2014 metadata removed.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download Clean Image</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-clean.' + (file.type === 'image/png' ? 'png' : 'jpg'), blob));\n      document.getElementById('again').addEventListener('click', () => { document.getElementById('chip').innerHTML=''; resultPanel.style.display='none'; dz.querySelector('input').value=''; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "merge-pdf": "\n<div class=\"panel\">\n  <h2>1. Choose PDF files</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop PDF files here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\" multiple>\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF files here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose files</span> (add at least 2)</div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB each</div>\n  </div>\n</div>\n<div class=\"panel\" id=\"order-panel\" style=\"display:none\">\n  <h2>2. Set the merge order</h2>\n  <p class=\"note\" style=\"color:var(--ink-soft);font-size:.85rem\">Use the arrows to reorder files \u2014 they\\u2019ll be combined top to bottom.</p>\n  <ul class=\"file-chip-list\" id=\"order-list\"></ul>\n  <button class=\"btn accent\" id=\"run\" type=\"button\" style=\"margin-top:1rem\" disabled>Merge PDFs</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let files = [];\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { multiple: true, accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: (newFiles) => {\n    files = files.concat(newFiles);\n    renderList();\n  }});\n  function renderList() {\n    const list = document.getElementById('order-list');\n    document.getElementById('order-panel').style.display = files.length ? 'block' : 'none';\n    document.getElementById('run').disabled = files.length < 2;\n    list.innerHTML = files.map((f, i) => `\n      <li class=\"file-chip\">\n        <span class=\"fc-name\">${i+1}. ${escapeHtml(f.name)}</span>\n        <span class=\"fc-size\">${formatBytes(f.size)}</span>\n        <button type=\"button\" data-up=\"${i}\" aria-label=\"Move up\" ${i===0?'disabled':''} style=\"color:var(--teal-ink)\">\u2191</button>\n        <button type=\"button\" data-down=\"${i}\" aria-label=\"Move down\" ${i===files.length-1?'disabled':''} style=\"color:var(--teal-ink)\">\u2193</button>\n        <button type=\"button\" data-remove=\"${i}\" aria-label=\"Remove\">\u00d7</button>\n      </li>`).join('');\n    list.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => { const i=+b.dataset.up; [files[i-1],files[i]]=[files[i],files[i-1]]; renderList(); }));\n    list.querySelectorAll('[data-down]').forEach(b => b.addEventListener('click', () => { const i=+b.dataset.down; [files[i+1],files[i]]=[files[i],files[i+1]]; renderList(); }));\n    list.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => { files.splice(+b.dataset.remove,1); renderList(); }));\n  }\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const bytes = await FilvoraPdf_merge(files);\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Your merged PDF is ready.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">Files combined</span><span class=\"ri-value\">${files.length}</span></div><div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download Merged PDF</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob('merged.pdf', blob));\n      document.getElementById('again').addEventListener('click', () => { files = []; renderList(); resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "split-pdf": "\n<div class=\"panel\">\n  <h2>1. Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Choose page ranges</h2>\n  <p class=\"note\" id=\"page-count\" style=\"color:var(--ink-soft);font-size:.85rem\"></p>\n  <div class=\"field\"><label for=\"ranges\">Ranges (comma-separated, e.g. 1-3, 4-6, 7-10)</label><input type=\"text\" id=\"ranges\" placeholder=\"1-3, 4-6\"></div>\n  <button class=\"btn accent\" id=\"run\" type=\"button\">Split PDF</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, pageCount = 0;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    try {\n      const info = await FilvoraPdf_getInfo(file);\n      pageCount = info.pageCount;\n      document.getElementById('page-count').textContent = `This PDF has ${pageCount} page(s).`;\n      document.getElementById('ranges').value = pageCount > 1 ? `1-${Math.ceil(pageCount/2)}, ${Math.ceil(pageCount/2)+1}-${pageCount}` : '1-1';\n      document.getElementById('options-panel').style.display = 'block';\n      document.getElementById('result-panel').style.display = 'none';\n    } catch (e) { toast(friendlyError(e), 'error'); }\n  }});\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const rangeText = document.getElementById('ranges').value;\n      const ranges = rangeText.split(',').map(s => s.trim()).filter(Boolean).map(s => {\n        const m = /^(\\d+)\\s*-\\s*(\\d+)$/.exec(s) || /^(\\d+)$/.exec(s);\n        if (!m) return null;\n        const a = parseInt(m[1],10), b = m[2] ? parseInt(m[2],10) : a;\n        return [Math.max(1,Math.min(a,b)), Math.min(pageCount,Math.max(a,b))];\n      }).filter(Boolean);\n      if (!ranges.length) { resultPanel.innerHTML = statusHTML('error', 'Enter at least one valid page range, like 1-3.'); return; }\n      const parts = await FilvoraPdf_split(file, ranges);\n      resultPanel.innerHTML = statusHTML('success', `Split into ${parts.length} file(s).`) +\n        `<div class=\"table-wrap\"><table><thead><tr><th>File</th><th>Size</th><th></th></tr></thead><tbody>${\n          parts.map((p,i) => `<tr><td>${escapeHtml(p.name)}</td><td class=\"mono\">${formatBytes(p.bytes.length)}</td><td><button class=\"btn secondary\" data-idx=\"${i}\" type=\"button\">Download</button></td></tr>`).join('')\n        }</tbody></table></div>\n        <div class=\"btn-row\"><button class=\"btn accent\" id=\"dl-all\" type=\"button\">Download All</button><button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button></div>`;\n      resultPanel.querySelectorAll('[data-idx]').forEach(btn => btn.addEventListener('click', () => {\n        const p = parts[+btn.dataset.idx];\n        downloadBlob(p.name, new Blob([p.bytes], { type: 'application/pdf' }));\n      }));\n      document.getElementById('dl-all').addEventListener('click', async () => {\n        for (const p of parts) { downloadBlob(p.name, new Blob([p.bytes], { type: 'application/pdf' })); await new Promise(r => setTimeout(r, 250)); }\n      });\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "extract-pdf-pages": "\n<div class=\"panel\">\n  <h2>1. Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Which pages do you want to keep?</h2>\n  <p class=\"note\" id=\"page-count\" style=\"color:var(--ink-soft);font-size:.85rem\"></p>\n  <div class=\"field\"><label for=\"pages\">Page numbers (e.g. 1,3,5-8)</label><input type=\"text\" id=\"pages\" placeholder=\"1,3,5-8\"></div>\n  <button class=\"btn accent\" id=\"run\" type=\"button\">Extract Pages</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, pageCount = 0;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    try {\n      const info = await FilvoraPdf_getInfo(file);\n      pageCount = info.pageCount;\n      document.getElementById('page-count').textContent = `This PDF has ${pageCount} page(s).`;\n      document.getElementById('options-panel').style.display = 'block';\n      document.getElementById('result-panel').style.display = 'none';\n    } catch (e) { toast(friendlyError(e), 'error'); }\n  }});\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const pages = parsePageList(document.getElementById('pages').value, pageCount);\n      if (!pages.length) { resultPanel.innerHTML = statusHTML('error', 'Enter at least one valid page number.'); return; }\n      const bytes = await FilvoraPdf_extractPages(file, pages);\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download PDF</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-extracted.pdf', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "delete-pdf-pages": "\n<div class=\"panel\">\n  <h2>1. Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Which pages do you want to delete?</h2>\n  <p class=\"note\" id=\"page-count\" style=\"color:var(--ink-soft);font-size:.85rem\"></p>\n  <div class=\"field\"><label for=\"pages\">Page numbers (e.g. 1,3,5-8)</label><input type=\"text\" id=\"pages\" placeholder=\"1,3,5-8\"></div>\n  <button class=\"btn accent\" id=\"run\" type=\"button\">Delete Pages</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, pageCount = 0;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    try {\n      const info = await FilvoraPdf_getInfo(file);\n      pageCount = info.pageCount;\n      document.getElementById('page-count').textContent = `This PDF has ${pageCount} page(s).`;\n      document.getElementById('options-panel').style.display = 'block';\n      document.getElementById('result-panel').style.display = 'none';\n    } catch (e) { toast(friendlyError(e), 'error'); }\n  }});\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const pages = parsePageList(document.getElementById('pages').value, pageCount);\n      if (!pages.length) { resultPanel.innerHTML = statusHTML('error', 'Enter at least one valid page number.'); return; }\n      const bytes = await FilvoraPdf_deletePages(file, pages);\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Your file is ready.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\">\n          <button class=\"btn accent\" id=\"dl\" type=\"button\">Download PDF</button>\n          <button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button>\n        </div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-deleted.pdf', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "reorder-pdf-pages": "\n<div class=\"panel\">\n  <h2>1. Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Reorder the pages</h2>\n  <p class=\"note\" style=\"color:var(--ink-soft);font-size:.85rem\">Use the arrows to set the new page order.</p>\n  <ul class=\"file-chip-list\" id=\"order-list\"></ul>\n  <button class=\"btn accent\" id=\"run\" type=\"button\" style=\"margin-top:1rem\">Save New Order</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, order = [];\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    try {\n      const info = await FilvoraPdf_getInfo(file);\n      order = Array.from({ length: info.pageCount }, (_, i) => i + 1);\n      renderOrder();\n      document.getElementById('options-panel').style.display = 'block';\n      document.getElementById('result-panel').style.display = 'none';\n    } catch (e) { toast(friendlyError(e), 'error'); }\n  }});\n  function renderOrder() {\n    const list = document.getElementById('order-list');\n    list.innerHTML = order.map((p, i) => `\n      <li class=\"file-chip\">\n        <span class=\"fc-name\">Position ${i+1} \u2014 original page ${p}</span>\n        <button type=\"button\" data-up=\"${i}\" aria-label=\"Move up\" ${i===0?'disabled':''} style=\"color:var(--teal-ink)\">\u2191</button>\n        <button type=\"button\" data-down=\"${i}\" aria-label=\"Move down\" ${i===order.length-1?'disabled':''} style=\"color:var(--teal-ink)\">\u2193</button>\n      </li>`).join('');\n    list.querySelectorAll('[data-up]').forEach(b => b.addEventListener('click', () => { const i=+b.dataset.up; [order[i-1],order[i]]=[order[i],order[i-1]]; renderOrder(); }));\n    list.querySelectorAll('[data-down]').forEach(b => b.addEventListener('click', () => { const i=+b.dataset.down; [order[i+1],order[i]]=[order[i],order[i+1]]; renderOrder(); }));\n  }\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const bytes = await FilvoraPdf_reorderPages(file, order);\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Your reordered PDF is ready.') +\n        `<div class=\"btn-row\"><button class=\"btn accent\" id=\"dl\" type=\"button\">Download PDF</button><button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button></div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-reordered.pdf', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "rotate-pdf": "\n<div class=\"panel\">\n  <h2>1. Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"options-panel\" style=\"display:none\">\n  <h2>2. Choose pages and rotation</h2>\n  <p class=\"note\" id=\"page-count\" style=\"color:var(--ink-soft);font-size:.85rem\"></p>\n  <div class=\"field\"><label for=\"pages\">Pages to rotate (leave blank for all pages)</label><input type=\"text\" id=\"pages\" placeholder=\"e.g. 1,3,5-8\"></div>\n  <div class=\"btn-row\">\n    <button class=\"btn secondary\" data-deg=\"90\" type=\"button\">Rotate 90\u00b0 right</button>\n    <button class=\"btn secondary\" data-deg=\"180\" type=\"button\">Rotate 180\u00b0</button>\n    <button class=\"btn secondary\" data-deg=\"270\" type=\"button\">Rotate 90\u00b0 left</button>\n  </div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let file = null, pageCount = 0;\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    try {\n      const info = await FilvoraPdf_getInfo(file);\n      pageCount = info.pageCount;\n      document.getElementById('page-count').textContent = `This PDF has ${pageCount} page(s).`;\n      document.getElementById('options-panel').style.display = 'block';\n      document.getElementById('result-panel').style.display = 'none';\n    } catch (e) { toast(friendlyError(e), 'error'); }\n  }});\n  document.querySelectorAll('#options-panel [data-deg]').forEach(btn => btn.addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const raw = document.getElementById('pages').value.trim();\n      const pages = raw ? parsePageList(raw, pageCount) : [];\n      const bytes = await FilvoraPdf_rotate(file, parseInt(btn.dataset.deg, 10), pages);\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Your rotated PDF is ready.') +\n        `<div class=\"btn-row\"><button class=\"btn accent\" id=\"dl\" type=\"button\">Download PDF</button><button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button></div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-rotated.pdf', blob));\n      document.getElementById('again').addEventListener('click', () => { file=null; document.getElementById('chip').innerHTML=''; document.getElementById('options-panel').style.display='none'; resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }));\n})();\n</script>\n", "pdf-metadata-viewer": "\n<div class=\"panel\">\n  <h2>Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<p class=\"note\">Reading metadata\u2026</p>';\n    try {\n      const info = await FilvoraPdf_getInfo(file);\n      const rows = [\n        ['Page count', info.pageCount],\n        ['Title', info.title || '(not set)'],\n        ['Author', info.author || '(not set)'],\n        ['Subject', info.subject || '(not set)'],\n        ['Keywords', info.keywords || '(not set)'],\n        ['Creator', info.creator || '(not set)'],\n        ['Producer', info.producer || '(not set)'],\n        ['Created', info.creationDate || '(not set)'],\n        ['Modified', info.modificationDate || '(not set)'],\n      ];\n      resultPanel.innerHTML = `<h2>Metadata</h2><div class=\"result-grid\">${rows.map(([l,v]) => `<div class=\"result-item\"><span class=\"ri-label\">${escapeHtml(l)}</span><span class=\"ri-value\">${escapeHtml(String(v))}</span></div>`).join('')}</div>`;\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "remove-pdf-metadata": "\n<div class=\"panel\">\n  <h2>Choose a PDF file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a PDF file here\">\n    <input type=\"file\" accept=\".pdf,application/pdf\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your PDF file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">PDF \u2022 up to 50MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.pdf','application/pdf'], maxSizeMB: 50, onFiles: async (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const bytes = await FilvoraPdf_removeMetadata(file);\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Metadata cleared where the PDF format allows it.') +\n        `<p class=\"note\">The title, author, subject and keyword fields have been cleared. As noted below, the Producer field and modification date are rewritten by the PDF engine and can\\u2019t be fully blanked.</p>\n        <div class=\"btn-row\"><button class=\"btn accent\" id=\"dl\" type=\"button\">Download PDF</button><button class=\"btn secondary\" id=\"again\" type=\"button\">Process another file</button></div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob(nameWithoutExt(file.name) + '-no-metadata.pdf', blob));\n      document.getElementById('again').addEventListener('click', () => { document.getElementById('chip').innerHTML=''; resultPanel.style.display='none'; dz.querySelector('input').value=''; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n", "file-size-checker": "\n<div class=\"panel\">\n  <h2>Choose a file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a file here\">\n    <input type=\"file\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop any file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">Any file type \u2022 up to 500MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { maxSizeMB: 500, onFiles: (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = `<h2>Size</h2><div class=\"result-grid\">\n      <div class=\"result-item\"><span class=\"ri-label\">Bytes</span><span class=\"ri-value\">${file.size.toLocaleString()}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">KB</span><span class=\"ri-value\">${(file.size/1000).toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">MB</span><span class=\"ri-value\">${(file.size/1e6).toLocaleString(undefined,{maximumFractionDigits:2})}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">GB</span><span class=\"ri-value\">${(file.size/1e9).toLocaleString(undefined,{maximumFractionDigits:4})}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">Human readable</span><span class=\"ri-value\">${formatBytes(file.size)}</span></div>\n    </div>`;\n  }});\n})();\n</script>\n", "file-type-checker": "\n<div class=\"panel\">\n  <h2>Choose a file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a file here\">\n    <input type=\"file\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop any file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">Any file type \u2022 up to 500MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { maxSizeMB: 500, onFiles: (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const { category, mime, ext } = categoryAndMime(file.name, file.type);\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = `<h2>File type</h2><div class=\"result-grid\">\n      <div class=\"result-item\"><span class=\"ri-label\">Extension</span><span class=\"ri-value\">${ext ? '.'+escapeHtml(ext) : '(none)'}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">MIME type</span><span class=\"ri-value\">${escapeHtml(mime)}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">Category</span><span class=\"ri-value\">${escapeHtml(category)}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">Size</span><span class=\"ri-value\">${formatBytes(file.size)}</span></div>\n    </div>`;\n  }});\n})();\n</script>\n", "mime-type-checker": "\n<div class=\"panel\">\n  <h2>Choose a file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a file here\">\n    <input type=\"file\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop any file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">Any file type \u2022 up to 500MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { maxSizeMB: 500, onFiles: (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const { category, mime, ext } = categoryAndMime(file.name, file.type);\n    const browserReported = file.type || '(browser did not report a type \u2014 shown value is inferred from the extension)';\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = `<h2>MIME type</h2><div class=\"result-grid\">\n      <div class=\"result-item\"><span class=\"ri-label\">MIME type</span><span class=\"ri-value\">${escapeHtml(mime)}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">Browser-reported type</span><span class=\"ri-value\">${escapeHtml(browserReported)}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">Extension</span><span class=\"ri-value\">${ext ? '.'+escapeHtml(ext) : '(none)'}</span></div>\n      <div class=\"result-item\"><span class=\"ri-label\">Category</span><span class=\"ri-value\">${escapeHtml(category)}</span></div>\n    </div>`;\n  }});\n})();\n</script>\n", "hash-generator": "\n<div class=\"panel\">\n  <h2>Choose a file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a file here\">\n    <input type=\"file\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop any file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">Any file type \u2022 up to 500MB</div>\n  </div>\n  <div id=\"chip\"></div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const ALGOS = ['SHA-1','SHA-256','SHA-384','SHA-512'];\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { maxSizeMB: 500, onFiles: async (files) => {\n    const file = files[0];\n    document.getElementById('chip').innerHTML = fileChipListHTML([file], { removable: false });\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:50%\"></div></div>';\n    const hashes = {};\n    for (const algo of ALGOS) hashes[algo] = await hashFile(file, algo);\n    resultPanel.innerHTML = `<h2>Hashes for ${escapeHtml(file.name)}</h2>` +\n      ALGOS.map(algo => `<div class=\"field\" style=\"margin-bottom:.8rem\">\n        <label>${algo}</label>\n        <div class=\"result-box\" style=\"margin-bottom:.4rem\">${hashes[algo]}</div>\n        <button class=\"btn secondary\" type=\"button\" data-algo=\"${algo}\">Copy ${algo}</button>\n      </div>`).join('') +\n      `<div class=\"btn-row\"><button class=\"btn secondary\" id=\"dl-all\" type=\"button\">Download all (.txt)</button></div>`;\n    resultPanel.querySelectorAll('[data-algo]').forEach(btn => btn.addEventListener('click', async () => {\n      await navigator.clipboard.writeText(hashes[btn.dataset.algo]).catch(()=>{});\n      const t = btn.textContent; btn.textContent = 'Copied \u2713'; setTimeout(()=>btn.textContent=t, 1200);\n    }));\n    document.getElementById('dl-all').addEventListener('click', () => downloadBlob(file.name + '.hashes.txt', new Blob([ALGOS.map(a=>`${a}: ${hashes[a]}`).join('\\n')], { type: 'text/plain' })));\n  }});\n})();\n</script>\n", "txt-to-pdf": "\n<div class=\"panel\">\n  <h2>1. Choose a .txt file or paste text</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a text file here\">\n    <input type=\"file\" accept=\".txt,text/plain\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your .txt file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">TXT \u2022 up to 20MB</div>\n  </div>\n  <div class=\"field\" style=\"margin-top:1rem\"><label for=\"text-input\">Or paste/edit text directly</label><textarea id=\"text-input\" rows=\"8\" placeholder=\"Paste your text here\u2026\"></textarea></div>\n</div>\n<div class=\"panel\">\n  <h2>2. Page settings</h2>\n  <div class=\"field-row\">\n    <div class=\"field\"><label for=\"page-size\">Page size</label><select id=\"page-size\"><option value=\"A4\">A4</option><option value=\"Letter\">US Letter</option></select></div>\n    <div class=\"field\"><label for=\"font-size\">Font size</label><select id=\"font-size\"><option value=\"10\">10pt</option><option value=\"11\" selected>11pt</option><option value=\"13\">13pt</option></select></div>\n  </div>\n  <button class=\"btn accent\" id=\"run\" type=\"button\">Convert to PDF</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  const textInput = document.getElementById('text-input');\n  createDropzone(dz, { accept: ['.txt','text/plain'], maxSizeMB: 20, onFiles: async (files) => {\n    textInput.value = await readFileAsText(files[0]);\n  }});\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    const text = textInput.value;\n    if (!text.trim()) { resultPanel.innerHTML = statusHTML('error', 'Add some text first \u2014 upload a .txt file or paste text above.'); return; }\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" style=\"width:60%\"></div></div>';\n    try {\n      const bytes = await FilvoraDoc_txtToPdf(text, { fontSize: parseInt(document.getElementById('font-size').value,10), pageSize: document.getElementById('page-size').value });\n      const blob = new Blob([bytes], { type: 'application/pdf' });\n      resultPanel.innerHTML = statusHTML('success', 'Your PDF is ready.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">File size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\"><button class=\"btn accent\" id=\"dl\" type=\"button\">Download PDF</button></div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob('document.pdf', blob));\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "zip-creator": "\n<div class=\"panel\">\n  <h2>1. Add files</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop files here\">\n    <input type=\"file\" multiple>\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop files here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose files</span></div>\n    <div class=\"dz-formats\">Any file type \u2022 up to 500MB total</div>\n  </div>\n  <div id=\"chips\"></div>\n  <div id=\"total\" class=\"note\" style=\"color:var(--ink-soft);font-size:.85rem;margin-top:.6rem\"></div>\n  <button class=\"btn accent\" id=\"run\" type=\"button\" style=\"margin-top:1rem\" disabled>Create ZIP</button>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  let files = [];\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { multiple: true, maxSizeMB: 500, onFiles: (newFiles) => { files = files.concat(newFiles); renderChips(); }});\n  function renderChips() {\n    document.getElementById('chips').innerHTML = fileChipListHTML(files);\n    document.querySelectorAll('.fc-remove').forEach(btn => btn.addEventListener('click', () => { files.splice(+btn.dataset.idx,1); renderChips(); }));\n    const total = files.reduce((a,f)=>a+f.size,0);\n    document.getElementById('total').textContent = files.length ? `${files.length} file(s), ${formatBytes(total)} total` : '';\n    document.getElementById('run').disabled = !files.length;\n  }\n  document.getElementById('run').addEventListener('click', async () => {\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<div class=\"progress-wrap\"><div class=\"progress-bar\" id=\"bar\" style=\"width:0%\"></div></div>';\n    try {\n      const blob = await FilvoraZip_create(files, (frac) => { const b=document.getElementById('bar'); if (b) b.style.width = Math.round(frac*100)+'%'; });\n      resultPanel.innerHTML = statusHTML('success', 'Your ZIP file is ready.') +\n        `<div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">Files</span><span class=\"ri-value\">${files.length}</span></div><div class=\"result-item\"><span class=\"ri-label\">Archive size</span><span class=\"ri-value\">${formatBytes(blob.size)}</span></div></div>\n        <div class=\"btn-row\"><button class=\"btn accent\" id=\"dl\" type=\"button\">Download archive.zip</button><button class=\"btn secondary\" id=\"again\" type=\"button\">Start over</button></div>`;\n      document.getElementById('dl').addEventListener('click', () => downloadBlob('archive.zip', blob));\n      document.getElementById('again').addEventListener('click', () => { files=[]; renderChips(); resultPanel.style.display='none'; });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  });\n})();\n</script>\n", "zip-extractor": "\n<div class=\"panel\">\n  <h2>Choose a .zip file</h2>\n  <div class=\"dropzone\" id=\"dz\" tabindex=\"0\" role=\"button\" aria-label=\"Drag and drop a ZIP file here\">\n    <input type=\"file\" accept=\".zip,application/zip\">\n    <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 16V4M8 8l4-4 4 4\"/><path d=\"M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3\"/></svg>\n    <strong>Drop your .zip file here</strong>\n    <div>or <span style=\"color:var(--teal-ink);font-weight:700\">choose a file</span></div>\n    <div class=\"dz-formats\">ZIP \u2022 up to 500MB</div>\n  </div>\n</div>\n<div class=\"panel\" id=\"result-panel\" style=\"display:none\"></div>\n<script>\n(function(){\n  const dz = document.getElementById('dz');\n  createDropzone(dz, { accept: ['.zip','application/zip'], maxSizeMB: 500, onFiles: async (files) => {\n    const file = files[0];\n    const resultPanel = document.getElementById('result-panel');\n    resultPanel.style.display = 'block';\n    resultPanel.innerHTML = '<p class=\"note\">Reading archive\u2026</p>';\n    try {\n      const { zip, entries } = await FilvoraZip_read(file);\n      const visible = entries.filter(e => !e.isDir);\n      resultPanel.innerHTML = `<h2>${escapeHtml(file.name)}</h2>\n        <div class=\"result-grid\"><div class=\"result-item\"><span class=\"ri-label\">Files</span><span class=\"ri-value\">${visible.length}</span></div><div class=\"result-item\"><span class=\"ri-label\">Archive size</span><span class=\"ri-value\">${formatBytes(file.size)}</span></div></div>\n        <div class=\"table-wrap\" style=\"margin-top:.9rem\"><table>\n          <thead><tr><th><input type=\"checkbox\" id=\"all-check\" checked></th><th>Path</th><th>Size</th><th></th></tr></thead>\n          <tbody>${visible.map((e,i) => `<tr><td><input type=\"checkbox\" class=\"row-check\" data-idx=\"${i}\" checked></td><td class=\"mono\">${escapeHtml(e.name)}</td><td class=\"mono\">${e.size!=null?formatBytes(e.size):'\u2014'}</td><td><button class=\"btn secondary\" data-single=\"${i}\" type=\"button\">Download</button></td></tr>`).join('')}</tbody>\n        </table></div>\n        <div class=\"btn-row\"><button class=\"btn accent\" id=\"extract-selected\" type=\"button\">Extract &amp; Download Selected</button></div>\n        <div id=\"zx-status\" style=\"margin-top:.7rem\"></div>`;\n      document.getElementById('all-check').addEventListener('change', (e) => document.querySelectorAll('.row-check').forEach(c => c.checked = e.target.checked));\n      document.querySelectorAll('[data-single]').forEach(btn => btn.addEventListener('click', async () => {\n        const entry = visible[+btn.dataset.single];\n        const blob = await FilvoraZip_extractOne(zip, entry.name);\n        downloadBlob(entry.name.split('/').pop(), blob);\n      }));\n      document.getElementById('extract-selected').addEventListener('click', async () => {\n        const checked = Array.from(document.querySelectorAll('.row-check')).filter(c => c.checked).map(c => visible[+c.dataset.idx]);\n        const status = document.getElementById('zx-status');\n        if (!checked.length) { status.innerHTML = statusHTML('error', 'Select at least one file.'); return; }\n        status.innerHTML = `<span class=\"spinner\"></span> Extracting ${checked.length} file(s)\u2026`;\n        for (const entry of checked) {\n          const blob = await FilvoraZip_extractOne(zip, entry.name);\n          downloadBlob(entry.name.split('/').pop(), blob);\n          await new Promise(r => setTimeout(r, 250));\n        }\n        status.innerHTML = statusHTML('success', `Downloaded ${checked.length} file(s).`);\n      });\n    } catch (e) {\n      resultPanel.innerHTML = statusHTML('error', friendlyError(e));\n    }\n  }});\n})();\n</script>\n"};
const TOOL_VIEW_META = {"compress-image": {"h1": "Compress Image Online", "lead": "Shrink a photo\u2019s file size with an adjustable quality slider, without uploading it anywhere.", "howto": ["Select a JPG, PNG or WebP image.", "Adjust the quality slider to balance size and sharpness.", "Click Compress Image.", "Download the smaller file."], "faq": [["Will compressing reduce image quality?", "Some quality is traded for a smaller file size \u2014 that\u2019s how compression works. Lower the quality slider for a smaller file, or raise it to keep more detail."], ["What is the maximum file size?", "This tool accepts images up to 30MB. Very large images may take a few extra seconds to process on older phones."], ["Does this upload my photo anywhere?", "No. The image is redrawn and re-encoded directly in your browser using the Canvas API, and never leaves your device."]]}, "resize-image": {"h1": "Resize Image Online", "lead": "Resize a photo to exact dimensions, or scale it proportionally, right in your browser.", "howto": ["Select an image.", "Enter a target width or height.", "Keep \"Keep aspect ratio\" on to avoid stretching.", "Click Resize Image and download the result."], "faq": [["Will resizing distort my image?", "Not if \"Keep aspect ratio\" stays checked \u2014 the other dimension is calculated automatically so proportions are preserved."], ["Can I make an image larger?", "Yes, though enlarging a small image beyond its original resolution can make it look soft, since no new detail is invented."], ["What formats are supported?", "JPG, PNG and WebP. The output keeps the same format as your original file."]]}, "jpg-to-png": {"h1": "JPG to PNG Converter", "lead": "Convert a JPG photo to a lossless PNG file, processed locally in your browser.", "howto": ["Select a JPG file.", "Filvora converts it automatically.", "Download the PNG file."], "faq": [["Why convert JPG to PNG?", "PNG is lossless and supports transparency, which makes it a better fit for graphics, screenshots, and images you plan to edit further."], ["Will the PNG file be larger?", "Usually yes \u2014 PNG doesn\u2019t use the same lossy compression as JPG, so file sizes are typically bigger for photos."], ["Is any quality lost in this conversion?", "No. Since your JPG is decoded to pixels and PNG is a lossless format, no additional compression artifacts are introduced during this step."]]}, "png-to-jpg": {"h1": "PNG to JPG Converter", "lead": "Convert a PNG image to a smaller JPG file, processed locally in your browser.", "howto": ["Select a PNG file.", "Filvora converts it automatically.", "Download the JPG file."], "faq": [["What happens to transparent areas?", "JPG has no transparency channel, so any transparent areas in your PNG are filled with white before conversion."], ["Why convert PNG to JPG?", "JPG files are usually much smaller than PNG for photographic images, which is useful for uploading or emailing."], ["Is this conversion reversible?", "Not perfectly \u2014 JPG uses lossy compression, so converting back to PNG afterward won\u2019t restore the exact original pixels."]]}, "jpg-to-webp": {"h1": "JPG to WebP Converter", "lead": "Convert a JPG photo to the smaller, modern WebP format, processed locally in your browser.", "howto": ["Select a JPG file.", "Filvora converts it automatically.", "Download the WebP file."], "faq": [["What is WebP?", "WebP is a modern image format that typically produces smaller files than JPG at a similar visual quality, and is supported by all current browsers."], ["Will everything be able to open a WebP file?", "Modern browsers and most current apps support WebP, but some older software may not. Keep a JPG copy if you need broad compatibility."], ["Does this tool upload my photo?", "No \u2014 the conversion happens locally using your browser\u2019s Canvas API."]]}, "webp-to-jpg": {"h1": "WebP to JPG Converter", "lead": "Convert a WebP image back to the widely-supported JPG format, processed locally in your browser.", "howto": ["Select a WebP file.", "Filvora converts it automatically.", "Download the JPG file."], "faq": [["Why convert WebP to JPG?", "Some older software, printers, or platforms don\u2019t accept WebP files, so converting to JPG restores broad compatibility."], ["Will image quality change?", "The image is re-encoded as JPG, which uses lossy compression, so a small amount of quality is traded for compatibility."], ["Does this tool upload my photo?", "No \u2014 conversion happens locally using your browser\u2019s Canvas API."]]}, "crop-image": {"h1": "Crop Image Online", "lead": "Drag to select exactly the area you want to keep, then download the cropped result.", "howto": ["Select an image.", "Drag on the preview to select the crop area.", "Click Crop Image.", "Download the cropped file."], "faq": [["Can I adjust the selection after drawing it?", "Currently you draw one selection at a time \u2014 if it\u2019s not quite right, just drag again to redraw it."], ["What format is the cropped file?", "The output keeps the same format as your original image (JPG, PNG or WebP)."], ["Does this tool upload my photo?", "No \u2014 cropping happens locally on a canvas in your browser."]]}, "rotate-image": {"h1": "Rotate Image Online", "lead": "Rotate a photo by 90\u00b0, 180\u00b0 or 270\u00b0 in one click.", "howto": ["Select an image.", "Choose a rotation angle.", "Download the rotated file."], "faq": [["Can I rotate by a custom angle?", "This tool supports quick 90\u00b0, 180\u00b0 and 270\u00b0 rotations. Free-angle rotation may be added as a separate tool later."], ["Will rotating reduce image quality?", "Rotating by 90\u00b0 increments doesn\u2019t resample pixels, so there is no meaningful quality loss beyond the normal re-encoding step."], ["Does this tool upload my photo?", "No \u2014 rotation happens locally on a canvas in your browser."]]}, "image-metadata-viewer": {"h1": "Image Metadata Viewer", "lead": "See the EXIF and file metadata stored inside a photo, including camera details when available.", "howto": ["Select a JPG, PNG or WebP image.", "Filvora reads its metadata automatically.", "Review the results on screen."], "faq": [["Why don\u2019t I see any EXIF data?", "PNG and WebP rarely carry EXIF data, and many phones and apps strip it automatically when saving or sharing a photo."], ["Does this tool show my location?", "If your photo\u2019s EXIF data includes GPS coordinates, this viewer does not currently decode them into a map location \u2014 only the common camera and date tags are shown."], ["Is my photo uploaded to check its metadata?", "No \u2014 the file is read directly in your browser and never leaves your device."]]}, "remove-image-metadata": {"h1": "Image Metadata Remover", "lead": "Strip EXIF, location and other hidden metadata from a photo before sharing it.", "howto": ["Select a JPG, PNG or WebP image.", "Filvora removes its metadata automatically.", "Download the clean file."], "faq": [["Does this really remove all metadata?", "Yes \u2014 the image is redrawn onto a blank canvas and re-encoded from scratch, so no EXIF, XMP or ICC data from the original file carries over."], ["Will this reduce image quality?", "The image is re-encoded, so there may be a very small, usually unnoticeable quality change, similar to re-saving a JPG."], ["Is my photo uploaded anywhere?", "No \u2014 this happens entirely on your device using the Canvas API."]]}, "file-size-checker": {"h1": "File Size Checker", "lead": "Check any file\u2019s exact size in bytes, KB, MB and GB \u2014 instantly, without uploading it.", "howto": ["Select any file.", "Filvora reads its size automatically.", "View the size in every common unit."], "faq": [["Is my file uploaded to check its size?", "No \u2014 file size is read directly from your browser\u2019s File API and never leaves your device."], ["Why do storage providers show a different size than this tool?", "Some services round to the nearest MB or GB, or use binary units (1024-based) instead of decimal (1000-based) \u2014 this tool shows both bytes and common decimal units for clarity."], ["Is there a file size limit?", "This tool supports files up to 500MB."]]}, "file-type-checker": {"h1": "File Type Checker", "lead": "Identify a file\u2019s extension, MIME type and category in one click.", "howto": ["Select any file.", "Filvora identifies its type automatically.", "View the extension, MIME type and category."], "faq": [["How does this tool detect the file type?", "It reads the extension and the type your browser reports for the file, then matches that against a table of common file types."], ["Can a file extension be wrong or misleading?", "Yes \u2014 renaming a file changes its extension but not its actual content. This tool checks what your browser reports, not the file\u2019s internal binary signature."], ["Is my file uploaded anywhere?", "No \u2014 everything happens locally using the File API."]]}, "mime-type-checker": {"h1": "MIME Type Checker", "lead": "Detect a file\u2019s MIME type for uploads, APIs, and web development.", "howto": ["Select any file.", "Filvora reads its MIME type automatically.", "Copy the result for use in your code or upload form."], "faq": [["What is a MIME type?", "A MIME type is a short label like \"image/png\" or \"application/pdf\" that tells applications what kind of content a file contains."], ["Why does the browser-reported type sometimes say nothing?", "Some browsers or operating systems don\u2019t reliably report a MIME type for every file extension \u2014 this tool falls back to a best-guess based on the file extension in that case."], ["Is my file uploaded anywhere?", "No \u2014 everything happens locally using the File API."]]}, "hash-generator": {"h1": "Hash Generator", "lead": "Generate SHA-1, SHA-256, SHA-384 and SHA-512 hashes for any file, using your browser\u2019s built-in cryptography.", "howto": ["Select any file.", "Filvora calculates all four hashes automatically.", "Copy or download the hash values."], "faq": [["What is a file hash used for?", "A hash is a short fingerprint of a file\u2019s contents \u2014 it\u2019s commonly used to verify that a download hasn\u2019t been corrupted or tampered with."], ["Which algorithm should I use?", "SHA-256 is the most common choice today. SHA-1 is older and no longer considered secure against deliberate tampering, though it\u2019s still used for basic integrity checks."], ["Is my file uploaded to calculate the hash?", "No \u2014 hashing is done locally with the Web Crypto API, built into your browser."]]}, "merge-pdf": {"h1": "Merge PDF Online", "lead": "Combine multiple PDF files into a single document, in whatever order you choose.", "howto": ["Select two or more PDF files.", "Reorder them using the arrow buttons.", "Click Merge PDFs.", "Download the combined file."], "faq": [["Is there a limit to how many PDFs I can merge?", "There\u2019s no hard limit built into the tool, but very large or numerous files will take longer and use more of your device\u2019s memory."], ["Will bookmarks or forms be preserved?", "Page content is preserved. Complex features like fillable form fields or bookmarks from the original files may not carry over."], ["Are my PDFs uploaded to a server?", "No \u2014 merging happens locally in your browser using the pdf-lib library."]]}, "split-pdf": {"h1": "Split PDF Online", "lead": "Split a PDF into separate files by page range, without uploading it anywhere.", "howto": ["Select a PDF file.", "Enter page ranges like 1-3, 4-6.", "Click Split PDF.", "Download each part, or all at once."], "faq": [["Can ranges overlap?", "Yes \u2014 you can include the same page in more than one output file if you need to."], ["What if I enter an invalid range?", "Ranges outside the document\u2019s page count are automatically limited to the actual number of pages."], ["Is my PDF uploaded anywhere?", "No \u2014 splitting happens locally using the pdf-lib library."]]}, "extract-pdf-pages": {"h1": "PDF Page Extractor", "lead": "Pull specific pages out of a PDF into a new file.", "howto": ["Select a PDF file.", "Enter the page numbers to keep, e.g. 1,3,5-8.", "Click Extract Pages.", "Download the new file."], "faq": [["Can I extract pages out of order?", "Pages are extracted in ascending order regardless of how you type the list \u2014 use the PDF Page Reorder tool afterward if you need a specific new order."], ["What happens to pages I don\u2019t list?", "They\u2019re left out of the new file entirely; your original PDF is not modified."], ["Is my PDF uploaded anywhere?", "No \u2014 extraction happens locally using the pdf-lib library."]]}, "delete-pdf-pages": {"h1": "PDF Page Deleter", "lead": "Remove specific pages from a PDF file and download the result.", "howto": ["Select a PDF file.", "Enter the page numbers to delete, e.g. 2,4.", "Click Delete Pages.", "Download the new file."], "faq": [["Can I delete every page?", "No \u2014 a PDF needs at least one page, so leave at least one page number out of the delete list."], ["Will the remaining pages keep their original order?", "Yes \u2014 deleting pages doesn\u2019t change the order of the pages that remain."], ["Is my PDF uploaded anywhere?", "No \u2014 this happens locally using the pdf-lib library."]]}, "reorder-pdf-pages": {"h1": "PDF Page Reorder", "lead": "Rearrange the pages of a PDF file into a new order.", "howto": ["Select a PDF file.", "Use the arrow buttons to set the new order.", "Click Save New Order.", "Download the reordered file."], "faq": [["Can I reorder a very long PDF?", "Yes, though reordering many pages one step at a time can be slow \u2014 for large restructuring, extracting page ranges separately and re-merging them may be quicker."], ["Does this change the page content?", "No \u2014 only the order of the pages changes; each page\u2019s content is untouched."], ["Is my PDF uploaded anywhere?", "No \u2014 this happens locally using the pdf-lib library."]]}, "rotate-pdf": {"h1": "PDF Rotator", "lead": "Rotate one, several, or all pages in a PDF file.", "howto": ["Select a PDF file.", "Optionally list specific pages to rotate.", "Choose a rotation angle.", "Download the rotated file."], "faq": [["Can I rotate different pages by different amounts?", "Not in a single pass \u2014 run the tool again on the same output file to apply a different rotation to another set of pages."], ["Will this affect the PDF\u2019s page size?", "No \u2014 rotation only changes how the page is displayed/printed, not its underlying dimensions."], ["Is my PDF uploaded anywhere?", "No \u2014 rotation happens locally using the pdf-lib library."]]}, "pdf-metadata-viewer": {"h1": "PDF Metadata Viewer", "lead": "View a PDF\u2019s title, author, subject, dates and page count.", "howto": ["Select a PDF file.", "Filvora reads its metadata automatically.", "Review the results on screen."], "faq": [["Why do some fields say \"(not set)\"?", "Not every PDF includes every metadata field \u2014 many PDFs are created without a title, author or keywords set."], ["Can I edit this metadata?", "This tool is read-only. Use the PDF Metadata Remover if you want to clear these fields instead."], ["Is my PDF uploaded anywhere?", "No \u2014 metadata is read locally using the pdf-lib library."]]}, "remove-pdf-metadata": {"h1": "PDF Metadata Remover", "lead": "Clear the title, author, subject and keyword fields from a PDF before sharing it.", "howto": ["Select a PDF file.", "Filvora clears its metadata automatically.", "Download the cleaned file."], "faq": [["Does this remove everything, including the Producer field?", "Not completely \u2014 this is a real limitation. The Title, Author, Subject and Keywords fields are cleared, but the PDF engine this tool uses (pdf-lib) automatically rewrites the Producer field and modification date on every save, and that can\u2019t currently be blanked."], ["Will this change how the PDF looks?", "No \u2014 only the metadata fields are affected; page content is untouched."], ["Is my PDF uploaded anywhere?", "No \u2014 this happens locally using the pdf-lib library."]]}, "txt-to-pdf": {"h1": "TXT to PDF Converter", "lead": "Turn a plain text file \u2014 or pasted text \u2014 into a clean, paginated PDF document.", "howto": ["Upload a .txt file, or paste text directly.", "Choose a page size and font size.", "Click Convert to PDF.", "Download the PDF."], "faq": [["Does this support rich formatting like bold or images?", "No \u2014 this tool is for plain text only. Line breaks and paragraph spacing are preserved, but styling like bold, colors or images are not supported."], ["How long can the text be?", "There\u2019s no hard limit \u2014 long text is automatically split across as many pages as needed."], ["Is my text uploaded anywhere?", "No \u2014 the PDF is generated locally using the pdf-lib library."]]}, "zip-creator": {"h1": "ZIP File Creator", "lead": "Bundle multiple files into a single, standard .zip archive.", "howto": ["Add the files you want to include.", "Review the list and total size.", "Click Create ZIP.", "Download the archive."], "faq": [["Will the ZIP file work with any unzip tool?", "Yes \u2014 this creates a standard ZIP archive using the DEFLATE compression method, which is readable by virtually any unzip tool or operating system."], ["Can I include folders?", "This tool zips individual files you select; folder structure from your device isn\u2019t preserved unless your browser\u2019s file picker supports folder selection."], ["Are my files uploaded anywhere?", "No \u2014 the archive is built locally using the JSZip library."]]}, "zip-extractor": {"h1": "ZIP File Extractor", "lead": "Open a .zip archive, browse its contents, and download the files you need.", "howto": ["Select a .zip file.", "Review the list of files inside.", "Select the files you want.", "Click Extract & Download Selected."], "faq": [["Does this support password-protected ZIP files?", "No \u2014 encrypted ZIP archives currently aren\u2019t supported."], ["Can I extract just one file instead of the whole archive?", "Yes \u2014 each file in the list has its own Download button alongside the \"extract selected\" option for multiple files."], ["Is my ZIP file uploaded anywhere?", "No \u2014 extraction happens locally using the JSZip library."]]}};
/* ---------------------------------------------------------
   Single-page app controller.
   Only one tool's markup + script exists in the DOM at a
   time (loaded into #tool-container), so element IDs inside
   each tool's UI never collide with another tool's.
   --------------------------------------------------------- */
TOOLS.forEach(t => {
  t.needsPdf = t.category === 'PDF Tools' || t.id === 'txt-to-pdf';
  t.needsZip = t.id === 'zip-creator' || t.id === 'zip-extractor';
});

const CDN = {
  pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  zip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
};
const _loadedScripts = {};
function loadScriptOnce(src) {
  if (_loadedScripts[src]) return _loadedScripts[src];
  _loadedScripts[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => { delete _loadedScripts[src]; reject(new Error('Failed to load ' + src)); };
    document.head.appendChild(s);
  });
  return _loadedScripts[src];
}

function runScripts(container) {
  container.querySelectorAll('script').forEach(oldScript => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(a => newScript.setAttribute(a.name, a.value));
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  });
}

const homeView = () => document.getElementById('home-view');
const toolView = () => document.getElementById('tool-view');
const toolContainer = () => document.getElementById('tool-container');

function toolCardHTML(t) {
  return `<button type="button" class="tool-card" data-tool="${t.id}">
    <div class="tc-top"><span class="tool-icon">${toolIcon(t.id)}</span><span class="tool-cat-tag">${escapeHtml(t.category)}</span></div>
    <h3>${escapeHtml(t.name)}</h3>
    <p>${escapeHtml(t.description)}</p>
    <span class="tool-open">Open tool →</span>
  </button>`;
}

function renderHome() {
  const grid = document.getElementById('tool-grid');
  grid.innerHTML = TOOLS.map(toolCardHTML).join('');
  grid.querySelectorAll('[data-tool]').forEach(btn => btn.addEventListener('click', () => showTool(btn.dataset.tool)));
  applyFilter();
}

function applyFilter() {
  const q = (document.getElementById('page-search').value || '').trim().toLowerCase();
  const cat = document.querySelector('#cat-filters button.active')?.dataset.cat || 'All';
  const cards = Array.from(document.querySelectorAll('#tool-grid .tool-card'));
  let shown = 0;
  cards.forEach(card => {
    const id = card.dataset.tool;
    const t = TOOLS.find(x => x.id === id);
    const matchesCat = cat === 'All' || t.category === cat;
    const matchesQ = !q || card.textContent.toLowerCase().includes(q);
    const visible = matchesCat && matchesQ;
    card.style.display = visible ? '' : 'none';
    if (visible) shown++;
  });
  document.getElementById('no-results').style.display = shown ? 'none' : 'block';
}

async function showTool(id) {
  const t = TOOLS.find(x => x.id === id);
  if (!t) return;
  const meta = TOOL_VIEW_META[id];
  location.hash = id;
  homeView().hidden = true;
  toolView().hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });

  document.getElementById('tool-view-title').textContent = meta.h1;
  document.getElementById('tool-view-lead').textContent = meta.lead;
  const container = toolContainer();
  container.innerHTML = '<p class="note">Loading tool…</p>';

  try {
    if (t.needsPdf) await loadScriptOnce(CDN.pdf);
    if (t.needsZip) await loadScriptOnce(CDN.zip);
  } catch (e) {
    container.innerHTML = statusHTML('error', 'This tool needs a small library to load from a CDN, and that failed — check your connection (or an ad-blocker) and try again.');
    return;
  }

  container.innerHTML = TOOL_BODIES[id];
  runScripts(container);

  const howtoList = document.getElementById('tool-howto');
  howtoList.innerHTML = meta.howto.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const faqWrap = document.getElementById('tool-faq');
  faqWrap.innerHTML = meta.faq.map(([q, a]) => `<details class="faq"><summary>${escapeHtml(q)}</summary><p>${escapeHtml(a)}</p></details>`).join('');
}

function showHomeView() {
  location.hash = '';
  toolView().hidden = true;
  homeView().hidden = false;
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

function initApp() {
  renderHome();
  document.getElementById('page-search').addEventListener('input', applyFilter);
  const filters = document.getElementById('cat-filters');
  filters.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') return;
    Array.from(filters.children).forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    applyFilter();
  });
  document.getElementById('back-to-home').addEventListener('click', showHomeView);
  document.getElementById('brand-link').addEventListener('click', (e) => { e.preventDefault(); showHomeView(); });

  const toggle = document.getElementById('theme-toggle');
  const syncTheme = () => toggle.setAttribute('aria-pressed', String(document.documentElement.getAttribute('data-theme') === 'dark'));
  syncTheme();
  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('filvora-theme', next);
    syncTheme();
  });

  const startId = location.hash.replace('#', '');
  if (startId && TOOLS.some(t => t.id === startId)) showTool(startId);

  window.addEventListener('hashchange', () => {
    const id = location.hash.replace('#', '');
    if (id && TOOLS.some(t => t.id === id)) showTool(id);
    else showHomeView();
  });
}

document.addEventListener('DOMContentLoaded', initApp);
