const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  role: String,
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'BLOCKED', 'WARNING'],
    default: 'SUCCESS'
  },
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
