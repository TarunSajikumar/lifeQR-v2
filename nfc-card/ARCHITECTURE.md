# 🏗️ LifeQR NFC Card: Technical System Architecture

## 1. System Topology & Data Flow

```text
               [ Physical LifeQR Card ]
              (NTAG216 / NTAG424 DNA Chip)
                           |
        +------------------+------------------+
        |                                     |
   (Contactless Tap)                    (Optical Scan)
   13.56 MHz RF Field                  High-Contrast QR
        |                                     |
        v                                     v
 [ Smartphone NFC Controller ]        [ Smartphone Camera ]
 (iOS CoreNFC / Android NFC)                  |
        |                                     |
        +------------------+------------------+
                           |
                           v
        [ Mobile Browser / System Dispatch ]
      Opens: https://lifeqr.com/emergency?nfc=...
                           |
            +--------------+--------------+
            | (Online)                    | (Offline)
            v                             v
[ Express Backend: /api/v1/nfc ]   [ Local NDEF Record Decoded ]
  - Verify Tag Signature (CMAC)      - Blood Group, Allergies, ICE
  - Fetch Patient Profile Data       - Emergency Telemetry Display
  - Check Requester Role (JWT)
  - Broadcast SOS to Socket.IO
  - Push SMS to Emergency Contacts
            |
            v
[ Responsive Emergency View ]
  (Bystander Tier or Paramedic EHR)
```

---

## 2. Hardware Specifications

| Parameter | NXP NTAG216 (Standard Edition) | NXP NTAG424 DNA (Secure Edition) |
| :--- | :--- | :--- |
| **Operating Frequency** | 13.56 MHz | 13.56 MHz |
| **RF Protocol** | ISO/IEC 14443 Type A | ISO/IEC 14443 Type A |
| **NFC Forum Tag Type** | Type 2 Tag | Type 4 Tag |
| **Usable EEPROM Memory** | 888 Bytes | 416 Bytes |
| **Data Retention** | 10 Years | 50 Years |
| **Write Endurance** | 100,000 Cycles | 200,000 Cycles |
| **Security Feature** | 32-bit password lock, ASCII mirror | AES-128 SUN (Secure Unique NFC) CMAC |
| **Antenna Dimension** | 76 mm x 45 mm (Standard ID-1) | 76 mm x 45 mm (Standard ID-1) |
| **Operating Temp** | -25°C to +70°C | -25°C to +85°C |

---

## 3. NDEF Payload Structure

The card contains a multi-record NDEF (NFC Data Exchange Format) message:

### Record 1: Smart Emergency URL (NDEF URI Record)
Universal tap-to-open handler for all smartphones without custom app requirements:
```text
Type: 'U' (URI)
Prefix: 0x04 (https://)
Payload: lifeqr.com/emergency?c=RAH-D3200470&auth=AES128_CMAC_TOKEN&t=TIMESTAMP
```

### Record 2: Offline Emergency Micro-Vitals (NDEF Text Record)
Directly readable by any phone even with zero internet or cellular connectivity:
```text
Type: 'T' (Text / UTF-8)
Payload:
LIFEQR:v1|ID:RAH-D3200470|BLOOD:O+|ALLG:PENICILLIN,PEANUTS|MEDS:ALBUTEROL|ICE1:+919876543211|ICE2:+919876543212
```

### Record 3: Secure Emergency Payload (NDEF MIME Record)
Used by authenticated first-responder equipment running specialized LifeQR applications:
```text
Type: 'MIME'
MIME Type: 'application/vnd.lifeqr.vitals+json'
Payload:
{
  "cardId": "LQR-NFC-88291",
  "patientId": "RAH-D3200470",
  "version": 1,
  "offlineSnapshot": {
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Peanuts"],
    "criticalNotes": "Asthma inhaler carried in coat pocket",
    "contacts": [
      { "name": "Priya Sharma", "phone": "+919876543211", "rel": "Spouse" }
    ]
  },
  "signature": "3f8b03070bc3..."
}
```

---

## 4. Web NFC Browser API Integration

Modern mobile browsers (Chrome on Android 89+) support the W3C Web NFC API. This enables writing directly to the physical card from the LifeQR Patient Portal without special hardware writers.

### 4.1. Reading NFC Card in Browser
```javascript
async function startNfcReader() {
  if (!('NDEFReader' in window)) {
    throw new Error('Web NFC is not supported on this browser/device.');
  }

  const ndef = new NDEFReader();
  await ndef.scan();

  ndef.onreading = (event) => {
    const { serialNumber, message } = event;
    console.log(`NFC Card Tapped: Serial ${serialNumber}`);

    for (const record of message.records) {
      if (record.recordType === 'url') {
        const decoder = new TextDecoder();
        const url = decoder.decode(record.data);
        console.log(`Dispatched URL: ${url}`);
      } else if (record.recordType === 'text') {
        const textDecoder = new TextDecoder(record.encoding);
        console.log(`Offline Vitals: ${textDecoder.decode(record.data)}`);
      }
    }
  };
}
```

### 4.2. Flashing / Syncing Vitals to Card
```javascript
async function flashNfcCard(patientData) {
  const ndef = new NDEFReader();
  
  // Format compact offline payload
  const compactPayload = [
    `LIFEQR:v1`,
    `ID:${patientData.qrCodeId}`,
    `BLOOD:${patientData.bloodGroup}`,
    `ALLG:${(patientData.allergies || []).join(',')}`,
    `MEDS:${(patientData.medications || []).join(',')}`,
    `ICE:${patientData.emergencyContacts[0]?.phone || ''}`
  ].join('|');

  await ndef.write({
    records: [
      {
        recordType: 'url',
        data: `https://lifeqr.com/emergency?id=${patientData.qrCodeId}`
      },
      {
        recordType: 'text',
        data: compactPayload
      }
    ]
  });

  return { success: true, timestamp: new Date() };
}
```

---

## 5. Backend API Endpoints (`/api/v1/nfc/`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/nfc/register` | Pair a new physical NFC card with patient profile | Yes (Patient) |
| `GET` | `/api/v1/nfc/status/:cardUid` | Check if card is active, locked, or reported lost | No |
| `POST` | `/api/v1/nfc/verify-tap` | Cryptographic SUN CMAC validation & emergency lookup | No |
| `POST` | `/api/v1/nfc/sync-payload` | Generates cryptographically signed offline NDEF packet | Yes (Patient) |
| `POST` | `/api/v1/nfc/lock` | Temporarily freeze or revoke card permissions | Yes (Patient / Admin) |
| `POST` | `/api/v1/nfc/sos-tap` | Trigger immediate SOS dispatch from NFC card tap | No |

---

## 6. Cryptographic CMAC Validation Workflow (NTAG424 DNA)

```text
[ Card Tapped ]
      |
[ Generates Dynamic URL: https://lifeqr.com/emergency?c=ID&picc=HEX1&cmac=HEX2 ]
      |
[ Backend: /api/v1/nfc/verify-tap ]
      |
1. Retrieve AES Master Key for Card UID from Secure Vault / DB
2. Decrypt PICCData using Diversified Card Key -> Extracts UID & Tap Counter
3. Compute expected AES-CMAC over (UID + TapCounter)
4. Compare expected CMAC with incoming CMAC in constant time:
   crypto.timingSafeEqual(computedCMAC, receivedCMAC)
      |
   +-- If Valid: Return decrypted profile & log tap event in AuditLog
   +-- If Invalid / Replayed: Flag security incident, reject access
```
