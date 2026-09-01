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

## 🎨 6. Landing Page Design Standard (Apple Health & Linear Tier)
- **Cards & Surfaces**: Use razor-sharp micro-hairlines (`border: 1px solid rgba(226, 232, 240, 0.85)` / `border: 1px solid rgba(255, 255, 255, 0.08)`), subtle inset light highlights, and soft ambient drop shadows. Avoid thick, bulky double-bezel bubbles.
- **Buttons**: Use ergonomic pill buttons (`.btn-pill`, `.btn-pill-primary`, `.btn-pill-secondary`) with smooth spring hover transitions and trailing micro-icons.
- **Typography**: Display headings in `Outfit`, body in `Plus Jakarta Sans`, and medical telemetry in `JetBrains Mono`.

