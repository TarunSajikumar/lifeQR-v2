# LifeQR — Master Test Credentials & Identity Directory

This document contains unified, verified system identifiers, QR codes, medical licenses, dispatch units, and test accounts across all ecosystem user roles in **LifeQR**:
1. **Patient (Web Portal & Mobile MVP App)**
2. **Doctor / Physician (Clinical Workstation & AI Copilot)**
3. **Ambulance Crew / Paramedic (Tactical Dispatch HUD & Triage Scanner)**
4. **Clinic / Hospital ER Trauma Center (Trauma Reception & Bed Allocation)**
5. **System Administrator (Security Ops & Universal Profile Troubleshooter)**
6. **Smart Emergency NFC Card (Zero-Login Chip & Telemetry)**

---

## 🗂️ Quick Role & Master Identifier Matrix

| Role | Entity / Full Name | Unique Identifier (ID) | Email / Username | Password | Verification Status | Default Portal / Test URL |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient (Primary)** | Rahul Sharma | `RAH-D3200470` / `RAH-B9AC820E` | `patient@lifeqr.com` | `Password@123` | `VERIFIED` | [`/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) |
| **Patient (Mobile MVP)** | Rahul Sharma | `RAH-D3200470` | `patient@lifeqr.com` | `Password@123` | `VERIFIED` | [`/patient_app.html`](http://localhost:5000/patient_app.html) |
| **Patient (Secondary)** | Ananya Verma | `ANA-AAEE4B38` | `ananya.patient@lifeqr.com` | `Password@123` | `VERIFIED` | [`/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) |
| **Patient (International)** | Alex Mercer | `030b00b0` | `patient@lifeqr.org` | `Password@123` | `VERIFIED` | [`/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) |
| **Doctor (Primary Attending)** | Dr. Amit Sharma, MD | `DOC-AMIT-8492` | `doctor@lifeqr.com` | `Password@123` | `VERIFIED` | [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html) |
| **Doctor (Secondary)** | Dr. Jacob | `KMC-2026-10245` | `jacob@gmail.com` | `Password@123` | `VERIFIED` | [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html) |
| **Doctor (Pending Review)** | Dr. Test Specialist | `DOC-12345` | `testdoctor@example.com` | `Password@123` | `PENDING` | [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html) |
| **Ambulance Crew (Lead)** | Officer Vikram Rao (EMT-P) | `EMS-PARAMEDIC-7701` | `crew@lifeqr.com` | `Password@123` | `VERIFIED` | [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html) |
| **Ambulance Crew (Fleet)** | Captain John Miller | `MED-UNIT-108` | `crew@lifeqr.org` | `Password@123` | `VERIFIED` | [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html) |
| **Ambulance Crew (Pending)** | Test Crew Paramedic | `AMB-101` | `testcrew3@example.com` | `Password@123` | `PENDING` | [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html) |
| **Hospital ER Desk** | Metro City Trauma Reception | `HOSP-CLINIC-9021` | `er@lifeqr.com` | `Password@123` | `VERIFIED` | [`/er_dashboard.html`](http://localhost:5000/er_dashboard.html) / [`/hospital_dashboard.html`](http://localhost:5000/hospital_dashboard.html) |
| **System Administrator** | LifeQR Security Ops Lead | `ADMIN-ROOT-001` | `admin@lifeqr.com` | `Password@123` | `VERIFIED` | [`/admin_dashboard.html`](http://localhost:5000/admin_dashboard.html) |

---

## 1. 🧑‍⚕️ Patient Identifiers & Medical Profiles

### Primary Test Patient: Rahul Sharma
- **Unique Patient QR Code ID**: `RAH-D3200470` *(Active Alias: `RAH-B9AC820E`)*
- **Patient Vault ID**: `PAT-IN-2026-9481`
- **Zero-Login Emergency URLs**:
  - Direct QR ID: [`http://localhost:5000/emergency_access.html?id=RAH-D3200470`](http://localhost:5000/emergency_access.html?id=RAH-D3200470)
  - Short URL Route: [`http://localhost:5000/e/RAH-D3200470`](http://localhost:5000/e/RAH-D3200470)
- **Account Email**: `patient@lifeqr.com`
- **Account Password**: `Password@123`
- **Full Legal Name**: Rahul Sharma
- **Age / Gender**: `32` | `Male`
- **Direct Phone**: `+91 9876543210`
- **Residential Address**: `42 Marine Drive, Nariman Point, Mumbai, MH 400021`
- **Blood Group**: `O+ (O Positive)` *(Supports `B+` in profile update tests)*
- **Severe Allergies (High-Risk)**: `Penicillin, Peanuts (Severe Anaphylaxis), Late-onset Shellfish`
- **Active Medications**: `Albuterol Inhaler (PRN), Cetirizine 10mg`
- **Chronic Conditions**: `Mild Bronchial Asthma`
- **Registered Emergency Contacts (ICE)**:
  1. **Priya Sharma** (Spouse) — `+91 9876543211` / `9876500001` (Primary)
  2. **Dr. Amit Sharma** (Brother / Physician) — `+91 9876543212`
  3. **Dr. R. K. Verma** (Family Physician) — `9876500002`
- **Portal Endpoints**:
  - Web Dashboard: [`/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html)
  - Mobile App View: [`/patient_app.html`](http://localhost:5000/patient_app.html)

---

### Secondary Test Patient: Ananya Verma
- **Unique Patient QR Code ID**: `ANA-AAEE4B38`
- **Zero-Login Emergency URL**: [`http://localhost:5000/emergency_access.html?id=ANA-AAEE4B38`](http://localhost:5000/emergency_access.html?id=ANA-AAEE4B38)
- **Account Email**: `ananya.patient@lifeqr.com`
- **Account Password**: `Password@123`
- **Full Legal Name**: Ananya Verma
- **Age / Gender**: `28` | `Female`
- **Direct Phone**: `+91 9820112230`
- **Blood Group**: `B+ (B Positive)`
- **Severe Allergies**: `Latex, Aspirin (Angioedema Risk)`
- **Active Medications**: `Levothyroxine 50mcg, Loratadine 10mg`
- **Chronic Conditions**: `Hypothyroidism`
- **Registered Emergency Contacts (ICE)**:
  1. **Karan Verma** (Brother) — `+91 9820112234` (Primary)
  2. **Sunita Verma** (Mother) — `+91 9820112235`

---

### International Test Patient: Alex Mercer
- **Unique Patient QR Code ID**: `030b00b0`
- **Zero-Login Emergency URL**: [`http://localhost:5000/emergency_access.html?id=030b00b0`](http://localhost:5000/emergency_access.html?id=030b00b0)
- **Account Email**: `patient@lifeqr.org`
- **Account Password**: `Password@123`
- **Full Legal Name**: Alex Mercer
- **Age / Gender**: `35` | `Male`
- **Blood Group**: `O+`
- **Severe Allergies**: `Penicillin, Peanuts`
- **Emergency Contact**: `Sarah Mercer (Spouse) — +1-555-0188`

---

## 2. 🩺 Doctor (Physician) Identifiers & Clinical Licenses

### Primary Attending Physician: Dr. Amit Sharma, MD
- **Unique Doctor Portal ID**: `DOC-AMIT-8492`
- **Database User ID**: `6a97d4901a541656124ce35c`
- **Account Email**: `doctor@lifeqr.com`
- **Account Password**: `Password@123`
- **Full Name**: Dr. Amit Sharma, MD
- **Medical License Number**: `DOC-IN-2026-9081` *(National Registry: `MCI-DEL-2018-84920`)*
- **Medical Registration Council**: `Delhi Medical Council (Medical Council of India - MCI)`
- **Registration Year**: `2018`
- **Clinical Specialization**: `General Medicine / Emergency & Trauma Critical Care`
- **Primary Hospital Affiliation**: `City Emergency Care & Clinic Matrix / Metro City Central Trauma Center`
- **Years of Clinical Experience**: `8 Years`
- **Verification Status**: `VERIFIED`
- **Clearance Level**: `Level 3 Clinical Access`
  - Integrated AI Medical Scribe (ambient audio dictation to clinical SOAP)
  - Differential Diagnosis Copilot (with 1-click apply to consultation)
  - Rx Safety Contraindication Sentinel (checks against lethal drug allergies)
  - Full Patient Health Timeline & Prescription Generator
- **Clinical Workstation URL**: [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html)

---

### Secondary Verified Physician: Dr. Jacob
- **Account Email**: `jacob@gmail.com`
- **Account Password**: `Password@123`
- **Full Name**: Dr. Jacob Thomas, MBBS
- **Medical License Number**: `KMC-2026-10245`
- **Medical Council**: `Karnataka Medical Council (KMC)`
- **Clinical Specialization**: `General Physician / Internal Medicine`
- **Affiliated Hospital**: `Aster Medcity, Kochi`
- **Verification Status**: `VERIFIED`
- **Clinical Workstation URL**: [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html)

---

### Pending Verification Doctor (Credential Sentinel Test Account)
- **Account Email**: `testdoctor@example.com` *(Alternative: `test_doc@lifeqr.com`)*
- **Account Password**: `Password@123`
- **Full Name**: Dr. Test Specialist
- **Medical License Number**: `DOC-12345` / `LIC-12345`
- **Clinical Specialization**: `Cardiology`
- **Affiliated Hospital**: `Central Hospital`
- **Verification Status**: `PENDING` *(Requires Admin review or document upload at `/api/v1/verification/upload-document`)*
- **Use Case**: Testing doctor credential submission, document preview modal, and Admin approval/rejection workflows in `admin_dashboard.html`.

---

## 3. 🚑 Ambulance Crew (Paramedic) Identifiers & Dispatch Units

### Primary Paramedic Crew Lead: Officer Vikram Rao
- **Unique Crew Responder ID**: `EMS-PARAMEDIC-7701`
- **Database User ID**: `6a99ab1789e3cf7014491bb3`
- **Account Email**: `crew@lifeqr.com`
- **Account Password**: `Password@123`
- **Commander / Lead Name**: Officer Vikram Rao (EMT-P Paramedic)
- **Vehicle Registration Number**: `KA-01-EQ-9110`
- **Ambulance Unit Identifier**: `Echo-9 (Unit Alpha-12)`
- **Radio Telemetry Call Sign**: `MEDIC-ALPHA-12`
- **Base Station**: `Station 12 — Central Trauma Sub-station`
- **EMS Organization**: `Metro City Emergency Medical Services (EMS)`
- **Direct Dispatch Mobile**: `+91 9876543213`
- **Crew Classification**: `paramedic` / `ambulance` (`Advanced Life Support - ALS`)
- **Verification Status**: `VERIFIED / APPROVED`
- **Tactical Capabilities**:
  - Instant SOS Receiver: Real-time Socket.IO popup alerts with patient GPS pin
  - Zero-Latency Camera Scanner: Scans physical QR badge to render emergency triage HUD
  - Live ER Handover Telemetry: Streams ETA, SpO2, Heart Rate, BP, and trauma level directly to hospital ER bays
- **Tactical Dispatch HUD URL**: [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html)

---

### Secondary Fleet Unit: Captain John Miller
- **Account Email**: `crew@lifeqr.org`
- **Account Password**: `Password@123`
- **Lead Name**: Captain John Miller (Flight Paramedic)
- **Vehicle Registration Number**: `MED-UNIT-108`
- **Base Station**: `Springfield Central Trauma Hub`
- **EMS Organization**: `Metro Emergency Medical Services`
- **Classification**: `Critical Care Transport (CCT)`
- **Verification Status**: `VERIFIED`
- **Tactical Dispatch HUD URL**: [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html)

---

### Pending Verification Crew (Onboarding Simulation Account)
- **Account Email**: `testcrew3@example.com` *(Alternative: `testcrew@example.com`)*
- **Account Password**: `Password@123`
- **Name**: Test Crew Paramedic
- **Vehicle Number**: `AMB-101`
- **Base Station**: `Central Station`
- **Verification Status**: `PENDING`
- **Use Case**: Testing crew verification gate (`requireVerified` middleware) and Admin credential clearance.

---

## 4. 🏥 Clinic / Hospital ER Trauma Center Identifier & Bay Matrix

### Primary Facility: Metro City Central Emergency & Level 1 Trauma Center
- **Hospital / Clinic Registration ID**: `HOSP-CLINIC-9021`
- **ER Station Desk ID**: `DESK-CENTRAL-ER-01`
- **ER Reception Account Email**: `er@lifeqr.com`
- **Account Password**: `Password@123`
- **Facility Legal Name**: `Metro City Central Emergency & Level 1 Trauma Center`
- **Affiliated Organization**: `Apollo LifeQR Emergency Center Matrix`
- **24/7 Trauma Dispatch Hotline**: `+91 1800-555-9110` / `112`
- **Physical Address**: `104 Emergency Expressway, Central Health District, Metro City, 560001`
- **Geographical Coordinates**: `12.9716° N, 77.5946° E`
- **Administrative & Clinical Leadership**:
  - **Medical Superintendent**: `Dr. K. Radhakrishnan, MS, MCh (Trauma Surgery)`
  - **Chief Medical Officer (CMO)**: `Dr. Amit Sharma, MD` (`DOC-AMIT-8492` / `doctor@lifeqr.com`)
  - **Chief Nursing Officer (CNO)**: `Sister Mary Varghese, RN, CEN`
  - **Blood Bank Director**: `Dr. Sanjay Sen, MD (Pathology / Transfusion Medicine)`
- **Trauma Bay Capacity & Resuscitation Matrix**:
  - **Total Emergency Beds**: `30 Beds`
  - **Active Trauma Resuscitation Bays**: `4 Bays`
    - **Bay 1**: `Resuscitation Alpha (Adult Critical Care / Defibrillation) — [READY]`
    - **Bay 2**: `Trauma Surgical Bay (Damage Control Surgery) — [READY]`
    - **Bay 3**: `Cardiac Care (Cath Lab Fast Track) — [RESERVED]`
    - **Bay 4**: `Rapid Stabilization & Pediatric Triage — [READY]`
  - **Intensive Care Unit (ICU) Capacity**: `8 Beds Available`
  - **General Medical Inpatient Ward**: `18 Beds Available`
  - **Facility Intake Status**: `accepting_all`
- **Blood Bank & Emergency Transfusion Reserves**:
  - `O- Negative (Universal Donor)`: `14 Units [READY]`
  - `O+ Positive`: `28 Units`
  - `A+ Positive`: `22 Units`
  - `B+ Positive`: `18 Units`
  - `AB+ Positive`: `12 Units`
  - `Fresh Frozen Plasma (FFP)`: `24 Units`
  - `Cryoprecipitate`: `16 Vials`
- **Portal Endpoints**:
  - Hospital ER Live Trauma Telemetry HUD: [`/er_dashboard.html`](http://localhost:5000/er_dashboard.html)
  - Hospital Operations & Ward Bed Management Hub: [`/hospital_dashboard.html`](http://localhost:5000/hospital_dashboard.html)
  - Clinic Management Portal: [`/clinic_dashboard.html`](http://localhost:5000/clinic_dashboard.html)

---

### Secondary Facility: Apollo LifeQR Emergency Critical Care Hub
- **Hospital Registration ID**: `APOLLO-EMERG-5502`
- **Hotline Phone**: `+91 1800-425-2345`
- **Physical Location**: `Bannerghatta Road, Health City, Bangalore South, 560076`
- **Trauma Bays**: `3 Bays (1 Dedicated Pediatric Trauma)`
- **ICU Beds**: `6 Beds`
- **Verification Status**: `VERIFIED`

---

### Municipal Facility: Central Municipal Trauma & Surgical Wing
- **Hospital Registration ID**: `MUN-TRAUMA-1104`
- **Hotline Phone**: `108` / `+91 11-2323-0108`
- **Physical Location**: `Old City Ring Road, Sector 4, 110002`
- **Trauma Bays**: `2 Bays`
- **General Inpatient Beds**: `40 Beds`
- **Verification Status**: `VERIFIED`

---

## 5. 🛡️ System Administrator & Security Operations Lead

### Master Security Administrator: Security Ops Lead
- **Unique Admin Identifier**: `ADMIN-ROOT-001`
- **Database User ID**: `6ac1410f97ac792fbd7bd321`
- **Account Email**: `admin@lifeqr.com`
- **Account Password**: `Password@123`
- **Full Legal Name**: LifeQR Security Ops Lead
- **Role Code**: `admin`
- **Clearance Level**: `Level 5 Root System Authority`
- **Verification Status**: `VERIFIED`
- **Core Administrative Powers & Controls**:
  1. **Universal User Directory & Troubleshooting Hub**:
     - Inspect and filter all system users across `patient`, `doctor`, `crew`, and `admin` roles.
     - Launch `#adminUserProfileModal` to live-edit clinical parameters, doctor licenses, and ambulance vehicle numbers.
     - Direct password override with real-time `UserSecurity` synchronization.
  2. **Emergency QR Code Regeneration**:
     - One-click cryptographic regeneration of emergency QR codes and security token re-hashing (`POST /api/v1/admin/users/:id/regenerate-qr`).
  3. **AI Credential Sentinel & Document Verification**:
     - Review submitted medical council licenses and paramedic registration certificates.
     - Approve, suspend, or revoke practitioner verification statuses with audit log trails.
  4. **Help & Support Ticket Clearinghouse**:
     - Real-time Socket.IO incoming ticket monitoring (`admin:all` room).
     - Filter tickets by category (`DAMAGED_QR`, `MEDICAL_RECORD`, `SOS_ISSUE`, `GENERAL`).
     - 1-click ticket resolution linked directly to user profile updates.
  5. **Security Audit Log Observer**:
     - Live stream of all authentication events, failed access attempts, and QR scan audits via `logEvent`.
- **Admin Command Workstation URL**: [`/admin_dashboard.html`](http://localhost:5000/admin_dashboard.html)

---

## 6. 📱 Mobile MVP Patient App Flow & OTP Bypass

The **Phase 1 Patient Mobile MVP Application** provides a mobile-first app shell for patients:
- **App Shell URL**: [`/patient_app.html`](http://localhost:5000/patient_app.html)
- **Primary Mobile Login**:
  - **Email**: `patient@lifeqr.com`
  - **Password**: `Password@123`
- **Signup & Phone Verification (OTP)**:
  - When registering a new test patient or requesting OTP verification, the backend generates a 6-digit verification code.
  - **Default Development Fallback OTP**: `123456`
  - The OTP code is also returned in JSON responses in development mode and logged to the Node.js server console.
- **Mobile Sub-Views**:
  1. **My LifeQR Badge**: High-contrast emergency QR badge with download and wallet options.
  2. **Medical Profile**: Vitals, blood group, allergies, medications, and chronic conditions.
  3. **Emergency Contacts**: ICE contact cards with direct 1-tap call links.
  4. **Medical Records**: Document uploads, discharge summaries, and lab reports.
  5. **App Settings**: Security pin, notifications, and offline emergency NFC sync.

---

## 7. 💳 Smart Emergency NFC Card System

LifeQR includes a dual-tier contactless emergency NFC card subsystem:
- **Interactive Simulator**: [`http://localhost:5000/nfc-card/demo-simulator.html`](http://localhost:5000/nfc-card/demo-simulator.html)
- **Supported Hardware & Chip Standards**:
  - **ISO/IEC 14443 Type A**, 13.56 MHz
  - **NXP NTAG216**: 888 bytes offline EEPROM for zero-network emergency telegrams
  - **NXP NTAG424 DNA**: Cryptographic AES-128 SUN CMAC for tamper-proof hospital authentication
- **Operating Modes**:
  1. **Public / Bystander Tap**: Scans without authentication, displaying high-risk allergies, blood type, and ICE telephone numbers.
  2. **Paramedic / Doctor Tap**: Authenticated through cryptographic token, unlocking complete EHR history and clinical notes.
  3. **Tap-to-SOS**: Physical card tap triggers immediate GPS beacon dispatch to nearby emergency responders.

---

## 🧪 Comprehensive End-to-End Testing Scenarios

### Scenario A: Zero-Login Emergency Scan & ICE Callout
1. Open [`http://localhost:5000/emergency_access.html?id=RAH-D3200470`](http://localhost:5000/emergency_access.html?id=RAH-D3200470) in any private/incognito window.
2. Confirm the page loads instantly without requiring login.
3. Verify that **Rahul Sharma**, blood group **O+**, high-risk **Penicillin & Peanut** allergies, and 1-tap dial buttons for **Priya Sharma** are prominently displayed.

### Scenario B: 1-Tap Patient SOS to Ambulance Crew Dispatch
1. Open Tab 1: [`http://localhost:5000/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html) and sign in as `crew@lifeqr.com` / `Password@123`.
2. Open Tab 2: [`http://localhost:5000/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) and sign in as `patient@lifeqr.com` / `Password@123`.
3. In Tab 2, click the **"Broadcast 1-Tap SOS"** button.
4. Switch to Tab 1: Observe the incoming real-time Socket.IO alert modal appear with live latitude/longitude, vitals preview, and 1-click **"Accept Dispatch & Navigate"** action.

### Scenario C: Paramedic Telemetry Streaming to Hospital ER Trauma Desk
1. On the Ambulance Crew dashboard ([`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html)), click **"Stream Vitals to ER Desk"**.
2. Enter ETA: `6 mins`, Heart Rate: `102 bpm`, BP: `118/76 mmHg`, SpO2: `98%`, Trauma Level: `Red (Priority 1)`.
3. Open [`http://localhost:5000/er_dashboard.html`](http://localhost:5000/er_dashboard.html) signed in as `er@lifeqr.com` / `Password@123`.
4. Observe the incoming live telemetry stream populate Trauma Bay 1 in real time.

### Scenario D: Doctor Clinical Copilot & Rx Safety Cross-Check
1. Open [`http://localhost:5000/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html) and log in with `doctor@lifeqr.com` / `Password@123`.
2. Search patient QR code `RAH-D3200470` to load Rahul Sharma's clinical record.
3. Test the **AI Medical Scribe**: Dictate or paste clinical observations to generate structured SOAP notes.
4. Test **Rx Safety Check**: Prescribe *Amoxicillin* (Penicillin derivative) — verify the copilot triggers an immediate lethal contraindication alert against the patient's Penicillin allergy.

### Scenario E: Admin User Troubleshooting & Ticket Resolution
1. Open [`http://localhost:5000/admin_dashboard.html`](http://localhost:5000/admin_dashboard.html) and sign in as `admin@lifeqr.com` / `Password@123`.
2. Navigate to **"User Management"** tab, locate Rahul Sharma, and click **"Edit Profile & Troubleshoot"**.
3. Verify the universal `#adminUserProfileModal` opens with full clinical history, ICE contacts, and password reset field.
4. Click **"Regenerate QR Code"** to verify dynamic cryptographic token rotation.
5. In **"Help & Support Tickets"**, inspect any pending ticket, apply a resolution note, and verify it updates the user record and marks the ticket resolved.

### Scenario F: Hospital Operations, Inpatient Admissions & Bed Matrix Allocation
1. Open [`http://localhost:5000/hospital_dashboard.html`](http://localhost:5000/hospital_dashboard.html) (or access via **"Hospital Hub"** button in [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html)).
2. Log in using `er@lifeqr.com` / `Password@123` (Metro City Central ER Reception) or `doctor@lifeqr.com` / `Password@123`.
3. In **"1. Patient Admissions"** panel, click **"+ New Intake"** / **"Admit Patient"**.
4. Enter Patient Name: `Rahul Sharma`, LifeQR ID: `RAH-D3200470`, select Ward: `Trauma Bay 1 (Resuscitation Alpha)`, Bed: `TB-01`, Urgency: `CRITICAL`.
5. Click **"Confirm & Admit Patient"**:
   - Verify the live KPI banner updates to show bed occupancy incremented and trauma bays adjusted.
   - Verify Socket.IO broadcasts `patient-admitted` event to hospital ER monitors.
6. Open [`http://localhost:5000/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) logged in as `patient@lifeqr.com` / `Password@123`:
   - Inspect the **"Doctor & Hospital History"** card.
   - Verify the hospital admission entry renders prominently with the red `HOSPITAL INPATIENT ADMISSION` badge, ward, bed, and attending physician details.
7. Return to [`http://localhost:5000/hospital_dashboard.html`](http://localhost:5000/hospital_dashboard.html) and click **"Discharge"** on the admission card:
   - Confirm bed capacity is freed up and the discharge event is logged in the patient's audit trail.

---

## 🔒 Security Best Practices for Test Accounts

> [!IMPORTANT]
> - All default test accounts use the standard test password: `Password@123`.
> - Do not deploy these test credentials to a public production environment without changing passwords and regenerating secrets.
> - Secrets and signing keys are managed in `backend/.env`.
> - Any administrative password reset synchronizes with the `UserSecurity` collection to prevent authentication desynchronization.
