/* =========================================================
   FILE TOOLS — script.js
   20 client-side file utilities. Hash-routed SPA.
   No uploads: every byte stays on this device.
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

function formatBytes(bytes, binary = false, decimals = 2) {
  if (!Number.isFinite(bytes)) return '—';
  if (bytes === 0) return '0 Bytes';
  const k = binary ? 1024 : 1000;
  const units = binary
    ? ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB']
    : ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);
  const i = Math.min(units.length - 1, Math.floor(Math.log(abs) / Math.log(k)));
  if (i === 0) return `${sign}${abs.toLocaleString()} Bytes`;
  const val = abs / Math.pow(k, i);
  return `${sign}${val.toFixed(decimals)} ${units[i]}`;
}

function humanDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return '—';
  return date.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function downloadText(filename, content, mime = 'text/plain') {
  downloadBlob(filename, new Blob([content], { type: mime + ';charset=utf-8' }));
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e2) {}
    ta.remove();
  }
  if (btn) {
    const original = btn.textContent;
    btn.textContent = 'Copied ✓';
    btn.disabled = true;
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 1400);
  }
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsText(file);
  });
}

function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(file);
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

function getExt(name) {
  const m = /\.([a-zA-Z0-9]+)$/.exec(name || '');
  return m ? m[1].toLowerCase() : '';
}

function nameWithoutExt(name) {
  const ext = getExt(name);
  return ext ? name.slice(0, -(ext.length + 1)) : name;
}

/* Category + MIME lookup (fallback for when File.type is empty,
   which is common for many extensions on Android/mobile browsers) */
const EXT_MAP = {
  // images
  jpg:['Image','image/jpeg'], jpeg:['Image','image/jpeg'], png:['Image','image/png'],
  gif:['Image','image/gif'], webp:['Image','image/webp'], svg:['Image','image/svg+xml'],
  bmp:['Image','image/bmp'], ico:['Image','image/x-icon'], avif:['Image','image/avif'],
  heic:['Image','image/heic'], tiff:['Image','image/tiff'],
  // video
  mp4:['Video','video/mp4'], mov:['Video','video/quicktime'], avi:['Video','video/x-msvideo'],
  mkv:['Video','video/x-matroska'], webm:['Video','video/webm'], flv:['Video','video/x-flv'],
  '3gp':['Video','video/3gpp'],
  // audio
  mp3:['Audio','audio/mpeg'], wav:['Audio','audio/wav'], ogg:['Audio','audio/ogg'],
  m4a:['Audio','audio/mp4'], flac:['Audio','audio/flac'], aac:['Audio','audio/aac'],
  // documents
  pdf:['Document','application/pdf'], doc:['Document','application/msword'],
  docx:['Document','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls:['Document','application/vnd.ms-excel'],
  xlsx:['Document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt:['Document','application/vnd.ms-powerpoint'],
  pptx:['Document','application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  txt:['Document','text/plain'], rtf:['Document','application/rtf'], csv:['Document','text/csv'],
  odt:['Document','application/vnd.oasis.opendocument.text'],
  // archives
  zip:['Archive','application/zip'], rar:['Archive','application/vnd.rar'],
  '7z':['Archive','application/x-7z-compressed'], tar:['Archive','application/x-tar'],
  gz:['Archive','application/gzip'],
  // code
  html:['Code','text/html'], htm:['Code','text/html'], css:['Code','text/css'],
  js:['Code','text/javascript'], json:['Code','application/json'], xml:['Code','application/xml'],
  py:['Code','text/x-python'], java:['Code','text/x-java-source'], c:['Code','text/x-c'],
  md:['Code','text/markdown'], sh:['Code','application/x-sh'], yml:['Code','application/x-yaml'],
  yaml:['Code','application/x-yaml'],
};
function categoryAndMime(name, browserType) {
  const ext = getExt(name);
  const entry = EXT_MAP[ext];
  const category = entry ? entry[0] : 'Other';
  const mime = browserType || (entry ? entry[1] : '') || 'application/octet-stream';
  return { category, mime, ext };
}

/* ---------------------------------------------------------
   CRC32 + ZIP (store/deflate-raw) — read & write
   Verified against the system `zip`/`unzip` tools.
   --------------------------------------------------------- */
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function dosDateTime(date) {
  const time = ((date.getHours() & 0x1F) << 11) | ((date.getMinutes() & 0x3F) << 5) | ((date.getSeconds() >> 1) & 0x1F);
  const dt = (((date.getFullYear() - 1980) & 0x7F) << 9) | (((date.getMonth() + 1) & 0xF) << 5) | (date.getDate() & 0x1F);
  return { time, dt };
}
const ZIP_SUPPORTED = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
async function streamThrough(streamCtor, bytes) {
  const s = new streamCtor('deflate-raw');
  const writer = s.writable.getWriter();
  writer.write(bytes); writer.close();
  const chunks = []; const reader = s.readable.getReader();
  while (true) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); }
  const total = chunks.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total); let off = 0;
  for (const c of chunks) { out.set(c, off); off += c.length; }
  return out;
}
const deflateRaw = (bytes) => streamThrough(CompressionStream, bytes);
const inflateRaw = (bytes) => streamThrough(DecompressionStream, bytes);
function u16(n) { return [n & 0xFF, (n >>> 8) & 0xFF]; }
function u32(n) { return [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF]; }

async function createZip(entries, onProgress) {
  const encoder = new TextEncoder();
  const localParts = []; const centralParts = []; let offset = 0;
  for (let i = 0; i < entries.length; i++) {
    const { name, data, lastModified } = entries[i];
    const nameBytes = encoder.encode(name);
    const crc = crc32(data);
    let method = 8, compressed = await deflateRaw(data);
    if (compressed.length >= data.length) { method = 0; compressed = data; }
    const { time, dt } = dosDateTime(lastModified ? new Date(lastModified) : new Date());
    const localHeader = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(method),
      ...u16(time), ...u16(dt), ...u32(crc), ...u32(compressed.length),
      ...u32(data.length), ...u16(nameBytes.length), ...u16(0)
    ]);
    const localOffset = offset;
    localParts.push(localHeader, nameBytes, compressed);
    offset += localHeader.length + nameBytes.length + compressed.length;
    const centralHeader = new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(method),
      ...u16(time), ...u16(dt), ...u32(crc), ...u32(compressed.length),
      ...u32(data.length), ...u16(nameBytes.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(localOffset)
    ]);
    centralParts.push(centralHeader, nameBytes);
    if (onProgress) onProgress((i + 1) / entries.length);
  }
  const centralStart = offset;
  let centralSize = 0; for (const p of centralParts) centralSize += p.length;
  const eocd = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(entries.length), ...u16(entries.length),
    ...u32(centralSize), ...u32(centralStart), ...u16(0)
  ]);
  const all = [...localParts, ...centralParts, eocd];
  const total = all.reduce((a, c) => a + c.length, 0);
  const out = new Uint8Array(total); let off = 0;
  for (const c of all) { out.set(c, off); off += c.length; }
  return out;
}

async function readZip(bytes) {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ru16 = (o) => dv.getUint16(o, true);
  const ru32 = (o) => dv.getUint32(o, true);
  let eocdOff = -1;
  const searchFrom = Math.max(0, bytes.length - 22 - 65557);
  for (let i = bytes.length - 22; i >= searchFrom; i--) {
    if (ru32(i) === 0x06054b50) { eocdOff = i; break; }
  }
  if (eocdOff === -1) throw new Error('Not a valid ZIP file (end-of-central-directory record not found).');
  const totalEntries = ru16(eocdOff + 10);
  const centralDirOffset = ru32(eocdOff + 16);
  const decoder = new TextDecoder();
  const entries = []; let ptr = centralDirOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (ru32(ptr) !== 0x02014b50) throw new Error('Corrupt or unsupported ZIP central directory.');
    const method = ru16(ptr + 10);
    const compSize = ru32(ptr + 20);
    const uncompSize = ru32(ptr + 24);
    const nameLen = ru16(ptr + 28);
    const extraLen = ru16(ptr + 30);
    const commentLen = ru16(ptr + 32);
    const localOffset = ru32(ptr + 42);
    const name = decoder.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    entries.push({ name, method, compSize, uncompSize, localOffset, isDir: name.endsWith('/') });
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return {
    entries,
    async extract(entry) {
      if (entry.isDir) return new Uint8Array(0);
      const lNameLen = ru16(entry.localOffset + 26);
      const lExtraLen = ru16(entry.localOffset + 28);
      const dataStart = entry.localOffset + 30 + lNameLen + lExtraLen;
      const compData = bytes.subarray(dataStart, dataStart + entry.compSize);
      return entry.method === 8 ? await inflateRaw(compData) : compData.slice();
    }
  };
}

/* ---------------------------------------------------------
   Icons — simple original line-icons, one per tool
   --------------------------------------------------------- */
