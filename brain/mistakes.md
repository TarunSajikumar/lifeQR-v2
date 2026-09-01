# Mistakes — Issue & Fix Log

## Issue 001: Missing MONGO_URI Error on Startup
- **Symptom**: `node backend/server.js` failed with `❌ Error: MONGO_URI is required`.
- **Root Cause**: `dotenv.config()` was called without a file path parameter, searching in working directory root instead of `backend/.env`.
- **Fix**: Updated call to `require("dotenv").config({ path: path.join(__dirname, ".env") });`.
- **Status**: Resolved.

## Issue 002: Crew Dashboard Missing Patient Data Fields
- **Symptom**: Scanning patient QR code in `CrewAmbulance_dashboard.html` displayed "Emergency Patient" without blood group or allergies.
- **Root Cause**: `crew-dashboard.js` expected `activePatient.user.name` and `activePatient.profile.bloodGroup`, but `/api/v1/patient/profile/:qrCodeId` returned flat properties (`activePatient.name`, `activePatient.bloodGroup`).
- **Fix**: Updated `renderPatientDetails()` to check both top-level and nested property formats.
- **Status**: Resolved.

## Issue 003: EPERM File Access Lock During Directory Restructuring
- **Symptom**: `fs.rmSync('frontend')` failed with `EPERM Permission denied`.
- **Root Cause**: Background server process (`node backend/server.js`) was actively holding open file handles in `frontend/`.
- **Fix**: Terminated running background server process before completing file folder cleanup.
- **Status**: Resolved.

## Issue 004: File Not Found Error on `website/lifeqr_signup.html`
- **Symptom**: Browser displayed `File not found: website/lifeqr_signup.html` when clicking Sign Up / Sign In links on the marketing site.
- **Root Cause**: `website/index.html` linked to `lifeqr_signup.html` without relative path (`../app/lifeqr_signup.html`), which failed when browsing file system directories directly.
- **Fix**: Updated all `href` paths in `website/index.html` to `../app/lifeqr_signup.html` & `../app/lifeqr_login.html`, and added fallback redirect files in `website/`.
- **Status**: Resolved.

## Issue 005: Unstyled Raw HTML & Broken Images on Mobile/LAN Testing (Port 5000)
- **Symptom**: Browsing `http://192.168.100.82:5000` on mobile rendered unstyled serif text (Times New Roman) and broken image icons.
- **Root Cause**: Helmet middleware applied default `upgrade-insecure-requests` CSP directive. When accessing via HTTP over local IP, the mobile browser automatically rewrote all CSS, images, and font URLs to `https://192.168.100.82:5000/...`, causing SSL handshake failures.
- **Fix**: Configured Helmet CSP with `upgradeInsecureRequests: null` for local development/HTTP and opened CORS for all LAN network interfaces. Rebuilt Tailwind CSS distribution bundle.
- **Status**: Resolved.

## Issue 006: Post-Signup Dashboard Redirection & Cross-Origin Auth Guard
- **Symptom**: After successfully creating an account, the browser failed to reach the dashboard or got bounced back to login.
- **Root Cause**: `js/auth-guard.js` hardcoded `const API_BASE = '/api/v1'`, causing session verification on alternate dev ports/origins (e.g. 5500, 3000) to 404 and kick the user back to login. Dashboard HTML files also omitted `api-utils.js`, and signup redirection had fixed timing without immediate role resolution.
- **Fix**: Upgraded `auth-guard.js` to dynamically detect `API_BASE` and sync `localStorage` user metadata. Included `api-utils.js` across all dashboards. Updated `lifeqr_signup.html` to resolve target dashboard immediately based on user role and redirect cleanly.
- **Status**: Resolved.

## Issue 007: Dashboard Data Failing to Populate Due to Hardcoded Relative Fetch Calls
- **Symptom**: Upon landing on `patient_dashboard.html`, the patient's name showed `Patient: Loading...`, the QR badge was broken, and form inputs stayed empty.
- **Root Cause**: `patient-dashboard.js` (and other dashboard JS controllers) made unrouted relative `fetch('/api/v1/patient/me')` calls instead of utilizing `window.authFetch` and dynamic `getApiUrl()`. When running via separate dev ports (e.g., Live Server on port 5500), these requests failed with 404, throwing an unhandled rejection and skipping DOM rendering. Additionally, `userName` and QR badge were not populated immediately from the verified session object.
- **Fix**: Updated `api-utils.js` to expose `window.getApiUrl()` and upgraded `patient-dashboard.js`, `doctor-dashboard.js`, and `crew-dashboard.js` to use `window.authFetch` across all endpoints. Added immediate pre-rendering of patient name, phone, gender, and QR badge from the authenticated user object on `DOMContentLoaded`.
- **Status**: Resolved.



