# Glossary — LifeQR Project Terminology

| Term | Definition |
|---|---|
| **Patient Profile** | Encrypted medical history record containing blood group, severe allergies, active medications, chronic conditions, and emergency contacts. |
| **Crew Dispatch** | Specialized portal for ambulance first responders to receive real-time SOS alerts, scan patient QR codes, and record in-transit vitals. |
| **QR Code ID** | Unique 8-character hex string generated per patient (e.g. `030b00b0`) that maps directly to their emergency medical profile. |
| **Emergency Credential** | Time-limited SHA-256 token used for high-security zero-login public emergency access links (`/e/:token`). |
| **SOS Beacon** | Geolocation-tagged emergency distress signal triggered by patients in urgent medical need. |
| **In-Transit Vitals** | Real-time clinical parameters recorded by paramedics during transport (Heart Rate, Blood Pressure, SpO2, Respiratory Rate, GCS). |
| **AI Medical Scribe** | NLP clinical tool that converts spoken or written consultation notes into structured diagnostic reports. |