function svgIcon(inner) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
}
const DOC = '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v4h4"/>';
const ICONS = {
  'size-converter': svgIcon('<rect x="2" y="7" width="8" height="10" rx="1.5"/><rect x="14" y="7" width="8" height="10" rx="1.5"/><path d="M10 12h4M12 10l2 2-2 2"/>'),
  'size-calculator': svgIcon('<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M7 6h10M7 11h2M11 11h2M15 11h2M7 15h2M11 15h2M15 15h2M7 19h2M11 19h2M15 19h2"/>'),
  'extension-checker': svgIcon(DOC + '<circle cx="10" cy="15" r="3.4"/><path d="M12.4 17.4 15 20"/>'),
  'mime-checker': svgIcon(DOC + '<path d="M8 13h5M8 16h3"/><circle cx="16" cy="16" r="1.2" fill="currentColor" stroke="none"/>'),
  'type-identifier': svgIcon(DOC + '<path d="M9.5 13a2 2 0 1 1 2.7 1.9c-.7.3-1.2.9-1.2 1.6"/><circle cx="11" cy="19" r=".2" fill="currentColor"/>'),
  'duplicate-finder': svgIcon('<path d="M8 4h7l4 4v13H8z"/><path d="M4 8v13h11"/>'),
  'filename-cleaner': svgIcon(DOC + '<path d="M8 14l1.5 4L14 16"/><path d="M16 13l1 1M17.5 11.5l1 1"/>'),
  'filename-generator': svgIcon(DOC + '<path d="M9 18l2-6 2 6M9.5 16h3"/><path d="M16 8v4M14 10h4"/>'),
  'extension-extractor': svgIcon(DOC + '<path d="M12 12v6M9.5 15.5 12 18l2.5-2.5"/>'),
  'file-list-generator': svgIcon('<path d="M4 3h16v18H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>'),
  'metadata-viewer': svgIcon(DOC + '<circle cx="10" cy="14" r="3.3"/><path d="M10 12.6v.1M10 14v1.7"/>'),
  'hash-generator': svgIcon('<path d="M4 2h9l6 6v14H4z"/><path d="M13 2v6h6"/><path d="M8.5 11v9M12.5 11v9M6.5 13.5h8M6.5 17h8"/>'),
  'hash-checker': svgIcon('<path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z"/><path d="M8.5 12l2.3 2.3L15.5 9.5"/>'),
  'timestamp-converter': svgIcon('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>'),
  'path-analyzer': svgIcon('<path d="M3 6h5l2 2h11v11H3z"/><path d="M8 13h4M8 17h7"/>'),
  'size-comparison': svgIcon('<path d="M4 20V10M10 20V4M16 20v13M22 20H2"/>'),
  'batch-renamer': svgIcon('<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/><path d="M9.5 21.7 8 18l3.2-.6z"/><path d="M15.5 12.5l2.3-2.3 1.6 1.6-2.3 2.3"/>'),
  'type-converter': svgIcon('<path d="M3 4h7v7H3z"/><path d="M14 13h7v7h-7z"/><path d="M10 7.5h4M14 7.5l-2-2m2 2-2 2"/><path d="M14 16.5H10M10 16.5l2-2m-2 2 2 2"/>'),
  'zip-creator': svgIcon('<path d="M4 4h16v16H4z"/><path d="M11 4v3M13 7v3M11 10v3M13 13v3"/><path d="M12 22v-3M9 19h6"/>'),
  'zip-extractor': svgIcon('<path d="M4 4h16v16H4z"/><path d="M11 4v3M13 7v3M11 10v3M13 13v3"/><path d="M12 15v6m0 0-2.5-2.5M12 21l2.5-2.5"/>'),
};
function toolIcon(id) { return ICONS[id] || svgIcon(DOC); }

const PRIVACY_NOTE = `<div class="privacy-note">${svgIcon('<path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z"/><path d="M8.5 12l2.3 2.3L15.5 9.5"/>').replace('viewBox="0 0 24 24"','viewBox="0 0 24 24" width="18" height="18"')}<span>Your files are processed locally in your browser. Nothing is uploaded to any server.</span></div>`;

/* ---------------------------------------------------------
   Small reusable UI builders
   --------------------------------------------------------- */
let dzCounter = 0;
function dropzoneHTML(id, { multiple = false, accept = '', label = 'Drag & drop file(s) here' } = {}) {
  return `
  <div class="dropzone" id="${id}" tabindex="0" role="button" aria-label="${label}">
    ${svgIcon('<path d="M12 16V4M8 8l4-4 4 4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>')}
    <div><strong>${label}</strong></div>
    <div class="note">or tap to browse ${multiple ? '(multiple files allowed)' : ''}</div>
    <input type="file" id="${id}-input" ${multiple ? 'multiple' : ''} ${accept ? `accept="${accept}"` : ''}>
  </div>`;
}
function wireDropzone(container, id, onFiles) {
  const zone = $(`#${id}`, container);
  const input = $(`#${id}-input`, container);
  const open = () => input.click();
  zone.addEventListener('click', open);
  zone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  input.addEventListener('change', () => onFiles(Array.from(input.files || [])));
  ['dragenter', 'dragover'].forEach(evt => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach(evt => zone.addEventListener(evt, (e) => { e.preventDefault(); zone.classList.remove('dragover'); }));
  zone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files || []);
    if (files.length) onFiles(files);
  });
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
function resultGridHTML(items) {
  return `<div class="result-grid">${items.map(([label, value]) => `
    <div class="result-item"><span class="ri-label">${escapeHtml(label)}</span><span class="ri-value">${value}</span></div>`).join('')}</div>`;
}
function statusLine(kind, text) {
  const cls = { match: 'status-match', nomatch: 'status-nomatch', info: 'status-info', error: 'status-error' }[kind] || 'status-info';
  const glyph = { match: '✓', nomatch: '✕', info: 'ℹ', error: '⚠' }[kind] || 'ℹ';
  return `<div class="status-line ${cls}">${glyph} ${text}</div>`;
}
function emptyState(text) { return `<p class="note">${escapeHtml(text)}</p>`; }

/* ---------------------------------------------------------
   Shared file-inspection helpers (tools 3, 4, 5, 11)
   --------------------------------------------------------- */
function inspectFile(file) {
  const { category, mime, ext } = categoryAndMime(file.name, file.type);
  return {
    name: file.name,
    ext: ext ? '.' + ext : '(none)',
    mime,
    size: file.size,
    lastModified: file.lastModified ? new Date(file.lastModified) : null,
    category,
  };
}
const CATEGORY_DESC = {
  Image: 'An image file — a photo, graphic, or icon.',
  Video: 'A video file containing moving picture and usually audio.',
  Audio: 'An audio file containing sound or music.',
  Document: 'A document file — text, a spreadsheet, presentation, or similar.',
  Archive: 'A compressed archive bundling one or more files.',
  Code: 'A source code, markup, or data file used in software or web projects.',
  Other: 'A file whose type could not be matched to a known category.',
};
function getImageDimensions(file) {
  return new Promise((resolve) => {
    if (!file.type || !file.type.startsWith('image/')) return resolve(null);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(url); };
    img.onerror = () => { resolve(null); URL.revokeObjectURL(url); };
    img.src = url;
  });
}

function singleFileInspectorTool(id, title, fieldSet) {
  return {
    render(container) {
      container.innerHTML = `
        <div class="panel">
          <h2>Choose a file</h2>
          ${dropzoneHTML(id + '-dz', { label: 'Drag & drop a file here' })}
          <div id="${id}-out"></div>
        </div>`;
      const out = $(`#${id}-out`, container);
      wireDropzone(container, id + '-dz', async (files) => {
        const file = files[0];
        if (!file) return;
        out.innerHTML = `<div class="panel"><p class="note">Reading file…</p></div>`;
        const info = inspectFile(file);
        const dims = await getImageDimensions(file);
        const rows = [];
        if (fieldSet.includes('name')) rows.push(['File name', escapeHtml(info.name)]);
        if (fieldSet.includes('ext')) rows.push(['Extension', escapeHtml(info.ext)]);
        if (fieldSet.includes('mime')) rows.push(['MIME type', escapeHtml(info.mime)]);
        if (fieldSet.includes('category')) rows.push(['Category', escapeHtml(info.category)]);
        if (fieldSet.includes('size')) rows.push(['File size', `${formatBytes(info.size)} <span class="note">(${info.size.toLocaleString()} bytes)</span>`]);
        if (fieldSet.includes('modified')) rows.push(['Last modified', info.lastModified ? escapeHtml(humanDate(info.lastModified)) : 'Not available']);
        if (fieldSet.includes('description')) rows.push(['Description', escapeHtml(CATEGORY_DESC[info.category] || CATEGORY_DESC.Other)]);
        if (fieldSet.includes('dims') && dims) rows.push(['Dimensions', `${dims.w} × ${dims.h} px`]);
        out.innerHTML = `<div class="panel"><h2>${escapeHtml(title)}</h2>${resultGridHTML(rows)}</div>`;
      });
    }
  };
}

/* ---------------------------------------------------------
   TOOLS REGISTRY
   --------------------------------------------------------- */
const TOOLS = [];

