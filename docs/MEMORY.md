# 🧠 Memory Bank & Project Intelligence — LifeQR

**Active Working Context & Fast Reference for AI Agents & Engineers**  
**Version:** 2.0  
**Target:** Read this file first before starting any new coding or debugging session.  

---

## 1. 📌 Project Snapshot

- **Project:** LifeQR — Critical Emergency Medical QR & Real-Time Ambulance Dispatch System.
- **Primary Core:** Emergency profile access for unconscious/trauma patients via QR code scan (zero-login) and real-time SOS broadcast with live GPS tracking to ambulance crews over Socket.IO.
- **Port:** Server runs on `http://localhost:5000` (and `http://<LAN_IP>:5000` for mobile testing).
- **Public Website (`website/`):** Served on `/`.
- **Portals & Dashboards (`app/`):** Served on `/app` and individual routes (`patient_dashboard.html`, `CrewAmbulance_dashboard.html`, `doctor_dashboard.html`, `er_dashboard.html`, `hospital_dashboard.html`, `admin_dashboard.html`, `emergency_access.html`).

---

## 2. 🔑 Verified Test Accounts & Seed Credentials

These verified credentials are confirmed functional in the active database:

| Role | Email | Password | Identifier / Details |
| :--- | :--- | :--- | :--- |
| **Patient** | `patient@lifeqr.com` | `Password@123` | **Name:** Rahul Sharma<br>**QR ID:** `RAH-D3200470`<br>**Blood:** `O+` \| **Allergies:** Penicillin, Peanuts (Anaphylaxis)<br>**Meds:** Albuterol Inhaler, Cetirizine 10mg<br>**ICE:** Priya Sharma (`+91 9876543211`, Spouse) |
| **Ambulance Crew** | `crew@lifeqr.com` | `Password@123` | **Unit:** EMS-402 \| **Station:** Central Trauma Station<br>**Status:** Verified Paramedic |
| **Emergency Doctor** | `doctor@lifeqr.com` | `Password@123` | **Name:** Dr. Amit Sharma \| **License:** MED-884920<br>**Hospital:** Apex Multi-Specialty Trauma Center |
| **Hospital Admin** | `admin@lifeqr.com` | `Password@123` | Full administrative review and audit privileges |
| **ER Wallboard** | `er@lifeqr.com` | `Password@123` | Dedicated trauma bay live reception display |

---

## 3. ⚙️ Run & Execution Commands

```bash
# Start backend server + automated frontend sync (Recommended):
npm run dev

# Start only the Express API backend:
npm --prefix backend run dev

# Run manual two-way synchronization between website/ and app/:
npm run sync

# Run continuous two-way file watcher:
npm run sync:watch

# Compile Tailwind CSS distribution stylesheet:
npm run build:css
```

> [!IMPORTANT]
> **Windows Powershell PATH Note**: Always use `npm --prefix backend run dev` rather than `cd backend && nodemon server.js`. Windows npm execution environments do not automatically expose nested `node_modules/.bin` unless `--prefix` is used.

---

## 4. ⚠️ Critical Pitfalls & Past Mistakes (Rapid Memory Bank)

Review these 14 documented failure modes to avoid repeating past bugs:

