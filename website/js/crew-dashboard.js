// Crew Dashboard JS Module
let currentUser = null;
let activePatient = null;
let scannerInstance = null;
let mapInstance = null;
let mapMarker = null;
let activeSosId = null;
let activeSosLocation = null;

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

  // Load crew help tickets
  loadCrewHelpTickets();
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

    socket.on('help-ticket-updated', (data) => {
      showToast(`LifeQR Dispatch Admin updated ticket ${data.ticketId} (${data.status})`, 'info');
      loadCrewHelpTickets();
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
  if (data.location && typeof data.location.lat === 'number') {
    activeSosLocation = data.location;
  }

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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function showPatientSkeleton() {
  const standby = document.getElementById('standbyDeck');
  if (standby) standby.classList.add('hidden');
  const panel = document.getElementById('patientDetailsPanel');
  const skel = document.getElementById('patientSkeleton');
  const content = document.getElementById('patientContent');
  const clearBtn = document.getElementById('clearTriageBtn');
  if (clearBtn) clearBtn.classList.remove('hidden');
  if (panel) panel.classList.remove('hidden');
  if (skel) skel.classList.remove('hidden');
  if (content) content.classList.add('hidden');
}

function hidePatientView() {
  const panel = document.getElementById('patientDetailsPanel');
  if (panel) panel.classList.add('hidden');
  const standby = document.getElementById('standbyDeck');
  if (standby) standby.classList.remove('hidden');
  const clearBtn = document.getElementById('clearTriageBtn');
  if (clearBtn) clearBtn.classList.add('hidden');
  activePatient = null;
  activeSosLocation = null;
  if (mapInstance) {
    try { mapInstance.remove(); } catch (e) {}
    mapInstance = null;
    mapMarker = null;
  }
}

window.resetTriageView = function() {
  activePatient = null;
  const qrInput = document.getElementById('patientQrId');
  if (qrInput) qrInput.value = '';
  hidePatientView();
  showToast('Triage console reset to standby readiness', 'info');
};

window.quickSearchPatient = function(id) {
  const qrInput = document.getElementById('patientQrId');
  if (qrInput) qrInput.value = id;
  searchPatient();
};

function renderPatientDetails() {
  const skel = document.getElementById('patientSkeleton');
  const content = document.getElementById('patientContent');
  const standby = document.getElementById('standbyDeck');
  if (standby) standby.classList.add('hidden');
  if (skel) skel.classList.add('hidden');
  if (content) content.classList.remove('hidden');
  const clearBtn = document.getElementById('clearTriageBtn');
  if (clearBtn) clearBtn.classList.remove('hidden');

  const name = activePatient.name || (activePatient.user && activePatient.user.name) || 'Emergency Patient';
  const qrId = activePatient.qrCodeId || (document.getElementById('patientQrId') ? document.getElementById('patientQrId').value.trim() : '') || 'N/A';
  const bloodGroup = activePatient.bloodGroup || (activePatient.profile && activePatient.profile.bloodGroup) || 'N/A';
  const gender = activePatient.gender || (activePatient.user && activePatient.user.gender) || 'N/A';
  const age = activePatient.age || (activePatient.profile && activePatient.profile.age) || 'N/A';
  const phone = activePatient.phone || (activePatient.user && activePatient.user.phone) || 'N/A';
  const address = activePatient.address || (activePatient.user && activePatient.user.address) || 'Registered Scene Location';
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
  setTxt('patPhone', phone);
  setTxt('patAddress', address);
  setTxt('patAllergies', allergies);
  setTxt('patMeds', medications);
  setTxt('patMedications', medications);
  setTxt('patIssues', healthIssues);
  setTxt('patHealthIssues', healthIssues);

  // Phone Direct Call Button
  const phoneCallBtn = document.getElementById('patPhoneCallBtn');
  if (phoneCallBtn) {
    if (phone && phone !== 'N/A') {
      phoneCallBtn.href = `tel:${phone}`;
      phoneCallBtn.classList.remove('hidden');
    } else {
      phoneCallBtn.classList.add('hidden');
    }
  }

  // Allergy Flash Warning Banner
  const allergyBanner = document.getElementById('patAllergyBanner');
  if (allergyBanner) {
    const allergiesStr = Array.isArray(allergies) ? allergies.join(', ') : String(allergies);
    if (allergiesStr && allergiesStr.toLowerCase() !== 'none' && allergiesStr.toLowerCase() !== 'none reported' && allergiesStr.toLowerCase() !== 'none known') {
      allergyBanner.classList.remove('hidden');
      const textEl = document.getElementById('patAllergyBannerText');
      if (textEl) textEl.textContent = `ALERT: High-risk patient allergies reported: ${allergiesStr}`;
    } else {
      allergyBanner.classList.add('hidden');
    }
  }

  // PATIENT PHOTO RENDERING
  const photoEl = document.getElementById('patPhoto');
  if (photoEl) {
    const pPhoto = activePatient.profilePhoto || (activePatient.user && activePatient.user.profilePhoto);
    if (pPhoto && !pPhoto.startsWith('/uploads')) {
      photoEl.src = pPhoto;
    } else if (qrId && qrId !== 'N/A') {
      photoEl.src = `/api/v1/emergency-access/${encodeURIComponent(qrId)}/photo`;
    } else {
      photoEl.src = '/LifeQR.png';
    }
    photoEl.onerror = function() {
      this.onerror = null;
      this.src = '/LifeQR.png';
    };
  }

  // Emergency Contacts
  const contactsContainer = document.getElementById('patEmergencyContact') || document.getElementById('patContactsList');
  if (contactsContainer) {
    contactsContainer.innerHTML = '';
    const contacts = activePatient.emergencyContacts || (activePatient.profile && activePatient.profile.emergencyContacts) || [];
    if (contacts.length === 0) {
      contactsContainer.innerHTML = `<p class="text-xs text-[#111111]/60 font-mono italic p-3 border-2 border-dashed border-[#111111]/20">No emergency contacts registered.</p>`;
    } else {
      contacts.forEach((c, idx) => {
        const div = document.createElement('div');
        div.className = 'p-3.5 bg-[#f9fafb] border-2 border-[#111111] flex items-center justify-between gap-3 shadow-[2px_2px_0px_#111111]';
        div.innerHTML = `
          <div>
            <div class="flex items-center gap-2">
              <p class="text-xs font-black text-[#111111] uppercase tracking-tight">${escapeHtml(c.name || 'Emergency Contact')}</p>
              <span class="px-1.5 py-0.5 bg-red-50 border border-[#E11D2E] text-[#E11D2E] text-[10px] font-mono font-bold uppercase">${escapeHtml(c.relationship || `Priority ${idx + 1}`)}</span>
            </div>
            <p class="text-xs text-[#111111]/70 font-mono font-bold mt-1">${escapeHtml(c.phone || '-')}</p>
          </div>
          ${c.phone ? `
          <a href="tel:${c.phone}" class="btn-primary px-3.5 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1.5 shadow-[2px_2px_0px_#111111]">
            <span class="material-symbols-outlined text-xs">call</span> Call
          </a>` : ''}
        `;
        contactsContainer.appendChild(div);
      });
    }
  }

  // Render Uploaded Reports
  const reportsList = document.getElementById('patReportsList');
  const reportsBadge = document.getElementById('patReportsBadge');
  const reports = activePatient.reports || (activePatient.profile && activePatient.profile.reports) || [];
  if (reportsBadge) reportsBadge.textContent = `${reports.length} Files`;
  if (reportsList) {
    reportsList.innerHTML = '';
    if (reports.length === 0) {
      reportsList.innerHTML = `<p class="text-xs text-[#111111]/60 font-mono italic p-3 border-2 border-dashed border-[#111111]/20">No diagnostic reports or uploaded medical files on record.</p>`;
    } else {
      reports.forEach(r => {
        const div = document.createElement('div');
        div.className = 'p-3.5 bg-[#f9fafb] border-2 border-[#111111] flex items-center justify-between gap-3 shadow-[2px_2px_0px_#111111]';
        div.innerHTML = `
          <div class="truncate mr-2">
            <div class="flex items-center gap-2 mb-0.5">
              <span class="px-1.5 py-0.5 bg-red-50 border border-[#E11D2E] text-[#E11D2E] text-[9px] font-mono font-bold uppercase">${escapeHtml(r.category || 'Clinical')}</span>
              <span class="text-[10px] text-[#111111]/60 font-mono">${r.uploadedAt ? new Date(r.uploadedAt).toLocaleDateString() : ''}</span>
            </div>
            <p class="text-xs font-black text-[#111111] uppercase truncate">${escapeHtml(r.originalName || r.filename || r.title || 'Medical File')}</p>
          </div>
          ${r.url || r.fileUrl ? `
            <a href="${r.url || r.fileUrl}" target="_blank" class="btn-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider transition flex items-center gap-1 shadow-[2px_2px_0px_#111111]">
              <span class="material-symbols-outlined text-xs">visibility</span> View
            </a>
          ` : ''}
        `;
        reportsList.appendChild(div);
      });
    }
  }

  // Render Medical History Timeline
  const historyList = document.getElementById('patHistoryList');
  const history = activePatient.medicalHistory || (activePatient.profile && activePatient.profile.medicalHistory) || [];
  if (historyList) {
    historyList.innerHTML = '';
    if (history.length === 0) {
      historyList.innerHTML = `<p class="text-xs text-[#111111]/60 font-mono italic p-3 border-2 border-dashed border-[#111111]/20">No recorded clinical history entries.</p>`;
    } else {
      history.forEach(h => {
        const div = document.createElement('div');
        div.className = 'p-3.5 bg-[#f9fafb] border-l-4 border-l-[#E11D2E] border-2 border-[#111111] space-y-1 shadow-[2px_2px_0px_#111111]';
        div.innerHTML = `
          <div class="flex items-center justify-between text-[10px] font-mono text-[#111111]/60">
            <span class="font-bold uppercase text-[#E11D2E]">${escapeHtml(h.type || 'Event')}</span>
            <span>${h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</span>
          </div>
          <p class="text-xs font-black text-[#111111] uppercase">${escapeHtml(h.title || 'Checkpoint')}</p>
          ${h.description ? `<p class="text-xs text-[#111111]/80 font-sans mt-0.5">${escapeHtml(h.description)}</p>` : ''}
        `;
        historyList.appendChild(div);
      });
    }
  }

  const loc = (activePatient.lastLocation && typeof activePatient.lastLocation.lat === 'number' && typeof activePatient.lastLocation.lng === 'number' && (activePatient.lastLocation.lat !== 0 || activePatient.lastLocation.lng !== 0))
    ? activePatient.lastLocation
    : (activePatient.location && typeof activePatient.location.lat === 'number' && typeof activePatient.location.lng === 'number' && (activePatient.location.lat !== 0 || activePatient.location.lng !== 0))
      ? activePatient.location
      : (activeSosLocation && typeof activeSosLocation.lat === 'number' && typeof activeSosLocation.lng === 'number' && (activeSosLocation.lat !== 0 || activeSosLocation.lng !== 0))
        ? activeSosLocation
        : null;

  if (loc) {
    renderEmergencyMap(loc.lat, loc.lng, { isLive: true, label: 'Patient Live Satellite Fix' });
    loadNearbyHospitals(loc.lat, loc.lng);
  } else if (address && address.trim() && address !== 'Registered Scene Location' && address !== 'N/A') {
    const addrCoords = resolveCoordinatesFromAddress(address);
    if (addrCoords) {
      renderEmergencyMap(addrCoords.lat, addrCoords.lng, { isLive: false, label: addrCoords.label || ('Scene Baseline: ' + address) });
      loadNearbyHospitals(addrCoords.lat, addrCoords.lng);
    } else {
      renderMapStandbyState(name, address);
    }
  } else {
    renderMapStandbyState(name, '');
  }
}

function resolveCoordinatesFromAddress(addr) {
  if (!addr || typeof addr !== 'string') return null;
  const s = addr.toLowerCase();
  if (s.includes('marine drive') || s.includes('mumbai') || s.includes('bandra') || s.includes('vashi') || s.includes('bombay')) {
    return { lat: 18.9438, lng: 72.8234, label: 'Mumbai Marine Drive Corridor' };
  }
  if (s.includes('delhi') || s.includes('noida') || s.includes('gurgaon') || s.includes('connaught')) {
    return { lat: 28.6139, lng: 77.2090, label: 'NCR Medical Corridor' };
  }
  if (s.includes('bangalore') || s.includes('bengaluru') || s.includes('koramangala') || s.includes('indiranagar')) {
    return { lat: 12.9716, lng: 77.5946, label: 'Bengaluru Trauma Corridor' };
  }
  if (s.includes('nagpur') || s.includes('nandanvan')) {
    return { lat: 21.1458, lng: 79.0882, label: 'Nagpur Central Scene' };
  }
  if (s.includes('pune') || s.includes('kothrud') || s.includes('viman nagar')) {
    return { lat: 18.5204, lng: 73.8567, label: 'Pune Trauma Corridor' };
  }
  if (s.includes('hyderabad') || s.includes('secunderabad')) {
    return { lat: 17.3850, lng: 78.4867, label: 'Hyderabad Trauma Corridor' };
  }
  if (s.includes('chennai') || s.includes('madras')) {
    return { lat: 13.0827, lng: 80.2707, label: 'Chennai Trauma Corridor' };
  }
  if (s.includes('evergreen')) {
    return { lat: 37.7749, lng: -122.4194, label: 'Evergreen Base Corridor' };
  }
  return null;
}

function renderMapStandbyState(patientName, address) {
  const mapEl = document.getElementById('leafletMapContainer') || document.getElementById('emergencyMap');
  if (!mapEl) return;

  if (mapInstance) {
    try { mapInstance.remove(); } catch (e) {}
    mapInstance = null;
    mapMarker = null;
  }

  const statusBadge = document.getElementById('mapStatusBadge');
  if (statusBadge) {
    statusBadge.className = 'px-2 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1';
    statusBadge.innerHTML = '<span class="live-dot"></span> AWAITING GPS FIX';
  }

  const subtext = document.getElementById('mapTelemetrySubtext');
  if (subtext) {
    subtext.textContent = 'Live satellite GPS coordinates not yet broadcasted by patient';
  }

  const gmapsBtn = document.getElementById('gmapsNavBtn');
  if (gmapsBtn) {
    if (address && address.trim() && address !== 'Registered Scene Location' && address !== 'N/A') {
      gmapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      gmapsBtn.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
      gmapsBtn.title = 'Open registered emergency address in Google Maps';
    } else {
      gmapsBtn.href = 'javascript:void(0)';
      gmapsBtn.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
      gmapsBtn.title = 'Awaiting live GPS coordinates';
    }
  }

  mapEl.innerHTML = `
    <div class="w-full h-full bg-[#f9fafb] flex flex-col items-center justify-center p-6 text-center space-y-3.5 select-none">
      <div class="w-14 h-14 border-2 border-[#111111] bg-white flex items-center justify-center shadow-[4px_4px_0px_#111111]">
        <span class="material-symbols-outlined text-3xl text-[#E11D2E] animate-pulse">satellite_alt</span>
      </div>
      <div class="max-w-md space-y-1">
        <h4 class="font-black text-sm uppercase text-[#111111]">Awaiting Live Patient GPS Beacon</h4>
        <p class="text-xs font-sans text-[#111111]/70">
          ${escapeHtml(patientName || 'This patient')} has not yet transmitted live satellite coordinates via an active SOS alert or mobile location share.
        </p>
        ${address && address !== 'Registered Scene Location' && address !== 'N/A' ? `<p class="text-[11px] font-mono font-bold text-[#111111] mt-1.5 bg-white border border-[#111111] p-1.5 shadow-[2px_2px_0px_#111111]">Registered Address: ${escapeHtml(address)}</p>` : ''}
      </div>
      <div class="flex items-center gap-2 pt-1 flex-wrap justify-center">
        <button onclick="window.simulatePatientLocation()" class="btn-primary text-xs px-3.5 py-2 uppercase font-mono font-bold flex items-center gap-1.5 shadow-[2px_2px_0px_#111111]">
          <span class="material-symbols-outlined text-sm">my_location</span>
          <span>Simulate Scene Location (EMT Drill)</span>
        </button>
        ${address && address !== 'Registered Scene Location' && address !== 'N/A' ? `
        <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}" target="_blank" class="btn-secondary text-xs px-3.5 py-2 uppercase font-mono font-bold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-sm">navigation</span>
          <span>Open Scene Address</span>
        </a>` : ''}
      </div>
    </div>
  `;
}

window.simulatePatientLocation = function() {
  if (!activePatient) {
    showToast('Please search or load a patient first.', 'warning');
    return;
  }
  const address = activePatient.address || (activePatient.user && activePatient.user.address) || '';
  const resolved = resolveCoordinatesFromAddress(address);
  const lat = resolved ? resolved.lat : 18.9438;
  const lng = resolved ? resolved.lng : 72.8234;

  activePatient.lastLocation = {
    lat,
    lng,
    updatedAt: new Date().toISOString()
  };

  showToast('🚨 Simulated incident scene coordinates deployed for EMT drill!', 'info');
  renderEmergencyMap(lat, lng, { isLive: true, isSimulated: true, label: 'Simulated Scene Fix (EMT Drill)' });
  loadNearbyHospitals(lat, lng);
};

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

function renderEmergencyMap(lat, lng, options = {}) {
  const container = document.getElementById('mapWrapper') || document.getElementById('emergencyMapContainer');
  if (container) container.classList.remove('hidden');

  const mapEl = document.getElementById('leafletMapContainer') || document.getElementById('emergencyMap');
  if (!mapEl) return;

  if (typeof L === 'undefined') {
    console.warn('Leaflet library not loaded.');
    mapEl.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#f9fafb]">
        <p class="font-black text-sm uppercase text-[#111111]">Map Engine Loading...</p>
        <p class="text-xs font-mono text-[#111111]/70 mt-1">Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" class="btn-primary mt-3 text-xs px-3.5 py-1.5 uppercase font-mono font-bold">Open In Google Maps</a>
      </div>
    `;
    return;
  }

  // Update Status Badge
  const statusBadge = document.getElementById('mapStatusBadge');
  if (statusBadge) {
    if (options.isLive) {
      statusBadge.className = 'px-2 py-0.5 border border-green-700 bg-green-100 text-green-900 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_#111111]';
      statusBadge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span> ${options.isSimulated ? 'EMT SIMULATED FIX' : 'LIVE SATELLITE FIX'}`;
    } else {
      statusBadge.className = 'px-2 py-0.5 border border-[#111111] bg-amber-100 text-amber-900 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_#111111]';
      statusBadge.innerHTML = '<span class="material-symbols-outlined text-xs">home_pin</span> SCENE BASELINE';
    }
  }

  // Update Telemetry Subtext
  const subtext = document.getElementById('mapTelemetrySubtext');
  if (subtext) {
    subtext.textContent = `Fix: ${lat.toFixed(5)}, ${lng.toFixed(5)} • ${options.label || 'Patient Live Distress Location'}`;
  }

  // Update Google Maps button
  const gmapsBtn = document.getElementById('gmapsNavBtn');
  if (gmapsBtn) {
    gmapsBtn.href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    gmapsBtn.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
    gmapsBtn.title = 'Open turn-by-turn navigation in Google Maps';
  }

  // Safe re-initialization of Leaflet
  if (mapInstance) {
    try {
      mapInstance.remove();
    } catch (e) {}
    mapInstance = null;
    mapMarker = null;
  }
  mapEl.innerHTML = '';

  try {
    mapInstance = L.map(mapEl, {
      zoomControl: true,
      scrollWheelZoom: false
    }).setView([lat, lng], 14);

    // High-clarity free OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapInstance);

    // High-impact Swiss Editorial Pulsing Emergency Beacon Marker
    const emergencyIcon = L.divIcon({
      className: 'custom-emergency-beacon',
      html: `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: rgba(225, 29, 46, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <div style="position: relative; width: 26px; height: 26px; background: #E11D2E; border: 2px solid #111111; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 2px 2px 0px #111111;">
            <span class="material-symbols-outlined" style="color: white; font-size: 15px; line-height: 1;">emergency</span>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18]
    });

    const patName = activePatient ? (activePatient.name || 'Emergency Patient') : 'Patient';
    mapMarker = L.marker([lat, lng], { icon: emergencyIcon }).addTo(mapInstance)
      .bindPopup(`
        <div style="font-family: Archivo, sans-serif; padding: 4px 2px; min-width: 150px;">
          <span style="display: inline-block; font-size: 9px; font-family: monospace; font-weight: bold; background: #E11D2E; color: white; padding: 1px 5px; border: 1px solid #111111; text-transform: uppercase;">
            ${options.isLive ? 'Live Beacon' : 'Scene Address'}
          </span>
          <p style="font-weight: 900; font-size: 13px; text-transform: uppercase; margin-top: 5px; color: #111111; line-height: 1.2;">
            ${escapeHtml(patName)}
          </p>
          <p style="font-size: 10px; font-family: monospace; color: #555; margin-top: 3px;">
            ${lat.toFixed(5)}, ${lng.toFixed(5)}
          </p>
          <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" style="display: inline-block; margin-top: 8px; font-size: 10px; font-weight: bold; color: #E11D2E; text-decoration: underline; text-transform: uppercase; font-family: monospace;">
            Open Google Maps &rarr;
          </a>
        </div>
      `)
      .openPopup();

    setTimeout(() => {
      if (mapInstance) mapInstance.invalidateSize();
    }, 250);
  } catch (err) {
    console.error('Failed to initialize Leaflet map:', err);
    mapEl.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center p-6 text-center bg-[#f9fafb]">
        <p class="font-black text-sm uppercase text-[#111111]">Map Display Error</p>
        <p class="text-xs font-mono text-[#111111]/70 mt-1">${escapeHtml(err.message)}</p>
        <a href="https://www.google.com/maps/search/?api=1&query=${lat},${lng}" target="_blank" class="btn-primary mt-3 text-xs px-3.5 py-1.5 uppercase font-mono font-bold">Open In Google Maps</a>
      </div>
    `;
  }
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

    const urlQrId = new URLSearchParams(window.location.search).get('qrId') || new URLSearchParams(window.location.search).get('id');
    if (urlQrId) {
      qrInput.value = urlQrId;
      setTimeout(() => {
        window.searchPatient();
      }, 300);
    }
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

// ==========================================
// CREW DISPATCH HELP & ADMIN SUPPORT WORKFLOW
// ==========================================

window.openCrewHelpModal = function() {
  const modal = document.getElementById('crewHelpModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  const patInput = document.getElementById('crewHelpPatientId');
  if (patInput && !patInput.value && activePatient?.profile?.qrCodeId) {
    patInput.value = activePatient.profile.qrCodeId;
  }

  loadCrewHelpTickets();
};

window.closeCrewHelpModal = function() {
  const modal = document.getElementById('crewHelpModal');
  if (modal) modal.classList.add('hidden');
};

window.switchCrewHelpTab = function(tab) {
  const newBtn = document.getElementById('crewHelpTabNewBtn');
  const histBtn = document.getElementById('crewHelpTabHistoryBtn');
  const formPane = document.getElementById('crewHelpForm');
  const histPane = document.getElementById('crewHelpHistoryPane');

  if (tab === 'new') {
    newBtn.className = 'px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-b-2 border-[#E11D2E] text-[#E11D2E] -mb-[2px] transition flex items-center gap-1.5';
    histBtn.className = 'px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#111111]/60 hover:text-[#111111] transition flex items-center gap-1.5';
    formPane.classList.remove('hidden');
    histPane.classList.add('hidden');
  } else {
    histBtn.className = 'px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider border-b-2 border-[#E11D2E] text-[#E11D2E] -mb-[2px] transition flex items-center gap-1.5';
    newBtn.className = 'px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-[#111111]/60 hover:text-[#111111] transition flex items-center gap-1.5';
    formPane.classList.add('hidden');
    histPane.classList.remove('hidden');
    loadCrewHelpTickets();
  }
};

window.handleCrewHelpSubmit = async function(e) {
  e.preventDefault();
  const subject = document.getElementById('crewHelpSubject')?.value?.trim();
  const message = document.getElementById('crewHelpMessage')?.value?.trim();
  const category = document.getElementById('crewHelpCategory')?.value;
  const priority = document.getElementById('crewHelpPriority')?.value;
  const patientQrCodeId = document.getElementById('crewHelpPatientId')?.value?.trim();

  if (!subject || !message) {
    showToast('Please provide subject and detailed situation description', 'warning');
    return;
  }

  const submitBtn = document.getElementById('crewHelpSubmitBtn');
  const origHtml = submitBtn.innerHTML;

  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Transmitting...</span>';

    const res = await crewApiFetch('/help-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject,
        message,
        category,
        priority,
        patientQrCodeId
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit help ticket');

    showToast('Dispatch Help Request transmitted to System Administrators!', 'success');
    document.getElementById('crewHelpForm').reset();
    switchCrewHelpTab('history');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = origHtml;
    }
  }
};

window.loadCrewHelpTickets = async function() {
  try {
    const res = await crewApiFetch('/help-tickets/my');
    if (!res.ok) return;
    const data = await res.json();
    const tickets = data.tickets || [];

    const badge = document.getElementById('crewHelpMyTicketsBadge');
    if (badge) {
      badge.textContent = tickets.length;
      if (tickets.length > 0) badge.classList.remove('hidden');
      else badge.classList.add('hidden');
    }

    const dot = document.getElementById('crewHelpPendingDot');
    const hasPending = tickets.some(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    if (dot) {
      if (hasPending) dot.classList.remove('hidden');
      else dot.classList.add('hidden');
    }

    const list = document.getElementById('crewHelpHistoryList');
    if (!list) return;

    if (tickets.length === 0) {
      list.innerHTML = `
        <div class="border-2 border-dashed border-[#111111]/20 p-6 text-center text-xs font-mono text-[#111111]/60">
          No dispatch tickets submitted yet. If you encounter telemetry blocks or need triage authorization, submit a request above.
        </div>
      `;
      return;
    }

    list.innerHTML = tickets.map(t => {
      let statusBadge = '<span class="px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-800 text-[10px] font-bold uppercase">Pending Dispatch Review</span>';
      if (t.status === 'IN_PROGRESS') {
        statusBadge = '<span class="px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-800 text-[10px] font-bold uppercase">In Progress</span>';
      } else if (t.status === 'RESOLVED') {
        statusBadge = '<span class="px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase">Resolved</span>';
      }

      let priorityBadge = '<span class="px-1.5 py-0.5 border border-gray-300 bg-gray-50 text-gray-700 text-[9px] font-bold uppercase">NORMAL</span>';
      if (t.priority === 'HIGH') {
        priorityBadge = '<span class="px-1.5 py-0.5 border border-amber-600 bg-amber-50 text-amber-900 text-[9px] font-bold uppercase">HIGH</span>';
      } else if (t.priority === 'CRITICAL') {
        priorityBadge = '<span class="px-1.5 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] text-[9px] font-bold uppercase">CRITICAL</span>';
      }

      const dateStr = new Date(t.createdAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

      const adminNotesHtml = t.adminNotes ? `
        <div class="mt-2.5 p-3 border-2 border-emerald-600 bg-emerald-50 text-emerald-950 text-xs">
          <div class="flex items-center gap-1.5 font-bold uppercase text-[10px] text-emerald-800 mb-1">
            <span class="material-symbols-outlined text-xs">admin_panel_settings</span>
            <span>Administrator Response Note</span>
            ${t.resolvedAt ? `<span class="ml-auto font-normal text-[9px] opacity-75">${new Date(t.resolvedAt).toLocaleDateString()}</span>` : ''}
          </div>
          <p class="font-sans leading-relaxed whitespace-pre-wrap">${t.adminNotes}</p>
        </div>
      ` : `
        <div class="mt-2 p-2 border border-dashed border-[#111111]/20 bg-gray-50 text-[11px] text-[#111111]/60 font-sans italic">
          Ticket queued in administrator command clearinghouse. Awaiting admin review.
        </div>
      `;

      return `
        <div class="border-2 border-[#111111] p-3.5 bg-white space-y-2 shadow-[2px_2px_0px_#111111]">
          <div class="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <span class="font-bold text-xs text-[#111111] uppercase tracking-wide">${t.subject}</span>
              <div class="text-[10px] text-[#111111]/60 font-mono mt-0.5">
                <span>#${t.ticketId}</span> &bull; <span>${t.category.replace(/_/g, ' ')}</span> &bull; <span>${dateStr}</span>
                ${t.patientQrCodeId ? ` &bull; Patient: <strong class="text-[#E11D2E]">${t.patientQrCodeId}</strong>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${priorityBadge}
              ${statusBadge}
            </div>
          </div>
          <p class="text-xs font-sans text-[#111111]/80 whitespace-pre-wrap">${t.message}</p>
          ${adminNotesHtml}
        </div>
      `;
    }).join('');

  } catch (err) {
    console.warn('Failed to load crew help tickets:', err);
  }
};