/* 01 — File Size Converter */
TOOLS.push({
  id: 'size-converter', name: 'File Size Converter', category: 'File Conversion',
  desc: 'Convert between Bytes, KB, MB, GB and TB — decimal and binary.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Convert a size</h2>
        <div class="field-row">
          <div class="field"><label for="sc-amount">Amount</label><input type="number" id="sc-amount" value="1" min="0" step="any"></div>
          <div class="field"><label for="sc-unit">Unit</label>
            <select id="sc-unit">
              <option value="0">Bytes</option><option value="1" selected>KB / KiB</option>
              <option value="2">MB / MiB</option><option value="3">GB / GiB</option><option value="4">TB / TiB</option>
            </select>
          </div>
          <div class="field"><label for="sc-system">Input system</label>
            <select id="sc-system"><option value="decimal">Decimal (×1000)</option><option value="binary">Binary (×1024)</option></select>
          </div>
        </div>
        <div id="sc-results"></div>
        <div class="btn-row">
          <button class="btn secondary" id="sc-copy" type="button">Copy results</button>
          <button class="btn secondary" id="sc-reset" type="button">Reset</button>
        </div>
      </div>`;
    const amountEl = $('#sc-amount', container), unitEl = $('#sc-unit', container), sysEl = $('#sc-system', container);
    const resultsEl = $('#sc-results', container);
    const UNAMES = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const UNAMES_BIN = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB'];
    function update() {
      const amount = parseFloat(amountEl.value) || 0;
      const unitIdx = parseInt(unitEl.value, 10);
      const k = sysEl.value === 'binary' ? 1024 : 1000;
      const bytes = amount * Math.pow(k, unitIdx);
      const decRows = UNAMES.map((u, i) => [u, (bytes / Math.pow(1000, i)).toLocaleString(undefined, { maximumFractionDigits: 6 })]);
      const binRows = UNAMES_BIN.map((u, i) => [u, (bytes / Math.pow(1024, i)).toLocaleString(undefined, { maximumFractionDigits: 6 })]);
      resultsEl.innerHTML = `
        <h3 style="font-size:.85rem;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em;margin:1rem 0 .5rem">Decimal (1000)</h3>
        ${resultGridHTML(decRows)}
        <h3 style="font-size:.85rem;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.04em;margin:1rem 0 .5rem">Binary (1024)</h3>
        ${resultGridHTML(binRows)}`;
    }
    amountEl.addEventListener('input', update);
    unitEl.addEventListener('change', update);
    sysEl.addEventListener('change', update);
    $('#sc-copy', container).addEventListener('click', (e) => copyText(resultsEl.innerText, e.target));
    $('#sc-reset', container).addEventListener('click', () => { amountEl.value = 1; unitEl.value = '1'; sysEl.value = 'decimal'; update(); });
    update();
  }
});

/* 02 — File Size Calculator */
TOOLS.push({
  id: 'size-calculator', name: 'File Size Calculator', category: 'File Analysis',
  desc: 'Estimate total storage from a file count and an average file size.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Estimate total size</h2>
        <div class="field-row">
          <div class="field"><label for="cal-count">Number of files</label><input type="number" id="cal-count" value="10" min="0" step="1"></div>
          <div class="field"><label for="cal-avg">Average size per file</label><input type="number" id="cal-avg" value="5" min="0" step="any"></div>
          <div class="field"><label for="cal-unit">Unit</label>
            <select id="cal-unit"><option value="0">Bytes</option><option value="1">KB</option><option value="2" selected>MB</option><option value="3">GB</option></select>
          </div>
        </div>
        <div id="cal-results"></div>
      </div>`;
    const countEl = $('#cal-count', container), avgEl = $('#cal-avg', container), unitEl = $('#cal-unit', container);
    const out = $('#cal-results', container);
    function update() {
      const count = parseFloat(countEl.value) || 0;
      const avg = parseFloat(avgEl.value) || 0;
      const mult = Math.pow(1000, parseInt(unitEl.value, 10));
      const totalBytes = count * avg * mult;
      out.innerHTML = resultGridHTML([
        ['Total (Bytes)', totalBytes.toLocaleString()],
        ['Total (KB)', (totalBytes / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })],
        ['Total (MB)', (totalBytes / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })],
        ['Total (GB)', (totalBytes / 1e9).toLocaleString(undefined, { maximumFractionDigits: 3 })],
        ['Total (TB)', (totalBytes / 1e12).toLocaleString(undefined, { maximumFractionDigits: 4 })],
        ['Human readable', formatBytes(totalBytes)],
      ]);
    }
    [countEl, avgEl, unitEl].forEach(el => el.addEventListener('input', update));
    unitEl.addEventListener('change', update);
    update();
  }
});

/* 03 — File Extension Checker */
TOOLS.push(Object.assign({ id: 'extension-checker', name: 'File Extension Checker', category: 'File Information',
  desc: 'Inspect a file\u2019s name, extension, MIME type, size and category.' },
  singleFileInspectorTool('extension-checker', 'File details', ['name', 'ext', 'mime', 'size', 'modified', 'category'])));

/* 04 — MIME Type Checker */
TOOLS.push(Object.assign({ id: 'mime-checker', name: 'MIME Type Checker', category: 'File Information',
  desc: 'Detect a file\u2019s MIME type, extension, category and size.' },
  singleFileInspectorTool('mime-checker', 'MIME details', ['name', 'ext', 'mime', 'category', 'size'])));

/* 05 — File Type Identifier */
TOOLS.push(Object.assign({ id: 'type-identifier', name: 'File Type Identifier', category: 'File Information',
  desc: 'Identify a file\u2019s type with a plain-language description.' },
  singleFileInspectorTool('type-identifier', 'Identification', ['name', 'ext', 'mime', 'category', 'description'])));

/* Reusable multi-file manager (tools 6, 9, 10, 16, 17, 19) */
function setupMultiFileArea(container, dzId, { onChange, accept = '' } = {}) {
  let files = [];
  const chipsSel = `#${dzId}-chips`;
  function render() {
    const chipsEl = $(chipsSel, container);
    if (chipsEl) chipsEl.innerHTML = fileChipListHTML(files);
    $$(`${chipsSel} .fc-remove`, container).forEach(btn =>
      btn.addEventListener('click', () => { files.splice(parseInt(btn.dataset.idx, 10), 1); render(); onChange && onChange(files); }));
  }
  wireDropzone(container, dzId, (newFiles) => { files = files.concat(newFiles); render(); onChange && onChange(files); });
  const clearBtn = $(`#${dzId}-clear`, container);
  if (clearBtn) clearBtn.addEventListener('click', () => { files = []; render(); onChange && onChange(files); });
  return { getFiles: () => files, render };
}
function multiFileAreaHTML(dzId, label) {
  return `${dropzoneHTML(dzId, { multiple: true, label })}
    <div id="${dzId}-chips"></div>
    <div class="btn-row"><button class="btn secondary" id="${dzId}-clear" type="button">Clear all</button></div>`;
}

/* 06 — Duplicate File Name Finder */
TOOLS.push({
  id: 'duplicate-finder', name: 'Duplicate File Name Finder', category: 'File Management',
  desc: 'Select multiple files and find ones that share the same file name.',
  render(container) {
    container.innerHTML = `
      <div class="panel"><h2>Select files</h2>${multiFileAreaHTML('dup-dz', 'Drag & drop multiple files here')}</div>
      <div class="panel" id="dup-out"></div>`;
    const out = $('#dup-out', container);
    const mgr = setupMultiFileArea(container, 'dup-dz', {
      onChange(files) {
        if (!files.length) { out.innerHTML = emptyState('Add files above to check for duplicate names.'); return; }
        const groups = new Map();
        files.forEach(f => {
          const key = f.name.toLowerCase();
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key).push(f);
        });
        const dupes = [...groups.values()].filter(g => g.length > 1);
        if (!dupes.length) { out.innerHTML = statusLine('match', `No duplicate file names among ${files.length} file(s).`); return; }
        const totalDup = dupes.reduce((a, g) => a + g.length, 0);
        out.innerHTML = statusLine('nomatch', `${dupes.length} duplicate name group(s), ${totalDup} file(s) affected.`) +
          `<div class="table-wrap" style="margin-top:.8rem"><table><thead><tr><th>File name</th><th>Occurrences</th><th>Sizes</th></tr></thead><tbody>${
            dupes.map(g => `<tr><td>${escapeHtml(g[0].name)}</td><td>${g.length}</td><td class="mono">${g.map(f => formatBytes(f.size)).join(', ')}</td></tr>`).join('')
          }</tbody></table></div>`;
      }
    });
    out.innerHTML = emptyState('Add files above to check for duplicate names.');
  }
});

