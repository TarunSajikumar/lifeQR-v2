const mongoose = require("mongoose");

const qrProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientProfile"
  },
  qrCodeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  qrToken: {
    type: String,
    required: true
  },
  qrImageUrl: {
    type: String,
    default: ''
  },
  publicFields: {
    showBloodGroup: { type: Boolean, default: true },
    showAllergies: { type: Boolean, default: true },
    showMedications: { type: Boolean, default: true },
    showConditions: { type: Boolean, default: true },
    showContacts: { type: Boolean, default: true },
    showDoctorNotes: { type: Boolean, default: false }
  },
  scanCount: {
    type: Number,
    default: 0
  },
  lastScannedAt: {
    type: Date,
    default: null
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("QRProfile", qrProfileSchema);
