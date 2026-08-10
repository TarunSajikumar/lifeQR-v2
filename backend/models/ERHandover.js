const mongoose = require('mongoose');

const erHandoverSchema = new mongoose.Schema({
  crewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  qrCodeId: {
    type: String,
    required: true
  },
  patientName: String,
  bloodGroup: String,
  allergies: String,
  medications: String,
  etaMinutes: {
    type: Number,
    default: 10
  },
  triageLevel: {
    type: String,
    enum: ['CRITICAL', 'URGENT', 'SEMI_URGENT', 'ROUTINE'],
    default: 'URGENT'
  },
  vitals: {
    heartRate: Number,
    bpSystolic: Number,
    bpDiastolic: Number,
    spO2: Number,
    respRate: Number,
    gcs: Number,
    temp: Number
  },
  location: {
    lat: Number,
    lng: Number
  },
  chiefComplaint: String,
  assignedBay: {
    type: String,
    default: 'PENDING'
  },
  status: {
    type: String,
    enum: ['IN_TRANSIT', 'ARRIVED', 'HANDOVER_COMPLETE', 'CANCELLED'],
    default: 'IN_TRANSIT'
  }
}, {
  timestamps: true
});

erHandoverSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ERHandover', erHandoverSchema);