/* 07 — File Name Cleaner */
TOOLS.push({
  id: 'filename-cleaner', name: 'File Name Cleaner', category: 'File Management',
  desc: 'Tidy up messy file names: extra spaces, symbols, casing and separators.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Enter or upload file names</h2>
        <div class="field"><label for="fnc-input">One file name per line</label>
          <textarea id="fnc-input" placeholder="My  Photo!! (final)_v2.jpg&#10;report--DRAFT copy.docx"></textarea></div>
        ${dropzoneHTML('fnc-dz', { multiple: true, label: 'Or drag & drop files to use their names' })}
        <div class="checks-grid" style="margin-top:1rem">
          <label class="check-row"><input type="checkbox" id="fnc-trim" checked> Trim extra spaces</label>
          <label class="check-row"><input type="checkbox" id="fnc-symbols" checked> Remove special characters</label>
          <label class="check-row"><input type="checkbox" id="fnc-underscores" checked> Collapse repeated _ / -</label>
        </div>
        <div class="field-row">
          <div class="field"><label for="fnc-case">Casing</label>
            <select id="fnc-case"><option value="none">Leave as-is</option><option value="lower">lowercase</option><option value="upper">UPPERCASE</option><option value="title">Title Case</option></select></div>
          <div class="field"><label for="fnc-spaces">Replace spaces with</label>
            <select id="fnc-spaces"><option value="none">Leave as-is</option><option value="_">Underscore ( _ )</option><option value="-">Hyphen ( - )</option></select></div>
        </div>
        <div class="btn-row">
          <button class="btn accent" id="fnc-run" type="button">Clean names</button>
          <button class="btn secondary" id="fnc-download" type="button" disabled>Download list (.txt)</button>
        </div>
      </div>
      <div class="panel" id="fnc-out"></div>`;
    const input = $('#fnc-input', container);
    wireDropzone(container, 'fnc-dz', (files) => {
      const existing = input.value.trim();
      const names = files.map(f => f.name).join('\n');
      input.value = existing ? existing + '\n' + names : names;
    });
    const out = $('#fnc-out', container);
    const dlBtn = $('#fnc-download', container);
    let cleanedList = [];
    function cleanOne(name) {
      const ext = getExt(name);
      let base = ext ? name.slice(0, -(ext.length + 1)) : name;
      if ($('#fnc-trim', container).checked) base = base.trim().replace(/\s+/g, ' ');
      if ($('#fnc-symbols', container).checked) base = base.replace(/[^\w\s.\-]/g, '');
      if ($('#fnc-underscores', container).checked) base = base.replace(/_{2,}/g, '_').replace(/-{2,}/g, '-');
      const caseMode = $('#fnc-case', container).value;
      if (caseMode === 'lower') base = base.toLowerCase();
      else if (caseMode === 'upper') base = base.toUpperCase();
      else if (caseMode === 'title') base = base.replace(/\w\S*/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase());
      const spaceMode = $('#fnc-spaces', container).value;
      if (spaceMode !== 'none') base = base.replace(/\s+/g, spaceMode);
      return ext ? `${base}.${ext}` : base;
    }
    $('#fnc-run', container).addEventListener('click', () => {
      const names = input.value.split('\n').map(s => s.trim()).filter(Boolean);
      if (!names.length) { out.innerHTML = statusLine('error', 'Enter at least one file name.'); dlBtn.disabled = true; return; }
      cleanedList = names.map(n => [n, cleanOne(n)]);
      out.innerHTML = `<h2>Result</h2><div class="table-wrap"><table><thead><tr><th>Original</th><th>Cleaned</th></tr></thead><tbody>${
        cleanedList.map(([o, c]) => `<tr><td class="mono">${escapeHtml(o)}</td><td class="mono">${escapeHtml(c)}</td></tr>`).join('')
      }</tbody></table></div>`;
      dlBtn.disabled = false;
    });
    dlBtn.addEventListener('click', () => downloadText('cleaned-filenames.txt', cleanedList.map(([, c]) => c).join('\n')));
    out.innerHTML = emptyState('Enter names above and click "Clean names".');
  }
});

/* 08 — File Name Generator */
TOOLS.push({
  id: 'filename-generator', name: 'File Name Generator', category: 'File Management',
  desc: 'Generate a batch of consistent, professional file names.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Generator settings</h2>
        <div class="field-row">
          <div class="field"><label for="fng-prefix">Prefix</label><input type="text" id="fng-prefix" placeholder="project-report"></div>
          <div class="field"><label for="fng-ext">Extension</label><input type="text" id="fng-ext" placeholder="pdf" value="pdf"></div>
        </div>
        <div class="field-row">
          <div class="field"><label for="fng-start">Start number</label><input type="number" id="fng-start" value="1" min="0"></div>
          <div class="field"><label for="fng-count">How many</label><input type="number" id="fng-count" value="5" min="1" max="2000"></div>
          <div class="field"><label for="fng-pad">Digit padding</label><input type="number" id="fng-pad" value="3" min="1" max="8"></div>
        </div>
        <label class="check-row"><input type="checkbox" id="fng-date"> Include today\u2019s date (YYYY-MM-DD)</label>
        <div class="btn-row">
          <button class="btn accent" id="fng-run" type="button">Generate</button>
          <button class="btn secondary" id="fng-download" type="button" disabled>Download list (.txt)</button>
        </div>
      </div>
      <div class="panel" id="fng-out"></div>`;
    const out = $('#fng-out', container);
    const dlBtn = $('#fng-download', container);
    let list = [];
    $('#fng-run', container).addEventListener('click', () => {
      const prefix = ($('#fng-prefix', container).value || 'file').trim().replace(/\s+/g, '-');
      const ext = ($('#fng-ext', container).value || 'txt').trim().replace(/^\./, '');
      const start = parseInt($('#fng-start', container).value, 10) || 0;
      const count = Math.min(2000, Math.max(1, parseInt($('#fng-count', container).value, 10) || 1));
      const pad = Math.min(8, Math.max(1, parseInt($('#fng-pad', container).value, 10) || 3));
      const withDate = $('#fng-date', container).checked;
      const dateStr = new Date().toISOString().slice(0, 10);
      list = [];
      for (let i = 0; i < count; i++) {
        const num = String(start + i).padStart(pad, '0');
        list.push(withDate ? `${prefix}-${dateStr}-${num}.${ext}` : `${prefix}-${num}.${ext}`);
      }
      out.innerHTML = `<h2>Generated names (${list.length})</h2><div class="result-box">${list.map(escapeHtml).join('\n')}</div>`;
      dlBtn.disabled = false;
    });
    dlBtn.addEventListener('click', () => downloadText('generated-filenames.txt', list.join('\n')));
    out.innerHTML = emptyState('Set your options and click "Generate".');
  }
});

/* 09 — File Extension Extractor */
TOOLS.push({
  id: 'extension-extractor', name: 'File Extension Extractor', category: 'File Management',
  desc: 'Upload multiple files and pull out a clean list of their extensions.',
  render(container) {
    container.innerHTML = `
      <div class="panel"><h2>Select files</h2>${multiFileAreaHTML('ext-dz', 'Drag & drop multiple files here')}</div>
      <div class="panel" id="ext-out"></div>`;
    const out = $('#ext-out', container);
    let current = [];
    setupMultiFileArea(container, 'ext-dz', {
      onChange(files) {
        current = files;
        if (!files.length) { out.innerHTML = emptyState('Add files above to extract their extensions.'); return; }
        const rows = files.map(f => [f.name, getExt(f.name) ? '.' + getExt(f.name) : '(none)']);
        out.innerHTML = `<h2>Extensions</h2><div class="table-wrap"><table><thead><tr><th>File name</th><th>Extension</th></tr></thead><tbody>${
          rows.map(([n, e]) => `<tr><td>${escapeHtml(n)}</td><td class="mono">${escapeHtml(e)}</td></tr>`).join('')
        }</tbody></table></div>
        <div class="btn-row">
          <button class="btn secondary" id="ext-copy" type="button">Copy all extensions</button>
          <button class="btn secondary" id="ext-txt" type="button">Download .txt</button>
          <button class="btn secondary" id="ext-csv" type="button">Download .csv</button>
        </div>`;
        $('#ext-copy', out).addEventListener('click', (e) => copyText(rows.map(r => r[1]).join('\n'), e.target));
        $('#ext-txt', out).addEventListener('click', () => downloadText('extensions.txt', rows.map(r => r[1]).join('\n')));
        $('#ext-csv', out).addEventListener('click', () => downloadText('extensions.csv', 'file_name,extension\n' + rows.map(r => `"${r[0].replace(/"/g,'""')}","${r[1]}"`).join('\n'), 'text/csv'));
      }
    });
    out.innerHTML = emptyState('Add files above to extract their extensions.');
  }
});

