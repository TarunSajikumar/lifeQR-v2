// Crew Dashboard JS Module
let currentUser = null;
let activePatient = null;
let scannerInstance = null;
let mapInstance = null;
let mapMarker = null;
let activeSosId = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await checkDashboardAccess(['crew']);
  if (!currentUser) return;

  // Initialize Socket.IO connection for real-time SOS alerts
  initSocketConnection();

  // Check account verification status
  await checkVerificationStatus();

  // Setup form submit listeners
  setupCrewListeners();
});

async function checkVerificationStatus() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/verification/status') : '/api/v1/verification/status';
    const res = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    if (!res.ok) return;
    const data = await res.json();
    currentUser.verificationStatus = data.verificationStatus;
    renderVerificationBanner(data.verificationStatus);
  } catch (e) {
    console.warn('Failed to check crew verification status:', e);
  }
}

function renderVerificationBanner(status) {
  const container = document.getElementById('verificationBannerContainer');
  if (!container) return;

  if (status === 'VERIFIED') {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="mb-6 p-5 bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-900/60 border border-rose-500/50 rounded-3xl shadow-xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start sm:items-center gap-3.5 text-white">
        <div class="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-md flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">ambulance</span>
        </div>
        <div>
          <h4 class="font-bold text-white text-sm flex items-center gap-2">
            Emergency Dispatcher Clearance Required
            <span class="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[10px] uppercase font-extrabold tracking-wider border border-rose-500/40">${status}</span>
          </h4>
          <p class="text-xs text-slate-300 font-medium mt-0.5">
            Your emergency responder account is pending clearance by dispatch administrators before performing patient triage lookups.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
        <span class="px-4 py-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base">pending</span>
          <span>Pending Dispatch Approval</span>
        </span>
      </div>
    </div>
  `;
}

function initSocketConnection() {
  try {
    const socket = io({ withCredentials: true });
    socket.on('sos-alert', (data) => {
      activeSosId = data.sosId;
      showSosAlertPopup(data);
    });

    socket.on('trauma-bay-assigned', (data) => {
      showToast(`🏥 TRAUMA BAY ASSIGNED BY ER: ${data.assignedBay} for ${data.patientName}!`, 'success', 10000);
    });
  } catch (e) {
    console.warn('Real-time Socket.IO connection failed. Crew alert broadcast disabled.');
  }
}

function showSosAlertPopup(data) {
  const popup = document.getElementById('sosAlertPopup');
  if (popup) popup.classList.remove('hidden');

  showToast(`🚨 EMERGENCY: SOS triggered by ${data.name}!`, 'emergency', 10000);

  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setTxt('sosPatName', data.name);
  setTxt('sosPatBlood', data.bloodGroup || 'N/A');
  setTxt('sosPatAllergies', data.allergies || 'None');
  setTxt('sosPatMessage', data.message || '');
  setTxt('sosPatLoc', `${data.location.lat.toFixed(4)}, ${data.location.lng.toFixed(4)}`);

  const input = document.getElementById('patientQrId');
  if (input) input.value = data.patientId;
}

window.acknowledgeSosAlert = async function() {
  if (!activeSosId) return;
  try {
    const response = await fetch('/api/v1/sos/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sosId: activeSosId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('SOS alert acknowledged. Navigation route updated!', 'success');
    const popup = document.getElementById('sosAlertPopup');
    if (popup) popup.classList.add('hidden');

    searchPatient();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.searchPatient = async function() {
  const input = document.getElementById('patientQrId');
  const qrId = input ? input.value.trim() : '';
  if (!qrId) {
    showToast('Please enter or scan a Patient QR Code ID', 'warning');
    return;
  }

  showPatientSkeleton();

  try {
    const response = await fetch(`/api/v1/patient/profile/${qrId}`, { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Patient profile not found');

    activePatient = data;

    await logCrewTriageAccess(qrId);
    renderPatientDetails();
  } catch (err) {
    showToast(err.message, 'error');
    hidePatientView();
  }
};

async function logCrewTriageAccess(qrCodeId) {
  try {
    await fetch(`/api/v1/patient/log-scan/${qrCodeId}`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn('Failed to log triage scan.');
  }
}

function showPatientSkeleton() {
  const panel = document.getElementById('patientDetailsPanel');
  const skel = document.getElementById('patientSkeleton');
  const content = document.getElementById('patientContent');
  if (panel) panel.classList.remove('hidden');
  if (skel) skel.classList.remove('hidden');
  if (content) content.classList.add('hidden');
}

function hidePatientView() {
  const panel = document.getElementById('patientDetailsPanel');
  if (panel) panel.classList.add('hidden');
}

function renderPatientDetails() {
  const skel = document.getElementById('patientSkeleton');
  const content = document.getElementById('patientContent');
  if (skel) skel.classList.add('hidden');
  if (content) content.classList.remove('hidden');

  const name = activePatient.name || (activePatient.user && activePatient.user.name) || 'Emergency Patient';
  const bloodGroup = activePatient.bloodGroup || (activePatient.profile && activePatient.profile.bloodGroup) || 'N/A';
  const gender = activePatient.gender || (activePatient.user && activePatient.user.gender) || 'N/A';
  const age = activePatient.age || (activePatient.profile && activePatient.profile.age) || 'N/A';
  const allergies = activePatient.allergies || (activePatient.profile && activePatient.profile.allergies) || 'None Reported';
  const medications = activePatient.medications || (activePatient.profile && activePatient.profile.medications) || 'None Reported';
  const healthIssues = activePatient.healthIssues || (activePatient.profile && activePatient.profile.healthIssues) || 'None Reported';

  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt;
  };

  setTxt('patName', name);
  setTxt('patBlood', bloodGroup);
  setTxt('patGender', gender !== 'N/A' ? gender.toUpperCase() : 'N/A');
  setTxt('patAge', age !== 'N/A' ? `${age} Yrs` : 'N/A');
  setTxt('patAllergies', allergies);
  setTxt('patMeds', medications);
  setTxt('patIssues', healthIssues);

  const contactsContainer = document.getElementById('patContactsList');
  if (contactsContainer) {
    const contacts = activePatient.emergencyContacts || (activePatient.profile && activePatient.profile.emergencyContacts) || [];
    if (contacts.length === 0) {
      contactsContainer.innerHTML = `<p class="text-xs text-slate-400 italic">No emergency contacts registered.</p>`;
    } else {
      contacts.forEach(c => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between';
        div.innerHTML = `
          <div>
            <p class="text-xs font-bold text-slate-100">${c.name} (${c.relationship || 'Contact'})</p>
            <p class="text-[10px] text-slate-400 font-mono">${c.phone}</p>
          </div>
          <a href="tel:${c.phone}" class="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition">
            <span class="material-symbols-outlined text-xs">call</span> Call
          </a>
        `;
        contactsContainer.appendChild(div);
      });
    }
  }

  if (activePatient.location && activePatient.location.lat) {
    renderEmergencyMap(activePatient.location.lat, activePatient.location.lng);
    loadNearbyHospitals(activePatient.location.lat, activePatient.location.lng);
  }
}

async function loadNearbyHospitals(lat, lng) {
  const wrapper = document.getElementById('hospitalWrapper');
  const container = document.getElementById('hospitalsList');
  if (!wrapper || !container) return;

  wrapper.classList.remove('hidden');
  container.innerHTML = `
    <div class="col-span-full py-4 text-center">
      <span class="material-symbols-outlined text-teal-500 animate-spin">sync</span>
      <p class="text-[10px] text-slate-400 mt-1 uppercase font-bold">Scanning Area for Nearest Medical Facilities...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/v1/hospitals/nearby?lat=${lat}&lng=${lng}`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    container.innerHTML = '';

    if (data.hospitals.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-xs text-slate-500">No medical facilities found in 10km radius.</p>';
      return;
    }

    data.hospitals.forEach(h => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-3 hover:border-teal-500/50 transition';

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`;

      card.innerHTML = `
        <div class="flex items-start justify-between">
          <div class="space-y-0.5">
            <h4 class="font-bold text-white text-xs leading-tight">${h.name}</h4>
            <p class="text-[10px] text-slate-400">${h.address.street || ''} ${h.address.city || ''}</p>
          </div>
          <span class="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[8px] font-bold uppercase">${h.source}</span>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <a href="tel:${h.emergencyHotline}" class="flex-1 py-1.5 bg-rose-600/20 border border-rose-500/30 text-rose-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-rose-600 hover:text-white transition">
            <span class="material-symbols-outlined text-xs">call</span> Hot-line
          </a>
          <a href="${mapsUrl}" target="_blank" class="flex-1 py-1.5 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-indigo-600 hover:text-white transition">
            <span class="material-symbols-outlined text-xs">directions</span> Route
          </a>
        </div>
      `;
      container.appendChild(card);

      // Also add marker to main map if possible
      if (typeof L !== 'undefined' && mapInstance) {
        L.marker([h.location.lat, h.location.lng], {
          icon: L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-color:#14b8a6; width:12px; height:12px; border-radius:50%; border:2px solid white;'></div>`,
            iconSize: [12, 12],
            iconAnchor: [6, 6]
          })
        }).addTo(mapInstance).bindPopup(`<b>${h.name}</b><br><a href="${mapsUrl}" target="_blank">Navigate Now</a>`);
      }
    });

  } catch (err) {
    container.innerHTML = `<p class="col-span-full text-center text-xs text-rose-400">Failed to load hospitals: ${err.message}</p>`;
  }
}

