const mongoose = require("mongoose");

const userSecuritySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  originalPassword: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'patient'
  }
}, {
  timestamps: true,
  collection: 'user securities'
});

module.exports = mongoose.model("UserSecurity", userSecuritySchema);