1. **`MONGO_URI` Missing on Startup (Issue 001):** `dotenv.config()` without path options searches in cwd root instead of `backend/.env`. Always use `{ path: path.join(__dirname, '.env') }`.
2. **MongoDB Atlas SRV Lookup Crashes (ADR 002):** Local Wi-Fi routers frequently fail SRV DNS resolution. `backend/server.js` must execute `dns.setServers(['8.8.8.8', '1.1.1.1'])` prior to Mongoose connection.
3. **Crew/Doctor Dashboard Missing Data (Issue 002 & 009):** Some API endpoints return flat JSON (`patient.bloodGroup`) while others return nested objects (`patient.profile.bloodGroup`). Always implement defensive fallback chaining in frontend renderers.
4. **Helmet CSP Blocking LAN Mobile Phones (Issue 005):** Helmet's default `upgrade-insecure-requests` directive converts `http://192.168.x.x:5000` asset requests to `https`, breaking CSS and font loading on mobile. Helmet CSP is specifically tuned with `upgradeInsecureRequests: null` in development.
5. **Hardcoded Unrouted `fetch()` Calls (Issue 007):** Relative calls like `fetch('/api/v1/patient/me')` fail with 404 when dashboards run on alternate dev ports (e.g., Live Server on 5500). Dashboards MUST import `api-utils.js` and call `window.authFetch(window.getApiUrl(...))`.
6. **Token Resolution Failures on Emergency QR Scans (Issue 010 & 012):** Scanned badges may contain raw QR IDs, full URLs, 64-char hex tokens, or SHA-256 hashes. Always use `backend/utils/patientResolver.js` to ensure zero lookup failures.
7. **Banned `plainPassword` Storage (Issue 001 in Analysis):** Passwords MUST be hashed with `bcryptjs`. Never store or expose plain text passwords in any JSON response.
8. **Broken Admin Check (Issue 002 in Analysis):** Never check `if (!req.user)` for admin access. Always verify `if (req.user.role !== 'admin')`.
9. **Residual AI Pastel Gradients (Issue 011):** Never dynamically inject `rounded-3xl` or `bg-purple-50` via JS template strings. Adhere strictly to the Swiss Brutalist 2px border and hard offset drop shadow design.
10. **Cross-Device Dynamic IP Resolution (Issue 012):** `backend/utils/frontendUrl.js` dynamically queries `os.networkInterfaces()` to resolve the machine's local IPv4 network address so scanned QR badges work across external devices on the same Wi-Fi.
11. **Missing `nodemailer` Dependency (Issue 013):** `emailService.js` wraps Nodemailer imports in safe try-catch blocks with automatic console mocking fallback.
12. **Port 5000 EADDRINUSE Conflicts (Issue 014):** If nodemon crashes with port 5000 in use, terminate the orphan node process via PowerShell (`Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess -Force`).
13. **Doctor AI Copilot Container ID Mismatch (Issue 015):** `doctor_dashboard.html` used `id="aiClinicalOutputContainer"`, but `doctor-dashboard.js` strictly queried `id="aiOutputContainer"`, preventing all 5 AI clinical tools from unhiding. Resolved by adding `getAiContainer()` helper checking both IDs.
14. **Admin Dashboard Null Dereference Crash (Issue 016):** `admin-dashboard.js` accessed `document.getElementById('statTotalSos').textContent` without a null check, crashing `loadAdminStats()` mid-execution. Resolved with defensive existence check.
15. **Ambulance HUD Dead Google Maps Navigation Link (Issue 017):** In `CrewAmbulance_dashboard.html`, `gmapsNavBtn` had `href=""` and was never updated in `renderEmergencyMap()`. Resolved by setting `gmapsNavBtn.href = https://maps.google.com/?q={lat},{lng}`.
16. **Missing Seed Master Accounts (Issue 018):** Seed accounts `admin@lifeqr.com` and `er@lifeqr.com` were missing in MongoDB, and `doctor`/`crew` were `PENDING`. Resolved via `backend/seed_master_accounts.js`.

---

## 5. 🔄 Frontend Two-Way Synchronization Rules

The codebase maintains duplicate copies of shared assets in both `website/` and `app/` (stylesheets, brand images, auth scripts, `api-utils.js`).

- **Rule 1:** When editing any shared asset in `app/`, immediately execute `npm run sync` (or have `npm run sync:watch` running) to update `website/`.
- **Rule 2:** Never remove `scripts/sync-frontend.js` or bypass its timestamp comparison logic.
- **Rule 3:** The canonical design reference is `website/landingpage.html` (and mirrored `app/landingpage.html`).

---

## 6. 🤖 AI Agent Handoff Protocol

When starting a new feature or task in this repository:
1. Consult `docs/MEMORY.md` (this file) and `docs/RULES.md`.
2. Do not introduce new third-party CSS libraries (Tailwind is preconfigured with custom tokens).
3. Always verify endpoints against the verified test accounts listed above (`patient@lifeqr.com`, `crew@lifeqr.com`, `doctor@lifeqr.com`, `admin@lifeqr.com`).
4. Keep all 6 documentation files in `docs/` updated as the system evolves.
