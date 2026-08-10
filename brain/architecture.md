# Architecture — LifeQR Technical System Design

## 🏛️ High-Level Component Structure

```text
               +----------------------------------+
               |        Client Browser            |
               +----------------------------------+
                 /                              \
     (Website Landing Page)            (App Portals & Dashboard)
               /                                  \
   [website/index.html]                  [app/patient_dashboard.html]
                                         [app/CrewAmbulance_dashboard.html]
                                         [app/emergency_access.html]
               \                                  /
                v                                v
    +--------------------------------------------------------+
    |                    Express HTTP Server                 |
    |                   (backend/server.js)                  |
    +--------------------------------------------------------+
      |               |                 |                 |
(Auth v1 API)   (Patient v1)       (SOS v1 API)    (Socket.IO Real-time)
      |               |                 |                 |
      v               v                 v                 v
  [User Model]  [PatientProfile]  [EmergencyEvent]   [crew:all Room]
```

## 📁 Frontend Architecture (`website/` vs `app/`)
- **`website/`**: Contains pure HTML5/Tailwind marketing and presentation code. Serves as `/` on the web server.
- **`app/`**: Contains SPA/MPA application views, JavaScript controllers in `app/js/`, `qr-scanner.js` module, `api-utils.js` fetch wrappers, and styling.

## ⚙️ Backend Architecture (`backend/`)
- **`server.js`**: Express server setup, Helmet CSP configuration, Rate Limiting, Cookie Parsing, Socket.IO server initialization, static directory hosting (`/app` -> `../app`, `/` -> `../website`).
- **`routes/v1/`**:
  - `auth.js`: User login, signup, JWT token issuance in HTTP-only cookie.
  - `patientProfile.js`: Profile details, QR regeneration, photo uploads, live location updates.
  - `sos.js`: Emergency alert broadcast & acknowledgement over Socket.IO.
  - `emergencyCredentials.js` & `verification.js`: Emergency responder credential checks.
  - `aiClinical.js` & `doctorDecisionTree.js`: AI clinical triage & medical scribing logic.

## 💾 Database Schemas (MongoDB Mongoose)
1. **`User`**: Base user entity (`name`, `email`, `password`, `role`: `'patient'|'crew'|'doctor'|'admin'`, `verified`, `verificationStatus`).
2. **`PatientProfile`**: Linked to `User` via `userId`. Stores `age`, `bloodGroup`, `healthIssues`, `allergies`, `medications`, `emergencyContacts` array, `qrCodeId`, `sosAlerts` array, `reports` array, `activities` array.
3. **`CrewProfile`**: Linked to `User` via `userId`. Stores `vehicleNumber`, `crewType`, `station`, `organization`.
4. **`EmergencyCredential`**: Stores encrypted QR access tokens (`tokenHash`, `status`, `expiresAt`).
