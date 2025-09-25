# Sanitary Map AI (Static + PWA)

A simple static website that can be installed to your phone as an app (PWA):
- Public Awareness info
- Public Report Problem (with image upload)
- Admin/NGO Login
- Dashboard sanitary map by areas

All data is stored locally in your browser using localStorage. Images are base64 strings.

## Files
- `index.html`, `awareness.html`, `report.html`, `admin.html`, `dashboard.html`
- `assets/css/styles.css`
- `assets/js/app.js`, `assets/js/storage.js`, `assets/js/ai.js`, `assets/js/report.js`, `assets/js/dashboard.js`
- `manifest.webmanifest` – PWA manifest
- `sw.js` – Service worker (offline support)

## Run
- Double-click `index.html` to open in your browser.
- For best PWA behavior, serve via a simple local server (optional). On Windows without installs, use Edge: open `index.html`, it works.

## Install to phone (PWA)
- Open the site URL in mobile Chrome or Edge.
- You should see an Install prompt or tap the "Install" button in the header when available.
- After installing, it appears on your home screen and works offline for cached pages.

## Admin Login
- Username: `admin`
- Password: `admin123`

## Data Export/Import
- On `dashboard.html` (after login), Export to JSON and Import from JSON to restore data.

## Clear Data (Admin Panel)
- In `dashboard.html` (after admin login), click "Clear Data (local)" to remove all locally stored reports and area scores from this device/browser. This immediately hides data from the public dashboard on this device.
- Backend data (if configured) is not deleted. You can still see all submissions in `admin-data.html` (fetched from backend), or re-import your backup JSON.

## Notes
- No external libraries, no build tools.
- Offline works for cached pages; first visit requires internet or local file access to cache assets.

# Backend (Optional) – Google Apps Script + Google Sheet

You can capture all public submissions centrally. This approach is free, no servers, no packages.

## What you get
- A Google Sheet storing every report (title, desc, category, areaId, image, createdAt, score).
- A web endpoint you can POST to from the site.
- A GET endpoint to list all reports for the Admin Data page.

## Setup Steps
1. Create a Google Sheet named "Sanitary Map AI Reports" with header row:
   - `id, title, description, category, areaId, imageData, createdAt, severityScore`
2. In Google Drive: New → More → Google Apps Script.
3. Replace Code.gs with:
```javascript
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body && body.type === 'report' && body.payload) {
      var r = body.payload;
      var sheet = getSheet();
      sheet.appendRow([r.id, r.title, r.description, r.category, r.areaId, r.imageData, r.createdAt, r.severityScore, r.lat || '', r.lon || '']);
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }
    if (body && body.type === 'deleteAll') {
      var adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
      if (!adminKey || body.adminKey !== adminKey) {
        return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'unauthorized' })).setMimeType(ContentService.MimeType.JSON);
      }
      var sheet = getSheet();
      var last = sheet.getLastRow();
      if (last > 1) sheet.deleteRows(2, last-1); // keep header row
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {}
  return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  var sheet = getSheet();
  var params = e.parameter || {};
  if (params.type === 'reports') {
    var values = sheet.getDataRange().getValues();
    var headers = values.shift();
    var idx = {};
    headers.forEach(function(h,i){ idx[h]=i; });
    var rows = values.map(function(v){
      return {
        id: v[idx.id] || '',
        title: v[idx.title] || '',
        description: v[idx.description] || '',
        category: v[idx.category] || '',
        areaId: v[idx.areaId] || '',
        imageData: v[idx.imageData] || '',
        createdAt: v[idx.createdAt] || '',
        severityScore: v[idx.severityScore] || 0,
        lat: v[idx.lat] || '',
        lon: v[idx.lon] || ''
      };
    });
    return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(){
  var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  return ss.getSheets()[0];
}
```
4. Link your Sheet: Extensions → Apps Script → Project Settings → Script properties:
   - Add property `SHEET_ID` = your Google Sheet ID (from its URL).
5. Deploy as web app: Deploy → New deployment → Type: Web app
   - Execute as: Me
   - Who has access: Anyone with the link
   - Deploy. Copy the Web app URL.
6. In `assets/js/app.js`, set:
```js
window.SMAI.config = { backendUrl: 'PASTE_YOUR_WEB_APP_URL_HERE' };
```

## Using the Admin Data page
- Open `admin-data.html`. If a backend URL is set, it loads from the backend; otherwise it shows local data.

## Notes
- Images are stored as base64 strings in the Sheet (large images may grow size). Consider compressing before upload if needed.
- If you later add authentication to Apps Script, adjust the site to pass tokens in headers.

## Backend: delete all submissions (Admin)
To enable the "Clear Data (backend)" button, add this to your Apps Script and set an admin key.

1) In Apps Script, add below functions:
```javascript
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    if (body && body.type === 'report' && body.payload) {
      var r = body.payload;
      var sheet = getSheet();
      sheet.appendRow([r.id, r.title, r.description, r.category, r.areaId, r.imageData, r.createdAt, r.severityScore, r.lat || '', r.lon || '']);
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }
    if (body && body.type === 'deleteAll') {
      var adminKey = PropertiesService.getScriptProperties().getProperty('ADMIN_KEY');
      if (!adminKey || body.adminKey !== adminKey) {
        return ContentService.createTextOutput(JSON.stringify({ ok:false, error:'unauthorized' })).setMimeType(ContentService.MimeType.JSON);
      }
      var sheet = getSheet();
      var last = sheet.getLastRow();
      if (last > 1) sheet.deleteRows(2, last-1); // keep header row
      return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {}
  return ContentService.createTextOutput(JSON.stringify({ ok: false })).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e){
  var sheet = getSheet();
  var params = e.parameter || {};
  if (params.type === 'reports') {
    var values = sheet.getDataRange().getValues();
    var headers = values.shift();
    var idx = {};
    headers.forEach(function(h,i){ idx[h]=i; });
    var rows = values.map(function(v){
      return {
        id: v[idx.id] || '',
        title: v[idx.title] || '',
        description: v[idx.description] || '',
        category: v[idx.category] || '',
        areaId: v[idx.areaId] || '',
        imageData: v[idx.imageData] || '',
        createdAt: v[idx.createdAt] || '',
        severityScore: v[idx.severityScore] || 0,
        lat: v[idx.lat] || '',
        lon: v[idx.lon] || ''
      };
    });
    return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}

function getSheet(){
  var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SHEET_ID'));
  return ss.getSheets()[0];
}
```
2) In your Sheet, add extra headers `lat, lon` to the end of the header row.
3) In Script properties, set `ADMIN_KEY` to a strong secret.
4) Redeploy the web app, then set `window.SMAI.config.backendUrl` in `assets/js/app.js`.

Now the Admin Panel button "Clear Data (backend)" will prompt for the key and delete all rows except headers.
