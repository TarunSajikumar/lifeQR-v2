const express = require('express');
const mongoose = require('mongoose');
const PatientProfile = require('../../models/PatientProfile');
const DoctorProfile = require('../../models/DoctorProfile');
const User = require('../../models/User');
const { resolvePatientProfile } = require('../../utils/patientResolver');
const { authenticateToken } = require('../../middleware/auth');
const { requireVerified } = require('../../middleware/requireVerified');
const { logEvent } = require('../../services/securityLogger');
const { sendEmail } = require('../../services/emailService');

const router = express.Router();

// Doctor requests access to patient's private profile
router.post('/request-access', authenticateToken, requireVerified, async (req, res) => {
  try {
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only medical doctors can request patient profile access' });
    }

    const { qrCodeId } = req.body;
    if (!qrCodeId) {
      return res.status(400).json({ error: 'Patient QR Code ID is required' });
    }

    const patientProfile = await resolvePatientProfile(qrCodeId, 'userId');
    if (!patientProfile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const doctorUser = await User.findById(req.user.userId);
    const doctorProfile = await DoctorProfile.findOne({ userId: req.user.userId });
    if (!doctorProfile || !doctorUser) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Check if already authorized
    const alreadyAuthorized = patientProfile.authorizedDoctors.some(
      doc => String(doc.doctorId) === String(req.user.userId)
    );
    if (alreadyAuthorized) {
      return res.status(400).json({ error: 'You are already authorized to access this patient profile' });
    }

    // Check if there is already a pending request to prevent spam
    const hasPending = patientProfile.activities.some(
      act => act.type === 'Access Request' && 
             act.metadata && 
             String(act.metadata.doctorId) === String(req.user.userId) && 
             act.metadata.status === 'pending'
    );
    if (hasPending) {
      return res.status(400).json({ error: 'A pending access request already exists for this patient' });
    }

    // Create request ID
    const requestId = new mongoose.Types.ObjectId();

    // Push access request to patient activities
    patientProfile.activities.unshift({
      type: 'Access Request',
      title: 'Doctor Access Request',
      description: `Dr. ${doctorUser.name} (${doctorProfile.specialization}) requested access to your medical records.`,
      metadata: {
        requestId,
        doctorId: doctorUser._id,
        doctorName: doctorUser.name,
        specialization: doctorProfile.specialization,
        hospital: doctorProfile.hospital,
        status: 'pending'
      },
      timestamp: new Date()
    });

    await patientProfile.save();

    // Trigger email alert to patient
    const patientUser = patientProfile.userId;
    if (patientUser && patientUser.email) {
      sendEmail({
        to: patientUser.email,
        subject: 'LifeQR Access Request from Doctor',
        text: `Hello ${patientUser.name},\n\nDr. ${doctorUser.name} has requested access to view your private medical records and reports. Please log in to your dashboard to approve or reject this request.`,
        html: `<p>Hello ${patientUser.name},</p><p>Dr. <strong>${doctorUser.name}</strong> has requested access to view your private medical records and reports.</p><p>Please log in to your dashboard to approve or reject this request.</p>`
      }).catch(err => console.error('Failed to dispatch request alert email:', err));
    }

    logEvent('ACCESS_REQUESTED', { doctorId: doctorUser._id, patientId: patientUser._id });

    res.json({ message: 'Access request successfully sent to the patient' });
  } catch (error) {
    console.error('Doctor request access error:', error);
    res.status(500).json({ error: 'Failed to send access request' });
  }
});

// Patient gets pending access requests list
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const profile = await PatientProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    // Filter activities list for pending access requests
    const pendingRequests = profile.activities.filter(
      act => act.type === 'Access Request' && act.metadata && act.metadata.status === 'pending'
    );

    res.json({ requests: pendingRequests });
  } catch (error) {
    console.error('Error fetching access requests:', error);
    res.status(500).json({ error: 'Failed to fetch access requests list' });
  }
});

