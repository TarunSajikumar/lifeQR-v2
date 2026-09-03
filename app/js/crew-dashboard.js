// Crew Dashboard JS Module
let currentUser = null;
let activePatient = null;
let scannerInstance = null;
let mapInstance = null;
let mapMarker = null;
let activeSosId = null;

function crewApiFetch(endpoint, options = {}) {
  const request = window.authFetch || fetch;
  const url = window.getApiUrl ? window.getApiUrl(endpoint) : (endpoint.startsWith('http') ? endpoint : `/api/v1${endpoint}`);
  return request(url, { ...options, credentials: 'include' });
}

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
    <div class="mb-6 p-5 bg-white border-2 border-[#E11D2E] shadow-[4px_4px_0px_#E11D2E] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start sm:items-center gap-3.5">
        <div class="w-11 h-11 border-2 border-[#111111] bg-[#111111] text-white flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-2xl text-[#E11D2E]">ambulance</span>
        </div>
        <div>
          <h4 class="font-black text-[#111111] text-sm uppercase tracking-tight flex items-center gap-2">
            Emergency Dispatcher Clearance Required
            <span class="px-2 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] text-[10px] font-mono font-bold uppercase tracking-wider">${status}</span>
          </h4>
          <p class="text-xs text-[#111111]/70 font-sans font-medium mt-0.5">
            Your emergency responder account is pending clearance by dispatch administrators before performing patient triage lookups.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
        <span class="px-4 py-2 border-2 border-[#111111] bg-[#f9fafb] text-[#111111] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span class="live-dot"></span>
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
    const response = await crewApiFetch('/sos/acknowledge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    showToast('Please enter or scan a Patient QR Code ID (e.g. RAH-D3200470)', 'warning');
    return;
  }

  showPatientSkeleton();

  try {
    const response = await crewApiFetch(`/patient/profile/${encodeURIComponent(qrId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Patient profile not found for ID: ' + qrId);

    activePatient = data;

    await logCrewTriageAccess(qrId);
    renderPatientDetails();
    showToast(`Emergency record loaded for ${data.name || qrId}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    hidePatientView();
  }
};

