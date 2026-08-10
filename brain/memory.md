# Memory — LifeQR Project Summary & Active State

## 📋 System Mission
Provide life-saving emergency medical data to first responders in under 15 seconds through QR code scanning and real-time SOS geolocation dispatch.

## 🌟 Core Capabilities
1. **Patient Management**:
   - Complete medical profile: Blood group, allergies, active medications, chronic conditions.
   - Priority emergency contacts with 1-click auto-dialing.
   - Dynamic QR Code medical badge & printable ID card generation.
   - Privacy settings (Public vs Private profile toggle).
   - Medical document vault (lab reports, ECGs, prescriptions).
   - Real-time access audit logs.

2. **Ambulance Crew / First Responder Portal**:
   - Dispatch clearance & verification status (`MED-UNIT-108`).
   - High-speed camera QR code scanner (`jsQR`) with manual fallback search.
   - Socket.IO SOS alert radar popup with distance estimation and interactive Leaflet map.
   - In-transit vitals recorder (BP, Pulse, SpO2, Respiratory Rate, GCS).
   - Hospital handover summary generator.

3. **Public Zero-Login Emergency Access**:
   - High-contrast, mobile-optimized emergency card displaying blood group, severe allergies, and emergency phone numbers when scanning a physical QR badge.

## 🚀 Active Environment State
- **Server Port**: `5000`
- **Database**: MongoDB (Atlas / local)
- **Node Environment**: `development`
- **Verified Workspace Accounts**:
  - Patient account should be registered with a real medical profile and QR code.
  - Crew account should be registered with verified dispatch credentials.