function renderEmergencyMap(lat, lng) {
  const container = document.getElementById('emergencyMapContainer');
  if (!container) return;
  container.classList.remove('hidden');

  if (!mapInstance) {
    mapInstance = L.map('emergencyMap').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance);
  } else {
    mapInstance.setView([lat, lng], 14);
  }

  if (mapMarker) {
    mapMarker.setLatLng([lat, lng]);
  } else {
    mapMarker = L.marker([lat, lng]).addTo(mapInstance)
      .bindPopup('<b>Patient Live Location</b>')
      .openPopup();
  }
}

function setupCrewListeners() {}

// QR Scanner setup
window.startQRScanner = function() {
  if (!scannerInstance) {
    scannerInstance = new QRScanner({
      onSuccess: (result) => {
        stopQRScanner();
        let parsedId = result;
        if (result.includes('id=')) {
          parsedId = new URL(result).searchParams.get('id');
        }
        const input = document.getElementById('patientQrId');
        if (input) input.value = parsedId;
        searchPatient();
      },
      onError: (err) => {
        showToast(`Scanner issue: ${err.message || err}`, 'error');
      }
    });
  }

  scannerInstance.start();
};

window.stopQRScanner = function() {
  if (scannerInstance) {
    scannerInstance.stop();
  }
};

