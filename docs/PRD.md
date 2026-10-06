# 📄 Product Requirements Document (PRD) — LifeQR

**Product Name:** LifeQR — Critical Emergency Medical Information & Response System  
**Document Version:** 2.0 (Production Release)  
**Status:** Active / Production  
**Target Ecosystem:** Web Application, PWA (Progressive Web App), Android Wrapper, Emergency QR Badges  

---

## 1. Executive Summary & Mission

In medical emergencies, every single second counts. When trauma victims, unconscious individuals, or disoriented patients arrive at an incident scene, emergency responders (paramedics, EMTs, bystanders, and trauma surgeons) frequently lack immediate access to the patient's critical health history—such as blood type, fatal drug allergies, chronic conditions, active prescriptions, and next-of-kin emergency contacts.

**LifeQR** bridges this critical information gap. It is an emergency medical infrastructure platform that enables:
1. **Citizens / Patients** to create a secure, dynamic medical profile and generate physical/digital QR code badges (wallet cards, stickers, wristbands, lockscreen wallpapers).
2. **First Responders & Bystanders** to scan the QR code badge using any smartphone camera or onboard terminal for **zero-login, instantaneous triage data** (Blood Group, Allergies, Medications, ICE Contacts with 1-click calling).
3. **Emergency Victims** to trigger a **1-click GPS SOS Beacon** that broadcasts immediate real-time audible and visual alarms to on-duty ambulance dispatchers over Socket.IO.
4. **Paramedic Crews & Hospital ERs** to stream live in-transit telemetry, triage stages, and trauma bay handovers with AI-assisted clinical documentation and differential diagnosis.

---

## 2. Problem Statement & Market Need

| Problem | Traditional Reality | LifeQR Solution |
| :--- | :--- | :--- |
| **Communication Barriers** | Patient is unconscious, in shock, non-verbal, or pediatric. | Instant QR badge scan loads verified medical matrix in < 500ms without patient input. |
| **Fatal Drug Incompatibilities** | Paramedics administer contraindicated drugs (e.g., penicillin to allergic patient). | High-visibility Red Banner highlights severe anaphylactic allergies and active drug interactions. |
| **Delayed Next-of-Kin (ICE) Notification** | Police/EMTs take hours searching locked phones or wallets for family contacts. | One-touch direct dialing to verified emergency contacts (ICE) directly from the triage HUD. |
| **Slow Ambulance Coordination** | Victims struggle to articulate exact addresses or landmarks while panicked. | 1-Click SOS captures high-precision GPS coordinates, reverse-geocodes, and alerts the closest unit. |
| **Disjointed Handover to Trauma Bay** | Paramedic radio reports are verbal, prone to error, and require manual re-typing at triage. | Digital ER Handover streaming vitals, suspected trauma type, and countdown ETA to the hospital bay. |

---

## 3. Target User Personas & Workflows

### Persona A: The Patient (Rahul Sharma, 28, Asthma & Penicillin Allergy)
- **Needs:** Fast setup, printable high-contrast QR badge for his wallet and bike helmet, guaranteed privacy controls, and a panic SOS button on his phone.
- **Workflow:** Signs up $\rightarrow$ Enters medical details & emergency contacts $\rightarrow$ Downloads PDF/PNG ID Card $\rightarrow$ In emergency, triggers SOS or wears badge.

### Persona B: The Ambulance Paramedic (Crew Unit 402, Bangalore Rapid EMS)
- **Needs:** Rugged, ultra-fast QR scanner running in browser, instant visual alerts on dispatch, turn-by-turn navigation link to victim GPS, and one-tap incident stage logging.
- **Workflow:** Terminal monitors `crew:all` room $\rightarrow$ Audible siren triggers on SOS $\rightarrow$ Views map radar $\rightarrow$ Acknowledges dispatch $\rightarrow$ Scans victim QR on scene $\rightarrow$ Transmits vitals to receiving hospital.