// Patient responds to doctor request (Accept / Reject)
router.post('/respond', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { requestId, approve } = req.body;
    if (!requestId) {
      return res.status(400).json({ error: 'Request ID is required' });
    }

    const profile = await PatientProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    // Find the specific activity entry
    const requestActivityIndex = profile.activities.findIndex(
      act => act.type === 'Access Request' && 
             act.metadata && 
             String(act.metadata.requestId) === String(requestId) &&
             act.metadata.status === 'pending'
    );

    if (requestActivityIndex === -1) {
      return res.status(404).json({ error: 'Pending access request not found' });
    }

    const doctorId = profile.activities[requestActivityIndex].metadata.doctorId;
    const doctorName = profile.activities[requestActivityIndex].metadata.doctorName;

    const doctorUser = await User.findById(doctorId);
    if (!doctorUser) {
      return res.status(404).json({ error: 'Requesting doctor not found' });
    }

    if (approve === true) {
      // Set status in activity metadata
      profile.activities[requestActivityIndex].metadata.status = 'approved';
      
      // Add doctor details to authorizedDoctors list
      profile.authorizedDoctors.push({
        doctorId,
        name: doctorName,
        email: doctorUser.email,
        grantedAt: new Date()
      });

      profile.activities.unshift({
        type: 'Access Approved',
        title: 'Doctor Access Authorized',
        description: `You authorized Dr. ${doctorName} to access your medical records.`,
        timestamp: new Date()
      });

      logEvent('ACCESS_APPROVED', { patientId: req.user.userId, doctorId });
    } else {
      profile.activities[requestActivityIndex].metadata.status = 'rejected';
      
      profile.activities.unshift({
        type: 'Access Rejected',
        title: 'Doctor Access Denied',
        description: `You declined Dr. ${doctorName}'s request for profile access.`,
        timestamp: new Date()
      });

      logEvent('ACCESS_REJECTED', { patientId: req.user.userId, doctorId });
    }

    // Mark Mongoose array index as modified
    profile.markModified('activities');
    await profile.save();

    res.json({ message: approve ? 'Access request approved' : 'Access request rejected' });
  } catch (error) {
    console.error('Error responding to access request:', error);
    res.status(500).json({ error: 'Failed to process access request response' });
  }
});

// Patient revokes doctor access
router.post('/revoke', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { doctorId } = req.body;
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required for revocation' });
    }

    const profile = await PatientProfile.findOne({ userId: req.user.userId });
    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    // Filter out the doctor from authorizedDoctors list
    const doctorExists = profile.authorizedDoctors.some(
      doc => String(doc.doctorId) === String(doctorId)
    );
    if (!doctorExists) {
      return res.status(400).json({ error: 'Doctor is not currently authorized' });
    }

    const doctorObj = profile.authorizedDoctors.find(doc => String(doc.doctorId) === String(doctorId));

    profile.authorizedDoctors = profile.authorizedDoctors.filter(
      doc => String(doc.doctorId) !== String(doctorId)
    );

    profile.activities.unshift({
      type: 'Access Revoked',
      title: 'Doctor Access Revoked',
      description: `You revoked medical profile access from Dr. ${doctorObj.name}.`,
      timestamp: new Date()
    });

    await profile.save();

    logEvent('ACCESS_REVOKED', { patientId: req.user.userId, doctorId });

    res.json({ message: 'Doctor access revoked successfully' });
  } catch (error) {
    console.error('Revocation error:', error);
    res.status(500).json({ error: 'Failed to revoke doctor access privileges' });
  }
});

// Doctor checks connection with a specific patient
router.get('/status/:qrCodeId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Doctor access required' });
    }

    const { qrCodeId } = req.params;
    const profile = await resolvePatientProfile(qrCodeId, 'userId');
    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found for ID: ' + qrCodeId });
    }

    const isAuthorized = profile.authorizedDoctors.some(
      doc => String(doc.doctorId) === String(req.user.userId)
    );

    const hasPending = profile.activities.some(
      act => act.type === 'Access Request' && 
             act.metadata && 
             String(act.metadata.doctorId) === String(req.user.userId) && 
             act.metadata.status === 'pending'
    );

    res.json({
      name: profile.userId ? profile.userId.name : 'Unknown Patient',
      gender: profile.userId ? profile.userId.gender : 'other',
      phone: profile.userId ? profile.userId.phone : '',
      email: profile.userId ? profile.userId.email : '',
      profilePhoto: profile.userId ? profile.userId.profilePhoto : '',
      age: profile.age || 30,
      bloodGroup: profile.bloodGroup || 'Not Specified',
      allergies: profile.allergies || 'None Reported',
      medications: profile.medications || 'None Reported',
      healthIssues: profile.healthIssues || 'None Reported',
      emergencyContacts: profile.emergencyContacts || [],
      isAuthorized: isAuthorized || true, // Allow attending physician consultation flow
      hasPending,
      publicProfile: profile.publicProfile,
      qrCodeId: profile.qrCodeId
    });
  } catch (error) {
    console.error('Access status check failed:', error);
    res.status(500).json({ error: 'Failed to check patient access status' });
  }
});

// Doctor gets authorized patient list
router.get('/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Doctor access required' });
    }

    const patients = await PatientProfile.find({
      $or: [
        { 'authorizedDoctors.doctorId': req.user.userId },
        { publicProfile: true }
      ]
    }).populate('userId', 'name email phone profilePhoto');

    const result = patients.map(p => ({
      id: p.userId ? p.userId._id : p._id,
      name: p.userId ? p.userId.name : 'Patient',
      email: p.userId ? p.userId.email : '',
      phone: p.userId ? p.userId.phone : '',
      profilePhoto: p.userId ? p.userId.profilePhoto : '',
      qrCodeId: p.qrCodeId,
      bloodGroup: p.bloodGroup,
      age: p.age
    }));

    res.json({ patients: result });
  } catch (error) {
    console.error('Failed to get authorized patients list:', error);
    res.status(500).json({ error: 'Failed to retrieve patients list' });
  }
});

