# Patterns — Approved Implementation Standards

## 🔐 1. Authentication & Cookie Pattern
- **Token Delivery**: JWT tokens are issued upon login and stored in `token` HTTP-only cookies (`res.cookie('token', jwtToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production' })`).
- **Middleware Check**: `authenticateToken` reads `req.cookies.token` or `Authorization: Bearer <token>`.
- **Auth Guard (Frontend)**: `js/auth-guard.js` exports `checkDashboardAccess(allowedRoles)` which fetches `/api/v1/patient/me` and redirects unauthorized roles to `lifeqr_login.html`.

## 🚨 2. Real-Time Socket.IO SOS Pattern
- **Server Broadcast**:
  ```javascript
  const io = req.app.get('io');
  if (io) {
    io.to('crew:all').emit('sos-alert', {
      sosId, patientId, name, bloodGroup, allergies, location: { lat, lng }, timestamp: new Date()
    });
  }
  ```
- **Client Listener**:
  ```javascript
  const socket = io({ withCredentials: true });
  socket.on('sos-alert', (data) => {
    showSosAlertPopup(data);
  });
  ```

## 📊 3. UI Data Model Fallback Pattern
To accommodate flat vs nested profile JSON outputs from REST endpoints:
```javascript
const name = activePatient.name || (activePatient.user && activePatient.user.name) || 'Emergency Patient';
const bloodGroup = activePatient.bloodGroup || (activePatient.profile && activePatient.profile.bloodGroup) || 'N/A';
const contacts = activePatient.emergencyContacts || (activePatient.profile && activePatient.profile.emergencyContacts) || [];
```

## 🛡️ 4. Security Audit Logging Pattern
Every security-sensitive operation (login, profile change, QR scan, SOS trigger) MUST invoke:
```javascript
const { logEvent } = require('../../services/securityLogger');
logEvent('EVENT_NAME', { userId: user._id, metadata });
```

## 🔄 5. Automatic Two-Way Frontend Directory Synchronization
Frontend common files (styles, images, scripts, Tailwind build outputs, login/signup templates) are synchronized across `website/` and `app/` using `scripts/sync-frontend.js`:
- **CLI Sync**: `npm run sync` runs two-way timestamp comparison and mirror copying.
- **Watcher Mode**: `npm run sync:watch` or server startup continuously watches `website/` and `app/` using `fs.watch` to instantly replicate changes made in either directory.

## 🎨 6. Unified Swiss / Brutalist Editorial Design Standard (landingpage.html Standard)
- **Palette**: Pure Onyx Black (`#111111`), Pure White (`#ffffff`), LifeQR Signal Red (`#E11D2E`), subtle contrast slate/gray accents.
- **Typography**: Display & Brand in `Archivo Black` / `Archivo` (weights 600–900), Body in `Archivo` / system-ui, and medical telemetry/tags in `JetBrains Mono`.
- **Cards & Surfaces**: Use crisp 2px solid borders (`border: 2px solid #111111` or `#E11D2E`) and hard offset drop shadows (`box-shadow: 6px 6px 0px #111111` or `#E11D2E`).
- **Buttons**: Use `.btn-primary` (black with red hover and 2px border), `.btn-secondary` (white with 2px black border), and `.btn-danger` / `.btn-sos` (red #E11D2E).
- **Telemetry Bars**: Sleek top ticker (`bg-[#111111] text-white py-2.5 px-6 font-mono text-[11px]`) with pulsing red `.live-dot`.

## 🌓 7. Universal Device Appearance / System Theme Synchronization
- **Device Theme Listener**: The application dynamically listens to OS / browser preference changes via `window.matchMedia('(prefers-color-scheme: dark)')` in `js/theme.js` & `api-utils.js`.
- **Zero-FOUC Head Bootstrapper**: Every HTML page runs an inline `<script>` in `<head>` to immediately set `<html data-theme="...">` matching either the user's manual choice or device appearance before first paint.
- **Dynamic Adaptability**: When the device switches between Dark and Light mode, the dashboard automatically updates its root `data-theme`, meta theme-color, toggle button state, and UI surfaces across all patient, crew, doctor, ER, and admin portals.


