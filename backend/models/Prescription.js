const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
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
  medications: [
    {
      name: { type: String, required: true },
      dosage: String,
      frequency: String,
      duration: String,
      instructions: String
    }
  ],
  diagnosis: String,
  validUntil: Date,
  isDispensed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Prescription || mongoose.model("Prescription", prescriptionSchema);