### Persona C: The Emergency Physician / Trauma Surgeon (Dr. Amit Sharma, Apex Hospital)
- **Needs:** Complete medical history, past surgical reports, verified prescriptions, AI Clinical summary of complex conditions, and digital scribe for SOAP documentation.
- **Workflow:** Receives incoming ER Handover notice $\rightarrow$ Reviews patient history while patient is in transit $\rightarrow$ Conducts intake and confirms drug safety using AI Rx validator.

### Persona D: Hospital & Clinic Administrator
- **Needs:** Overview of trauma bays, ICU beds, general ward occupancy, on-duty specialist rosters, and emergency blood bank units.
- **Workflow:** Accesses Command Hub $\rightarrow$ Allocates incoming patient to Bay 02 $\rightarrow$ Reserves 2 units of O+ blood $\rightarrow$ Verifies attending physician credentials.

### Persona E: System Compliance Administrator
- **Needs:** Strict audit trail of every patient profile access, credential verification for doctors/crews, and role governance.

---

## 4. Key Functional Requirements (FRs)

### FR-01: Zero-Login Emergency QR Access & ICE Hotlines
- **Description:** Anyone scanning a patient's QR code must see critical emergency data immediately without entering passwords, creating accounts, or installing apps.
- **Data Displayed:** Full Name, Blood Group (large badge), Severe Allergies (red warning badges), Current Medications, Chronic Conditions, Organ Donor status, Emergency Contacts (clickable `tel:` links).
- **Security & Privacy:** Sensitive history (e.g., full clinical psychiatric notes, uploaded PDF lab reports) is hidden unless accessed by a verified doctor/crew credential.
- **Dynamic Resolution:** Scanned QR can resolve raw `qrCodeId` (e.g., `RAH-D3200470`), SHA-256 encrypted emergency tokens, or direct URLs via the unified `patientResolver`.

### FR-02: Real-time SOS Dispatch & GPS Telemetry
- **Description:** A patient can activate a high-priority SOS emergency alert from their dashboard or mobile web app.
- **Payload:** High-precision latitude/longitude coordinates, accuracy radius, timestamp, patient blood group, and emergency contacts.
- **Socket Pipeline:** Emits `sos-alert` to `crew:all` socket room. Triggers visual pulsing banner and siren audio on all active ambulance crew dashboards.
- **Mapping:** Renders interactive Leaflet radar map with victim marker, responder location, and direct hyperlink to Google Maps GPS turn-by-turn navigation.
- **Lifecycle Stages:** `triggered` $\rightarrow$ `acknowledged` $\rightarrow$ `en_route` $\rightarrow$ `on_scene` $\rightarrow$ `transporting` $\rightarrow$ `hospital_arrived` $\rightarrow$ `resolved`.

### FR-03: Paramedic-to-ER Handover Protocol
- **Description:** While en route, paramedics can initialize an ER Handover dossier linking the active SOS incident or patient QR ID to a target hospital emergency department.
- **Telemetry:** GCS (Glasgow Coma Scale), SpO2, Pulse, Blood Pressure, Estimated Arrival Time (ETA countdown), and primary clinical impression.
- **Receiving Interface:** Live ER Trauma Bay dashboard (`er_dashboard.html`) updates automatically via WebSocket without page refreshes.

### FR-04: AI Clinical Copilot & Decision Support
- **Description:** AI assistant built into the Doctor Dashboard to accelerate decision-making during critical golden-hour trauma care.
- **Capabilities:**
  - *Automated Clinical Summary:* Distills complex multi-year medical histories into a 3-bullet emergency brief.
  - *Medical Scribe:* Converts doctor voice dictation or shorthand notes into structured SOAP (Subjective, Objective, Assessment, Plan) records.
  - *Differential Diagnosis (Dx):* Recommends evidence-based diagnostic paths based on presented symptoms and vitals.
  - *Rx Safety Validator:* Flags contraindicated medications against recorded patient allergies and existing prescriptions.

