const express = require('express');
const https = require('https');
const Hospital = require('../../models/Hospital');
const User = require('../../models/User');
const Doctor = require('../../models/Doctor');
const PatientProfile = require('../../models/PatientProfile');
const { authenticateToken } = require('../../middleware/auth');
const { logEvent } = require('../../services/securityLogger');

const router = express.Router();

// In-memory runtime state for live clinic / hospital operations (synchronized with DB)
let runtimeAdmissions = [
  {
    id: 'ADM-8901',
    patientName: 'Rahul Sharma',
    qrCodeId: 'RAH-D3200470',
    bloodGroup: 'O+',
    age: 32,
    gender: 'Male',
    ward: 'Trauma Bay 1 (Resuscitation Alpha)',
    bedNumber: 'TB-01',
    attendingDoctor: 'Dr. Amit Sharma',
    triageLevel: 'CRITICAL',
    admittedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    vitals: { hr: 98, bp: '120/80', spo2: 99, temp: '98.6°F' },
    status: 'admitted'
  },
  {
    id: 'ADM-8902',
    patientName: 'Priya Patel',
    qrCodeId: 'PRI-B8920112',
    bloodGroup: 'B+',
    age: 28,
    gender: 'Female',
    ward: 'ICU Wing Alpha',
    bedNumber: 'ICU-03',
    attendingDoctor: 'Dr. Rajesh Nair',
    triageLevel: 'URGENT',
    admittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    vitals: { hr: 84, bp: '118/75', spo2: 98, temp: '99.1°F' },
    status: 'admitted'
  },
  {
    id: 'ADM-8903',
    patientName: 'Anil Kumar',
    qrCodeId: 'ANI-K1104829',
    bloodGroup: 'A+',
    age: 45,
    gender: 'Male',
    ward: 'General Medical Ward 2',
    bedNumber: 'GW-08',
    attendingDoctor: 'Dr. Sneha Verma',
    triageLevel: 'SEMI_URGENT',
    admittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    vitals: { hr: 72, bp: '124/82', spo2: 99, temp: '98.4°F' },
    status: 'admitted'
  }
];

let runtimeBloodBank = {
  'O+': 24,
  'O-': 8,
  'A+': 18,
  'A-': 6,
  'B+': 22,
  'B-': 5,
  'AB+': 12,
  'AB-': 4
};

let runtimeBeds = {
  total: 30,
  occupied: 18,
  traumaBaysAvailable: 3,
  traumaBaysTotal: 4,
  icuAvailable: 4,
  icuTotal: 8,
  generalAvailable: 5,
  generalTotal: 18
};

const queueService = require('../../services/queueService');

/**
 * GET /api/v1/hospitals/queue
 * Returns clinic waiting queue and currently called patient announcement
 */
router.get('/queue', async (req, res) => {
  try {
    const queue = queueService.getQueue();
    const nowCalling = queueService.getNowCalling();
    res.json({ queue, nowCalling });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch clinic queue' });
  }
});

/**
 * POST /api/v1/hospitals/queue
 * Front desk registers patient & assigns to doctor's waiting queue
 */
router.post('/queue', async (req, res) => {
  try {
    const { patientName, qrCodeId, age, gender, phone, bloodGroup, chiefComplaint, priority, assignedDoctorName, roomNumber } = req.body;

    if (!patientName) {
      return res.status(400).json({ error: 'Patient name is required' });
    }

    const item = queueService.addToQueue({
      patientName,
      qrCodeId,
      age,
      gender,
      phone,
      bloodGroup,
      chiefComplaint,
      priority,
      assignedDoctorName,
      roomNumber
    });

    const io = req.app.get('io');
    if (io) {
      io.to('hospital:er').emit('patient-queued', item);
      io.to('doctor:all').emit('patient-queued', item);
    }

    logEvent('CLINIC_PATIENT_TOKEN_REGISTERED', { tokenNumber: item.tokenNumber, patientName, assignedDoctorName });

    res.status(201).json({
      message: `Token #${item.tokenNumber} generated for ${patientName}`,
      item
    });
  } catch (error) {
    console.error('Queue error:', error);
    res.status(500).json({ error: 'Failed to add patient to queue' });
  }
});

/**
 * GET /api/v1/hospitals/metrics
 * Returns real-time KPI overview metrics for the hospital/clinic command center
 */