/* 10 — File List Generator */
TOOLS.push({
  id: 'file-list-generator', name: 'File List Generator', category: 'File Management',
  desc: 'Build an exportable list of file names, types and sizes.',
  render(container) {
    container.innerHTML = `
      <div class="panel"><h2>Select files</h2>${multiFileAreaHTML('fl-dz', 'Drag & drop multiple files here')}</div>
      <div class="panel" id="fl-out"></div>`;
    const out = $('#fl-out', container);
    setupMultiFileArea(container, 'fl-dz', {
      onChange(files) {
        if (!files.length) { out.innerHTML = emptyState('Add files above to build a list.'); return; }
        const rows = files.map(f => {
          const { category, mime, ext } = categoryAndMime(f.name, f.type);
          return { name: f.name, ext: ext ? '.' + ext : '', size: f.size, type: mime, category };
        });
        out.innerHTML = `<h2>File list (${rows.length})</h2><div class="table-wrap"><table><thead><tr><th>Name</th><th>Ext</th><th>Size</th><th>Type</th></tr></thead><tbody>${
          rows.map(r => `<tr><td>${escapeHtml(r.name)}</td><td class="mono">${escapeHtml(r.ext)}</td><td class="mono">${formatBytes(r.size)}</td><td class="mono">${escapeHtml(r.type)}</td></tr>`).join('')
        }</tbody></table></div>
        <div class="btn-row">
          <button class="btn secondary" id="fl-txt" type="button">Export .txt</button>
          <button class="btn secondary" id="fl-csv" type="button">Export .csv</button>
          <button class="btn secondary" id="fl-json" type="button">Export .json</button>
        </div>`;
        $('#fl-txt', out).addEventListener('click', () => downloadText('file-list.txt', rows.map(r => `${r.name}\t${r.ext}\t${formatBytes(r.size)}\t${r.type}`).join('\n')));
        $('#fl-csv', out).addEventListener('click', () => downloadText('file-list.csv', 'name,extension,size_bytes,type,category\n' + rows.map(r => `"${r.name.replace(/"/g,'""')}","${r.ext}",${r.size},"${r.type}","${r.category}"`).join('\n'), 'text/csv'));
        $('#fl-json', out).addEventListener('click', () => downloadText('file-list.json', JSON.stringify(rows, null, 2), 'application/json'));
      }
    });
    out.innerHTML = emptyState('Add files above to build a list.');
  }
});

function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function hashFile(file, algo) {
  const buf = await readFileAsArrayBuffer(file);
  const digest = await crypto.subtle.digest(algo, buf);
  return bufferToHex(digest);
}
function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* 11 — File Metadata Viewer */
TOOLS.push(Object.assign({ id: 'metadata-viewer', name: 'File Metadata Viewer', category: 'File Information',
  desc: 'View the metadata your browser exposes for any file: size, type, dates, image dimensions.' },
  singleFileInspectorTool('metadata-viewer', 'Metadata', ['name', 'ext', 'mime', 'size', 'modified', 'dims'])));
{
  const mv = TOOLS.find(t => t.id === 'metadata-viewer');
  const origRender = mv.render;
  mv.render = function (container) {
    origRender(container);
    const panel = $('.panel:last-child', container) || container;
    container.insertAdjacentHTML('beforeend', `<p class="note">This tool reads metadata your browser already exposes (name, size, type, dates, and image dimensions). It does not strip or modify metadata inside the file.</p>`);
  };
}

/* 12 — File Hash Generator */
TOOLS.push({
  id: 'hash-generator', name: 'File Hash Generator', category: 'File Security',
  desc: 'Calculate SHA-1, SHA-256, SHA-384 and SHA-512 hashes for any file.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Choose a file</h2>
        ${dropzoneHTML('hg-dz', { label: 'Drag & drop a file here' })}
      </div>
      <div class="panel" id="hg-out"></div>`;
    const out = $('#hg-out', container);
    const ALGOS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'];
    let hashes = {};
    let currentFile = null;
    wireDropzone(container, 'hg-dz', async (files) => {
      const file = files[0];
      if (!file) return;
      currentFile = file;
      out.innerHTML = `<h2>Hashing ${escapeHtml(file.name)}…</h2><div class="progress-wrap"><div class="progress-bar" style="width:40%"></div></div>`;
      hashes = {};
      for (const algo of ALGOS) hashes[algo] = await hashFile(file, algo);
      renderHashes();
    });
    function renderHashes() {
      out.innerHTML = `<h2>Hashes for ${escapeHtml(currentFile.name)}</h2>` +
        ALGOS.map(algo => `
          <div class="field" style="margin-bottom:.8rem">
            <label>${algo}</label>
            <div class="result-box" id="hg-${algo}" style="margin-bottom:.4rem">${hashes[algo]}</div>
            <button class="btn secondary" type="button" data-algo="${algo}" data-action="copy">Copy ${algo}</button>
          </div>`).join('') +
        `<div class="btn-row"><button class="btn secondary" id="hg-download" type="button">Download all (.txt)</button></div>
        <div class="panel" style="margin-top:1rem">
          <h2>Compare a hash</h2>
          <div class="field-row">
            <div class="field"><label for="hg-cmp-algo">Algorithm</label>
              <select id="hg-cmp-algo">${ALGOS.map(a => `<option value="${a}">${a}</option>`).join('')}</select></div>
            <div class="field"><label for="hg-cmp-value">Expected hash</label><input type="text" id="hg-cmp-value" placeholder="paste hash to compare"></div>
          </div>
          <button class="btn accent" id="hg-cmp-run" type="button">Compare</button>
          <div id="hg-cmp-result" style="margin-top:.7rem"></div>
        </div>`;
      $$('#hg-out button[data-action="copy"]', container).forEach(btn =>
        btn.addEventListener('click', () => copyText(hashes[btn.dataset.algo], btn)));
      $('#hg-download', container).addEventListener('click', () =>
        downloadText(`${currentFile.name}.hashes.txt`, ALGOS.map(a => `${a}: ${hashes[a]}`).join('\n')));
      $('#hg-cmp-run', container).addEventListener('click', () => {
        const algo = $('#hg-cmp-algo', container).value;
        const expected = $('#hg-cmp-value', container).value.trim().toLowerCase();
        const resEl = $('#hg-cmp-result', container);
        if (!expected) { resEl.innerHTML = statusLine('error', 'Enter a hash to compare.'); return; }
        resEl.innerHTML = constantTimeEqual(hashes[algo], expected) ? statusLine('match', `${algo} hash MATCHES.`) : statusLine('nomatch', `${algo} hash does NOT match.`);
      });
    }
    out.innerHTML = emptyState('Add a file above to generate its hashes.');
  }
});

/* 13 — Hash Checker / File Integrity Checker */
TOOLS.push({
  id: 'hash-checker', name: 'Hash Checker / Integrity Checker', category: 'File Security',
  desc: 'Verify a file\u2019s SHA-256 hash against an expected value.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>1. Choose a file</h2>
        ${dropzoneHTML('hc-dz', { label: 'Drag & drop a file here' })}
        <div id="hc-hash" class="note"></div>
      </div>
      <div class="panel">
        <h2>2. Enter the expected SHA-256 hash</h2>
        <div class="field"><label for="hc-expected" class="visually-hidden">Expected hash</label>
          <input type="text" id="hc-expected" placeholder="e.g. from the file's official download page"></div>
        <button class="btn accent" id="hc-run" type="button" disabled>Compare</button>
        <div id="hc-result" style="margin-top:.8rem"></div>
      </div>`;
    let computed = null;
    wireDropzone(container, 'hc-dz', async (files) => {
      const file = files[0];
      if (!file) return;
      $('#hc-hash', container).textContent = `Hashing ${file.name}…`;
      $('#hc-run', container).disabled = true;
      computed = await hashFile(file, 'SHA-256');
      $('#hc-hash', container).innerHTML = `SHA-256: <span class="mono">${computed}</span>`;
      $('#hc-run', container).disabled = false;
    });
    $('#hc-run', container).addEventListener('click', () => {
      const expected = $('#hc-expected', container).value.trim().toLowerCase();
      const resEl = $('#hc-result', container);
      if (!computed) { resEl.innerHTML = statusLine('error', 'Choose a file first.'); return; }
      if (!expected) { resEl.innerHTML = statusLine('error', 'Enter the expected hash.'); return; }
      resEl.innerHTML = constantTimeEqual(computed, expected) ? statusLine('match', 'MATCH — the file integrity is verified.') : statusLine('nomatch', 'NOT MATCH — the file may be corrupted, incomplete, or tampered with.');
    });
  }
});

