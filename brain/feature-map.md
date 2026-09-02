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


