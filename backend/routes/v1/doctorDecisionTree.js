const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const PatientProfile = require('../../models/PatientProfile');
const MedicalHistory = require('../../models/MedicalRecord'); // Or a specific history model if exists
const User = require('../../models/User');

const router = express.Router();

// 1. GET Clinical Decision Tree Schema
router.get('/schema', authenticateToken, (req, res) => {
  const schema = {
    tracks: [
      {
        id: 'track-1',
        name: 'Emergency Triage & Primary Survey',
        stages: [
          { id: 1, name: 'Airway & C-Spine Protection', options: ['Patent', 'Obstructed', 'At Risk'] },
          { id: 2, name: 'Breathing & Ventilation', options: ['Normal', 'Labored', 'Apneic'] },
          { id: 3, name: 'Circulation & Hemorrhage Control', options: ['Stable', 'Compromised', 'Shock'] }
        ]
      },
      {
        id: 'track-2',
        name: 'Clinical Diagnostics & Allergies',
        stages: [
          { id: 4, name: 'Medical Identity Verification', elements: ['QR Data Review', 'ID Confirmation', 'Emergency Contact Notify'] },
          { id: 5, name: 'Allergy Matrix Check', categories: ['Drug', 'Food', 'Environmental', 'Latex'] }
        ]
      }
    ]
  };
  res.json(schema);
});

// 2. Execute Stage (Log decision to history)
router.post('/execute-stage', authenticateToken, async (req, res) => {
  try {
    const { qrCodeId, stageId, stageName, decisionTitle, details } = req.body;

    const profile = await PatientProfile.findOne({ qrCodeId });
    if (!profile) return res.status(404).json({ error: 'Patient not found' });

    const doctor = await User.findById(req.user.userId);

    // Push to patient activities or specific history
    profile.activities.unshift({
      type: 'Clinical Decision',
      title: `${stageName}: ${decisionTitle}`,
      description: details,
      metadata: { stageId, doctorId: req.user.userId, doctorName: doctor.name },
      timestamp: new Date()
    });

    await profile.save();

    res.json({ message: 'Decision stage logged successfully', stageId });
  } catch (error) {
    console.error('Decision Tree Error:', error);
    res.status(500).json({ error: 'Failed to execute decision stage' });
  }
});

module.exports = router;
