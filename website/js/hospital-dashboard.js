/**
 * Hospital & Clinic Management Dashboard Controller (LifeQR)
 * High-Contrast Swiss / Brutalist Editorial Standards
 */

let activeAdmissions = [];
let doctorRoster = [];
let bloodBankInventory = {};
let bedData = {};

document.addEventListener('DOMContentLoaded', () => {
  initHospitalDashboard();
  setupEventListeners();
  setupSocketListeners();
});

async function initHospitalDashboard() {
  await Promise.all([
    loadHospitalMetrics(),
    loadAdmissionsList(),
    loadDoctorRoster()
  ]);
  // Periodic refresh every 15s for live telemetry
  setInterval(() => {
    loadHospitalMetrics(true);
    loadAdmissionsList(true);
  }, 15000);
}

/**
 * Load Facility Metrics & Overview
 */
async function loadHospitalMetrics(silent = false) {
  try {
    const res = await window.authFetch('/api/v1/hospitals/metrics');
    if (!res.ok) throw new Error('Failed to fetch hospital metrics');
    const data = await res.json();

    bedData = data.beds || {};
    bloodBankInventory = data.bloodBank || {};

    // Render Stats
    document.getElementById('statTotalInpatients').textContent = data.totalInpatients || 0;
    document.getElementById('statBaysAvailable').textContent = `${bedData.traumaBaysAvailable || 3} / ${bedData.traumaBaysTotal || 4}`;
    document.getElementById('statIcuAvailable').textContent = `${bedData.icuAvailable || 4} / ${bedData.icuTotal || 8}`;
    document.getElementById('statOpdQueue').textContent = data.opdQueueCount || 14;
    document.getElementById('statDoctorsOnDuty').textContent = data.onDutyDoctorsCount || 6;
    
    // Blood total calculation
    const totalBloodUnits = Object.values(bloodBankInventory).reduce((a, b) => a + b, 0);
    document.getElementById('statBloodUnits').textContent = `${totalBloodUnits} Units`;

    renderBloodBankGrid();
    renderBedMatrix();
  } catch (err) {
    if (!silent && typeof showToast === 'function') {
      showToast(err.message, 'error');
    }
  }
}

/**
 * Load Admissions Table
 */
async function loadAdmissionsList(silent = false) {
  try {
    const res = await window.authFetch('/api/v1/hospitals/admissions');
    if (!res.ok) throw new Error('Failed to fetch admissions');
    const data = await res.json();
    activeAdmissions = data.admissions || [];
    renderAdmissionsTable(activeAdmissions);
  } catch (err) {
    if (!silent && typeof showToast === 'function') {
      showToast(err.message, 'error');
    }
  }
}

/**
 * Render Admissions Registry
 */
