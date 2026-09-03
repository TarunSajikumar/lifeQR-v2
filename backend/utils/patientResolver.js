const crypto = require('crypto');
const mongoose = require('mongoose');
const PatientProfile = require('../models/PatientProfile');
const EmergencyCredential = require('../models/EmergencyCredential');

/**
 * Robust Patient Profile Resolver
 * Resolves a patient profile by:
 * 1. qrCodeId (e.g. RAH-D3200470, VED-C188E7F9) - exact or case-insensitive
 * 2. Raw Emergency Token (e.g. 64-char hex string e9fdaf2e8d68178adc8d5ba06c9b44c1...)
 * 3. Token Hash directly
 * 4. Scanned URL string (e.g. /e/token or ?id=RAH-D3200470 or ?token=...)
 * 5. MongoDB ObjectId (profile._id or userId)
 */
async function resolvePatientProfile(identifier, populateQuery = '') {
  if (!identifier) return null;

  let cleaned = String(identifier).trim();

  // If full URL was passed or pasted
  try {
    if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
      const url = new URL(cleaned);
      cleaned = url.searchParams.get('id') || url.searchParams.get('token') || url.pathname.split('/').filter(Boolean).pop() || cleaned;
    }
  } catch (e) {}

  // 1. Direct qrCodeId match
  let profileQuery = PatientProfile.findOne({ qrCodeId: cleaned });
  if (populateQuery) profileQuery = profileQuery.populate(populateQuery);
  let profile = await profileQuery;
  if (profile) return profile;

  // 2. Case-insensitive qrCodeId match
  profileQuery = PatientProfile.findOne({ qrCodeId: new RegExp('^' + cleaned.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
  if (populateQuery) profileQuery = profileQuery.populate(populateQuery);
  profile = await profileQuery;
  if (profile) return profile;

  // 3. EmergencyCredential token lookup (hash or raw hex token)
  const tokenHash = crypto.createHash('sha256').update(cleaned).digest('hex');
  const credential = await EmergencyCredential.findOne({
    $or: [
      { tokenHash: tokenHash },
      { tokenHash: cleaned }
    ],
    status: 'ACTIVE'
  });

  if (credential && credential.patientId) {
    let credProfileQuery = PatientProfile.findById(credential.patientId);
    if (populateQuery) credProfileQuery = credProfileQuery.populate(populateQuery);
    profile = await credProfileQuery;
    if (profile) return profile;
  }

  // 4. Check if valid ObjectId
  if (mongoose.Types.ObjectId.isValid(cleaned)) {
    let idProfileQuery = PatientProfile.findOne({
      $or: [
        { _id: cleaned },
        { userId: cleaned }
      ]
    });
    if (populateQuery) idProfileQuery = idProfileQuery.populate(populateQuery);
    profile = await idProfileQuery;
    if (profile) return profile;
  }

  return null;
}

module.exports = { resolvePatientProfile };