window.openERStreamModal = function() {
  const modal = document.getElementById('erStreamModal');
  if (!activePatient) {
    showToast('Please search or scan a Patient QR Code first before streaming vitals to ER', 'warning');
    return;
  }
  if (modal) modal.classList.remove('hidden');
};

window.closeERStreamModal = function() {
  const modal = document.getElementById('erStreamModal');
  if (modal) modal.classList.add('hidden');
};

window.sendERLiveStream = async function() {
  if (!activePatient) {
    showToast('No active patient selected for ER vitals stream', 'error');
    return;
  }

  const eta = parseInt(document.getElementById('erEtaMinutes').value) || 10;
  const hr = parseInt(document.getElementById('erPulse').value) || 100;
  const spo2 = parseInt(document.getElementById('erSpO2').value) || 98;
  const bpStr = document.getElementById('erBp').value || '120/80';
  const triageLevel = document.getElementById('erTriageLevel').value || 'CRITICAL';
  const complaint = document.getElementById('erComplaint').value || 'Acute Distress';

  const bpParts = bpStr.split('/');
  const bpSys = parseInt(bpParts[0]) || 120;
  const bpDia = parseInt(bpParts[1]) || 80;

  const qrId = activePatient.qrCodeId || (document.getElementById('patientQrId') ? document.getElementById('patientQrId').value : '');

  try {
    const res = await fetch('/api/v1/er/stream-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        qrCodeId: qrId,
        etaMinutes: eta,
        triageLevel,
        vitals: {
          heartRate: hr,
          bpSystolic: bpSys,
          bpDiastolic: bpDia,
          spO2: spo2,
          gcs: 15
        },
        chiefComplaint: complaint
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('📡 Live in-transit vitals & ETA streamed to Hospital ER Desk!', 'success');
    closeERStreamModal();
  } catch (err) {
    showToast(err.message, 'error');
  }
};