/* 14 — File Timestamp Converter */
TOOLS.push({
  id: 'timestamp-converter', name: 'File Timestamp Converter', category: 'File Conversion',
  desc: 'Convert between Unix timestamps and human-readable dates.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Timestamp \u2192 Date</h2>
        <div class="field-row">
          <div class="field"><label for="tc-ts">Unix timestamp</label><input type="number" id="tc-ts" placeholder="1735689600"></div>
          <div class="field"><label for="tc-unit">Unit</label><select id="tc-unit"><option value="s">Seconds</option><option value="ms">Milliseconds</option></select></div>
        </div>
        <div class="btn-row">
          <button class="btn secondary" id="tc-now" type="button">Use current timestamp</button>
          <button class="btn secondary" id="tc-copy" type="button">Copy result</button>
        </div>
        <div id="tc-out" style="margin-top:.8rem"></div>
      </div>
      <div class="panel">
        <h2>Date \u2192 Timestamp</h2>
        <div class="field"><label for="tc-date">Local date &amp; time</label><input type="datetime-local" id="tc-date"></div>
        <div id="tc-out2" style="margin-top:.6rem"></div>
      </div>`;
    const tsEl = $('#tc-ts', container), unitEl = $('#tc-unit', container), out = $('#tc-out', container);
    function fromTs() {
      const raw = parseFloat(tsEl.value);
      if (!Number.isFinite(raw)) { out.innerHTML = emptyState('Enter a timestamp above.'); return; }
      const ms = unitEl.value === 's' ? raw * 1000 : raw;
      const d = new Date(ms);
      if (isNaN(d)) { out.innerHTML = statusLine('error', 'Invalid timestamp.'); return; }
      out.innerHTML = resultGridHTML([
        ['Local time', escapeHtml(d.toLocaleString())],
        ['UTC time', escapeHtml(d.toUTCString())],
        ['ISO 8601', escapeHtml(d.toISOString())],
        ['Seconds', Math.floor(d.getTime() / 1000)],
        ['Milliseconds', d.getTime()],
      ]);
    }
    tsEl.addEventListener('input', fromTs); unitEl.addEventListener('change', fromTs);
    $('#tc-now', container).addEventListener('click', () => {
      const now = Date.now();
      unitEl.value = 'ms'; tsEl.value = now; fromTs();
    });
    $('#tc-copy', container).addEventListener('click', (e) => copyText(out.innerText, e.target));
    const dateEl = $('#tc-date', container), out2 = $('#tc-out2', container);
    dateEl.addEventListener('input', () => {
      if (!dateEl.value) { out2.innerHTML = ''; return; }
      const d = new Date(dateEl.value);
      out2.innerHTML = resultGridHTML([
        ['Seconds', Math.floor(d.getTime() / 1000)],
        ['Milliseconds', d.getTime()],
        ['UTC time', escapeHtml(d.toUTCString())],
      ]);
    });
    out.innerHTML = emptyState('Enter a timestamp above.');
  }
});

/* 15 — File Path / Filename Analyzer */
TOOLS.push({
  id: 'path-analyzer', name: 'File Path / Filename Analyzer', category: 'File Information',
  desc: 'Break a file path or file name down into its parts.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Enter a path or filename</h2>
        <div class="field"><label for="pa-input" class="visually-hidden">Path</label>
          <input type="text" id="pa-input" placeholder="/path/projects/report/final.pdf"></div>
        <div id="pa-out" style="margin-top:.8rem"></div>
      </div>`;
    const input = $('#pa-input', container), out = $('#pa-out', container);
    function update() {
      const raw = input.value;
      if (!raw.trim()) { out.innerHTML = emptyState('Type a path above to analyze it.'); return; }
      const normalized = raw.replace(/\\/g, '/');
      const lastSlash = normalized.lastIndexOf('/');
      const dir = lastSlash >= 0 ? normalized.slice(0, lastSlash + 1) : '';
      const filename = lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
      const ext = getExt(filename);
      const nameOnly = ext ? filename.slice(0, -(ext.length + 1)) : filename;
      const depth = dir.split('/').filter(Boolean).length;
      out.innerHTML = resultGridHTML([
        ['Directory', escapeHtml(dir) || '(none)'],
        ['File name', escapeHtml(filename)],
        ['Name (no extension)', escapeHtml(nameOnly)],
        ['Extension', ext ? '.' + escapeHtml(ext) : '(none)'],
        ['Path depth', depth],
        ['Character count', raw.length],
      ]);
    }
    input.addEventListener('input', update);
    out.innerHTML = emptyState('Type a path above to analyze it.');
  }
});

/* 16 — File Size Comparison Tool */
TOOLS.push({
  id: 'size-comparison', name: 'File Size Comparison Tool', category: 'File Analysis',
  desc: 'Compare multiple files side by side: smallest, largest, average and total.',
  render(container) {
    container.innerHTML = `
      <div class="panel"><h2>Select files</h2>${multiFileAreaHTML('cmp-dz', 'Drag & drop multiple files here')}</div>
      <div class="panel" id="cmp-out"></div>`;
    const out = $('#cmp-out', container);
    setupMultiFileArea(container, 'cmp-dz', {
      onChange(files) {
        if (!files.length) { out.innerHTML = emptyState('Add at least two files to compare.'); return; }
        const sizes = files.map(f => f.size);
        const total = sizes.reduce((a, b) => a + b, 0);
        const max = Math.max(...sizes), min = Math.min(...sizes);
        out.innerHTML = `<h2>Comparison (${files.length} files)</h2>
          <div class="table-wrap"><table><thead><tr><th>File</th><th>Size</th><th>Type</th></tr></thead><tbody>${
            files.map((f, i) => `<tr><td>${escapeHtml(f.name)}</td><td class="mono">${formatBytes(f.size)}${sizes[i] === max ? ' <span class="badge">largest</span>' : ''}${sizes[i] === min ? ' <span class="badge">smallest</span>' : ''}</td><td class="mono">${escapeHtml(categoryAndMime(f.name, f.type).mime)}</td></tr>`).join('')
          }</tbody></table></div>
          ${resultGridHTML([
            ['Total size', formatBytes(total)],
            ['Average size', formatBytes(total / files.length)],
            ['Largest', formatBytes(max)],
            ['Smallest', formatBytes(min)],
            ['Difference (max-min)', formatBytes(max - min)],
          ])}`;
      }
    });
    out.innerHTML = emptyState('Add at least two files to compare.');
  }
});

/* 17 — Batch File Renamer */
TOOLS.push({
  id: 'batch-renamer', name: 'Batch File Renamer', category: 'File Management',
  desc: 'Preview batch rename rules, then download a rename list or a ZIP of renamed copies.',
  render(container) {
    container.innerHTML = `
      <div class="panel"><h2>Select files</h2>${multiFileAreaHTML('br-dz', 'Drag & drop multiple files here')}</div>
      <div class="panel">
        <h2>Rename rules</h2>
        <div class="field-row">
          <div class="field"><label for="br-prefix">Add prefix</label><input type="text" id="br-prefix"></div>
          <div class="field"><label for="br-suffix">Add suffix (before extension)</label><input type="text" id="br-suffix"></div>
        </div>
        <div class="field-row">
          <div class="field"><label for="br-find">Find text</label><input type="text" id="br-find"></div>
          <div class="field"><label for="br-replace">Replace with</label><input type="text" id="br-replace"></div>
        </div>
        <div class="checks-grid">
          <label class="check-row"><input type="checkbox" id="br-seq"> Sequential numbering</label>
          <label class="check-row"><input type="checkbox" id="br-lower"> lowercase</label>
          <label class="check-row"><input type="checkbox" id="br-upper"> UPPERCASE</label>
          <label class="check-row"><input type="checkbox" id="br-spaces"> Replace spaces with _</label>
          <label class="check-row"><input type="checkbox" id="br-date"> Add today\u2019s date</label>
        </div>
        <button class="btn accent" id="br-preview" type="button">Preview</button>
      </div>
      <div class="panel" id="br-out"></div>
      <div class="note warn">Browser security does not allow websites to rename files already saved on your device. Use the downloadable rename list as a guide, or download a ZIP containing copies with the new names.</div>`;
    const mgr = setupMultiFileArea(container, 'br-dz', { onChange() {} });
    const out = $('#br-out', container);
    let plan = [];
    function buildPlan() {
      const files = mgr.getFiles();
      const prefix = $('#br-prefix', container).value;
      const suffix = $('#br-suffix', container).value;
      const find = $('#br-find', container).value;
      const replace = $('#br-replace', container).value;
      const seq = $('#br-seq', container).checked;
      const lower = $('#br-lower', container).checked;
      const upper = $('#br-upper', container).checked;
      const spaces = $('#br-spaces', container).checked;
      const withDate = $('#br-date', container).checked;
      const dateStr = new Date().toISOString().slice(0, 10);
      return files.map((f, i) => {
        const ext = getExt(f.name);
        let base = ext ? f.name.slice(0, -(ext.length + 1)) : f.name;
        if (find) base = base.split(find).join(replace);
        if (spaces) base = base.replace(/\s+/g, '_');
        if (lower) base = base.toLowerCase();
        if (upper) base = base.toUpperCase();
        if (prefix) base = `${prefix}${base}`;
        if (suffix) base = `${base}${suffix}`;
        if (withDate) base = `${base}-${dateStr}`;
        if (seq) base = `${base}-${String(i + 1).padStart(3, '0')}`;
        return { file: f, newName: ext ? `${base}.${ext}` : base };
      });
    }
    $('#br-preview', container).addEventListener('click', () => {
      const files = mgr.getFiles();
      if (!files.length) { out.innerHTML = statusLine('error', 'Add files first.'); return; }
      plan = buildPlan();
      out.innerHTML = `<h2>Preview</h2><div class="table-wrap"><table><thead><tr><th>Original</th><th>New name</th></tr></thead><tbody>${
        plan.map(p => `<tr><td class="mono">${escapeHtml(p.file.name)}</td><td class="mono">${escapeHtml(p.newName)}</td></tr>`).join('')
      }</tbody></table></div>
      <div class="btn-row">
        <button class="btn secondary" id="br-dl-list" type="button">Download rename list (.csv)</button>
        <button class="btn accent" id="br-dl-zip" type="button" ${ZIP_SUPPORTED ? '' : 'disabled'}>Download ZIP of renamed copies</button>
      </div>
      ${ZIP_SUPPORTED ? '' : '<p class="note warn">Your browser does not support the compression API needed to build a ZIP here.</p>'}`;
      $('#br-dl-list', out).addEventListener('click', () => downloadText('rename-plan.csv', 'original_name,new_name\n' + plan.map(p => `"${p.file.name.replace(/"/g,'""')}","${p.newName.replace(/"/g,'""')}"`).join('\n'), 'text/csv'));
      const zipBtn = $('#br-dl-zip', out);
      zipBtn.addEventListener('click', async () => {
        zipBtn.disabled = true; zipBtn.innerHTML = '<span class="spinner"></span> Building ZIP…';
        const entries = [];
        for (const p of plan) entries.push({ name: p.newName, data: new Uint8Array(await readFileAsArrayBuffer(p.file)), lastModified: p.file.lastModified });
        const zipBytes = await createZip(entries);
        downloadBlob('renamed-files.zip', new Blob([zipBytes], { type: 'application/zip' }));
        zipBtn.disabled = false; zipBtn.textContent = 'Download ZIP of renamed copies';
      });
    });
    out.innerHTML = emptyState('Add files, set your rules, then click Preview.');
  }
});