function renderAdmissionsTable(admissions) {
  const tbody = document.getElementById('admissionsTableBody');
  if (!tbody) return;

  if (admissions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-6 text-center font-mono text-xs text-[#111111]/50 italic">
          No active patient admissions currently registered in the facility.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = admissions.map(adm => {
    let triageBadge = '';
    if (adm.triageLevel === 'CRITICAL') {
      triageBadge = '<span class="px-2 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] font-mono text-[10px] font-bold">🔴 CRITICAL</span>';
    } else if (adm.triageLevel === 'URGENT') {
      triageBadge = '<span class="px-2 py-0.5 border border-amber-500 bg-amber-50 text-amber-800 font-mono text-[10px] font-bold">🟠 URGENT</span>';
    } else {
      triageBadge = '<span class="px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold">🟢 STABLE</span>';
    }

    const timeAgo = new Date(adm.admittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return `
      <tr class="hover:bg-[#f9fafb] transition-colors border-b border-[#111111]/10">
        <td class="p-3.5 font-mono font-bold text-xs text-[#111111]">
          ${adm.id}
        </td>
        <td class="p-3.5">
          <div class="font-bold text-xs text-[#111111] uppercase">${adm.patientName}</div>
          <div class="font-mono text-[10px] text-[#111111]/60 font-semibold">${adm.qrCodeId} &bull; ${adm.age}y &bull; ${adm.gender}</div>
        </td>
        <td class="p-3.5 font-black text-sm text-[#E11D2E]">
          ${adm.bloodGroup}
        </td>
        <td class="p-3.5 font-mono text-xs">
          <div class="font-bold text-[#111111]">${adm.ward}</div>
          <div class="text-[10px] text-[#111111]/60 font-semibold">Bed: ${adm.bedNumber} &bull; Dr: ${adm.attendingDoctor}</div>
        </td>
        <td class="p-3.5">
          ${triageBadge}
        </td>
        <td class="p-3.5 font-mono text-xs text-[#111111]/70">
          <div class="font-bold text-[#111111]">HR: ${adm.vitals?.hr || 80} bpm &bull; SpO2: ${adm.vitals?.spo2 || 99}%</div>
          <div class="text-[10px] text-[#111111]/60">BP: ${adm.vitals?.bp || '120/80'} &bull; In: ${timeAgo}</div>
        </td>
        <td class="p-3.5 text-right font-mono">
          <button onclick="dischargePatient('${adm.id}')" class="btn-secondary text-[11px] px-3 py-1 uppercase tracking-wider font-bold">
            Discharge
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

/**
 * Filter Admissions by Search Query
 */
function filterAdmissions(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    renderAdmissionsTable(activeAdmissions);
    return;
  }
  const filtered = activeAdmissions.filter(a => 
    a.patientName.toLowerCase().includes(q) ||
    a.qrCodeId.toLowerCase().includes(q) ||
    a.ward.toLowerCase().includes(q) ||
    a.bloodGroup.toLowerCase().includes(q)
  );
  renderAdmissionsTable(filtered);
}

/**
 * Discharge Patient
 */
async function dischargePatient(admissionId) {
  if (!confirm(`Are you sure you want to discharge admission record ${admissionId}?`)) return;

  try {
    const res = await window.authFetch(`/api/v1/hospitals/admissions/${admissionId}/discharge`, {
      method: 'PUT'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to discharge patient');

    if (typeof showToast === 'function') {
      showToast(`Patient discharged successfully. Bed freed.`, 'success');
    }
    await loadHospitalMetrics();
    await loadAdmissionsList();
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message, 'error');
    }
  }
}

/**
 * Open Fast Admission Modal
 */
function openAdmitModal() {
  const modal = document.getElementById('admitPatientModal');
  if (modal) modal.classList.remove('hidden');
}

function closeAdmitModal() {
  const modal = document.getElementById('admitPatientModal');
  if (modal) modal.classList.add('hidden');
}

/**
 * Handle Patient Admission Form
 */
async function handleAdmissionSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('admitName').value;
  const qrId = document.getElementById('admitQrId').value;
  const blood = document.getElementById('admitBlood').value;
  const age = document.getElementById('admitAge').value;
  const gender = document.getElementById('admitGender').value;
  const ward = document.getElementById('admitWard').value;
  const doctor = document.getElementById('admitDoctor').value;
  const triage = document.getElementById('admitTriage').value;

  try {
    const res = await window.authFetch('/api/v1/hospitals/admissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: name,
        qrCodeId: qrId,
        bloodGroup: blood,
        age: parseInt(age) || 30,
        gender,
        ward,
        attendingDoctor: doctor,
        triageLevel: triage
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to admit patient');

    if (typeof showToast === 'function') {
      showToast(`Patient ${name} admitted to ${ward}!`, 'success');
    }
    closeAdmitModal();
    document.getElementById('admissionForm').reset();
    await loadHospitalMetrics();
    await loadAdmissionsList();
  } catch (err) {
    if (typeof showToast === 'function') {
      showToast(err.message, 'error');
    }
  }
}

/**
 * Quick QR Lookup Auto-fill
 */
async function lookupQrForAdmission() {
  const qrInput = document.getElementById('admitQrId');
  const code = (qrInput?.value || '').trim();
  if (!code) {
    if (typeof showToast === 'function') showToast('Please enter a QR Code ID first', 'warning');
    return;
  }

  try {
    const res = await window.authFetch(`/api/v1/patient/profile/${code}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Patient QR not found');

    const pat = data.patient || data;
    if (document.getElementById('admitName')) document.getElementById('admitName').value = pat.name || (pat.user && pat.user.name) || '';
    if (document.getElementById('admitBlood')) document.getElementById('admitBlood').value = pat.bloodGroup || (pat.profile && pat.profile.bloodGroup) || '';
    if (document.getElementById('admitAge')) document.getElementById('admitAge').value = pat.age || (pat.profile && pat.profile.age) || '';
    if (document.getElementById('admitGender')) document.getElementById('admitGender').value = pat.gender || (pat.profile && pat.profile.gender) || 'male';

    if (typeof showToast === 'function') showToast('LifeQR data loaded successfully!', 'success');
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
  }
}

/**
 * Render Visual Bed Matrix
 */
function renderBedMatrix() {
  const container = document.getElementById('bedMatrixGrid');
  if (!container) return;

  const bays = [
    { name: 'Bay 1 - Resuscitation Alpha', code: 'TB-01', type: 'Trauma Bay', occupied: true, patient: 'Rahul Sharma' },
    { name: 'Bay 2 - Surgical Trauma', code: 'TB-02', type: 'Trauma Bay', occupied: false },
    { name: 'Bay 3 - Cardiac Care', code: 'TB-03', type: 'Trauma Bay', occupied: true, patient: 'Reserved / Cath Lab' },
    { name: 'Bay 4 - Fast Track', code: 'TB-04', type: 'Trauma Bay', occupied: false },
    { name: 'ICU Bed 1', code: 'ICU-01', type: 'ICU', occupied: true, patient: 'Patient A. Roy' },
    { name: 'ICU Bed 2', code: 'ICU-02', type: 'ICU', occupied: false },
    { name: 'ICU Bed 3', code: 'ICU-03', type: 'ICU', occupied: true, patient: 'Priya Patel' },
    { name: 'ICU Bed 4', code: 'ICU-04', type: 'ICU', occupied: false },
    { name: 'General Bed 1', code: 'GW-01', type: 'General', occupied: true, patient: 'Patient D. V.' },
    { name: 'General Bed 2', code: 'GW-02', type: 'General', occupied: false },
    { name: 'General Bed 3', code: 'GW-03', type: 'General', occupied: false },
    { name: 'General Bed 4', code: 'GW-04', type: 'General', occupied: true, patient: 'Anil Kumar' }
  ];

  container.innerHTML = bays.map(b => {
    const isOcc = b.occupied;
    const badgeColor = isOcc 
      ? 'border-[#E11D2E] bg-red-50 text-[#E11D2E]' 
      : 'border-emerald-600 bg-emerald-50 text-emerald-800';

    return `
      <div class="p-3.5 border-2 border-[#111111] bg-white flex flex-col justify-between space-y-2 shadow-[3px_3px_0px_#111111]">
        <div class="flex items-center justify-between">
          <span class="font-mono font-bold text-xs text-[#111111]">${b.code}</span>
          <span class="px-2 py-0.5 border ${badgeColor} font-mono text-[9px] font-bold uppercase">
            ${isOcc ? 'OCCUPIED' : 'READY'}
          </span>
        </div>
        <div>
          <p class="font-black text-xs text-[#111111] uppercase">${b.name}</p>
          <p class="font-mono text-[10px] text-[#111111]/60 mt-0.5">${isOcc ? b.patient : 'Available for Admission'}</p>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Load Doctors Roster
 */
async function loadDoctorRoster() {
  try {
    const res = await window.authFetch('/api/v1/hospitals/doctors');
    if (!res.ok) throw new Error('Failed to fetch doctor roster');
    const data = await res.json();
    doctorRoster = data.doctors || [];
    renderDoctorRoster();
  } catch (err) {
    console.warn('Doctor roster error:', err);
  }
}

function renderDoctorRoster() {
  const container = document.getElementById('doctorRosterList');
  if (!container) return;

  container.innerHTML = doctorRoster.map(doc => {
    const isAvail = doc.isAvailable !== false;
    return `
      <div class="p-4 border-2 border-[#111111] bg-white flex items-center justify-between gap-3 shadow-[3px_3px_0px_#111111]">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 border-2 border-[#111111] bg-[#f9fafb] text-[#E11D2E] flex items-center justify-center font-black text-sm">
            Dr
          </div>
          <div>
            <h4 class="font-black text-xs uppercase text-[#111111]">${doc.name}</h4>
            <p class="font-mono text-[10px] text-[#111111]/70 font-semibold">${doc.specialization} &bull; ${doc.department}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 border font-mono text-[10px] font-bold uppercase ${isAvail ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-amber-500 bg-amber-50 text-amber-800'}">
            ${isAvail ? 'AVAILABLE' : 'IN SURGERY'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render Blood Bank Inventory
 */
function renderBloodBankGrid() {
  const container = document.getElementById('bloodBankGrid');
  if (!container) return;

  const groups = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  container.innerHTML = groups.map(grp => {
    const units = bloodBankInventory[grp] || 0;
    const isLow = units < 8;
    return `
      <div class="p-3 border-2 border-[#111111] bg-white text-center flex flex-col justify-between space-y-1 shadow-[3px_3px_0px_#111111]">
        <span class="font-mono text-[10px] font-bold text-[#111111]/60 uppercase">${grp} UNITS</span>
        <span class="font-black text-2xl ${isLow ? 'text-[#E11D2E]' : 'text-[#111111]'}">${units}</span>
        <div class="flex items-center justify-center gap-1 pt-1 font-mono">
          <button onclick="adjustBloodStock('${grp}', -1)" class="w-6 h-6 border border-[#111111] bg-[#f3f4f6] hover:bg-[#111111] hover:text-white font-bold text-xs flex items-center justify-center cursor-pointer">-</button>
          <button onclick="adjustBloodStock('${grp}', 1)" class="w-6 h-6 border border-[#111111] bg-[#f3f4f6] hover:bg-[#E11D2E] hover:text-white font-bold text-xs flex items-center justify-center cursor-pointer">+</button>
        </div>
      </div>
    `;
  }).join('');
}

async function adjustBloodStock(bloodGroup, delta) {
  const current = bloodBankInventory[bloodGroup] || 0;
  const newCount = Math.max(0, current + delta);
  bloodBankInventory[bloodGroup] = newCount;
  renderBloodBankGrid();

  try {
    await window.authFetch('/api/v1/hospitals/blood-bank', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bloodGroup, count: newCount })
    });
  } catch (e) {
    console.warn('Blood bank sync failed:', e);
  }
}

/**
 * Socket.IO Real-time Inbound Alerts
 */
function setupSocketListeners() {
  if (typeof io !== 'undefined') {
    try {
      const socket = io({ withCredentials: true });
      socket.on('connect', () => {
        socket.emit('join-hospital-room', 'hospital:er');
      });

      socket.on('sos-alert', (data) => {
        if (typeof showToast === 'function') {
          showToast(`🚨 INCOMING SOS DISPATCH: ${data.name || 'Emergency Patient'} (${data.bloodGroup || 'N/A'})`, 'error');
        }
        loadAdmissionsList(true);
      });

      socket.on('er-vitals-stream', (data) => {
        if (typeof showToast === 'function') {
          showToast(`🚑 INCOMING AMBULANCE: ETA ${data.etaMinutes || 10}m | HR: ${data.pulse || '-'} | SpO2: ${data.spo2 || '-'}%`, 'warning');
        }
        loadHospitalMetrics(true);
      });
    } catch (e) {
      console.warn('Socket connection fallback:', e);
    }
  }
}

function setupEventListeners() {
  const form = document.getElementById('admissionForm');
  if (form) {
    form.addEventListener('submit', handleAdmissionSubmit);
  }
}

// Tab Switcher
function switchHospitalTab(tabId) {
  document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.hospital-tab-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.remove('bg-[#111111]');
    b.classList.remove('text-white');
    b.classList.add('bg-white');
    b.classList.add('text-[#111111]');
  });

  const activePanel = document.getElementById(`panel-${tabId}`);
  const activeBtn = document.getElementById(`tabBtn-${tabId}`);
  if (activePanel) activePanel.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('active');
    activeBtn.classList.add('bg-[#111111]');
    activeBtn.classList.add('text-white');
    activeBtn.classList.remove('bg-white');
    activeBtn.classList.remove('text-[#111111]');
  }
}
