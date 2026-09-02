# LifeQR — Master Test Credentials & Identity Directory

This document contains unified, verified system identifiers, QR codes, license credentials, and test accounts across all four primary LifeQR ecosystem roles: **Patient**, **Doctor**, **Ambulance Crew**, and **Clinic / Hospital ER**.

---

## 🗂️ Quick Role & Identifier Matrix

| Role | Entity / Name | Unique Identifier (ID) | Email / Username | Password | Default Portal URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Patient** | Rahul Sharma | `RAH-D3200470` | `patient@lifeqr.com` | `Password@123` | [`/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) |
| **Doctor** | Dr. Amit Sharma | `DOC-AMIT-8492` | `doctor@lifeqr.com` | `Password@123` | [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html) |
| **Ambulance Crew** | Officer Vikram Rao | `EMS-PARAMEDIC-7701` | `crew@lifeqr.com` | `Password@123` | [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html) |
| **Clinic / Hospital ER** | Central Trauma Center | `HOSP-CLINIC-9021` | `er@lifeqr.com` | `Password@123` | [`/hospital_dashboard.html`](http://localhost:5000/hospital_dashboard.html) / [`/er_dashboard.html`](http://localhost:5000/er_dashboard.html) |
| **System Admin** | Security Ops Lead | `ADMIN-ROOT-001` | `admin@lifeqr.com` | `Password@123` | [`/admin_dashboard.html`](http://localhost:5000/admin_dashboard.html) |

---

## 1. 🧑‍⚕️ Patient Identifier & Medical Profile

- **Unique Patient QR Code ID**: `RAH-D3200470`
- **Patient Vault ID**: `PAT-IN-2026-9481`
- **Zero-Login Emergency URL**: [`/emergency_access.html?id=RAH-D3200470`](http://localhost:5000/emergency_access.html?id=RAH-D3200470) or [`/e/RAH-D3200470`](http://localhost:5000/e/RAH-D3200470)
- **Account Email**: `patient@lifeqr.com`
- **Account Password**: `Password@123`
- **Full Legal Name**: Rahul Sharma
- **Age / Gender**: `32` | `Male`
- **Direct Phone**: `+91 9876543210`
- **Blood Group**: `O+ (O Positive)`
- **Severe Allergies (High-Risk)**: `Penicillin, Peanuts (Severe Anaphylaxis)`
- **Active Medications**: `Albuterol Inhaler (PRN), Cetirizine 10mg`
- **Chronic Conditions**: `Mild Bronchial Asthma`
- **Registered Emergency Contacts (ICE)**:
  1. **Priya Sharma** (Spouse) — `+91 9876543211`
  2. **Dr. Amit Sharma** (Brother / Physician) — `+91 9876543212`

---

## 2. 🩺 Doctor (Physician) Identifier & Clinical License

- **Unique Doctor Portal ID**: `DOC-AMIT-8492`
- **Medical License Number**: `MCI-DEL-2018-84920`
- **Medical Registration Council**: `Delhi Medical Council (Medical Council of India - MCI)`
- **Registration Year**: `2018`
- **Account Email**: `doctor@lifeqr.com`
- **Account Password**: `Password@123`
- **Full Name**: Dr. Amit Sharma, MD
- **Clinical Specialization**: `Emergency Medicine & Trauma Critical Care`
- **Primary Hospital Affiliation**: `Metro City Central Trauma Center`
- **Verification Status**: `VERIFIED / ACTIVE`
- **Clearance Level**: `Level 3 Clinical Access (SOAP Notes, EHR Timeline, Rx Safety, Scribe)`
- **Clinical Workstation URL**: [`/doctor_dashboard.html`](http://localhost:5000/doctor_dashboard.html)

---

## 3. 🚑 Ambulance Crew (Paramedic) Identifier & Dispatch Unit

- **Unique Crew Responder ID**: `EMS-PARAMEDIC-7701`
- **Vehicle Registration Number**: `KA-01-EQ-9110`
- **Ambulance Unit Identifier**: `Echo-9 (Unit Alpha-12)`
- **Account Email**: `crew@lifeqr.com`
- **Account Password**: `Password@123`
- **Crew Commander / Lead**: Officer Vikram Rao (EMT-P Paramedic)
- **Crew Classification**: `paramedic` / `ambulance` (`Advanced Life Support - ALS`)
- **Base Station**: `Station 12 — Central Trauma Sub-station`
- **EMS Organization**: `Metro City Emergency Medical Services (EMS)`
- **Radio Telemetry Call Sign**: `MEDIC-ALPHA-12`
- **Verification Status**: `VERIFIED / APPROVED`
- **Tactical Dispatch HUD URL**: [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html)

---

## 4. 🏥 Clinic / Hospital ER Trauma Center Identifier & Bay Matrix

- **Hospital / Clinic Registration ID**: `HOSP-CLINIC-9021`
- **ER Station Desk ID**: `DESK-CENTRAL-ER-01`
- **Facility Name**: `Metro City Central Emergency & Level 1 Trauma Center`
- **Account Email**: `er@lifeqr.com`
- **Account Password**: `Password@123`
- **24/7 Emergency Dispatch Hotline**: `+91 1800-555-9110` / `112`
- **Physical Address**: `104 Emergency Expressway, Central Health District, Metro City, 560001`
- **Geographical Coordinates**: `12.9716° N, 77.5946° E`
- **ER Bay Capacity & Resuscitation Matrix**:
  - **Total Emergency Beds**: `30`
  - **Trauma Bays Available**: `4 Bays`
    - **Bay 1**: `Resuscitation Alpha (Adult Critical Care) — [READY]`
    - **Bay 2**: `Trauma Surgical Bay (Surgical Triage) — [READY]`
    - **Bay 3**: `Cardiac Care (Cath Lab Standby) — [RESERVED]`
    - **Bay 4**: `Fast Track (Rapid Stabilization) — [READY]`
  - **ICU Beds Available**: `8 Beds`
  - **Facility Triage Status**: `accepting_all`
- **Hospital & Clinic Command URL**: [`/hospital_dashboard.html`](http://localhost:5000/hospital_dashboard.html) (or [`/clinic_dashboard.html`](http://localhost:5000/clinic_dashboard.html))
- **Hospital ER Trauma Bay Dispatcher URL**: [`/er_dashboard.html`](http://localhost:5000/er_dashboard.html)

---

## 🧪 Testing & Simulation Flows

### 1. Zero-Login Scan Test
1. Open [`http://localhost:5000/emergency_access.html?id=RAH-D3200470`](http://localhost:5000/emergency_access.html?id=RAH-D3200470) in any browser.
2. Verify patient name, **O+** blood group callout, high-risk allergies, medications, and 1-tap call triggers.

### 2. Live SOS Dispatch Simulation
1. Log into [`/patient_dashboard.html`](http://localhost:5000/patient_dashboard.html) using `patient@lifeqr.com` / `Password@123`.
2. Click **"Broadcast 1-Tap SOS"**.
3. In a separate tab/window, open [`/CrewAmbulance_dashboard.html`](http://localhost:5000/CrewAmbulance_dashboard.html) logged in as `crew@lifeqr.com`.
4. Observe the real-time Socket.IO modal alert pop up with patient vitals and GPS coordinates.

### 3. Paramedic to Hospital ER Live Stream Test
1. On the Ambulance Crew dashboard, click **"Stream Vitals to ER Desk"**.
2. Enter ETA (e.g. `8 mins`), Pulse (`95 bpm`), BP (`120/80`), and SpO2 (`99%`).
3. Open [`/er_dashboard.html`](http://localhost:5000/er_dashboard.html) to observe incoming live telemetry updates on the trauma reception matrix.