/* 18 — File Type Converter */
TOOLS.push({
  id: 'type-converter', name: 'File Type Converter', category: 'File Conversion',
  desc: 'Convert plain text and data between TXT, HTML, JSON, CSV and Markdown.',
  render(container) {
    container.innerHTML = `
      <div class="panel">
        <h2>Choose a conversion</h2>
        <div class="field">
          <label for="tv-mode">Conversion</label>
          <select id="tv-mode">
            <option value="txt2html">TXT \u2192 HTML</option>
            <option value="txt2json">TXT \u2192 JSON</option>
            <option value="csv2json">CSV \u2192 JSON</option>
            <option value="json2csv">JSON \u2192 CSV</option>
            <option value="md2html">Markdown \u2192 HTML (basic)</option>
          </select>
        </div>
        <div class="field"><label for="tv-input">Input</label><textarea id="tv-input" placeholder="Paste content here, or drop a file below"></textarea></div>
        ${dropzoneHTML('tv-dz', { label: 'Or drag & drop a text-based file' })}
        <button class="btn accent" id="tv-run" type="button" style="margin-top:.9rem">Convert</button>
      </div>
      <div class="panel" id="tv-out"></div>`;
    const modeEl = $('#tv-mode', container), inputEl = $('#tv-input', container), out = $('#tv-out', container);
    wireDropzone(container, 'tv-dz', async (files) => { if (files[0]) inputEl.value = await readFileAsText(files[0]); });
    function parseCSV(text) {
      const rows = []; let row = [], cur = '', inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (inQuotes) {
          if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false; }
          else cur += c;
        } else if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
        else cur += c;
      }
      if (cur.length || row.length) { row.push(cur); rows.push(row); }
      return rows.filter(r => r.length && !(r.length === 1 && r[0] === ''));
    }
    function csvField(v) { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }
    function basicMarkdownToHtml(md) {
      let html = escapeHtml(md);
      html = html.replace(/^### (.*)$/gm, '<h3>$1</h3>').replace(/^## (.*)$/gm, '<h2>$1</h2>').replace(/^# (.*)$/gm, '<h1>$1</h1>');
      html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
      html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
      html = html.replace(/^(?:- .*(?:\n|$))+/gm, (block) => `<ul>${block.trim().split('\n').map(l => `<li>${l.replace(/^- /, '')}</li>`).join('')}</ul>\n`);
      html = html.split(/\n{2,}/).map(p => /^<(h1|h2|h3|ul)/.test(p.trim()) ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`).join('\n');
      return html;
    }
    $('#tv-run', container).addEventListener('click', () => {
      const mode = modeEl.value, text = inputEl.value;
      if (!text.trim()) { out.innerHTML = statusLine('error', 'Enter or drop some input first.'); return; }
      let result = '', mime = 'text/plain', filename = 'converted.txt';
      try {
        if (mode === 'txt2html') {
          result = text.split(/\n{2,}/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('\n');
          mime = 'text/html'; filename = 'converted.html';
        } else if (mode === 'txt2json') {
          result = JSON.stringify({ lines: text.split('\n') }, null, 2);
          mime = 'application/json'; filename = 'converted.json';
        } else if (mode === 'csv2json') {
          const rows = parseCSV(text);
          const [header, ...body] = rows;
          const objs = body.map(r => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));
          result = JSON.stringify(objs, null, 2); mime = 'application/json'; filename = 'converted.json';
        } else if (mode === 'json2csv') {
          const data = JSON.parse(text);
          const arr = Array.isArray(data) ? data : [data];
          const cols = [...new Set(arr.flatMap(o => Object.keys(o)))];
          result = [cols.join(','), ...arr.map(o => cols.map(c => csvField(o[c])).join(','))].join('\n');
          mime = 'text/csv'; filename = 'converted.csv';
        } else if (mode === 'md2html') {
          result = basicMarkdownToHtml(text); mime = 'text/html'; filename = 'converted.html';
        }
      } catch (err) {
        out.innerHTML = statusLine('error', `Could not convert: ${escapeHtml(err.message)}`); return;
      }
      out.innerHTML = `<h2>Result</h2><div class="result-box">${escapeHtml(result)}</div>
        <div class="btn-row">
          <button class="btn secondary" id="tv-copy" type="button">Copy</button>
          <button class="btn secondary" id="tv-dl" type="button">Download</button>
        </div>`;
      $('#tv-copy', out).addEventListener('click', (e) => copyText(result, e.target));
      $('#tv-dl', out).addEventListener('click', () => downloadText(filename, result, mime));
    });
    out.innerHTML = emptyState('Choose a conversion, add input, then click Convert.');
  }
});

/* 19 — ZIP File Creator */
TOOLS.push({
  id: 'zip-creator', name: 'ZIP File Creator', category: 'File Compression',
  desc: 'Bundle multiple files into a real .zip archive, entirely in your browser.',
  render(container) {
    if (!ZIP_SUPPORTED) { container.innerHTML = `<div class="panel">${statusLine('error', 'Your browser does not support the compression API this tool needs. Try a recent version of Chrome, Edge, Firefox or Safari.')}</div>`; return; }
    container.innerHTML = `
      <div class="panel">
        <h2>Add files</h2>
        ${multiFileAreaHTML('zc-dz', 'Drag & drop multiple files here')}
        <div id="zc-total" class="note"></div>
        <button class="btn accent" id="zc-create" type="button" style="margin-top:.6rem" disabled>Create ZIP</button>
        <div id="zc-progress" style="margin-top:.7rem"></div>
      </div>`;
    const mgr = setupMultiFileArea(container, 'zc-dz', {
      onChange(files) {
        $('#zc-total', container).textContent = files.length ? `${files.length} file(s), ${formatBytes(files.reduce((a, f) => a + f.size, 0))} total` : '';
        $('#zc-create', container).disabled = !files.length;
      }
    });
    $('#zc-create', container).addEventListener('click', async () => {
      const files = mgr.getFiles();
      if (!files.length) return;
      const btn = $('#zc-create', container);
      const prog = $('#zc-progress', container);
      btn.disabled = true;
      prog.innerHTML = `<div class="progress-wrap"><div class="progress-bar" id="zc-bar" style="width:0%"></div></div>`;
      const bar = $('#zc-bar', container);
      const entries = [];
      for (const f of files) entries.push({ name: f.name, data: new Uint8Array(await f.arrayBuffer()), lastModified: f.lastModified });
      const zipBytes = await createZip(entries, (frac) => { bar.style.width = `${Math.round(frac * 100)}%`; });
      downloadBlob('archive.zip', new Blob([zipBytes], { type: 'application/zip' }));
      prog.innerHTML = statusLine('match', `ZIP created: ${formatBytes(zipBytes.length)}.`);
      btn.disabled = false;
    });
  }
});

/* 20 — ZIP File Extractor */
TOOLS.push({
  id: 'zip-extractor', name: 'ZIP File Extractor', category: 'File Compression',
  desc: 'Open a .zip archive in your browser and download the files inside.',
  render(container) {
    if (!ZIP_SUPPORTED) { container.innerHTML = `<div class="panel">${statusLine('error', 'Your browser does not support the decompression API this tool needs. Try a recent version of Chrome, Edge, Firefox or Safari.')}</div>`; return; }
    container.innerHTML = `
      <div class="panel"><h2>Choose a .zip file</h2>${dropzoneHTML('zx-dz', { accept: '.zip', label: 'Drag & drop a .zip file here' })}</div>
      <div class="panel" id="zx-out"></div>`;
    const out = $('#zx-out', container);
    let zip = null, zipName = 'archive';
    wireDropzone(container, 'zx-dz', async (files) => {
      const file = files[0];
      if (!file) return;
      zipName = nameWithoutExt(file.name) || 'archive';
      out.innerHTML = `<p class="note">Reading archive…</p>`;
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        zip = await readZip(bytes);
      } catch (err) {
        out.innerHTML = statusLine('error', `Could not open this ZIP: ${escapeHtml(err.message)}`); return;
      }
      const visible = zip.entries.filter(e => !e.isDir);
      out.innerHTML = `<h2>${escapeHtml(file.name)}</h2>
        ${resultGridHTML([['Files', visible.length], ['Total entries', zip.entries.length], ['Archive size', formatBytes(file.size)]])}
        <div class="table-wrap" style="margin-top:.9rem"><table>
          <thead><tr><th><input type="checkbox" id="zx-all" checked></th><th>Path</th><th>Size</th><th></th></tr></thead>
          <tbody>${visible.map((e, i) => `<tr><td><input type="checkbox" class="zx-check" data-idx="${i}" checked></td><td class="mono">${escapeHtml(e.name)}</td><td class="mono">${formatBytes(e.uncompSize)}</td><td><button class="btn secondary" data-single="${i}" type="button">Download</button></td></tr>`).join('')}</tbody>
        </table></div>
        <div class="btn-row"><button class="btn accent" id="zx-extract-all" type="button">Extract &amp; download selected</button></div>
        <div id="zx-status" style="margin-top:.7rem"></div>`;
      const checks = () => $$('.zx-check', out);
      $('#zx-all', out).addEventListener('change', (e) => checks().forEach(c => c.checked = e.target.checked));
      $$('[data-single]', out).forEach(btn => btn.addEventListener('click', async () => {
        const e = visible[parseInt(btn.dataset.single, 10)];
        const data = await zip.extract(e);
        downloadBlob(e.name.split('/').pop(), new Blob([data]));
      }));
      $('#zx-extract-all', out).addEventListener('click', async () => {
        const selected = checks().filter(c => c.checked).map(c => visible[parseInt(c.dataset.idx, 10)]);
        const statusEl = $('#zx-status', out);
        if (!selected.length) { statusEl.innerHTML = statusLine('error', 'Select at least one file.'); return; }
        statusEl.innerHTML = `<span class="spinner"></span> Extracting ${selected.length} file(s)…`;
        for (let i = 0; i < selected.length; i++) {
          const e = selected[i];
          const data = await zip.extract(e);
          downloadBlob(e.name.split('/').pop() || `file-${i}`, new Blob([data]));
          await new Promise(r => setTimeout(r, 250));
        }
        statusEl.innerHTML = statusLine('match', `Downloaded ${selected.length} file(s).`);
      });
    });
    out.innerHTML = emptyState('Choose a .zip file above to see what\u2019s inside.');
  }
});

/* ---------------------------------------------------------
   Static pages (About / Privacy / Terms)
   --------------------------------------------------------- */
const STATIC_PAGES = {
  about: {
    title: 'About Filvora',
    html: `<div class="panel">
      <h2>About Filvora</h2>
      <p>Filvora is a collection of 20 focused, single-purpose file utilities — size converters, hash generators, a ZIP creator and extractor, metadata viewers, batch renaming helpers and more.</p>
      <p>Every tool runs as plain HTML, CSS and JavaScript directly in your browser. There is no backend, no account, and no file upload: your files are read locally using standard browser APIs (the File API, Web Crypto, and the Compression Streams API) and never leave your device.</p>
    </div>`
  },
  privacy: {
    title: 'Privacy',
    html: `<div class="panel">
      <h2>Privacy</h2>
      <p>Filvora does not run a server-side backend for file processing. When a tool says a file is "processed locally," the file's bytes are read with your browser's File API and never transmitted anywhere.</p>
      <p>Your theme preference (light/dark) is stored in your browser's local storage so it's remembered on your next visit. No file content or personal data is collected or stored by this site.</p>
    </div>`
  },
  terms: {
    title: 'Terms',
    html: `<div class="panel">
      <h2>Terms of use</h2>
      <p>Filvora is provided free of charge, "as is," without warranty of any kind. You are responsible for verifying results (such as hashes or renamed files) before relying on them for anything important.</p>
      <p>Do not use these tools to process files you do not have the right to handle.</p>
    </div>`
  }
};

/* ---------------------------------------------------------
   Home page
   --------------------------------------------------------- */
const CATEGORY_ORDER = ['File Information', 'File Management', 'File Security', 'File Compression', 'File Conversion', 'File Analysis'];

function toolCardHTML(tool) {
  return `<a class="tool-card" href="#/${tool.id}">
    <span class="tool-icon">${toolIcon(tool.id)}</span>
    <h3>${escapeHtml(tool.name)}</h3>
    <p>${escapeHtml(tool.desc)}</p>
    <span class="tool-open">Open tool →</span>
  </a>`;
}

function renderHome(container, query = '', activeCategory = 'All') {
  const q = query.trim().toLowerCase();
  const filtered = TOOLS.filter(t =>
    (!q || t.name.toLowerCase().includes(q) || t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)) &&
    (activeCategory === 'All' || t.category === activeCategory)
  );

  const catButtons = ['All', ...CATEGORY_ORDER].map(c =>
    `<button type="button" data-cat="${escapeHtml(c)}" class="${c === activeCategory ? 'active' : ''}">${escapeHtml(c)}</button>`
  ).join('');

  let gridHtml;
  if (!filtered.length) {
    gridHtml = `<p class="no-results">No tools found. Try a different search term.</p>`;
  } else if (q) {
    gridHtml = `<div class="tool-grid">${filtered.map(toolCardHTML).join('')}</div>`;
  } else {
    gridHtml = CATEGORY_ORDER
      .filter(cat => activeCategory === 'All' || activeCategory === cat)
      .map(cat => {
        const tools = filtered.filter(t => t.category === cat);
        if (!tools.length) return '';
        return `<h2 class="category-heading">${escapeHtml(cat)}</h2><div class="tool-grid">${tools.map(toolCardHTML).join('')}</div>`;
      }).join('');
  }

  container.innerHTML = `
    <div class="hero">
      <h1>Filvora — 20 Free File Tools</h1>
      <p>Fast, privacy-friendly file utilities that run entirely in your browser. Nothing you open here is ever uploaded.</p>
      <div class="hero-badges">
        <span class="badge">No sign-up</span>
        <span class="badge">Processed locally</span>
        <span class="badge">Free forever</span>
        <span class="badge">Works offline</span>
      </div>
    </div>
    <div class="category-nav" id="home-cat-nav">${catButtons}</div>
    <div id="home-grid">${gridHtml}</div>
    <div class="panel" style="margin-top:2rem">
      <h2>What are file tools, and why local processing?</h2>
      <p>File tools are small utilities that help you inspect, convert, rename, hash, compress or extract files without installing anything. Because every tool on this site runs client-side, your files are read directly by your browser and processed on your own device — nothing is sent to a server, which makes these tools fast, private, and usable even on a slow connection.</p>
      <p>Common uses: checking a download's integrity with a hash checker, converting a file size for a storage quota, cleaning up messy file names before uploading them somewhere, or zipping a batch of files for sharing.</p>
    </div>`;

  $$('#home-cat-nav button', container).forEach(btn =>
    btn.addEventListener('click', () => renderHome(container, $('#global-search').value, btn.dataset.cat)));
}

/* ---------------------------------------------------------
   Router
   --------------------------------------------------------- */
function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  return hash || '';
}

function render() {
  const view = $('#view');
  const route = currentRoute();
  window.scrollTo(0, 0);

  if (!route) {
    renderHome(view, $('#global-search') ? $('#global-search').value : '');
    document.title = 'Filvora — 20 Free Online File Utilities';
    return;
  }

  if (STATIC_PAGES[route]) {
    const page = STATIC_PAGES[route];
    view.innerHTML = `<a class="back-link" href="#/">← All tools</a><h1>${escapeHtml(page.title)}</h1>${page.html}`;
    document.title = `${page.title} — Filvora`;
    return;
  }

  const tool = TOOLS.find(t => t.id === route);
  if (!tool) {
    view.innerHTML = `<a class="back-link" href="#/">← All tools</a><div class="panel">${statusLine('error', `Tool "${escapeHtml(route)}" was not found.`)}</div>`;
    document.title = 'Not found — Filvora';
    return;
  }

  view.innerHTML = `
    <a class="back-link" href="#/">← All tools</a>
    <p class="breadcrumb"><a href="#/">Home</a> / <a href="#/">${escapeHtml(tool.category)}</a> / ${escapeHtml(tool.name)}</p>
    <div class="tool-header">
      <h1>${escapeHtml(tool.name)}</h1>
      <p>${escapeHtml(tool.desc)}</p>
    </div>
    ${PRIVACY_NOTE}
    <div id="tool-mount"></div>`;
  document.title = `${tool.name} — Filvora`;
  const meta = $('meta[name="description"]');
  if (meta) meta.setAttribute('content', tool.desc);
  try {
    tool.render($('#tool-mount'));
  } catch (err) {
    $('#tool-mount').innerHTML = statusLine('error', `Something went wrong loading this tool: ${escapeHtml(err.message)}`);
    console.error(err);
  }
}

/* ---------------------------------------------------------
   Theme toggle
   --------------------------------------------------------- */
function initTheme() {
  const stored = localStorage.getItem('ft-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = stored || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ft-theme', theme);
  const label = $('#theme-label');
  const toggle = $('#theme-toggle');
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
  if (toggle) toggle.setAttribute('aria-pressed', String(theme === 'dark'));
}

/* ---------------------------------------------------------
   Init
   --------------------------------------------------------- */
function init() {
  initTheme();
  $('#theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
  $('#global-search').addEventListener('input', () => {
    if (currentRoute()) location.hash = '#/';
    renderHome($('#view'), $('#global-search').value);
  });
  window.addEventListener('hashchange', render);
  render();
}

document.addEventListener('DOMContentLoaded', init);
