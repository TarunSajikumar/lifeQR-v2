const express = require('express');
const ERHandover = require('../../models/ERHandover');
const PatientProfile = require('../../models/PatientProfile');
const CrewProfile = require('../../models/CrewProfile');
const User = require('../../models/User');
const { authenticateToken } = require('../../middleware/auth');
const { logEvent } = require('../../services/securityLogger');

const router = express.Router();

// 1. STREAM IN-TRANSIT VITALS (Called by Ambulance Crew)
router.post('/stream-vitals', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'crew' && req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Only ambulance crew or medical staff can stream in-transit ER telemetry' });
    }

    const {
      qrCodeId,
      etaMinutes,
      triageLevel,
      vitals,
      location,
      chiefComplaint
    } = req.body;

    if (!qrCodeId) {
      return res.status(400).json({ error: 'Patient QR Code ID is required' });
    }

    const crewUser = await User.findById(req.user.userId);
    const crewProfile = await CrewProfile.findOne({ userId: req.user.userId });
    const vehicleNumber = crewProfile ? crewProfile.vehicleNumber : 'MED-UNIT-108';

    // Fetch patient profile details
    const patientProfile = await PatientProfile.findOne({ qrCodeId }).populate('userId', 'name bloodGroup gender');
    const patientName = patientProfile && patientProfile.userId ? patientProfile.userId.name : 'Emergency Patient';
    const bloodGroup = patientProfile ? patientProfile.bloodGroup : 'N/A';
    const allergies = patientProfile ? patientProfile.allergies : 'None Reported';
    const medications = patientProfile ? patientProfile.medications : 'None Reported';

    // Create or update active handover record
    let handover = await ERHandover.findOne({ qrCodeId, status: 'IN_TRANSIT' });

    if (!handover) {
      handover = new ERHandover({
        crewId: req.user.userId,
        vehicleNumber,
        qrCodeId,
        patientName,
        bloodGroup,
        allergies,
        medications,
        etaMinutes: etaMinutes || 10,
        triageLevel: triageLevel || 'CRITICAL',
        vitals: vitals || {},
        location: location || { lat: 37.7749, lng: -122.4194 },
        chiefComplaint: chiefComplaint || 'Acute Trauma / Distress'
      });
    } else {
      if (etaMinutes !== undefined) handover.etaMinutes = etaMinutes;
      if (triageLevel) handover.triageLevel = triageLevel;
      if (vitals) handover.vitals = { ...handover.vitals, ...vitals };
      if (location) handover.location = location;
      if (chiefComplaint) handover.chiefComplaint = chiefComplaint;
    }

    await handover.save();

    // Broadcast Socket.IO event to Hospital ER Reception rooms
    const io = req.app.get('io');
    if (io) {
      const payload = {
        handoverId: handover._id,
        vehicleNumber,
        crewName: crewUser.name,
        qrCodeId,
        patientName,
        bloodGroup,
        allergies,
        medications,
        etaMinutes: handover.etaMinutes,
        triageLevel: handover.triageLevel,
        vitals: handover.vitals,
        location: handover.location,
        chiefComplaint: handover.chiefComplaint,
        assignedBay: handover.assignedBay,
        timestamp: new Date()
      };
      io.to('hospital:er').emit('incoming-ambulance-update', payload);
      io.to('crew:all').emit('incoming-ambulance-update', payload);
    }

    logEvent('ER_TELEMETRY_STREAMED', { handoverId: handover._id, qrCodeId, crewId: req.user.userId });

    res.json({ message: 'Live in-transit vitals streamed to Hospital ER Reception', handover });
  } catch (error) {
    console.error('Error streaming ER vitals:', error);
    res.status(500).json({ error: 'Failed to stream telemetry to ER reception' });
  }
});

// 2. GET ACTIVE INCOMING AMBULANCES (Used by ER Reception Dashboard)
router.get('/incoming', authenticateToken, async (req, res) => {
  try {
    const incoming = await ERHandover.find({ status: 'IN_TRANSIT' }).sort({ etaMinutes: 1, createdAt: -1 });
    res.json({ incoming });
  } catch (error) {
    console.error('Error fetching incoming ER handovers:', error);
    res.status(500).json({ error: 'Failed to fetch incoming ambulances list' });
  }
});

// 3. ASSIGN TRAUMA BAY (Called by ER Triage Nurse / Reception)
router.post('/assign-bay', authenticateToken, async (req, res) => {
  try {
    const { handoverId, assignedBay } = req.body;
    if (!handoverId || !assignedBay) {
      return res.status(400).json({ error: 'Handover ID and Assigned Bay name are required' });
    }

    const handover = await ERHandover.findById(handoverId);
    if (!handover) {
      return res.status(404).json({ error: 'In-transit handover record not found' });
    }

    handover.assignedBay = assignedBay;
    await handover.save();

    // Broadcast Socket.IO event to notify Ambulance Unit & ER dashboards
    const io = req.app.get('io');
    if (io) {
      io.to('hospital:er').emit('trauma-bay-assigned', {
        handoverId,
        assignedBay,
        vehicleNumber: handover.vehicleNumber,
        patientName: handover.patientName,
        timestamp: new Date()
      });
      io.to('crew:all').emit('trauma-bay-assigned', {
        handoverId,
        assignedBay,
        vehicleNumber: handover.vehicleNumber,
        patientName: handover.patientName,
        timestamp: new Date()
      });
    }

    logEvent('TRAUMA_BAY_ASSIGNED', { handoverId, assignedBay });

    res.json({ message: `Trauma Bay ${assignedBay} assigned successfully`, handover });
  } catch (error) {
    console.error('Error assigning trauma bay:', error);
    res.status(500).json({ error: 'Failed to assign trauma bay' });
  }
});

// 4. MARK ARRIVED / COMPLETE HANDOVER
router.post('/complete-handover', authenticateToken, async (req, res) => {
  try {
    const { handoverId } = req.body;
    if (!handoverId) return res.status(400).json({ error: 'Handover ID is required' });

    const handover = await ERHandover.findById(handoverId);
    if (!handover) return res.status(404).json({ error: 'Handover record not found' });

    handover.status = 'ARRIVED';
    await handover.save();

    const io = req.app.get('io');
    if (io) {
      io.to('hospital:er').emit('handover-completed', { handoverId, timestamp: new Date() });
    }

    res.json({ message: 'Patient handover completed at ER', handover });
  } catch (error) {
    console.error('Error completing ER handover:', error);
    res.status(500).json({ error: 'Failed to mark handover complete' });
  }
});

module.exports = router;