### FR-05: Multi-Role Portals & Dashboard Ecosystem
- Dedicated optimized interfaces for:
  - **Patient App / Mobile MVP (`patient_app.html`):** Native mobile feel with splash, onboarding, OTP verification, QR card wallet, and offline badge view.
  - **Patient Desktop Portal (`patient_dashboard.html`):** Comprehensive record management, PDF ID card export, report uploads, activity timeline.
  - **Ambulance Crew HUD (`CrewAmbulance_dashboard.html`):** High-contrast dark terminal with camera scanner, radar map, and audio alerts.
  - **Doctor Workstation (`doctor_dashboard.html`):** Quick patient search, medical history inspection, consultation manager, AI copilot.
  - **ER Reception Stream (`er_dashboard.html`):** Wallboard view for incoming ambulances and bay assignments.
  - **Hospital Operations Hub (`hospital_dashboard.html`):** Bed management, blood inventory, staff roster.
  - **Admin & Compliance Panel (`admin_dashboard.html`):** Document verification approvals and security audit logs.

### FR-06: Official Professional Verification Pipeline
- **Description:** Healthcare providers (Doctors and Paramedics) must upload official government/hospital accreditation documents (`.pdf`, `.jpg`, `.png`).
- **Review:** System administrators review credentials in `admin_dashboard.html` and approve/reject before granting elevated clinical access.
- **Policy:** Zero auto-verification bypasses; strictly auditable credentialing.

---

## 5. Non-Functional Requirements (NFRs)

### NFR-01: Performance & Latency
- Emergency QR scan page must load in **under 500ms** on 3G/4G networks.
- Socket.IO SOS event delivery to crew terminals must occur in **under 150ms**.
- Lightweight static assets with local font fallbacks to prevent network layout shifts.

### NFR-02: Security, Privacy & Compliance
- **Zero Raw Password Exposure:** Passwords must be hashed with `bcryptjs` (salt rounds: 10). The `plainPassword` field is strictly prohibited from being exposed in any API response.
- **Token Delivery:** JWT authentication tokens stored in secure, `httpOnly`, `sameSite` cookies with fallback to `Authorization: Bearer` headers for mobile/PWA.
- **Audit Logging:** Every scan, record read, and profile modification is permanently recorded in the `AuditLog` collection with actor IP, user agent, and timestamp.
- **CSP & Security Headers:** Helmet security middleware configured to prevent XSS, clickjacking, and mime-sniffing while supporting local LAN development IPs.

### NFR-03: Reliability & Fallbacks
- **SRV DNS Resilience:** Node.js DNS resolver bootstrapped with Google (`8.8.8.8`) and Cloudflare (`1.1.1.1`) to prevent Atlas lookup failures on local routers.
- **Email Resilience:** `emailService.js` includes a safe mock logger fallback if external SMTP or Nodemailer credentials are not configured.
- **Data Model Resilience:** Frontend controllers implement recursive fallbacks (`activePatient.name || activePatient.user?.name`) to eliminate runtime crashes on varying endpoint payloads.

### NFR-04: Usability & Ergonomics
- High-contrast **Swiss Brutalist / Editorial design** ensures visibility in direct sunlight on ambulance mounting docks.
- **Universal Device Appearance:** Automatically synchronizes with OS dark/light mode preference with zero-FOUC (Flash of Unstyled Content).
- Fully responsive across 360px mobile viewports through 4K ER wallboards.

---

## 6. Release Milestones & Phase Scope

- **Phase 1 (Completed):** Core Patient Management, Dynamic QR generation, Zero-Login Emergency Access View.
- **Phase 2 (Completed):** Socket.IO Real-time SOS Dispatch, Ambulance Crew HUD, Leaflet Radar Mapping.
- **Phase 3 (Completed):** Doctor Clinical Dashboard, AI Copilot Engine, ER Handover Stream, Admin Document Verification.
- **Phase 4 (Completed):** Hospital Operations Hub, Bed Matrix, Blood Bank Registry, Unified Patient Resolver.
- **Phase 5 (Active):** Offline-first PWA caching via Service Worker, Multi-channel push alerts (OneSignal & Telegram Bot), native packaging.
