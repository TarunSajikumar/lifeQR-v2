# Dependency Graph — File & Module Interactions

## 🔗 High-Level Dependency Map

```text
[website/index.html] ----------> Static Assets (styles.css, dist/output.css, LifeQR.png)
                              |
[app/lifeqr_login.html] ------> [/api/v1/auth/login] ------> [backend/routes/v1/auth.js]
                              |                                  |
                              v                                  v
[app/patient_dashboard.html] --> [/api/v1/patient/me] --------> [User & PatientProfile Models]
   |                          |
   +--> [SOS Button] ---------> [/api/v1/sos/sos] ----------> [backend/routes/v1/sos.js]
                                                                 |
                                                                 v
                                                      [Socket.IO: crew:all Room]
                                                                 |
[app/CrewAmbulance_dashboard.html] <------------------------------+
   |
   +--> [QR Scanner / Input] -> [/api/v1/patient/profile/:id] -> [backend/routes/v1/patientProfile.js]
```

## 📦 Service & Utility Mapping
- `backend/server.js` imports:
  - `backend/utils/frontendUrl.js`
  - `backend/services/securityLogger.js`
  - `backend/services/emailService.js`
  - `backend/middleware/auth.js`
  - `backend/routes/v1/*`
