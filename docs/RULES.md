# 📜 Engineering Rules & Vibe Coding Principles — LifeQR

**Operating Standards & Development Guidelines**  
**Version:** 2.0 (Mandatory Compliance)  
**Applies to:** Human Engineers, AI Agents, Vibe Coders, and Autonomous Assistants  

---

## 1. 🛡️ Non-Negotiable Security & Data Integrity Rules

1. **NO RAW PASSWORDS IN RESPONSES OR UI:**
   - Plain text passwords MUST NEVER be exposed in any API response, JSON payload, log output, or administrative view.
   - All passwords must be salted and hashed with `bcryptjs` (min 10 salt rounds).
   - The legacy `plainPassword` field has been deprecated. Never introduce it into any new route, template, or schema.

2. **STRICT ROLE-BASED ACCESS CONTROL (RBAC):**
   - Every administrative or clinical route must enforce explicit middleware checks (`authenticateToken`, `requireRole(['admin'])`, `requireVerified`).
   - Never allow any authenticated user to inherit admin capabilities without an explicit `role === 'admin'` database verification.

3. **NEVER HARDCODE SECRETS:**
   - Secrets (`MONGO_URI`, `JWT_SECRET`, `ONESIGNAL_API_KEY`, `TELEGRAM_BOT_TOKEN`) must only be read from environment variables via `process.env`.
   - Never commit `.env` to Git. Keep `backend/.env.example` up to date with placeholder keys.

4. **IMMUTABLE AUDIT LOGGING FOR PATIENT ACCESS:**
   - Every read of a patient's emergency profile, QR scan, SOS dispatch, or record modification MUST invoke the security audit logger:
     ```javascript
     const { logEvent } = require('../../services/securityLogger');
     logEvent('EVENT_NAME', { userId: user._id, targetPatientId, metadata, ip: req.ip });
     ```

5. **VERIFICATION DOCUMENT AUDITING:**
   - Medical Doctor and Ambulance Crew verification requires official license and document inspection. Auto-verification bypasses are strictly prohibited in production.

---

## 2. 📁 Architectural Separation & Two-Way Sync Protocol

1. **SEPARATION OF `website/` AND `app/`:**
   - **`website/`** is reserved strictly for public marketing, static presentation, and landing pages (`index.html`, `landingpage.html`, `404.html`).
   - **`app/`** contains all authenticated portals, application views, and dashboard logic (`patient_app.html`, `CrewAmbulance_dashboard.html`, `doctor_dashboard.html`, `er_dashboard.html`, `hospital_dashboard.html`, `admin_dashboard.html`, `emergency_access.html`).

2. **THE SYNC-FRONTEND PROTOCOL:**
   - Shared assets (stylesheets, images, `api-utils.js`, `theme.js`, auth templates) exist in both `app/` and `website/`.
   - **Rule:** Whenever you modify a shared file in either directory, you MUST run:
     ```bash
     npm run sync
     ```
     or ensure the background watcher (`npm run sync:watch`) is active. Never allow stylesheets or utilities to diverge.

---

## 3. 🎨 UI/UX & Design Consistency Rules (Swiss Brutalist Standard)

1. **CANONICAL AESTHETIC:**
   - All dashboards and pages MUST follow the high-contrast **Swiss Brutalist / Editorial** design standard established in `website/landingpage.html`.
   - **Strictly Banned:** Pastel gradients, generic AI purple rounded cards (`rounded-3xl bg-purple-50`), low-contrast gray text, and blurry soft shadows.

2. **CORE DESIGN TOKENS:**
   - **Borders:** Crisp solid borders: `border-2 border-[#111111]` (dark elements) or `border-2 border-[#E11D2E]` (emergency elements).
   - **Shadows:** Hard offset brutalist drop shadows: `shadow-[4px_4px_0px_#111111]` or `shadow-[6px_6px_0px_#111111]`.
   - **Emergency Accent:** LifeQR Signal Red (`#E11D2E`).
   - **Typography:**
     - Headlines, branding, and major action labels: `font-black uppercase tracking-tight` (`Archivo Black` / `Archivo`).
     - Telemetry, timestamps, IDs, coordinates, and vital signs: `font-mono` (`JetBrains Mono`).
     - Body copy: `Archivo` / clean system-ui.

