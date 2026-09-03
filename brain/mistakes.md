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

## Issue 008: Doctor Dashboard Patient Search & QR Scanner Theme Discrepancy
- **Symptom**: In Doctor Dashboard, searching patient ID (e.g., `RAH-D3200470`) remained stuck on "No Patient Record Selected" if the doctor account was pending verification; QR camera modal had unmatched purple styling and failed to populate search results; overall dashboard had harsh brutalist block shadows inconsistent with `website/landingpage.html`.
- **Root Cause**: `backend/routes/v1/doctorAccess.js` enforced `requireVerified` on `GET /status/:qrCodeId`, blocking search lookups for pending doctors and omitting emergency medical summaries (blood group, allergies, medications). `qr-scanner.js` used mismatched purple theme and lacked callback wiring to trigger `searchPatient()`. `doctor_dashboard.html` had static 6px drop-shadows on all cards.
- **Fix**: Removed `requireVerified` blocker from `/status/:qrCodeId`, returning full emergency triage matrix. Rebuilt `qr-scanner.js` with Swiss high-contrast editorial theme, drag-and-drop, test button, and auto-trigger callback. Modernized `doctor_dashboard.html` to match `website/landingpage.html` with high-impact medical cards and synchronized `website/` and `app/`.
- **Status**: Resolved.

## Issue 009: Crew Dashboard Patient Details & Emergency ICE Contacts Failing to Render
- **Symptom**: In `CrewAmbulance_dashboard.html`, searching a patient QR ID (e.g., `VED-C188E7F9`) displayed the patient name, age, and allergies, but Blood Group, Current Prescriptions, Chronic Conditions showed empty `-` dashes, Emergency Contacts (ICE) remained blank, and the Patient QR Identifier displayed literal text `ID`.
- **Root Cause**: `renderPatientDetails()` in `crew-dashboard.js` targeted mismatched element IDs (`patBlood`, `patMeds`, `patIssues`, `patContactsList`), whereas `CrewAmbulance_dashboard.html` defined IDs as `patBloodGroup`, `patMedications`, `patHealthIssues`, `patEmergencyContact`, and omitted updating `patId`. Additionally, `renderEmergencyMap()` looked for `emergencyMapContainer` and `L.map('emergencyMap')` instead of `mapWrapper` and `leafletMapContainer`, `logIncidentStage()` and `closeSosPopup()` were undefined, and backend `/api/v1/sos/acknowledge` lacked body-based resolution.
- **Fix**: Updated `renderPatientDetails()` to support both legacy and HUD element IDs (`patBloodGroup`, `patMedications`, `patHealthIssues`, `patEmergencyContact`, `patId`), wired Leaflet map container to `leafletMapContainer` with live Google Maps navigation link, implemented `logIncidentStage()` and `closeSosPopup()`, and added fallback resolution to `backend/routes/v1/sos.js` and `backend/routes/v1/patientProfile.js`.
- **Status**: Resolved.

## Issue 010: Scanned Emergency Credential Tokens & Full QR URLs Failing Doctor/Crew Lookup
- **Symptom**: When scanning or pasting a patient QR badge containing raw emergency credential hex tokens (e.g., `e9fdaf2e8d68178adc8d5ba06c9b44c1...`) or full emergency URLs (`/e/...`), Doctor and Crew lookups failed with `Patient not found for ID: e9fdaf...` or only loaded partial data.
- **Root Cause**: Backend routes (`/doctor-access/status/:qrCodeId`, `/patient/profile/:qrCodeId`, `/history/:qrCodeId`, etc.) strictly performed `PatientProfile.findOne({ qrCodeId })`. When emergency QR codes encoded active credential hashes (stored in the `EmergencyCredential` model) rather than the raw `qrCodeId`, lookups returned `null`.
- **Fix**: Implemented a unified resolver utility `backend/utils/patientResolver.js` that normalizes URLs and resolves patient profiles across `qrCodeId`, case-insensitive strings, `EmergencyCredential` SHA-256 token hashes, raw hex tokens, and ObjectIds. Connected the resolver across Doctor, Crew, History, AI Clinical, and ER Handover endpoints.
- **Status**: Resolved.

## Issue 011: Residual Legacy Gradients and Soft Rounded Containers in Dynamic JS Renderers
- **Symptom**: After converting static HTML files to the Swiss Brutalist editorial design of `landingpage.html`, some cards, boxes, fonts, and action buttons in Patient, Crew, Doctor, ER, and Admin dashboards still rendered with old pastel gradients, soft rounded borders (`rounded-xl`, `rounded-2xl`, `rounded-3xl`), and generic purple styles when populated dynamically at runtime.
- **Root Cause**: Client-side JavaScript modules (`patient-dashboard.js`, `crew-dashboard.js`, `doctor-dashboard.js`, `er-dashboard.js`, `admin-dashboard.js`, `pwa-install.js`) dynamically created and injected HTML template strings containing legacy Tailwind classes (`rounded-2xl`, `bg-purple-50`, `bg-teal-50`, `bg-slate-900`, `shadow-xs`).
- **Fix**: Systematically audited and refactored all dynamic JavaScript template injectors across all dashboards to use 2px solid borders (`border-2 border-[#111111]` / `border-2 border-[#E11D2E]`), hard offset drop-shadows (`shadow-[4px_4px_0px_#111111]`, `shadow-[6px_6px_0px_#111111]`), uppercase `Archivo Black` (`font-black`) headings, `JetBrains Mono` (`font-mono`) badges/telemetry, and semantic buttons (`btn-primary`, `btn-secondary`, `btn-danger`). Re-synchronized `website/` and `app/`.
- **Status**: Resolved.