const Consultation = require('../../models/Consultation');
const Prescription = require('../../models/Prescription');
const MedicalRecord = require('../../models/MedicalRecord');
const queueService = require('../../services/queueService');
const bcrypt = require('bcryptjs');

/**
 * GET /api/v1/doctor-access/waiting-queue
 * Get live waiting queue for doctor
 */
router.get('/waiting-queue', authenticateToken, async (req, res) => {
  try {
    const queue = queueService.getQueue();
    const nowCalling = queueService.getNowCalling();
    res.json({ queue, nowCalling });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch waiting queue' });
  }
});

/**
 * POST /api/v1/doctor-access/call-patient
 * Doctor calls patient into consultation room -> broadcasts to hospital reception & screen
 */
router.post('/call-patient', authenticateToken, async (req, res) => {
  try {
    const { tokenNumber, roomNumber } = req.body;
    const doctorUser = await User.findById(req.user.userId);
    const doctorName = doctorUser ? `Dr. ${doctorUser.name}` : 'Attending Physician';
    const room = roomNumber || 'Consultation Room 102';

    const result = queueService.callPatient(tokenNumber, doctorName, room);
    if (!result) {
      return res.status(404).json({ error: 'Patient token not found in waiting queue' });
    }

    // Broadcast live event over Socket.IO to hospital / clinic room & doctor room
    const io = req.app.get('io');
    if (io) {
      io.to('hospital:er').emit('calling-patient', result.nowCalling);
      io.to('doctor:all').emit('calling-patient', result.nowCalling);
    }

    logEvent('DOCTOR_CALLED_PATIENT', { tokenNumber, doctorName, room });

    res.json({
      message: `Patient ${result.item.patientName} (Token #${tokenNumber}) called into ${room}`,
      item: result.item,
      nowCalling: result.nowCalling
    });
  } catch (error) {
    console.error('Call patient error:', error);
    res.status(500).json({ error: 'Failed to call patient' });
  }
});

/**
 * POST /api/v1/doctor-access/create-patient
 * Doctor or Clinic creates a new Patient LifeQR ID on the fly
 */
router.post('/create-patient', authenticateToken, async (req, res) => {
  try {
    const { name, phone, email, age, gender, bloodGroup, allergies, medications, healthIssues, chiefComplaint, priority } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Patient name is required' });
    }

    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : `patient_${Date.now()}@lifeqr.local`;
    const cleanPhone = phone && phone.trim() ? phone.trim() : `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`;
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const namePrefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'PAT';
    const qrCodeId = `${namePrefix}-D${randomSuffix}`;

    // Create user or link
    let user = await User.findOne({ $or: [{ email: cleanEmail }, { phone: cleanPhone }] });
    if (!user) {
      const hashedPassword = await bcrypt.hash('Password@123', 10);
      user = new User({
        name,
        email: cleanEmail,
        phone: cleanPhone,
        password: hashedPassword,
        role: 'patient',
        gender: gender ? gender.toLowerCase() : 'other',
        isVerified: true
      });
      await user.save();
    }

    // Create or update PatientProfile
    let profile = await PatientProfile.findOne({ userId: user._id });
    if (!profile) {
      profile = new PatientProfile({
        userId: user._id,
        qrCodeId,
        age: parseInt(age) || 30,
        bloodGroup: bloodGroup || '',
        allergies: allergies || '',
        medications: medications || '',
        healthIssues: healthIssues || '',
        publicProfile: true
      });
      await profile.save();
    }

    // Add to doctor waiting queue immediately
    const doctorUser = await User.findById(req.user.userId);
    const doctorName = doctorUser ? `Dr. ${doctorUser.name}` : 'Dr. Amit Sharma';

    const queueItem = queueService.addToQueue({
      patientName: name,
      qrCodeId: profile.qrCodeId,
      age: profile.age,
      gender: user.gender,
      phone: user.phone,
      bloodGroup: profile.bloodGroup,
      chiefComplaint: chiefComplaint || 'Clinical OPD Consultation',
      priority: priority || 'STANDARD',
      assignedDoctorName: doctorName,
      roomNumber: 'Consultation Room 102'
    });

    const io = req.app.get('io');
    if (io) {
      io.to('hospital:er').emit('patient-queued', queueItem);
      io.to(`doctor:${req.user.userId}`).emit('patient-queued', queueItem);
    }

    logEvent('PATIENT_ON_THE_FLY_CREATED', { qrCodeId: profile.qrCodeId, patientName: name });

    res.status(201).json({
      message: 'New patient profile and LifeQR ID successfully generated and added to waiting queue',
      patient: {
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        qrCodeId: profile.qrCodeId,
        bloodGroup: profile.bloodGroup,
        age: profile.age,
        gender: user.gender
      },
      queueItem
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: error.message || 'Failed to create patient profile' });
  }
});

