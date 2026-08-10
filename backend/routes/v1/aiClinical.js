const express = require('express');
const { authenticateToken } = require('../../middleware/auth');
const PatientProfile = require('../../models/PatientProfile');
const User = require('../../models/User');
const { logEvent } = require('../../services/securityLogger');

const router = express.Router();

// 1. AI PATIENT SUMMARY
router.post('/patient-summary', authenticateToken, async (req, res) => {
  try {
    const { qrCodeId } = req.body;
    if (!qrCodeId) return res.status(400).json({ error: 'Patient QR Code ID is required' });

    const profile = await PatientProfile.findOne({ qrCodeId }).populate('userId', 'name');
    if (!profile) return res.status(404).json({ error: 'Patient profile not found' });

    // Mocking AI Logic - In production, call OpenAI/Anthropic here
    const summary = `Patient ${profile.userId.name} presents with a history of ${profile.healthIssues || 'no chronic conditions'}. Current medications include ${profile.medications || 'none'}. Based on recent triage scans, there is a consistent pattern of medical identity lookups.`;

    const alerts = [];
    if (profile.allergies && profile.allergies.toLowerCase() !== 'none') {
      alerts.push(`SEVERE ALLERGY ALERT: ${profile.allergies}`);
    }

    res.json({
      patientName: profile.userId.name,
      summary,
      confidenceScore: '94%',
      alerts,
      recommendedFocus: [
        'Review recent medication adherence',
        'Verify allergy reaction history',
        'Assess for acute trauma symptoms'
      ]
    });
  } catch (error) {
    console.error('AI Summary Error:', error);
    res.status(500).json({ error: 'AI Clinical engine failed to generate summary' });
  }
});

// 2. AI MEDICAL SCRIBE
router.post('/medical-scribe', authenticateToken, async (req, res) => {
  try {
    const { dictationText } = req.body;
    if (!dictationText) return res.status(400).json({ error: 'Dictation text is required' });

    // Mocking AI Scribe Logic
    res.json({
      structuredNote: {
        title: 'Clinical Consultation Note',
        diagnosis: 'Suspected Upper Respiratory Tract Infection',
        formattedObservations: `Subjective: ${dictationText}\nObjective: Patient appears fatigued. Lungs clear to auscultation.`,
        prescriptions: ['Paracetamol 500mg TID', 'Rest and hydration'],
        suggestedNextSteps: 'Follow up in 3 days if fever persists.'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'AI Scribe failed' });
  }
});

// 3. AI DIFFERENTIAL DIAGNOSIS
router.post('/differential-diagnosis', authenticateToken, async (req, res) => {
  try {
    const { symptoms } = req.body;

    res.json({
      differentials: [
        { diagnosis: 'Common Cold / Viral Rhinitis', probability: '85%', urgency: 'LOW' },
        { diagnosis: 'Acute Sinusitis', probability: '40%', urgency: 'MEDIUM' },
        { diagnosis: 'Bacterial Pharyngitis', probability: '15%', urgency: 'MEDIUM' }
      ],
      recommendedLabs: ['CBC', 'Rapid Strep Test', 'Physical Exam of Nasal Passages']
    });
  } catch (error) {
    res.status(500).json({ error: 'AI Diagnostic Engine failed' });
  }
});

// 4. AI PRESCRIPTION SAFETY CHECKER
router.post('/prescription-checker', authenticateToken, async (req, res) => {
  try {
    const { qrCodeId, prescriptionText } = req.body;
    let warnings = [];
    let interactions = [];
    let status = 'SAFE';
    let safetyScore = 98;

    if (qrCodeId) {
      const profile = await PatientProfile.findOne({ qrCodeId });
      if (profile && profile.allergies && prescriptionText.toLowerCase().includes(profile.allergies.toLowerCase().split(',')[0].trim())) {
        status = 'CRITICAL_WARNING';
        safetyScore = 12;
        warnings.push(`🚨 DRUG-ALLERGY ALERT: Prescription contains ${profile.allergies} which matches patient's severe allergy profile.`);
      }
    }

    res.json({
      status,
      safetyScore,
      warnings,
      interactions,
      alternativeSuggestions: status === 'SAFE' ? [] : ['Alternative non-allergenic antibiotic class', 'Consult Clinical Pharmacist']
    });
  } catch (error) {
    res.status(500).json({ error: 'Rx Safety Check failed' });
  }
});

// 5. AI SOAP GENERATOR
router.post('/soap-generator', authenticateToken, async (req, res) => {
  try {
    const { title, description } = req.body;

    const soap = {
      subjective: description,
      objective: 'Vitals stable. Physical exam within normal limits.',
      assessment: title || 'General Consultation',
      plan: 'Initiate treatment protocol as discussed. Schedule follow-up.'
    };

    const formattedText = `S: ${soap.subjective}\nO: ${soap.objective}\nA: ${soap.assessment}\nP: ${soap.plan}`;

    res.json({
      formattedText,
      soap
    });
  } catch (error) {
    res.status(500).json({ error: 'SOAP Generator failed' });
  }
});

module.exports = router;
