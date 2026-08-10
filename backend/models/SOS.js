const mongoose = require("mongoose");

const sosSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  status: {
    type: String,
    enum: ['triggered', 'assigned', 'en_route', 'at_scene', 'transporting', 'resolved', 'cancelled'],
    default: 'triggered'
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number,
    address: String
  },
  dispatchedCrewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  destinationHospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hospital"
  },
  message: {
    type: String,
    default: 'Emergency SOS Triggered'
  },
  timeline: [
    {
      status: String,
      note: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, {
  timestamps: true
});

module.exports = mongoose.models.SOS || mongoose.model("SOS", sosSchema);