async function logCrewTriageAccess(qrCodeId) {
  try {
    await crewApiFetch(`/patient/log-scan/${encodeURIComponent(qrCodeId)}`, {
      method: 'POST'
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
  const qrId = activePatient.qrCodeId || (document.getElementById('patientQrId') ? document.getElementById('patientQrId').value.trim() : '') || 'N/A';
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
  setTxt('patId', qrId);
  setTxt('patBlood', bloodGroup);
  setTxt('patBloodGroup', bloodGroup);
  setTxt('patGender', gender !== 'N/A' ? gender.toUpperCase() : 'N/A');
  setTxt('patAge', age !== 'N/A' ? `${age} Yrs` : 'N/A');
  setTxt('patAllergies', allergies);
  setTxt('patMeds', medications);
  setTxt('patMedications', medications);
  setTxt('patIssues', healthIssues);
  setTxt('patHealthIssues', healthIssues);

  const contactsContainer = document.getElementById('patEmergencyContact') || document.getElementById('patContactsList');
  if (contactsContainer) {
    contactsContainer.innerHTML = '';
    const contacts = activePatient.emergencyContacts || (activePatient.profile && activePatient.profile.emergencyContacts) || [];
    if (contacts.length === 0) {
      contactsContainer.innerHTML = `<p class="text-xs text-slate-400 italic">No emergency contacts registered.</p>`;
    } else {
      contacts.forEach((c, idx) => {
        const div = document.createElement('div');
        div.className = 'p-3 bg-[#111111] border-2 border-[#2e2e2e] flex items-center justify-between gap-3 mb-2';
        div.innerHTML = `
          <div>
            <div class="flex items-center gap-2">
              <p class="text-xs font-bold text-white uppercase">${c.name || 'Emergency Contact'}</p>
              <span class="px-1.5 py-0.5 bg-red-950/60 border border-[#E11D2E] text-[#E11D2E] text-[10px] font-mono font-bold uppercase">${c.relationship || `Priority ${idx + 1}`}</span>
            </div>
            <p class="text-xs text-slate-300 font-mono mt-0.5">${c.phone || '-'}</p>
          </div>
          ${c.phone ? `
          <a href="tel:${c.phone}" class="px-3.5 py-1.5 bg-[#E11D2E] hover:bg-white hover:text-[#111111] text-white text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]">
            <span class="material-symbols-outlined text-xs">call</span> Call
          </a>` : ''}
        `;
        contactsContainer.appendChild(div);
      });
    }
  }

  const loc = activePatient.lastLocation || activePatient.location;
  if (loc && loc.lat && loc.lng) {
    renderEmergencyMap(loc.lat, loc.lng);
    loadNearbyHospitals(loc.lat, loc.lng);
    const gmapsBtn = document.getElementById('gmapsNavBtn');
    if (gmapsBtn) {
      gmapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}`;
    }
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
    const res = await crewApiFetch(`/hospitals/nearby?lat=${lat}&lng=${lng}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    container.innerHTML = '';

    if (!data.hospitals || data.hospitals.length === 0) {
      container.innerHTML = '<p class="col-span-full text-center text-xs text-slate-500">No medical facilities found in 10km radius.</p>';
      return;
    }

    data.hospitals.forEach(h => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-3 transition hover:-translate-y-0.5';

      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${h.location.lat},${h.location.lng}`;

      card.innerHTML = `
        <div class="flex items-start justify-between pb-2 border-b-2 border-[#111111]/10">
          <div class="space-y-0.5">
            <h4 class="font-black text-[#111111] text-xs uppercase tracking-tight">${h.name}</h4>
            <p class="text-[10px] font-mono font-bold text-[#111111]/60 uppercase">${h.address.street || ''} ${h.address.city || ''}</p>
          </div>
          <span class="px-2 py-0.5 border border-[#111111] bg-white text-[#111111] text-[9px] font-mono font-bold uppercase">${h.source || 'ER'}</span>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <a href="tel:${h.emergencyHotline}" class="btn-danger flex-1 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 shadow-[2px_2px_0px_#111111]">
            <span class="material-symbols-outlined text-xs">call</span> Hot-line
          </a>
          <a href="${mapsUrl}" target="_blank" class="btn-primary flex-1 py-1.5 text-[10px] uppercase font-mono font-bold tracking-wider flex items-center justify-center gap-1 shadow-[2px_2px_0px_#111111]">
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
  const container = document.getElementById('mapWrapper') || document.getElementById('emergencyMapContainer');
  if (container) container.classList.remove('hidden');

  const mapEl = document.getElementById('leafletMapContainer') || document.getElementById('emergencyMap');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    console.warn('Leaflet library not loaded.');
    return;
  }

  if (!mapInstance) {
    mapInstance = L.map(mapEl).setView([lat, lng], 14);
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

  setTimeout(() => {
    if (mapInstance) mapInstance.invalidateSize();
  }, 200);
}

function setupCrewListeners() {
  const ackBtn = document.getElementById('ackSosBtn');
  if (ackBtn) {
    ackBtn.addEventListener('click', window.acknowledgeSosAlert);
  }

  const qrInput = document.getElementById('patientQrId');
  if (qrInput) {
    qrInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.searchPatient();
      }
    });
  }
}

window.closeSosPopup = function() {
  const popup = document.getElementById('sosAlertPopup');
  if (popup) popup.classList.add('hidden');
};

window.logIncidentStage = async function(stageName) {
  if (!activePatient) {
    showToast('Please search or scan a patient before logging incident checkpoints', 'warning');
    return;
  }
  const qrId = activePatient.qrCodeId || (document.getElementById('patientQrId') ? document.getElementById('patientQrId').value.trim() : '');
  try {
    await crewApiFetch(`/history/add/${encodeURIComponent(qrId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'vital',
        title: `Paramedic Checkpoint: ${stageName}`,
        description: `Field responder logged stage '${stageName}' for patient ${activePatient.name || qrId}.`
      })
    });
    showToast(`✓ Incident Logged: ${stageName}`, 'success');
  } catch (err) {
    showToast(`Checkpoint Recorded: ${stageName}`, 'info');
  }
};

// QR Scanner setup
window.startQRScanner = function() {
  if (!scannerInstance) {
    scannerInstance = new QRScanner({
      onSuccess: (result) => {
        stopQRScanner();
        let parsedId = String(result || '').trim();
        try {
          const scannedUrl = new URL(parsedId);
          parsedId = scannedUrl.searchParams.get('id') || scannedUrl.pathname.split('/').filter(Boolean).pop() || parsedId;
        } catch (e) {}
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
    const res = await crewApiFetch('/er/stream-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCodeId: qrId,
        etaMinutes: eta,
        triageLevel,
        vitals: {
          heartRate: hr,
          bpSystolic: bpSys,
          bpDia,
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