router.get('/metrics', async (req, res) => {
  try {
    const totalPatients = await PatientProfile.countDocuments();
    const totalDoctors = await Doctor.countDocuments();
    const queue = queueService.getQueue();

    res.json({
      facilityName: 'Metro City Central Emergency & Level 1 Trauma Center',
      facilityId: 'HOSP-CLINIC-9021',
      totalInpatients: runtimeAdmissions.filter(a => a.status === 'admitted').length,
      beds: runtimeBeds,
      bloodBank: runtimeBloodBank,
      opdQueueCount: queue.filter(q => q.status === 'waiting').length,
      onDutyDoctorsCount: Math.max(totalDoctors, 6),
      surgeriesActive: 2,
      ambulancesAttached: 5,
      nowCalling: queueService.getNowCalling(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Hospital Metrics Error:', error);
    res.status(500).json({ error: 'Failed to fetch hospital metrics' });
  }
});

/**
 * GET /api/v1/hospitals/admissions
 * Returns list of active admitted patients
 */
router.get('/admissions', async (req, res) => {
  try {
    res.json({
      admissions: runtimeAdmissions.filter(a => a.status === 'admitted')
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch admissions list' });
  }
});

/**
 * POST /api/v1/hospitals/admissions
 * Admits a patient via LifeQR ID or direct intake
 */
router.post('/admissions', async (req, res) => {
  try {
    const { qrCodeId, patientName, bloodGroup, age, gender, ward, bedNumber, attendingDoctor, triageLevel, vitals } = req.body;

    if (!patientName || !ward) {
      return res.status(400).json({ error: 'Patient name and ward allocation are required' });
    }

    const newAdmission = {
      id: `ADM-${Math.floor(1000 + Math.random() * 9000)}`,
      patientName,
      qrCodeId: qrCodeId || `LQR-WALKIN-${Date.now().toString().slice(-4)}`,
      bloodGroup: bloodGroup || 'N/A',
      age: parseInt(age) || 30,
      gender: gender || 'Unspecified',
      ward,
      bedNumber: bedNumber || `BED-${Math.floor(1 + Math.random() * 20)}`,
      attendingDoctor: attendingDoctor || 'Dr. On Duty',
      triageLevel: triageLevel || 'URGENT',
      admittedAt: new Date().toISOString(),
      vitals: vitals || { hr: 80, bp: '120/80', spo2: 99, temp: '98.6°F' },
      status: 'admitted'
    };

    runtimeAdmissions.unshift(newAdmission);
    runtimeBeds.occupied = Math.min(runtimeBeds.total, runtimeBeds.occupied + 1);

    if (ward.includes('Trauma')) {
      runtimeBeds.traumaBaysAvailable = Math.max(0, runtimeBeds.traumaBaysAvailable - 1);
    }

    logEvent('HOSPITAL_PATIENT_ADMITTED', { admissionId: newAdmission.id, patientName, ward });

    res.status(201).json({
      message: 'Patient successfully admitted to hospital',
      admission: newAdmission
    });
  } catch (error) {
    console.error('Admission Error:', error);
    res.status(500).json({ error: 'Failed to process patient admission' });
  }
});

/**
 * PUT /api/v1/hospitals/admissions/:id/discharge
 * Discharges a patient and frees bed capacity
 */
router.put('/admissions/:id/discharge', async (req, res) => {
  try {
    const { id } = req.params;
    const admission = runtimeAdmissions.find(a => a.id === id);

    if (!admission) {
      return res.status(404).json({ error: 'Admission record not found' });
    }

    admission.status = 'discharged';
    admission.dischargedAt = new Date().toISOString();
    runtimeBeds.occupied = Math.max(0, runtimeBeds.occupied - 1);

    if (admission.ward.includes('Trauma')) {
      runtimeBeds.traumaBaysAvailable = Math.min(runtimeBeds.traumaBaysTotal, runtimeBeds.traumaBaysAvailable + 1);
    }

    logEvent('HOSPITAL_PATIENT_DISCHARGED', { admissionId: id, patientName: admission.patientName });

    res.json({
      message: 'Patient discharged successfully',
      admission
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to discharge patient' });
  }
});

/**
 * GET /api/v1/hospitals/doctors
 * Returns on-duty doctor roster with live availability status
 */
router.get('/doctors', async (req, res) => {
  try {
    const registeredDoctors = await Doctor.find().populate('userId', 'name email').limit(10);

    const defaultRoster = [
      { id: 'DOC-101', name: 'Dr. Amit Sharma', specialization: 'Emergency Medicine & Trauma', department: 'Trauma Bay', isAvailable: true, activePatients: 3 },
      { id: 'DOC-102', name: 'Dr. Rajesh Nair', specialization: 'Critical Care & Pulmonology', department: 'ICU Wing Alpha', isAvailable: true, activePatients: 4 },
      { id: 'DOC-103', name: 'Dr. Sneha Verma', specialization: 'Interventional Cardiology', department: 'Cath Lab', isAvailable: false, activePatients: 2 },
      { id: 'DOC-104', name: 'Dr. Ananya Roy', specialization: 'Pediatrics & Neonatal Care', department: 'Pediatric Care', isAvailable: true, activePatients: 1 },
      { id: 'DOC-105', name: 'Dr. Vikram Patel', specialization: 'Orthopedic Trauma Surgery', department: 'Operating Theatre 1', isAvailable: false, activePatients: 2 }
    ];

    if (registeredDoctors.length > 0) {
      registeredDoctors.forEach((d, i) => {
        if (!defaultRoster.some(r => r.name === (d.userId && d.userId.name))) {
          defaultRoster.unshift({
            id: `DOC-${d._id.toString().slice(-4)}`,
            name: (d.userId && d.userId.name) || 'Attending Physician',
            specialization: d.specialization || 'General Clinical Medicine',
            department: d.hospital || 'Clinical Ward',
            isAvailable: d.isAvailable !== false,
            activePatients: 2
          });
        }
      });
    }

    res.json({ doctors: defaultRoster });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctor roster' });
  }
});

/**
 * PUT /api/v1/hospitals/blood-bank
 * Updates blood bank unit stock
 */
router.put('/blood-bank', async (req, res) => {
  try {
    const { bloodGroup, count } = req.body;
    if (!bloodGroup || count === undefined) {
      return res.status(400).json({ error: 'Blood group and count are required' });
    }

    runtimeBloodBank[bloodGroup] = Math.max(0, parseInt(count));
    logEvent('BLOOD_BANK_UPDATED', { bloodGroup, newCount: runtimeBloodBank[bloodGroup] });

    res.json({
      message: 'Blood bank inventory updated',
      bloodBank: runtimeBloodBank
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update blood bank' });
  }
});

/**
 * GET /api/v1/hospitals/nearby
 * Existing Nearby Hospitals API
 */
router.get('/nearby', authenticateToken, async (req, res) => {
  try {
    const { lat, lng, radius = 10000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Coordinates are required' });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    let localHospitals = await Hospital.find({
      'location.lat': { $gte: latitude - 0.1, $lte: latitude + 0.1 },
      'location.lng': { $gte: longitude - 0.1, $lte: longitude + 0.1 },
      active: true
    }).limit(5);

    const overpassQuery = `[out:json];node["amenity"="hospital"](around:${radius},${latitude},${longitude});out 10;`;
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`;

    https.get(overpassUrl, (overpassRes) => {
      let data = '';
      overpassRes.on('data', chunk => data += chunk);
      overpassRes.on('end', () => {
        try {
          const results = JSON.parse(data);
          const osmHospitals = results.elements.map(e => ({
            name: e.tags.name || 'Emergency Center',
            location: { lat: e.lat, lng: e.lon },
            emergencyHotline: e.tags.phone || e.tags['contact:phone'] || 'Check Google Maps',
            address: {
              street: e.tags['addr:street'] || '',
              city: e.tags['addr:city'] || ''
            },
            source: 'OpenStreetMap'
          }));

          const combined = [...localHospitals.map(h => ({
            _id: h._id,
            name: h.name,
            location: h.location,
            emergencyHotline: h.emergencyHotline,
            address: h.address,
            status: h.status,
            source: 'LifeQR Verified'
          })), ...osmHospitals].slice(0, 8);

          res.json({ hospitals: combined });
        } catch (e) {
          res.json({ hospitals: localHospitals });
        }
      });
    }).on('error', () => {
      res.json({ hospitals: localHospitals });
    });

  } catch (error) {
    console.error('Nearby Hospitals Error:', error);
    res.status(500).json({ error: 'Failed to find nearby hospitals' });
  }
});

module.exports = router;