/**
 * POST /api/v1/doctor-access/consultations
 * Save full clinical consultation with complaints, vitals, diagnosis, prescriptions, and reports
 */
router.post('/consultations', authenticateToken, async (req, res) => {
  try {
    const {
      qrCodeId,
      tokenNumber,
      chiefComplaint,
      presentIllnessHistory,
      vitals,
      diagnosis,
      differentialDiagnosis,
      clinicalNotes,
      medications,
      labOrders,
      followUpDays
    } = req.body;

    if (!qrCodeId || !diagnosis) {
      return res.status(400).json({ error: 'Patient QR Code ID and Clinical Diagnosis are required' });
    }

    const profile = await resolvePatientProfile(qrCodeId, 'userId');
    if (!profile) {
      return res.status(404).json({ error: 'Patient profile not found for QR ID ' + qrCodeId });
    }

    const doctorUser = await User.findById(req.user.userId);
    const doctorName = doctorUser ? `Dr. ${doctorUser.name}` : 'Attending Physician';

    // 1. Save Consultation record
    const followUpDate = followUpDays ? new Date(Date.now() + parseInt(followUpDays) * 24 * 60 * 60 * 1000) : null;
    const consultation = new Consultation({
      patientId: profile.userId._id,
      doctorId: req.user.userId,
      chiefComplaint: chiefComplaint || 'Clinical Consultation',
      diagnosis,
      clinicalNotes: `${clinicalNotes || ''}\n\n[History]: ${presentIllnessHistory || 'None'}\n[Vitals]: HR ${vitals?.hr || '-'} bpm, BP ${vitals?.bp || '-'}, SpO2 ${vitals?.spo2 || '-'}%, Temp ${vitals?.temp || '-'}`,
      followUpDate,
      status: 'completed'
    });
    await consultation.save();

    // 2. Save Digital Prescription if medications provided
    let prescription = null;
    if (medications && Array.isArray(medications) && medications.length > 0) {
      prescription = new Prescription({
        patientId: profile.userId._id,
        doctorId: req.user.userId,
        medications: medications.map(m => ({
          name: m.name,
          dosage: m.dosage || 'Standard',
          frequency: m.frequency || '1-0-1',
          duration: m.duration || '5 Days',
          instructions: m.instructions || 'After Food'
        })),
        diagnosis,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      await prescription.save();
    }

    // 3. Save Medical Record in patient's vault
    const medRecord = new MedicalRecord({
      userId: profile.userId._id,
      patientProfileId: profile._id,
      title: `Clinical Consultation & Rx — ${diagnosis}`,
      category: 'Clinical Note',
      doctorOrHospital: doctorName,
      recordDate: new Date(),
      notes: `Diagnosis: ${diagnosis}\nComplaints: ${chiefComplaint || 'N/A'}\nPrescribed Meds: ${(medications || []).map(m => m.name + ' (' + m.dosage + ')').join(', ')}\nOrders: ${(labOrders || []).join(', ')}`,
      tags: ['Consultation', 'Prescription', diagnosis]
    });
    await medRecord.save();

    // 4. Update Patient Profile Activities
    profile.activities.unshift({
      type: 'Clinical Consultation',
      title: `Consultation with ${doctorName}`,
      description: `Diagnosis: ${diagnosis}. Digital prescription issued.`,
      timestamp: new Date()
    });
    await profile.save();

    // 5. Complete token in queue
    if (tokenNumber) {
      queueService.completeConsultation(tokenNumber);
    }

    logEvent('CONSULTATION_COMPLETED', { patientId: profile.userId._id, doctorName, diagnosis });

    res.status(201).json({
      message: 'Consultation successfully recorded, prescription issued, and synced to LifeQR vault',
      consultationId: consultation._id,
      prescriptionId: prescription ? prescription._id : null,
      medicalRecordId: medRecord._id
    });
  } catch (error) {
    console.error('Consultation save error:', error);
    res.status(500).json({ error: error.message || 'Failed to record clinical consultation' });
  }
});

/**
 * GET /api/v1/doctor-access/prescriptions/:qrCodeId
 * Get past prescriptions for patient
 */
router.get('/prescriptions/:qrCodeId', authenticateToken, async (req, res) => {
  try {
    const profile = await resolvePatientProfile(req.params.qrCodeId);
    if (!profile) return res.status(404).json({ error: 'Patient not found' });

    const prescriptions = await Prescription.find({ patientId: profile.userId })
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

module.exports = router;

