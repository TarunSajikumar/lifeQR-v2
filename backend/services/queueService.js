/**
 * Live Clinic & Doctor Patient Queue Service
 * Handles live token generation, waiting queues, calling patients, and broadcasting
 */

let nextTokenNumber = 4;

let activeQueue = [
  {
    tokenNumber: 1,
    patientName: 'Rahul Sharma',
    qrCodeId: 'RAH-D3200470',
    age: 32,
    gender: 'Male',
    phone: '+91 9876543210',
    bloodGroup: 'O+',
    chiefComplaint: 'Acute chest tightness & intermittent wheezing for 2 days',
    vitals: { hr: 98, bp: '128/84', spo2: 97, temp: '98.8°F' },
    priority: 'URGENT',
    status: 'waiting', // waiting | in_consultation | completed
    waitingSince: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    assignedDoctorName: 'Dr. Amit Sharma',
    roomNumber: 'Consultation Room 102'
  },
  {
    tokenNumber: 2,
    patientName: 'Ananya Verma',
    qrCodeId: 'LQR-PAT-8921',
    age: 27,
    gender: 'Female',
    phone: '+91 9876543215',
    bloodGroup: 'B+',
    chiefComplaint: 'Severe migraine with aura, photophobia, and nausea',
    vitals: { hr: 78, bp: '116/74', spo2: 99, temp: '98.4°F' },
    priority: 'STANDARD',
    status: 'waiting',
    waitingSince: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    assignedDoctorName: 'Dr. Amit Sharma',
    roomNumber: 'Consultation Room 102'
  },
  {
    tokenNumber: 3,
    patientName: 'Vikram Mehta',
    qrCodeId: 'LQR-PAT-8922',
    age: 54,
    gender: 'Male',
    phone: '+91 9876543218',
    bloodGroup: 'A+',
    chiefComplaint: 'Post-prandial epigastric burning and chronic acid reflux',
    vitals: { hr: 82, bp: '135/88', spo2: 98, temp: '98.6°F' },
    priority: 'STANDARD',
    status: 'waiting',
    waitingSince: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    assignedDoctorName: 'Dr. Amit Sharma',
    roomNumber: 'Consultation Room 102'
  }
];

let nowCalling = {
  tokenNumber: null,
  patientName: null,
  doctorName: null,
  roomNumber: null,
  timestamp: null
};

module.exports = {
  getQueue: () => activeQueue,

  getNowCalling: () => nowCalling,

  addToQueue: (patientData) => {
    const token = nextTokenNumber++;
    const queueItem = {
      tokenNumber: token,
      patientName: patientData.patientName || 'Patient',
      qrCodeId: patientData.qrCodeId || `LQR-PAT-${Math.floor(1000 + Math.random() * 9000)}`,
      age: parseInt(patientData.age) || 30,
      gender: patientData.gender || 'Other',
      phone: patientData.phone || '',
      bloodGroup: patientData.bloodGroup || 'N/A',
      chiefComplaint: patientData.chiefComplaint || 'General Consultation',
      vitals: patientData.vitals || { hr: 80, bp: '120/80', spo2: 99, temp: '98.6°F' },
      priority: patientData.priority || 'STANDARD',
      status: 'waiting',
      waitingSince: new Date().toISOString(),
      assignedDoctorName: patientData.assignedDoctorName || 'Dr. Amit Sharma',
      roomNumber: patientData.roomNumber || 'Consultation Room 102'
    };
    activeQueue.push(queueItem);
    return queueItem;
  },

  callPatient: (tokenNumber, doctorName, roomNumber) => {
    const item = activeQueue.find(q => q.tokenNumber === parseInt(tokenNumber));
    if (!item) return null;

    // Update status
    item.status = 'in_consultation';
    item.calledAt = new Date().toISOString();
    if (doctorName) item.assignedDoctorName = doctorName;
    if (roomNumber) item.roomNumber = roomNumber;

    nowCalling = {
      tokenNumber: item.tokenNumber,
      patientName: item.patientName,
      doctorName: item.assignedDoctorName,
      roomNumber: item.roomNumber,
      timestamp: new Date().toISOString()
    };

    return { item, nowCalling };
  },

  completeConsultation: (tokenNumber) => {
    const item = activeQueue.find(q => q.tokenNumber === parseInt(tokenNumber));
    if (item) {
      item.status = 'completed';
      item.completedAt = new Date().toISOString();
    }
    return item;
  }
};
