const mongoose = require("mongoose");

const nfcCardSchema = new mongoose.Schema({
  cardUid: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true,
    uppercase: true,
    description: "Hardware 7-byte or 14-byte UID of physical NFC chip (e.g. 04:A2:3B:5F:89:C0:11)"
  },
  cardId: {
    type: String,
    required: true,
    unique: true,
    index: true,
    description: "Human-readable LifeQR card identifier (e.g. LQR-NFC-88291)"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientProfile",
    required: true
  },
  chipType: {
    type: String,
    enum: ["NTAG213", "NTAG215", "NTAG216", "NTAG424_DNA", "DESFIRE_EV3"],
    default: "NTAG216"
  },
  formFactor: {
    type: String,
    enum: ["CARD", "WRISTBAND", "STICKER", "KEYFOB"],
    default: "CARD"
  },
  status: {
    type: String,
    enum: ["ACTIVE", "LOCKED_BY_USER", "REPORTED_LOST", "DECOMMISSIONED"],
    default: "ACTIVE"
  },
  // Dynamic Cryptographic Configuration (For NTAG424 DNA SUN CMAC)
  security: {
    isSecureSunEnabled: { type: Boolean, default: false },
    diversifiedKeyHash: { type: String, select: false },
    lastTapCounter: { type: Number, default: 0 },
    tamperDetected: { type: Boolean, default: false }
  },
  // Privacy Visibility Control for Bystander Scans
  privacyTierSettings: {
    allowBystanderAccess: { type: Boolean, default: true },
    showBloodGroup: { type: Boolean, default: true },
    showAllergies: { type: Boolean, default: true },
    showMedications: { type: Boolean, default: true },
    showEmergencyContacts: { type: Boolean, default: true },
    showFullClinicalNotes: { type: Boolean, default: false }, // Only verified EMT/Doctor
    autoNotifyFamilyOnTap: { type: Boolean, default: true }
  },
  // Offline NDEF snapshot synchronization
  offlinePayload: {
    lastSyncedAt: { type: Date, default: null },
    checksum: { type: String, default: null },
    syncedVersion: { type: Number, default: 1 }
  },
  metrics: {
    tapCount: { type: Number, default: 0 },
    lastTappedAt: { type: Date, default: null },
    lastTapLocation: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number }
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("NfcCard", nfcCardSchema);
