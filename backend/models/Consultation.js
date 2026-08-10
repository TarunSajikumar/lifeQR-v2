const mongoose = require("mongoose");

const consultationSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  scheduledAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  chiefComplaint: {
    type: String,
    trim: true
  },
  diagnosis: String,
  clinicalNotes: String,
  followUpDate: Date
}, {
  timestamps: true
});

module.exports = mongoose.models.Consultation || mongoose.model("Consultation", consultationSchema);
