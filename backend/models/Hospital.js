const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  registrationNumber: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  location: {
    lat: Number,
    lng: Number
  },
  emergencyHotline: {
    type: String,
    required: true
  },
  erCapacity: {
    totalBeds: { type: Number, default: 20 },
    occupiedBeds: { type: Number, default: 0 },
    traumaBaysAvailable: { type: Number, default: 4 },
    icuBedsAvailable: { type: Number, default: 2 }
  },
  status: {
    type: String,
    enum: ['accepting_all', 'diverting_trauma', 'diverting_all', 'limited_capacity'],
    default: 'accepting_all'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);
