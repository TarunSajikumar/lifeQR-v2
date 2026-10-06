# Feature Map — Capability to Code File Mapping

## 🗺️ Feature Matrix

### 1. Patient Emergency Profile & QR Generation
- **Frontend Views**: [patient_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/patient_dashboard.html)
- **Frontend Logic**: [patient-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/patient-dashboard.js)
- **Backend Route**: [patientProfile.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/patientProfile.js)
- **Database Model**: `PatientProfile.js`, `User.js`

### 2. Real-time Emergency SOS Geolocation Broadcast
- **Trigger**: [patient-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/patient-dashboard.js) (`triggerSOS()`)
- **Backend Handler**: [sos.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/sos.js) (`/api/v1/sos/sos`)
- **Socket Dispatch**: `io.to('crew:all').emit('sos-alert', ...)`
- **Responder Receiver**: [crew-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/crew-dashboard.js) (`showSosAlertPopup()`)

### 3. Ambulance Crew Camera QR Scanner & Triage Lookup
- **Frontend View**: [CrewAmbulance_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/CrewAmbulance_dashboard.html)
- **QR Scanner**: [qr-scanner.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/qr-scanner.js) (`jsQR`)
- **Controller Logic**: [crew-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/crew-dashboard.js)
- **Backend Handler**: [patientProfile.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/patientProfile.js) (`GET /profile/:qrCodeId`)

### 4. Zero-Login Public Emergency Profile View
- **Frontend View**: [emergency_access.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/emergency_access.html)
- **Controller Logic**: [emergency-access.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/emergency-access.js)
- **Backend Route**: [emergencyCredentials.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/emergencyCredentials.js)

### 5. Hospital ER Reception Live Stream & Trauma Bay Dispatcher
- **Frontend View**: [er_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/er_dashboard.html)
- **Controller Logic**: [er-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/er-dashboard.js)
- **Paramedic Stream Integration**: [crew-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/crew-dashboard.js)
- **Backend Route**: [erHandover.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/erHandover.js)
- **Database Model**: [ERHandover.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/models/ERHandover.js)

### 6. AI Clinical Copilot & Decision Tree
- **Backend Routes**: `aiClinical.js`, `doctorDecisionTree.js`
- **Features**: Patient Summary, Medical Scribe, Differential Dx, Rx Safety, SOAP Generator.
- **Frontend Controller**: `doctor-dashboard.js`

### 7. Phase 1 Patient Mobile MVP Application
- **Frontend App Shell**: [patient_app.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/patient_app.html)
- **Mobile Controller**: [patient-app.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/patient-app.js)
- **App Design System**: [patient-app.css](file:///c:/Users/USER/Downloads/lifeqr-complete/app/css/patient-app.css)
- **Backend API Route**: [patientApp.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/patientApp.js) (`/api/v1/patient-app/...`)
- **Key Screens**: Splash $\rightarrow$ Login $\rightarrow$ Signup $\rightarrow$ OTP $\rightarrow$ Profile Setup $\rightarrow$ Home (My LifeQR, Medical Profile, Contacts, Records, Settings)
- **Database Models**: `User.js`, `PatientProfile.js`, `EmergencyContact.js`, `QRProfile.js`, `MedicalRecord.js`

### 8. Hospital & Clinic Operations Command Hub
- **Frontend View**: [hospital_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/hospital_dashboard.html) / [clinic_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/clinic_dashboard.html)
- **Controller Logic**: [hospital-dashboard.js](file:///c:/Users/USER/Downloads/lifeqr-complete/app/js/hospital-dashboard.js)
- **Backend Route**: [hospitals.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/hospitals.js) (`/api/v1/hospitals/...`)
- **Capabilities**: Inpatient Admissions Registry, Ward & Bed Allocation Matrix (Trauma Bays, ICU, General Wards), On-Duty Specialist Roster, Emergency Blood Bank & Supplies Vault, Fast Patient Intake via LifeQR auto-fill.
- **Database Models**: `Hospital.js`, `PatientProfile.js`, `Doctor.js`, `User.js`

### 9. Smart Emergency NFC Card System
- **Module Directory**: `nfc-card/`
- **Documentation**: [README.md](file:///c:/Users/USER/Downloads/lifeqr-complete/nfc-card/README.md), [IDEAS_AND_FEATURES.md](file:///c:/Users/USER/Downloads/lifeqr-complete/nfc-card/IDEAS_AND_FEATURES.md), [ARCHITECTURE.md](file:///c:/Users/USER/Downloads/lifeqr-complete/nfc-card/ARCHITECTURE.md)
- **Interactive Simulator**: [demo-simulator.html](file:///c:/Users/USER/Downloads/lifeqr-complete/nfc-card/demo-simulator.html)
- **Hardware & Chip Standards**: ISO/IEC 14443 Type A, 13.56 MHz, NXP NTAG216 (888B offline EEPROM), NTAG424 DNA (AES-128 SUN CMAC)
- **Database Models & Schemas**: `nfc-card/schemas/NfcCard.js`, `nfc-card/schemas/nfcCard.schema.json`
- **Features**: 0.5s zero-login tap, dual-tier privacy (bystander vs verified paramedic), offline NDEF emergency telegram, tap-to-dispatch geolocated SOS, Web NFC in-browser flashing.

### 10. Help & Support Ticket Clearinghouse
- **Frontend Views**: Dedicated Help Modals across [patient_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/patient_dashboard.html), [doctor_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/doctor_dashboard.html), [CrewAmbulance_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/CrewAmbulance_dashboard.html) and Admin Clearinghouse tab in [admin_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/admin_dashboard.html).
- **Frontend Logic**: `patient-dashboard.js`, `doctor-dashboard.js`, `crew-dashboard.js`, `admin-dashboard.js`
- **Backend Route**: [helpTickets.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/helpTickets.js) (`/api/v1/help-tickets`)
- **Database Model**: `backend/models/HelpTicket.js`
- **Features**: Category & priority tagging, auto-linked patient QR code context, live Socket.IO alerts to `admin:all` and user rooms, status filtering (`PENDING`, `IN_PROGRESS`, `RESOLVED`), and 1-click admin resolution.

### 11. Universal Admin User Profile Handling & Troubleshooting System
- **Frontend View**: `#adminUserProfileModal` in [admin_dashboard.html](file:///c:/Users/USER/Downloads/lifeqr-complete/app/admin_dashboard.html)
- **Frontend Logic**: `admin-dashboard.js` (`openAdminUserProfile()`, `renderRoleSpecificForm()`, `handleAdminProfileSave()`, `adminRegenerateUserQR()`)
- **Backend Routes**: [admin.js](file:///c:/Users/USER/Downloads/lifeqr-complete/backend/routes/v1/admin.js) (`GET /api/v1/admin/users`, `GET /api/v1/admin/users/:id/profile`, `PUT /api/v1/admin/users/:id/profile`, `POST /api/v1/admin/users/:id/regenerate-qr`)
- **Capabilities**: Universal management for Patients (blood group, age, allergies, chronic conditions, medications, emergency contacts, QR badge regeneration), Doctors (specialization, license, hospital, council, verification status), Ambulance Crew (vehicle number, crew type, station, organization), and Administrators; password reset override with `UserSecurity` synchronization; seamless ticket-to-profile troubleshooting with auto-resolution notes.



