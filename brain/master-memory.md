# Master Memory — LifeQR Project Intelligence

> **Target Size**: Under 5,000 words  
> **Audience**: AI Agents (Read this file FIRST before starting any task)

---

## 📌 Project Overview
**LifeQR** is an emergency medical web application designed for **Patients** and **Ambulance Crews / Emergency Responders**. Patients store encrypted health profiles (blood group, severe allergies, active medications, emergency contacts) and generate printable QR code badges. In an emergency, scanning the QR badge gives instant access to critical health data without requiring login. Patients can also trigger 1-click SOS beacons with live GPS coordinates, broadcasting real-time dispatch alerts to ambulance crews.

---

## 🏗️ Core Architecture at a Glance

- **Website Directory (`website/`)**: Public-facing marketing website, feature showcase, 404 page, and static brand assets.
- **Application Directory (`app/`)**: Web application portals:
  - `patient_app.html` & `js/patient-app.js` & `css/patient-app.css` (Phase 1 Patient Mobile MVP: Splash, Login, Signup, OTP, Profile Setup, Home with 5 Sub-Views)
  - `patient_dashboard.html` & `js/patient-dashboard.js`
  - `CrewAmbulance_dashboard.html` & `js/crew-dashboard.js`
  - `doctor_dashboard.html` & `js/doctor-dashboard.js`
  - `admin_dashboard.html` & `js/admin-dashboard.js`
  - `emergency_access.html` & `js/emergency-access.js` (Zero-login emergency QR page)
- **Backend API (`backend/`)**: Node.js + Express API (`/api/v1/...`), MongoDB Mongoose schemas (`User`, `UserSecurity`, `PatientProfile`, `EmergencyContact`, `QRProfile`, `MedicalRecord`, `Doctor`, `AmbulanceCrew`, `Hospital`, `Consultation`, `Prescription`, `SOS`, `ERHandover`, `AuditLog`), Socket.IO real-time event server, Helmet security headers, rate limiters, JWT cookie auth. Note: `UserSecurity` synchronizes with `users` during registration/resets to store credentials in the `'user securities'` collection.
- **Notification Services**: Integrated OneSignal for multi-platform push notifications and Telegram Bot support for professional crew dispatch.
- **AI Clinical Engine**: Integrated logic for AI Patient Summaries, Medical Scribe (Auto-note), Differential Diagnosis, and Rx Safety validation.

---

## 🔑 Verified Account Notes

- **Patient Account**:
  - **Email**: `patient@lifeqr.com` | **Password**: `Password@123`
  - **Name**: Rahul Sharma (`+91 9876543210`)
  - **QR Code ID**: `RAH-D3200470`
  - **Blood Group**: `O+` | **Allergies**: Penicillin, Peanuts (Severe Anaphylaxis)
  - **Medications**: Albuterol Inhaler (PRN), Cetirizine 10mg
  - **Emergency Contacts**: Priya Sharma (`+91 9876543211`, Spouse), Dr. Amit Sharma (`+91 9876543212`, Brother)
- **Ambulance Crew Account**:
  - Use a verified crew account for live dispatch workflows.
  - Unit and station details should be populated from the registered profile.

---

## 🔒 Security & Verification Protocol

1. **Official Professional Verification**: Doctor and Ambulance Crew verification relies strictly on uploading official credential documents (`/api/v1/verification/upload-document`) and Admin review/approval via [admin_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/admin_dashboard.html). All demo auto-verify bypasses have been removed.
2. **Website vs App Separation & Auto-Sync**: Public landing site lives in `website/`; app portals live in `app/`. The project runs `scripts/sync-frontend.js` on server boot and build steps to perform automatic two-way synchronization of all common stylesheets (`styles.css`, `src/input.css`, `dist/output.css`), images (`LifeQR.png`, `lifeqr_transparent.png`), scripts (`api-utils.js`), and shared HTML pages (`lifeqr_login.html`, `lifeqr_signup.html`, `404.html`) between `website/` and `app/`.
3. **Socket.IO Real-Time Dispatch**: Emergency SOS beacons emit `sos-alert` to `crew:all` room, while in-transit telemetry streams to `hospital:er` room for ER triage monitoring.
4. **Public DNS Resolution**: `backend/server.js` invokes `dns.setServers(['8.8.8.8', '1.1.1.1'])` to resolve MongoDB Atlas SRV URIs reliably across environments.

---

## ⚠️ Known Pitfalls & Fixes

- **Dotenv Path**: Always specify `{ path: path.join(__dirname, '.env') }` when requiring `dotenv` in `backend/` scripts.
- **Mongoose Index Warnings**: `qrCodeId` has schema index `patientProfileSchema.index({ qrCodeId: 1 })`; avoid duplicate `index: true` inline declarations.
