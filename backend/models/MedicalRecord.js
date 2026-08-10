const mongoose = require("mongoose");

const medicalRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientProfile"
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Lab Report', 'Prescription', 'Discharge Summary', 'Imaging/X-Ray', 'Vaccination', 'Clinical Note', 'Other'],
    default: 'Lab Report'
  },
  doctorOrHospital: {
    type: String,
    default: ''
  },
  recordDate: {
    type: Date,
    default: Date.now
  },
  fileUrl: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  tags: [String]
}, {
  timestamps: true
});

medicalRecordSchema.index({ userId: 1, recordDate: -1 });

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