3. **DYNAMIC JAVASCRIPT TEMPLATE INJECTION RULE:**
   - When dynamically rendering HTML cards or modal dialogs from JavaScript (e.g., in `patient-dashboard.js`, `crew-dashboard.js`, `doctor-dashboard.js`), **DO NOT** inject legacy rounded pastel classes. Always use the 2px solid border, hard offset shadow, and Archivo/JetBrains Mono classes.

4. **UNIVERSAL DEVICE THEME SYNCHRONIZATION:**
   - Every HTML page must include the zero-FOUC head bootstrapper script that checks `localStorage.getItem('theme')` or system `prefers-color-scheme`.
   - The UI must dynamically react to system theme changes via `window.matchMedia('(prefers-color-scheme: dark)')` without requiring page reloads.

---

## 4. 💻 Code & Implementation Conventions

1. **FRONTEND API CONSUMPTION:**
   - Always use `window.authFetch` and `window.getApiUrl()` from `api-utils.js`.
   - **Never** make unrouted relative fetch calls like `fetch('/api/v1/patient/me')` because they break when running on alternate ports (e.g., Live Server port 5500).
   ```javascript
   // ✅ CORRECT:
   const res = await window.authFetch(window.getApiUrl('/api/v1/patient/me'));
   const data = await res.json();
   ```

2. **UI DATA MODEL DEFENSIVE FALLBACKS:**
   - Backend endpoints may return flat or nested data models depending on whether populate was applied. Always use fallback chaining:
   ```javascript
   // ✅ CORRECT:
   const patientName = patient.name || patient.user?.name || 'Emergency Patient';
   const bloodGroup = patient.bloodGroup || patient.profile?.bloodGroup || 'N/A';
   const contacts = patient.emergencyContacts || patient.profile?.emergencyContacts || [];
   ```

3. **BACKEND DOTENV RESOLUTION:**
   - In all backend entry scripts and utilities, always pass an explicit path to `dotenv.config()`:
   ```javascript
   // ✅ CORRECT:
   require('dotenv').config({ path: path.join(__dirname, '.env') });
   ```

4. **MONGODB ATLAS SRV PUBLIC DNS RESOLUTION:**
   - Node.js DNS resolvers can fail on local routers with `querySrv ECONNREFUSED`. Always invoke:
   ```javascript
   // ✅ MANDATORY IN SERVER INITIALIZATION:
   const dns = require('dns');
   dns.setServers(['8.8.8.8', '1.1.1.1']);
   ```

5. **PORT MANAGEMENT & SCRIPT EXECUTION ON WINDOWS:**
   - Default backend port is `5000`.
   - In root `package.json`, run backend commands with `npm --prefix backend run dev` rather than `cd backend && nodemon server.js` to ensure Windows npm PATH resolution succeeds.
   - If port 5000 is occupied, kill the orphan process rather than switching ports, so frontend clients on port 5000 continue communicating seamlessly.

---

## 5. 🤖 AI Agent & Vibe Coding Guidelines

1. **MANDATORY PRE-TASK WORKFLOW:**
   - Before executing code generation, consult `docs/MEMORY.md` (or `brain/master-memory.md`) first to absorb verified credentials, architecture patterns, and past solved issues.

2. **FULL OUTPUT ENFORCEMENT:**
   - Banned patterns: `// ... rest of the code remains the same ...`, placeholder comments for core logic, or omitting working implementations. Output complete, functional code blocks.

3. **NEVER BREAK VERIFIED ENDPOINTS:**
   - Do not replace working MongoDB/Socket.IO backend calls with mock client-side memory stores unless explicitly instructed to write a standalone mock test.

4. **MEMORY LOGGING UPON FIXES:**
   - Whenever you resolve a bug or architectural conflict, document the symptom, root cause, and fix in `docs/MEMORY.md` (and `brain/mistakes.md`).
