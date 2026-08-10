const mongoose = require("mongoose");

const emergencyContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  patientProfileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PatientProfile"
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  relationship: {
    type: String,
    required: true,
    enum: ['Parent', 'Spouse', 'Sibling', 'Child', 'Friend', 'Guardian', 'Doctor', 'Other'],
    default: 'Other'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  priority: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

emergencyContactSchema.index({ userId: 1, priority: 1 });

module.exports = mongoose.model("EmergencyContact", emergencyContactSchema);
