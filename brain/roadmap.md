# Roadmap — Future Development & Milestones

## 🚀 Upcoming Technical & Product Milestones

### Phase 1: Real-time Dispatch & Core System (Completed ✅)
- Dual Patient & Ambulance Crew application.
- Express REST API v1, MongoDB, Socket.IO live SOS dispatch.
- Camera QR scanner (`jsQR`) & public emergency badge viewing.
- Verified production-ready accounts for patient and crew workflows.
- Separation of `website/` and `app/` architecture.

### Phase 2: SMS & Offline Capabilities (Completed ✅)
- **Twilio SMS Gateway**: Direct SMS dispatch to family emergency contacts when an SOS is triggered.
- **PWA Offline Mode**: Enhanced ServiceWorker caching for emergency medical cards when cellular connection is lost.
- **AI Clinical Copilot**: 5 AI-driven tools for doctors (Summary, Scribe, Differential Diagnosis, SOAP Generator, Rx Safety).
- **Admin Verification Queue**: Dedicated UI for approving professional medical credentials.

### Phase 3: Multi-Hospital ER Handover Integration (Planned ⏳)
- **ER Reception Interface**: Automated transmission of in-transit vitals from ambulance units directly to destination hospital ER screens.
- **HL7 / FHIR Interoperability**: Standardized export of patient emergency summaries to hospital EHR systems.
