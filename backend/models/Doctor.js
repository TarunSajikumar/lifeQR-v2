const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true
  },
  specialization: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    required: true
  },
  hospital: {
    type: String,
    required: true
  },
  registrationCouncil: {
    type: String,
    default: ''
  },
  registrationYear: {
    type: Number
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 5.0
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
