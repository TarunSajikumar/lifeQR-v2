// Doctor Dashboard JS Module
let currentUser = null;
let activePatient = null;
let scannerInstance = null;

function doctorApiFetch(endpoint, options = {}) {
  const request = window.authFetch || fetch;
  const url = window.getApiUrl ? window.getApiUrl(endpoint) : endpoint;
  return request(url, { ...options, credentials: 'include' });
}

function applyDoctorTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('doctorTheme', theme);
  const icon = document.getElementById('doctorThemeIcon');
  const label = document.getElementById('doctorThemeLabel');
  if (icon) icon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  if (label) label.textContent = theme === 'dark' ? 'Light' : 'Dark';
}

window.toggleDoctorTheme = function() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyDoctorTheme(current === 'dark' ? 'light' : 'dark');
};

document.addEventListener('DOMContentLoaded', async () => {
  applyDoctorTheme(localStorage.getItem('doctorTheme') || 'light');
  currentUser = await checkDashboardAccess(['doctor']);
  if (!currentUser) return;

  // Initialize display details
  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = currentUser.name;

  // Update attending station card if present
  const stationNameEl = document.getElementById('attendingStationName');
  if (stationNameEl && currentUser.name) {
    const formattedDoctor = currentUser.name.startsWith('Dr.') ? currentUser.name : `Dr. ${currentUser.name}`;
    stationNameEl.textContent = `${formattedDoctor} &bull; Room 102`;
  }

  // Check account verification status
  await checkVerificationStatus();

  // Load list of authorized patients
  await loadAuthorizedPatients();

  // Load live OPD waiting queue & badge
  await loadDoctorWaitingQueue(true);

  // Auto-refresh waiting queue every 10 seconds
  setInterval(() => {
    loadDoctorWaitingQueue(true);
  }, 10000);

  // Handle forms
  setupDoctorListeners();

  // Check pending help tickets
  loadDoctorHelpTickets();

  // Load hospital bed telemetry
  loadDoctorHospitalBedMetrics();
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
    console.warn('Failed to check verification status:', e);
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
          <span class="material-symbols-outlined text-2xl text-[#E11D2E]">verified_user</span>
        </div>
        <div>
          <h4 class="font-black text-[#111111] text-sm uppercase tracking-tight flex items-center gap-2">
            Professional Account Verification Required
            <span class="px-2 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] text-[10px] font-mono font-bold uppercase tracking-wider">${status}</span>
          </h4>
          <p class="text-xs text-[#111111]/70 font-sans font-medium mt-0.5">
            Your medical practitioner account is pending verification by system administrators before accessing full patient records.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
        <span class="px-4 py-2 border-2 border-[#111111] bg-[#f9fafb] text-[#111111] text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
          <span class="live-dot"></span>
          <span>Pending Admin Approval</span>
        </span>
      </div>
    </div>
  `;
}

async function loadAuthorizedPatients() {
  const container = document.getElementById('authorizedPatientsList');
  if (!container) return;

  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/doctor-access/patients') : '/api/v1/doctor-access/patients';
    const response = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 403 && data.error === 'Account not verified') {
        container.innerHTML = `<div class="p-4 bg-[#f9fafb] border-2 border-[#111111] text-xs font-mono font-bold text-[#111111] text-center uppercase">Your account is pending professional verification. Once admin review is complete, you’ll be able to access patient records and add clinical notes.</div>`;
        return;
      }
      throw new Error(data.error);
    }

    container.innerHTML = '';

    if (data.patients.length === 0) {
      container.innerHTML = `<p class="text-xs text-[#111111]/60 font-mono italic text-center py-4">No authorized patients connected yet.</p>`;
      return;
    }

    data.patients.forEach(p => {
      const card = document.createElement('div');
      card.className = 'p-3.5 bg-white hover:bg-[#f9fafb] border-2 border-[#111111] flex items-center justify-between cursor-pointer transition-all shadow-[3px_3px_0px_#111111] hover:shadow-[4px_4px_0px_#111111] group';
      card.onclick = () => {
        document.getElementById('patientQrId').value = p.qrCodeId;
        searchPatient();
      };
      
      const photo = p.profilePhoto || 'https://www.w3schools.com/howto/img_avatar.png';
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="relative w-10 h-10 border-2 border-[#111111] flex-shrink-0">
            <img src="${photo}" class="w-full h-full object-cover">
          </div>
          <div>
            <p class="text-xs font-black text-[#111111] uppercase tracking-tight group-hover:text-[#E11D2E] transition-colors">${p.name}</p>
            <p class="text-[10px] text-[#111111]/60 font-mono flex items-center gap-1.5 mt-0.5">
              <span class="font-bold">${p.qrCodeId}</span>
              <span class="px-1.5 py-0.5 bg-red-50 text-[#E11D2E] border border-[#E11D2E] font-bold">${p.bloodGroup || 'N/A'}</span>
            </p>
          </div>
        </div>
        <div class="w-7 h-7 border-2 border-[#111111] bg-white flex items-center justify-center text-[#111111] group-hover:bg-[#111111] group-hover:text-white transition-all">
          <span class="material-symbols-outlined text-sm">chevron_right</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.warn('Load authorized patients error:', err);
  }
}

// Search or scan patient QR ID
window.searchPatient = async function() {
  const qrIdInput = document.getElementById('patientQrId');
  let qrId = qrIdInput ? qrIdInput.value.trim() : '';
  if (!qrId) {
    showToast('Please enter a patient QR Code ID (e.g. RAH-D3200470)', 'warning');
    return;
  }

  // Parse if full URL or token link was pasted/scanned
  try {
    if (qrId.startsWith('http://') || qrId.startsWith('https://')) {
      const parsedUrl = new URL(qrId);
      qrId = parsedUrl.searchParams.get('id') || parsedUrl.searchParams.get('token') || parsedUrl.pathname.split('/').filter(Boolean).pop() || qrId;
    }
  } catch (e) {
    // Fallback if URL parsing fails
    qrId = qrId.split('/').filter(Boolean).pop();
  }

  showPatientSkeleton();

  try {
    const response = await doctorApiFetch(`/doctor-access/status/${encodeURIComponent(qrId)}`);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Patient not found for ID: ' + qrId);
    }

    activePatient = data;
    activePatient.qrCodeId = data.qrCodeId || qrId;
    if (qrIdInput) qrIdInput.value = activePatient.qrCodeId;

    // Log the scan activity
    await logDoctorScan(activePatient.qrCodeId);

    renderPatientDetails();
    showToast(`Loaded medical record for ${data.name || activePatient.qrCodeId}`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
    hidePatientView();
  }
};

async function logDoctorScan(qrCodeId) {
  try {
    await doctorApiFetch(`/patient/log-scan/${encodeURIComponent(qrCodeId)}`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn('Failed to log scan.');
  }
}

function showPatientSkeleton() {
  const prompt = document.getElementById('patientDetailsEmptyPrompt');
  const panel = document.getElementById('patientDetailsPanel');
  const skel = document.getElementById('patientSkeleton');
  const content = document.getElementById('patientContent');
  if (prompt) prompt.classList.add('hidden');
  if (panel) panel.classList.remove('hidden');
  if (skel) skel.classList.remove('hidden');
  if (content) content.classList.add('hidden');
}

function hidePatientView() {
  const prompt = document.getElementById('patientDetailsEmptyPrompt');
  const panel = document.getElementById('patientDetailsPanel');
  if (prompt) prompt.classList.remove('hidden');
  if (panel) panel.classList.add('hidden');
}

function renderPatientDetails() {
  const skel = document.getElementById('patientSkeleton');
  const content = document.getElementById('patientContent');
  if (skel) skel.classList.add('hidden');
  if (content) content.classList.remove('hidden');

  const nameEl = document.getElementById('patName');
  if (nameEl) nameEl.textContent = activePatient.name || 'Patient';

  const idEl = document.getElementById('patId');
  if (idEl) idEl.textContent = activePatient.qrCodeId;

  const demoEl = document.getElementById('patDemographics');
  const genderCapitalized = activePatient.gender ? (activePatient.gender.charAt(0).toUpperCase() + activePatient.gender.slice(1)) : 'Patient';
  if (demoEl) demoEl.textContent = `${genderCapitalized}, ${activePatient.age || 30} Yrs`;

  const genderEl = document.getElementById('patGender');
  if (genderEl) genderEl.textContent = `${genderCapitalized} / ${activePatient.age || 30} Yrs`;

  const phoneEl = document.getElementById('patPhone');
  if (phoneEl) phoneEl.textContent = activePatient.phone || 'N/A';

  const photoEl = document.getElementById('patPhoto');
  if (photoEl) {
    photoEl.src = activePatient.profilePhoto || 'https://www.w3schools.com/howto/img_avatar.png';
  }

  // Emergency Triage Matrix elements
  const bloodEl = document.getElementById('patBlood');
  if (bloodEl) bloodEl.textContent = activePatient.bloodGroup || 'O+';

  const allergiesEl = document.getElementById('patAllergies');
  if (allergiesEl) {
    allergiesEl.textContent = activePatient.allergies || 'None Known';
    allergiesEl.title = activePatient.allergies || 'None Known';
  }

  const medsEl = document.getElementById('patMeds');
  if (medsEl) {
    medsEl.textContent = activePatient.medications || 'None Reported';
    medsEl.title = activePatient.medications || 'None Reported';
  }

  const contactEl = document.getElementById('patEmergencyContact');
  if (contactEl) {
    if (activePatient.emergencyContacts && activePatient.emergencyContacts.length > 0) {
      const c = activePatient.emergencyContacts[0];
      contactEl.textContent = `${c.name || 'Emergency Contact'} (${c.phone || c.relationship || 'Emergency'})`;
      contactEl.title = `${c.name} - ${c.phone} (${c.relationship || 'Emergency Contact'})`;
    } else {
      contactEl.textContent = activePatient.phone || 'Registered Emergency Contact';
    }
  }

  // Prepopulate consultation form if empty
  const complaintInput = document.getElementById('consultComplaint');
  if (complaintInput && !complaintInput.value) {
    complaintInput.value = activePatient.healthIssues && activePatient.healthIssues !== 'None Reported' 
      ? `Evaluation of ${activePatient.healthIssues}` 
      : 'Outpatient clinical consultation';
  }

  const historyInput = document.getElementById('consultHistory');
  if (historyInput && !historyInput.value) {
    const histItems = [];
    if (activePatient.healthIssues && activePatient.healthIssues !== 'None Reported') histItems.push(`Known: ${activePatient.healthIssues}`);
    if (activePatient.allergies && activePatient.allergies !== 'None Known' && activePatient.allergies !== 'None Reported') histItems.push(`Allergies: ${activePatient.allergies}`);
    if (activePatient.medications && activePatient.medications !== 'None Reported') histItems.push(`Active Meds: ${activePatient.medications}`);
    historyInput.value = histItems.join('; ') || 'No significant prior chronic illness reported.';
  }

  // Status banner
  const statusContainer = document.getElementById('accessStatusContainer');
  const detailsContainer = document.getElementById('authorizedDetailsContainer');

  if (statusContainer) {
    statusContainer.innerHTML = `
      <div class="p-3.5 bg-[#f9fafb] border-2 border-[#111111] text-[#111111] flex items-center justify-between gap-2 text-xs font-mono font-bold">
        <div class="flex items-center gap-2">
          <span class="live-dot"></span>
          <span>EMERGENCY CLINICAL CLEARANCE: Authorized attending physician consultation enabled.</span>
        </div>
        <span class="px-2.5 py-0.5 bg-[#111111] text-white text-[10px] uppercase tracking-wider font-extrabold">READY</span>
      </div>
    `;
  }

  if (detailsContainer) detailsContainer.classList.remove('hidden');
  loadPatientMedicalHistory(activePatient.qrCodeId);
  loadPatientReports(activePatient.qrCodeId);
}

window.requestAccess = async function() {
  try {
    const response = await doctorApiFetch('/doctor-access/request-access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ qrCodeId: activePatient.qrCodeId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast('Access request sent successfully to patient!', 'success');
    activePatient.hasPending = true;
    renderPatientDetails();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

async function loadPatientMedicalHistory(qrCodeId) {
  try {
    const response = await doctorApiFetch(`/history/${encodeURIComponent(qrCodeId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const container = document.getElementById('patientHistoryTimeline');
    if (!container) return;
    container.innerHTML = '';

    if (!data.history || data.history.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-6">No clinical history records logged yet.</p>`;
      return;
    }

    data.history.forEach(h => {
      const item = document.createElement('div');
      item.className = 'relative pl-7 pb-5 last:pb-0 group';
      
      let icon = 'medical_services';
      let badgeClass = 'bg-indigo-100 text-indigo-700 border-indigo-200';
      let dotBg = 'bg-indigo-600';
      
      if (h.type === 'vital') {
        icon = 'favorite';
        badgeClass = 'bg-emerald-100 text-emerald-700 border-emerald-200';
        dotBg = 'bg-emerald-600';
      } else if (h.type === 'symptom') {
        icon = 'thermostat';
        badgeClass = 'bg-amber-100 text-amber-800 border-amber-200';
        dotBg = 'bg-amber-500';
      } else if (h.type === 'treatment') {
        icon = 'medication';
        badgeClass = 'bg-purple-100 text-purple-700 border-purple-200';
        dotBg = 'bg-purple-600';
      }

      const authorRole = h.author ? h.author.role : 'clinician';
      const authorName = h.author ? h.author.name : 'Doctor';
      const dateStr = new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      item.innerHTML = `
        <!-- Vertical connecting line -->
        <div class="absolute left-[11px] top-4 bottom-0 w-0.5 bg-[#111111] group-last:hidden"></div>
        
        <!-- Timeline node dot -->
        <span class="absolute left-0 top-0.5 w-6 h-6 border-2 border-[#111111] bg-[#111111] text-white flex items-center justify-center z-10">
          <span class="material-symbols-outlined text-[12px]">${icon}</span>
        </span>
        
        <!-- Timeline card content -->
        <div class="bg-white p-4 border-2 border-[#111111] shadow-[4px_4px_0px_#111111] transition hover:-translate-y-0.5">
          <div class="flex items-center justify-between gap-2 mb-1.5 pb-2 border-b-2 border-[#111111]/10">
            <h5 class="font-black text-[#111111] text-xs sm:text-sm tracking-tight uppercase">${h.title}</h5>
            <span class="px-2 py-0.5 border border-[#111111] text-[9px] font-mono uppercase tracking-wider font-bold bg-[#f9fafb] text-[#111111]">${h.type || 'entry'}</span>
          </div>
          <p class="text-xs text-[#111111]/80 leading-relaxed font-medium mb-3">${h.description}</p>
          <div class="flex items-center justify-between pt-2 border-t border-[#111111]/10 text-[10px] font-mono font-bold text-[#111111]/60">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-[#E11D2E]">person</span>
              Logged by <strong class="text-[#111111]">${authorName}</strong> (${authorRole.toUpperCase()})
            </span>
            <span>${dateStr}</span>
          </div>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.error('Failed to load patient history:', err);
  }
}

async function loadPatientReports(qrCodeId) {
  try {
    const container = document.getElementById('patientReportsList');
    if (!container) return;
    container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">Medical reports available upon patient record authorization.</p>`;
  } catch (err) {
    console.error('Failed to load patient reports:', err);
  }
}

function setupDoctorListeners() {
  // Default +91 number formatting and behavior for new patient registration
  const docPhoneInput = document.getElementById('docNewPhone');
  if (docPhoneInput) {
    if (!docPhoneInput.value || !docPhoneInput.value.trim()) {
      docPhoneInput.value = '+91 ';
    }
    docPhoneInput.addEventListener('focus', () => {
      if (!docPhoneInput.value || !docPhoneInput.value.trim()) {
        docPhoneInput.value = '+91 ';
      }
    });
    docPhoneInput.addEventListener('input', () => {
      const val = docPhoneInput.value;
      if (!val.startsWith('+91')) {
        const digits = val.replace(/[^0-9]/g, '');
        if (digits.startsWith('91')) {
          docPhoneInput.value = '+91 ' + digits.slice(2);
        } else if (digits.length > 0) {
          docPhoneInput.value = '+91 ' + digits;
        } else {
          docPhoneInput.value = '+91 ';
        }
      }
    });
    docPhoneInput.addEventListener('keydown', (e) => {
      // Prevent deleting the '+91 ' prefix
      if ((e.key === 'Backspace' || e.key === 'Delete') && (docPhoneInput.value === '+91 ' || docPhoneInput.value === '+91')) {
        e.preventDefault();
      }
    });
  }

  const form = document.getElementById('addTreatmentForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('addTreatmentBtn');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Adding Note...';
    }

    try {
      const title = document.getElementById('treatmentTitle').value;
      const description = document.getElementById('treatmentDesc').value;

      const response = await doctorApiFetch(`/history/add/${encodeURIComponent(activePatient.qrCodeId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type: 'treatment', title, description })
      });
      const res = await response.json();
      if (!response.ok) throw new Error(res.error);

      showToast('Clinical treatment entry recorded!', 'success');
      e.target.reset();
      await loadPatientMedicalHistory(activePatient.qrCodeId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Add Clinical Note';
      }
    }
  });
}

// Camera Scanner Triggers
window.startQRScanner = function() {
  if (!scannerInstance) {
    scannerInstance = new QRScanner({
      onSuccess: (result) => {
        stopQRScanner();
        const rawResult = String(result || '').trim();
        let parsedId = rawResult;
        try {
          const scannedUrl = new URL(rawResult);
          parsedId = scannedUrl.searchParams.get('id') || scannedUrl.pathname.split('/').filter(Boolean).pop() || rawResult;
        } catch (e) {
          parsedId = rawResult;
        }
        if (!parsedId) {
          showToast('The QR code did not contain a patient ID.', 'error');
          return;
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

// ============================================================
// AI CLINICAL COPILOT SUITE (5 High-Impact AI Features)
// ============================================================

// ============================================================
// AI CLINICAL INTELLIGENCE & PATIENT ANALYSIS SUITE
// ============================================================

// Helper to retrieve AI output container
function getAiContainer() {
  return document.getElementById('aiClinicalOutputContainer');
}

// Helper to show AI loading state in Swiss Editorial aesthetic
function showAiLoading(toolName) {
  const container = getAiContainer();
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="p-5 border-2 border-[#111111] bg-white space-y-3 font-mono">
      <div class="flex items-center gap-3 text-xs font-bold text-[#111111]">
        <span class="material-symbols-outlined text-lg animate-spin text-[#E11D2E]">progress_activity</span>
        <span class="tracking-wider uppercase">CLINICAL NEURAL ENGINE: ANALYZING PATIENT &bull; [${toolName}]</span>
      </div>
      <div class="w-full bg-gray-100 h-1.5 overflow-hidden border border-[#111111]/20">
        <div class="bg-[#E11D2E] h-full w-2/3 animate-pulse"></div>
      </div>
      <p class="text-[11px] text-gray-500 font-sans">Cross-referencing verified LifeQR patient matrix, lethal allergy contraindications, and clinical practice guidelines.</p>
    </div>
  `;
}

// 1. ⭐⭐⭐⭐⭐ AI FULL PATIENT ANALYSIS & RISK STRATIFICATION
window.runAiPatientSummary = async function() {
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please search or select an active patient first.', 'warning');
    return;
  }

  showAiLoading('DEEP CLINICAL RISK STRATIFICATION & CONTRAINDICATION REVIEW');

  try {
    const res = await doctorApiFetch('/ai-clinical/patient-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCodeId: activePatient.qrCodeId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate AI Patient Analysis');

    const container = getAiContainer();
    if (!container) return;
    container.classList.remove('hidden');

    const isCritical = data.riskLevel === 'CRITICAL';
    const isElevated = data.riskLevel === 'ELEVATED';
    const riskBadgeClass = isCritical 
      ? 'bg-red-50 text-[#E11D2E] border-2 border-[#E11D2E]' 
      : (isElevated ? 'bg-amber-50 text-amber-900 border-2 border-amber-600' : 'bg-emerald-50 text-emerald-800 border-2 border-emerald-600');

    // Contraindications markup
    let contraindicationsHtml = '';
    if (data.contraindications && data.contraindications.length > 0) {
      contraindicationsHtml = `
        <div class="p-3.5 bg-red-50/80 border-2 border-[#E11D2E] text-red-950 space-y-1.5 font-sans">
          <div class="flex items-center gap-1.5 font-mono text-xs font-black uppercase text-[#E11D2E]">
            <span class="material-symbols-outlined text-base">emergency_home</span>
            <span>🚨 LETHAL DRUG CONTRAINDICATIONS &amp; ALLERGY HAZARDS</span>
          </div>
          <ul class="list-disc list-inside space-y-1 text-xs font-bold text-red-900">
            ${data.contraindications.map(c => `<li>${c}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Polypharmacy markup
    let polypharmacyHtml = '';
    if (data.polypharmacyRisks && data.polypharmacyRisks.length > 0) {
      polypharmacyHtml = `
        <div class="p-3 bg-amber-50/80 border-2 border-amber-600 text-amber-950 space-y-1 font-sans">
          <div class="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-amber-800">
            <span class="material-symbols-outlined text-sm">medication</span>
            <span>Active Polypharmacy &amp; Drug Cautions</span>
          </div>
          <ul class="list-disc list-inside space-y-0.5 text-xs text-amber-950">
            ${data.polypharmacyRisks.map(p => `<li>${p}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Suggested Labs chips
    const suggestedLabs = data.suggestedLabOrders || [];
    const labsChips = suggestedLabs.map(lab => `
      <span class="px-2.5 py-1 border border-[#111111] bg-white text-[#111111] font-mono text-[11px] font-bold shadow-xs">
        ${lab}
      </span>
    `).join('');

    const jsonSafeData = encodeURIComponent(JSON.stringify({
      summary: data.summary,
      diagnosis: data.chronicConditionReview && data.chronicConditionReview[0] ? data.chronicConditionReview[0].replace('Pre-existing Medical History: ', '') : 'Clinical Assessment',
      labs: suggestedLabs.join(', ')
    }));

    container.innerHTML = `
      <div class="space-y-4">
        
        <!-- Header Strip -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-[#111111]">
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-black text-sm uppercase tracking-tight text-[#111111] flex items-center gap-1.5">
                <span class="material-symbols-outlined text-base text-[#E11D2E]">analytics</span>
                <span>AI Clinical Risk &amp; Patient Analysis: ${data.patientName}</span>
              </h4>
              <span class="px-2 py-0.5 ${riskBadgeClass} font-mono text-[10px] font-bold uppercase tracking-wider">
                RISK: ${data.riskLevel} (${data.riskScore}/100)
              </span>
            </div>
            <p class="text-xs font-mono text-gray-600 mt-0.5">
              LifeQR ID: <strong>${data.qrCodeId}</strong> &bull; Blood Group: <strong class="text-[#E11D2E]">${data.bloodGroup}</strong> &bull; Confidence: <strong>${data.confidenceScore}</strong>
            </p>
          </div>

          <div class="flex items-center gap-2 font-mono flex-shrink-0">
            <button type="button" onclick="populateAiAnalysisToConsultation('${jsonSafeData}')" class="btn-primary text-xs px-3.5 py-1.5 uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#111111]">
              <span class="material-symbols-outlined text-sm">input</span>
              <span>Insert AI Notes into Consultation</span>
            </button>
          </div>
        </div>

        ${contraindicationsHtml}
        ${polypharmacyHtml}

        <!-- Clinical Narrative -->
        <div class="p-3.5 bg-white border-2 border-[#111111] space-y-2">
          <span class="block font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">Executive Clinical Assessment</span>
          <p class="text-xs font-sans text-[#111111] leading-relaxed font-medium">${data.summary}</p>
        </div>

        <!-- Labs & Recommendations Grid -->
        <div class="grid sm:grid-cols-2 gap-3">
          <div class="p-3 bg-white border-2 border-[#111111] space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-[#111111]">Suggested Lab Investigations</span>
              <button type="button" onclick="addLabsToConsultation('${encodeURIComponent(suggestedLabs.join(', '))}')" class="text-[10px] font-mono font-bold text-[#E11D2E] hover:underline flex items-center gap-0.5">
                <span class="material-symbols-outlined text-xs">add</span> Add to Form
              </button>
            </div>
            <div class="flex flex-wrap gap-1.5 pt-1">
              ${labsChips || '<span class="text-xs text-gray-500 font-mono">Routine baseline blood work recommended</span>'}
            </div>
          </div>

          <div class="p-3 bg-white border-2 border-[#111111] space-y-1.5">
            <span class="block font-mono text-[10px] font-bold uppercase tracking-wider text-[#111111]">Recommended Attending Focus</span>
            <ul class="list-disc list-inside space-y-0.5 text-xs text-[#111111]/80 font-sans">
              ${(data.recommendedFocus || []).map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>
        </div>

        <!-- Triage Velocity Strip -->
        <div class="flex items-center justify-between text-[11px] font-mono text-gray-600 bg-white p-2.5 border-2 border-[#111111]">
          <span>Triage Access Velocity: <strong>${data.triageVelocity?.scansCount || 0}</strong> emergency scans on file</span>
          <span>SOS Distress Incidents: <strong class="${(data.triageVelocity?.sosCount || 0) > 0 ? 'text-[#E11D2E]' : 'text-emerald-700'}">${data.triageVelocity?.sosCount || 0} alerts</strong></span>
        </div>

      </div>
    `;

    showToast('AI Patient Analysis & Clinical Risk Stratification completed!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    console.error('runAiPatientSummary error:', err);
  }
};

// 1.1 Helper to populate AI analysis into Consultation form
window.populateAiAnalysisToConsultation = function(encodedJson) {
  try {
    const data = JSON.parse(decodeURIComponent(encodedJson));
    
    // 1. History / Complaints
    const historyEl = document.getElementById('consultHistory');
    if (historyEl) {
      historyEl.value = (historyEl.value ? historyEl.value + '\n\n' : '') + `[AI Clinical Summary]: ${data.summary}`;
    }

    // 2. Diagnosis
    const diagEl = document.getElementById('consultDiagnosis');
    if (diagEl && !diagEl.value && data.diagnosis) {
      diagEl.value = data.diagnosis;
    }

    // 3. Labs
    const labsEl = document.getElementById('consultLabOrders');
    if (labsEl && data.labs) {
      labsEl.value = labsEl.value ? `${labsEl.value}, ${data.labs}` : data.labs;
    }

    // Scroll smoothly to consultation form
    const consultSection = document.getElementById('clinicalConsultationSection');
    if (consultSection) {
      consultSection.scrollIntoView({ behavior: 'smooth' });
    }

    showToast('✅ AI Clinical Notes and Suggested Labs populated into Consultation Form!', 'success');
  } catch (e) {
    console.error('Error populating AI notes:', e);
    showToast('Failed to populate notes to form.', 'error');
  }
};

// 1.2 Helper to append recommended labs
window.addLabsToConsultation = function(encodedLabs) {
  const labs = decodeURIComponent(encodedLabs);
  const labsEl = document.getElementById('consultLabOrders');
  if (labsEl) {
    labsEl.value = labsEl.value ? `${labsEl.value}, ${labs}` : labs;
    showToast('Recommended labs added to Consultation Form!', 'success');
  }
};

// 2. ⭐⭐⭐⭐⭐ AI DIFFERENTIAL DIAGNOSIS COPILOT
window.runAiDifferential = async function() {
  const complaint = document.getElementById('consultComplaint')?.value?.trim() || '';
  const history = document.getElementById('consultHistory')?.value?.trim() || '';
  let symptoms = complaint || history;

  if (!symptoms) {
    symptoms = prompt('🧠 AI Differential Diagnosis: Enter patient symptoms or chief complaints:', 'Acute chest tightness, progressive wheezing for 2 days, dry cough');
    if (!symptoms || !symptoms.trim()) return;
  }

  showAiLoading('DIFFERENTIAL DIAGNOSIS & PROBABILITY CALCULATION');

  try {
    const res = await doctorApiFetch('/ai-clinical/differential-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Differential engine failed');

    const container = getAiContainer();
    if (!container) return;
    container.classList.remove('hidden');

    const diffsHtml = (data.differentials || []).map((d, idx) => {
      const urgencyBadge = d.urgency === 'CRITICAL' || d.urgency === 'HIGH'
        ? 'bg-red-50 text-[#E11D2E] border border-[#E11D2E]'
        : 'bg-blue-50 text-blue-900 border border-blue-600';

      const labsStr = encodeURIComponent((data.recommendedLabs || []).join(', '));
      const diagStr = encodeURIComponent(d.diagnosis);

      return `
        <div class="p-3.5 bg-white border-2 border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-mono text-xs font-bold text-gray-500">#${idx + 1}</span>
              <strong class="font-black text-sm text-[#111111] uppercase tracking-tight">${d.diagnosis}</strong>
              <span class="px-2 py-0.5 ${urgencyBadge} font-mono text-[10px] font-bold uppercase">${d.urgency}</span>
            </div>
            <p class="text-xs font-mono text-gray-600">Calculated Probability: <strong class="text-[#111111]">${d.probability}</strong></p>
          </div>
          <button type="button" onclick="applyDifferentialDiagnosis('${diagStr}', '${labsStr}')" class="btn-secondary text-xs px-3 py-1.5 uppercase font-mono font-bold tracking-wider flex items-center gap-1 flex-shrink-0">
            <span class="material-symbols-outlined text-sm text-[#E11D2E]">check_circle</span>
            <span>Apply to Diagnosis</span>
          </button>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <h4 class="font-black text-sm uppercase text-[#111111] flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-blue-700">diagnostics</span>
            <span>AI Differential Diagnosis &bull; Evaluated for: "${symptoms.substring(0, 45)}..."</span>
          </h4>
          <span class="text-[10px] font-mono font-bold text-gray-500 uppercase">EVIDENCE-BASED</span>
        </div>

        <div class="space-y-2.5">
          ${diffsHtml}
        </div>

        <div class="p-3 bg-white border-2 border-[#111111] space-y-1.5">
          <div class="flex items-center justify-between">
            <span class="font-mono text-[10px] font-bold uppercase tracking-wider text-[#111111]">Recommended Diagnostic Lab Battery</span>
            <button type="button" onclick="addLabsToConsultation('${encodeURIComponent((data.recommendedLabs || []).join(', '))}')" class="text-[10px] font-mono font-bold text-[#E11D2E] hover:underline flex items-center gap-0.5">
              <span class="material-symbols-outlined text-xs">add</span> Add All Labs
            </button>
          </div>
          <p class="text-xs font-mono font-bold text-gray-800">${(data.recommendedLabs || []).join(' &bull; ')}</p>
        </div>
      </div>
    `;

    showToast('AI Differential Diagnoses evaluated successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.applyDifferentialDiagnosis = function(encodedDiag, encodedLabs) {
  const diag = decodeURIComponent(encodedDiag);
  const labs = decodeURIComponent(encodedLabs);

  const diagEl = document.getElementById('consultDiagnosis');
  if (diagEl) diagEl.value = diag;

  if (labs) {
    const labsEl = document.getElementById('consultLabOrders');
    if (labsEl) {
      labsEl.value = labsEl.value ? `${labsEl.value}, ${labs}` : labs;
    }
  }

  const consultSection = document.getElementById('clinicalConsultationSection');
  if (consultSection) consultSection.scrollIntoView({ behavior: 'smooth' });

  showToast(`✅ Primary Diagnosis set to: ${diag}`, 'success');
};

// 3. ⭐⭐⭐⭐⭐ AI MEDICAL SCRIBE & MODAL WORKFLOW
window.openAiScribeModal = function() {
  const modal = document.getElementById('aiScribeModal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('aiScribeInput');
    if (input) {
      if (!input.value) {
        input.value = document.getElementById('consultComplaint')?.value || '';
      }
      input.focus();
    }
  }
};

window.closeAiScribeModal = function() {
  const modal = document.getElementById('aiScribeModal');
  if (modal) modal.classList.add('hidden');
};

window.loadScribePreset = function(type) {
  const input = document.getElementById('aiScribeInput');
  if (!input) return;

  if (type === 'asthma') {
    input.value = '32-year old male presenting with acute wheezing for 2 days, dry cough, SpO2 94%, pulse 92. Known asthmatic on Albuterol. Auscultation reveals bilateral expiratory wheezes. Plan: PEFR test, Salbutamol 2 puffs SOS, Budesonide 200mcg BID.';
  } else if (type === 'cardiac') {
    input.value = '54-year old female presenting with retrosternal chest tightness radiating to left shoulder for 45 mins. Diaphoresis, BP 148/92, pulse 88. Order immediate 12-lead ECG, Troponin-I. Prescribe Aspirin 300mg stat (verify no allergy) and sublingual Sorbitrate.';
  } else if (type === 'urti') {
    input.value = '26-year old patient with 3 days acute fever 101F, severe sore throat, painful swallowing, tonsillar erythema. Vitals stable. Order CBC. Prescribe Paracetamol 650mg TID, Cetirizine 10mg HS, warm saline gargles.';
  } else if (type === 'trauma') {
    input.value = '29-year old presenting post two-wheeler collision. Right forearm swelling, deformity, severe local tenderness. Distal neurovascular status intact. Order X-ray Right Forearm AP/Lateral, immobilization, Paracetamol 1g IV.';
  }
};

window.submitAiScribe = async function() {
  const input = document.getElementById('aiScribeInput');
  const dictationText = input?.value?.trim();
  if (!dictationText) {
    showToast('Please type or paste clinical conversation/dictation first.', 'warning');
    return;
  }

  closeAiScribeModal();
  showAiLoading('MEDICAL SCRIBE: STRUCTURING UNFORMATTED CLINICAL DICTATION');

  try {
    const res = await doctorApiFetch('/ai-clinical/medical-scribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dictationText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Medical Scribe failed');

    const note = data.structuredNote;

    // 1. Populate into consultation form fields
    const complaintEl = document.getElementById('consultComplaint');
    if (complaintEl) complaintEl.value = dictationText;

    const diagEl = document.getElementById('consultDiagnosis');
    if (diagEl) diagEl.value = note.diagnosis;

    const historyEl = document.getElementById('consultHistory');
    if (historyEl) {
      historyEl.value = `${note.formattedObservations}\n\nNext Steps: ${note.suggestedNextSteps}`;
    }

    // 2. If prescriptions extracted, add them into Rx table
    if (note.prescriptions && note.prescriptions.length > 0) {
      const rxTbody = document.getElementById('rxMedicationsTableBody');
      if (rxTbody) {
        rxTbody.innerHTML = ''; // reset table with structured prescriptions
        note.prescriptions.forEach((rx, i) => {
          const row = document.createElement('tr');
          row.className = 'border-b border-[#111111]/10 font-sans text-xs';
          row.id = `rxRow_${i}`;
          row.innerHTML = `
            <td class="p-2">
              <input type="text" class="rx-med-name w-full p-1.5 font-bold" value="${rx}" required>
            </td>
            <td class="p-2">
              <input type="text" class="rx-med-dosage w-full p-1.5 font-mono" value="As Directed">
            </td>
            <td class="p-2">
              <select class="rx-med-freq w-full p-1.5 font-mono font-bold">
                <option value="1-0-1" selected>1-0-1 (Twice daily)</option>
                <option value="1-1-1">1-1-1 (Thrice daily)</option>
                <option value="1-0-0">1-0-0 (Morning)</option>
                <option value="SOS">SOS (When needed)</option>
              </select>
            </td>
            <td class="p-2">
              <input type="text" class="rx-med-duration w-full p-1.5 font-mono" value="5 Days">
            </td>
            <td class="p-2">
              <input type="text" class="rx-med-instructions w-full p-1.5" value="Post meals">
            </td>
            <td class="p-2 text-right">
              <button type="button" onclick="removeRxRow(this)" class="text-gray-400 hover:text-[#E11D2E] p-1 font-bold">✕</button>
            </td>
          `;
          rxTbody.appendChild(row);
        });
      }
    }

    // 3. Render scribe output in container
    const container = getAiContainer();
    if (container) {
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
            <h4 class="font-black text-sm uppercase text-[#111111] flex items-center gap-2">
              <span class="material-symbols-outlined text-base text-purple-700">mic</span>
              <span>AI Scribe: Standardized EHR Consultation Note</span>
            </h4>
            <span class="px-2 py-0.5 border border-purple-600 bg-purple-50 text-purple-900 font-mono text-[10px] font-bold uppercase">Auto-Populated</span>
          </div>

          <div class="p-3.5 bg-white border-2 border-[#111111] space-y-2 text-xs font-sans">
            <div><strong>Clinical Diagnosis:</strong> <span class="font-bold text-[#E11D2E]">${note.diagnosis}</span></div>
            <div class="text-gray-700"><strong>Observations:</strong> ${note.formattedObservations}</div>
            <div><strong>Extracted Medications:</strong> <span class="font-mono font-bold">${note.prescriptions.join(', ')}</span></div>
            <div class="text-gray-600 italic"><strong>Follow-up:</strong> ${note.suggestedNextSteps}</div>
          </div>
        </div>
      `;
    }

    const consultSection = document.getElementById('clinicalConsultationSection');
    if (consultSection) consultSection.scrollIntoView({ behavior: 'smooth' });

    showToast('✅ AI Scribe structured dictation & populated Consultation Form!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 4. ⭐⭐⭐⭐⭐ AI PRESCRIPTION SAFETY & ALLERGY CROSS-CHECK
window.checkPrescriptionSafety = async function() {
  const rows = document.querySelectorAll('#rxMedicationsTableBody tr');
  const medNames = [];
  rows.forEach(tr => {
    const name = tr.querySelector('.rx-med-name')?.value?.trim();
    if (name) medNames.push(name);
  });

  const consultDiag = document.getElementById('consultDiagnosis')?.value || '';
  const prescriptionText = medNames.length > 0 ? medNames.join(', ') : consultDiag;

  if (!prescriptionText || !prescriptionText.trim()) {
    showToast('Please add at least one medication in the Prescription Builder first.', 'warning');
    return;
  }

  showAiLoading('PRESCRIPTION SAFETY: ALLERGY CROSS-REACTIVITY & CONTRAINDICATION SCREEN');

  try {
    const res = await doctorApiFetch('/ai-clinical/prescription-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCodeId: activePatient ? activePatient.qrCodeId : null,
        prescriptionText
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Prescription safety engine failed');

    const container = getAiContainer();
    if (!container) return;
    container.classList.remove('hidden');

    const isSafe = data.status === 'SAFE';
    const scoreColor = isSafe ? 'text-emerald-700' : 'text-[#E11D2E]';
    const cardBorder = isSafe ? 'border-emerald-600 bg-emerald-50/40' : 'border-[#E11D2E] bg-red-50/60';

    let warningsList = '';
    if (data.warnings && data.warnings.length > 0) {
      warningsList = `
        <div class="p-3.5 bg-red-50 border-2 border-[#E11D2E] text-red-950 space-y-1.5">
          <div class="flex items-center gap-1.5 font-mono text-xs font-black uppercase text-[#E11D2E]">
            <span class="material-symbols-outlined text-base">report</span>
            <span>🚨 ALLERGY / LETHAL CONTRAINDICATION ALERT</span>
          </div>
          <ul class="list-disc list-inside space-y-1 text-xs font-bold text-red-900">
            ${data.warnings.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let interactionsList = '';
    if (data.interactions && data.interactions.length > 0) {
      interactionsList = `
        <div class="p-3 bg-amber-50 border-2 border-amber-600 text-amber-950 space-y-1">
          <div class="flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase text-amber-800">
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>Clinical Interaction Warnings</span>
          </div>
          <ul class="list-disc list-inside space-y-0.5 text-xs text-amber-950">
            ${data.interactions.map(i => `<li>${i}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    let alternativesHtml = '';
    if (data.alternativeSuggestions && data.alternativeSuggestions.length > 0) {
      alternativesHtml = `
        <div class="p-3 bg-white border-2 border-[#111111] space-y-1">
          <span class="block font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">Suggested Safe Clinical Alternatives</span>
          <p class="text-xs font-mono font-bold text-gray-800">${data.alternativeSuggestions.join(' &bull; ')}</p>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-base ${isSafe ? 'text-emerald-700' : 'text-[#E11D2E]'}">health_and_safety</span>
            <h4 class="font-black text-sm uppercase text-[#111111]">AI Prescription Safety Validation</h4>
          </div>
          <span class="px-2.5 py-0.5 border-2 ${isSafe ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-[#E11D2E] bg-red-50 text-[#E11D2E]'} font-mono text-xs font-bold uppercase">
            SAFETY SCORE: ${data.safetyScore}/100 (${data.status})
          </span>
        </div>

        <div class="p-3 bg-white border-2 border-[#111111] font-mono text-xs">
          <span class="text-gray-500 block uppercase text-[10px] font-bold">Tested Prescription Payload:</span>
          <strong>${prescriptionText}</strong>
        </div>

        ${warningsList}
        ${interactionsList}

        ${isSafe ? `
          <div class="p-3.5 bg-emerald-50 border-2 border-emerald-600 text-emerald-900 font-sans text-xs font-bold flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-emerald-700">verified</span>
            <span>✅ VERIFIED CLINICALLY SAFE: No known lethal allergy cross-reactivities or acute drug-drug contraindications detected for active patient.</span>
          </div>
        ` : ''}

        ${alternativesHtml}
      </div>
    `;

    if (isSafe) {
      showToast('✅ Prescription verified clinically safe!', 'success');
    } else {
      showToast('⚠️ Clinical Contraindications detected in prescription!', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 5. ⭐⭐⭐⭐⭐ AI AUTO-SOAP NOTE GENERATOR
window.generateSoapNote = async function() {
  const title = document.getElementById('consultDiagnosis')?.value?.trim() || 'Clinical Assessment';
  const complaint = document.getElementById('consultComplaint')?.value?.trim() || '';
  const history = document.getElementById('consultHistory')?.value?.trim() || '';
  const description = complaint || history;

  if (!description) {
    showToast('Please fill in Chief Complaints or HPI in the consultation form first.', 'warning');
    return;
  }

  showAiLoading('SOAP NOTE: GENERATING STANDARDIZED CLINICAL RECORD');

  try {
    const res = await doctorApiFetch('/ai-clinical/soap-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'SOAP generator failed');

    const historyEl = document.getElementById('consultHistory');
    if (historyEl) {
      historyEl.value = data.formattedText;
    }

    const container = getAiContainer();
    if (container) {
      container.classList.remove('hidden');
      container.innerHTML = `
        <div class="space-y-3">
          <div class="flex items-center justify-between pb-2 border-b-2 border-[#111111]">
            <h4 class="font-black text-sm uppercase text-[#111111] flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-amber-700">note_alt</span>
              <span>AI Standardized SOAP Note Generated</span>
            </h4>
            <span class="px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold uppercase">Inserted into HPI</span>
          </div>
          <div class="p-3.5 bg-white border-2 border-[#111111] font-mono text-xs space-y-1.5 whitespace-pre-line text-[#111111]">
            ${data.formattedText}
          </div>
        </div>
      `;
    }

    showToast('✅ Standardized SOAP Note generated and inserted into HPI!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ============================================================
// DOCTOR CLINICAL DECISION TREE SUITE (26 Stages & 38 Scenarios)
// ============================================================
let decisionTreeSchema = null;

async function initDoctorDecisionTree() {
  try {
    const res = await fetch('/api/v1/doctor-decision-tree/schema', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) return;
    decisionTreeSchema = data;
    renderDecisionTrack('track-1');
  } catch (err) {
    console.error('Failed to initialize Doctor Decision Tree:', err);
  }
}

window.switchDecisionTrack = function(trackId) {
  document.querySelectorAll('.track-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-track') === trackId) {
      btn.className = 'track-tab-btn active px-3.5 py-2 border-2 border-[#111111] bg-[#111111] text-white font-mono font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-[2px_2px_0px_#111111]';
    } else {
      btn.className = 'track-tab-btn px-3.5 py-2 border-2 border-[#111111] bg-white text-[#111111] font-mono font-bold text-xs uppercase tracking-wider hover:bg-[#f9fafb] transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer';
    }
  });
  renderDecisionTrack(trackId);
};

function renderDecisionTrack(trackId) {
  const container = document.getElementById('decisionTrackContent');
  if (!container) return;

  if (!decisionTreeSchema || !decisionTreeSchema.tracks) {
    container.innerHTML = `<div class="p-6 text-center font-mono text-xs text-[#111111]/60 uppercase font-bold">Loading Clinical Decision Tree...</div>`;
    return;
  }

  const track = decisionTreeSchema.tracks.find(t => t.id === trackId);
  if (!track) return;

  let stagesHtml = '';
  track.stages.forEach(stage => {
    let actionButtons = '';
    
    if (stage.options) {
      actionButtons = stage.options.map(opt => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', '${opt}', 'Triage Priority Set: ${opt}')" class="btn-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider">
          <span>${opt}</span>
        </button>
      `).join('');
    } else if (stage.actions) {
      actionButtons = stage.actions.map(act => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', '${act}', 'Clinical action executed: ${act}')" class="btn-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-xs text-[#E11D2E]">play_arrow</span> ${act}
        </button>
      `).join('');
    } else if (stage.elements) {
      actionButtons = stage.elements.map(el => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', 'Audited ${el}', 'Verified and reviewed patient ${el}')" class="btn-secondary px-2.5 py-1.5 text-[11px] font-mono font-bold uppercase tracking-wider">
          &check; ${el}
        </button>
      `).join('');
    } else if (stage.categories) {
      actionButtons = stage.categories.map(c => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', 'Allergy Check: ${c}', 'Audited ${c} allergy safety matrix')" class="btn-danger px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider">
          ⚠️ ${c} Allergy
        </button>
      `).join('');
    } else if (stage.examples || stage.systems || stage.vitals || stage.levels || stage.types || stage.choices || stage.forms || stage.list || stage.steps || stage.specialties || stage.units || stage.protocols || stage.destinations || stage.panels || stage.docs || stage.topics || stage.intervals) {
      const items = stage.examples || stage.systems || stage.vitals || stage.levels || stage.types || stage.choices || stage.forms || stage.list || stage.steps || stage.specialties || stage.units || stage.protocols || stage.destinations || stage.panels || stage.docs || stage.topics || stage.intervals;
      actionButtons = items.map(item => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', '${item}', 'Clinical Decision Protocol: ${item}')" class="btn-secondary px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider">
          ${item}
        </button>
      `).join('');
    }

    stagesHtml += `
      <div class="p-4.5 bg-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] space-y-3">
        <div class="flex items-center justify-between pb-2 border-b-2 border-[#111111]/10">
          <h4 class="font-black text-xs text-[#111111] flex items-center gap-2 uppercase tracking-tight">
            <span class="w-5 h-5 border border-[#111111] bg-[#111111] text-white text-[10px] flex items-center justify-center font-mono font-bold">${stage.id}</span>
            <span>${stage.name}</span>
          </h4>
          <span class="text-[10px] text-[#111111]/60 font-mono font-bold uppercase">Stage ${stage.id} of 26</span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          ${actionButtons}
        </div>
      </div>
    `;
  });

  container.innerHTML = stagesHtml;
}

window.executeDecisionStage = async function(stageId, stageName, decisionTitle, details) {
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please search and select an active patient first.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/v1/doctor-decision-tree/execute-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        qrCodeId: activePatient.qrCodeId,
        stageId,
        stageName,
        decisionTitle,
        details
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Executed Stage ${stageId}: ${decisionTitle}`, 'success');
    await loadPatientMedicalHistory(activePatient.qrCodeId);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.triggerSpecialSituation = async function(protocolName) {
  if (!protocolName) return;
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please search and select an active patient first.', 'warning');
    document.getElementById('specialSituationSelect').value = '';
    return;
  }

  try {
    const res = await fetch('/api/v1/doctor-decision-tree/execute-stage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        qrCodeId: activePatient.qrCodeId,
        stageId: 20,
        stageName: 'Emergency Management & Special Situation',
        decisionTitle: `🚨 SPECIAL PROTOCOL ACTIVATED: ${protocolName}`,
        details: `Doctor activated high-priority emergency situation protocol: ${protocolName}. Clinical escalation initiated.`,
        emergencyProtocol: protocolName
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`🚨 High-Priority Emergency Protocol Triggered: ${protocolName}`, 'warning');
    document.getElementById('specialSituationSelect').value = '';
    await loadPatientMedicalHistory(activePatient.qrCodeId);
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Initialize decision tree on load
document.addEventListener('DOMContentLoaded', () => {
  initDoctorDecisionTree();
  loadDoctorWaitingQueue();
  setupDoctorSocketQueue();
  setInterval(() => loadDoctorWaitingQueue(true), 12000);
});

// ==================== DOCTOR WAITING ROOM & CLINICAL CONSULTATION WORKFLOW ====================

let doctorQueue = [];
let currentConsultingToken = null;

// Audio Chime Generator using Web Audio API
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.6);
  } catch (e) {
    console.log('Audio chime not permitted without prior user gesture.');
  }
}

async function loadDoctorWaitingQueue(silent = false) {
  try {
    const res = await (window.authFetch ? window.authFetch('/api/v1/doctor-access/waiting-queue') : fetch('/api/v1/doctor-access/waiting-queue', { credentials: 'include' }));
    if (!res.ok) return;
    const data = await res.json();
    doctorQueue = data.queue || [];
    renderWaitingQueue(doctorQueue, data.nowCalling);
  } catch (e) {
    if (!silent) console.warn('Queue fetch warning:', e);
  }
}

window.switchLeftPanelTab = function(tab) {
  const tabs = ['queue', 'search', 'authorized'];
  tabs.forEach(t => {
    const pane = document.getElementById(t === 'queue' ? 'leftPaneQueue' : (t === 'search' ? 'leftPaneSearch' : 'leftPaneAuthorized'));
    const btn = document.getElementById(t === 'queue' ? 'leftTabQueueBtn' : (t === 'search' ? 'leftTabSearchBtn' : 'leftTabAuthBtn'));
    
    if (t === tab) {
      if (pane) pane.classList.remove('hidden');
      if (btn) {
        btn.className = 'flex-1 py-1.5 px-2 bg-[#111111] text-white uppercase text-center transition flex items-center justify-center gap-1 shadow-[2px_2px_0px_#111111]';
      }
    } else {
      if (pane) pane.classList.add('hidden');
      if (btn) {
        btn.className = 'flex-1 py-1.5 px-2 bg-transparent text-[#111111] hover:bg-gray-200 uppercase text-center transition flex items-center justify-center gap-1';
      }
    }
  });

  if (tab === 'queue') {
    loadDoctorWaitingQueue(true);
  } else if (tab === 'authorized') {
    loadAuthorizedPatients();
  }
};

window.scrollToDoctorSection = function(sectionId) {
  let el = document.getElementById(sectionId);
  if (!el && sectionId === 'patientMedicalHistoryCard') {
    el = document.getElementById('authorizedDetailsContainer');
  }
  if (!el) return;

  // Highlight active button in jump bar
  document.querySelectorAll('.doctor-jump-btn').forEach(btn => {
    btn.classList.remove('bg-[#111111]', 'text-white');
    btn.classList.add('bg-[#f9fafb]', 'text-[#111111]');
  });
  if (window.event && window.event.currentTarget && window.event.currentTarget.classList.contains('doctor-jump-btn')) {
    window.event.currentTarget.classList.remove('bg-[#f9fafb]', 'text-[#111111]');
    window.event.currentTarget.classList.add('bg-[#111111]', 'text-white');
  }

  const offset = 85;
  const elementPosition = el.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;
  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  });
};

window.callNextWaitingPatient = async function() {
  if (!doctorQueue || doctorQueue.length === 0) {
    await loadDoctorWaitingQueue(true);
  }

  const nextWaiting = (doctorQueue || []).find(q => q.status === 'waiting');
  if (nextWaiting) {
    await callPatientIn(nextWaiting.tokenNumber, nextWaiting.qrCodeId);
  } else {
    const inConsult = (doctorQueue || []).find(q => q.status === 'in_consultation');
    if (inConsult) {
      showToast(`Token #${inConsult.tokenNumber} (${inConsult.patientName}) is currently active in consultation.`, 'info');
      await callPatientIn(inConsult.tokenNumber, inConsult.qrCodeId);
    } else {
      showToast('No patients currently in OPD waiting queue. Register a new intake or search by LifeQR ID.', 'info');
      switchLeftPanelTab('queue');
    }
  }
};

function renderWaitingQueue(queue, nowCalling) {
  const container = document.getElementById('doctorWaitingQueueContainer');
  const badgeCount = document.getElementById('waitingQueueCountBadge');
  if (!container) return;

  const activeWaiting = queue.filter(q => q.status === 'waiting' || q.status === 'in_consultation');
  if (badgeCount) badgeCount.textContent = activeWaiting.length;

  if (activeWaiting.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center border-2 border-dashed border-[#111111]/30 bg-[#f9fafb]">
        <span class="material-symbols-outlined text-3xl text-[#111111]/40 mb-1">sentiment_satisfied</span>
        <p class="font-mono text-xs font-bold text-[#111111] uppercase">No Patients Currently Waiting</p>
        <p class="text-[11px] text-[#111111]/60 font-sans">New patients registered at clinic front desk or direct intake will appear here immediately.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = activeWaiting.map(item => {
    const isCalling = item.status === 'in_consultation';
    const borderCls = isCalling 
      ? 'border-2 border-[#E11D2E] bg-red-50/50 shadow-[3px_3px_0px_#E11D2E]' 
      : 'border-2 border-[#111111] bg-white shadow-[3px_3px_0px_#111111] hover:shadow-[4px_4px_0px_#111111]';
    const statusBadge = isCalling 
      ? '<span class="px-1.5 py-0.5 border border-[#E11D2E] bg-[#E11D2E] text-white font-mono text-[9px] font-black uppercase animate-pulse">IN CONSULT</span>'
      : '<span class="px-1.5 py-0.5 border border-[#111111] bg-amber-50 text-amber-900 font-mono text-[9px] font-bold uppercase">WAITING</span>';

    return `
      <div class="p-3.5 ${borderCls} space-y-2.5 transition-all">
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 border-2 border-[#111111] bg-[#111111] text-white flex flex-col items-center justify-center font-mono flex-shrink-0 shadow-[1px_1px_0px_#111111]">
              <span class="text-[8px] font-bold uppercase leading-none text-white/60">TKN</span>
              <span class="text-sm font-black leading-none mt-0.5">${item.tokenNumber}</span>
            </div>
            <div class="min-w-0">
              <h4 class="font-black text-xs uppercase text-[#111111] truncate tracking-tight">${item.patientName}</h4>
              <p class="font-mono text-[10px] text-[#111111]/70 font-semibold truncate">
                ${item.qrCodeId} &bull; ${item.age || 30}y &bull; ${item.gender || 'Pt'}
              </p>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1 flex-shrink-0">
            ${statusBadge}
            <span class="px-1.5 py-0.2 border border-[#111111] bg-[#f9fafb] font-mono text-[9px] font-black text-[#E11D2E]">${item.bloodGroup || 'N/A'}</span>
          </div>
        </div>

        <div class="p-2 bg-[#f9fafb] border border-[#111111]/20 text-[11px] font-sans">
          <span class="font-mono text-[9px] font-bold uppercase text-[#E11D2E] block">Chief Complaint:</span>
          <p class="text-[#111111] font-medium line-clamp-2 mt-0.5">${item.chiefComplaint || 'Consultation request'}</p>
        </div>

        <button onclick="callPatientIn(${item.tokenNumber}, '${item.qrCodeId}')" class="${isCalling ? 'btn-primary' : 'btn-secondary'} w-full py-1.5 px-2 text-xs font-mono uppercase font-bold tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#111111]">
          <span class="material-symbols-outlined text-sm">${isCalling ? 'play_arrow' : 'campaign'}</span>
          <span>${isCalling ? 'Resume Active Chart' : 'Call Patient In'}</span>
        </button>
      </div>
    `;
  }).join('');
}

window.callPatientIn = async function(tokenNumber, qrCodeId) {
  try {
    const res = await (window.authFetch ? window.authFetch('/api/v1/doctor-access/call-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenNumber, roomNumber: 'Consultation Room 102' })
    }) : fetch('/api/v1/doctor-access/call-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ tokenNumber, roomNumber: 'Consultation Room 102' })
    }));

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    playChime();
    showToast(`📢 Token #${tokenNumber} called into Consultation Room 102! Announcement broadcast to reception.`, 'success');
    currentConsultingToken = tokenNumber;

    // Auto-select patient and load chart
    const input = document.getElementById('patientQrId');
    if (input && qrCodeId) {
      input.value = qrCodeId;
      await searchPatient();
    }

    // Populate consultation form with initial token data
    const item = doctorQueue.find(q => q.tokenNumber === tokenNumber);
    if (item) {
      if (document.getElementById('consultComplaint')) document.getElementById('consultComplaint').value = item.chiefComplaint || '';
      if (document.getElementById('consultPulse')) document.getElementById('consultPulse').value = item.vitals?.hr || '';
      if (document.getElementById('consultBp')) document.getElementById('consultBp').value = item.vitals?.bp || '';
      if (document.getElementById('consultSpo2')) document.getElementById('consultSpo2').value = item.vitals?.spo2 || '';
      if (document.getElementById('consultTemp')) document.getElementById('consultTemp').value = item.vitals?.temp || '';
    }

    await loadDoctorWaitingQueue(true);

    // Scroll smoothly to Consultation Workspace
    const consultEl = document.getElementById('clinicalConsultationSection');
    if (consultEl) consultEl.scrollIntoView({ behavior: 'smooth' });
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.openNewPatientModal = function() {
  const modal = document.getElementById('doctorNewPatientModal');
  if (modal) modal.classList.remove('hidden');
  const phoneInput = document.getElementById('docNewPhone');
  if (phoneInput && (!phoneInput.value || !phoneInput.value.trim() || phoneInput.value === '+91')) {
    phoneInput.value = '+91 ';
  }
};

window.closeNewPatientModal = function() {
  const modal = document.getElementById('doctorNewPatientModal');
  if (modal) modal.classList.add('hidden');
};

window.handleNewPatientSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('docNewName').value.trim();
  const age = document.getElementById('docNewAge').value.trim();
  const gender = document.getElementById('docNewGender').value;
  let phone = document.getElementById('docNewPhone').value.trim();
  const bloodGroup = document.getElementById('docNewBlood').value;
  const allergies = document.getElementById('docNewAllergies').value.trim();
  const chiefComplaint = document.getElementById('docNewComplaint').value.trim();

  // Normalize phone number to format +91 XXXXXXXXXX
  if (phone && phone !== '+91' && phone !== '+91 ') {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.startsWith('91') && digits.length >= 12) {
      phone = '+' + digits.slice(0, 2) + ' ' + digits.slice(2);
    } else if (digits.length === 10) {
      phone = '+91 ' + digits;
    }
  } else {
    phone = '';
  }

  try {
    const res = await (window.authFetch ? window.authFetch('/api/v1/doctor-access/create-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, age, gender, phone, bloodGroup, allergies, chiefComplaint })
    }) : fetch('/api/v1/doctor-access/create-patient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, age, gender, phone, bloodGroup, allergies, chiefComplaint })
    }));

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`✅ Patient ${name} created with LifeQR ID ${data.patient.qrCodeId} and added to queue!`, 'success');
    closeNewPatientModal();
    const newPatientForm = document.getElementById('doctorNewPatientForm');
    if (newPatientForm) newPatientForm.reset();
    const phoneInput = document.getElementById('docNewPhone');
    if (phoneInput) phoneInput.value = '+91 ';
    await loadDoctorWaitingQueue();
    await loadAuthorizedPatients();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ==================== PRESCRIPTION BUILDER & CONSULTATION SAVER ====================

let rxRowCounter = 1;

window.addRxRow = function(name = '', dosage = '500mg', freq = '1-0-1', duration = '5 Days', instructions = 'After Food') {
  const tbody = document.getElementById('rxMedicationsTableBody');
  if (!tbody) return;

  const rowId = `rxRow_${rxRowCounter++}`;
  const tr = document.createElement('tr');
  tr.id = rowId;
  tr.className = 'border-b border-[#111111]/10 font-sans text-xs';
  tr.innerHTML = `
    <td class="p-2">
      <input type="text" class="rx-med-name w-full p-1.5 font-bold" placeholder="e.g. Amoxicillin / Paracetamol" value="${name}" required>
    </td>
    <td class="p-2">
      <input type="text" class="rx-med-dosage w-full p-1.5 font-mono" placeholder="500mg" value="${dosage}">
    </td>
    <td class="p-2">
      <select class="rx-med-freq w-full p-1.5 font-mono font-bold">
        <option value="1-0-1" ${freq === '1-0-1' ? 'selected' : ''}>1-0-1 (Twice daily)</option>
        <option value="1-1-1" ${freq === '1-1-1' ? 'selected' : ''}>1-1-1 (Thrice daily)</option>
        <option value="1-0-0" ${freq === '1-0-0' ? 'selected' : ''}>1-0-0 (Morning only)</option>
        <option value="0-0-1" ${freq === '0-0-1' ? 'selected' : ''}>0-0-1 (Night only)</option>
        <option value="SOS" ${freq === 'SOS' ? 'selected' : ''}>SOS (As needed)</option>
      </select>
    </td>
    <td class="p-2">
      <input type="text" class="rx-med-duration w-full p-1.5 font-mono" placeholder="5 Days" value="${duration}">
    </td>
    <td class="p-2">
      <select class="rx-med-instructions w-full p-1.5 font-sans">
        <option value="After Food" ${instructions === 'After Food' ? 'selected' : ''}>After Food</option>
        <option value="Before Food" ${instructions === 'Before Food' ? 'selected' : ''}>Before Food</option>
        <option value="With Milk" ${instructions === 'With Milk' ? 'selected' : ''}>With Milk</option>
        <option value="Bedtime" ${instructions === 'Bedtime' ? 'selected' : ''}>Bedtime</option>
      </select>
    </td>
    <td class="p-2 text-right">
      <button type="button" onclick="document.getElementById('${rowId}').remove()" class="text-rose-600 hover:text-rose-800 font-bold px-2 py-1"><span class="material-symbols-outlined text-sm">delete</span></button>
    </td>
  `;
  tbody.appendChild(tr);
};

window.saveFullConsultation = async function() {
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please select or search an active patient first.', 'warning');
    return;
  }

  const diagnosis = document.getElementById('consultDiagnosis')?.value;
  if (!diagnosis) {
    showToast('Please enter a clinical diagnosis.', 'warning');
    document.getElementById('consultDiagnosis')?.focus();
    return;
  }

  const chiefComplaint = document.getElementById('consultComplaint')?.value || '';
  const presentHistory = document.getElementById('consultHistory')?.value || '';
  const clinicalNotes = document.getElementById('consultNotes')?.value || '';
  const labOrdersText = document.getElementById('consultLabOrders')?.value || '';
  const followUpDays = document.getElementById('consultFollowUp')?.value || '7';

  const vitals = {
    hr: document.getElementById('consultPulse')?.value || 80,
    bp: document.getElementById('consultBp')?.value || '120/80',
    spo2: document.getElementById('consultSpo2')?.value || 99,
    temp: document.getElementById('consultTemp')?.value || '98.6°F'
  };

  // Extract Rx Table Rows
  const medications = [];
  document.querySelectorAll('#rxMedicationsTableBody tr').forEach(tr => {
    const name = tr.querySelector('.rx-med-name')?.value;
    const dosage = tr.querySelector('.rx-med-dosage')?.value;
    const frequency = tr.querySelector('.rx-med-freq')?.value;
    const duration = tr.querySelector('.rx-med-duration')?.value;
    const instructions = tr.querySelector('.rx-med-instructions')?.value;
    if (name) {
      medications.push({ name, dosage, frequency, duration, instructions });
    }
  });

  const labOrders = labOrdersText ? labOrdersText.split(',').map(s => s.trim()).filter(Boolean) : [];

  try {
    const res = await (window.authFetch ? window.authFetch('/api/v1/doctor-access/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        qrCodeId: activePatient.qrCodeId,
        tokenNumber: currentConsultingToken,
        chiefComplaint,
        presentIllnessHistory: presentHistory,
        vitals,
        diagnosis,
        clinicalNotes,
        medications,
        labOrders,
        followUpDays
      })
    }) : fetch('/api/v1/doctor-access/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        qrCodeId: activePatient.qrCodeId,
        tokenNumber: currentConsultingToken,
        chiefComplaint,
        presentIllnessHistory: presentHistory,
        vitals,
        diagnosis,
        clinicalNotes,
        medications,
        labOrders,
        followUpDays
      })
    }));

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast('✅ Consultation saved & Digital Rx synced to Patient LifeQR Vault!', 'success');
    await loadPatientMedicalHistory(activePatient.qrCodeId);
    await loadDoctorWaitingQueue();
    currentConsultingToken = null;
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.printDigitalPrescription = function() {
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please select a patient first.', 'warning');
    return;
  }

  const diagnosis = document.getElementById('consultDiagnosis')?.value || 'Clinical Assessment';
  const doctorName = currentUser?.name || 'Dr. Amit Sharma';
  const patientName = activePatient?.name || 'Patient';
  const qrCodeId = activePatient?.qrCodeId || 'LQR-PAT';
  const ageGender = `${activePatient?.age || 30}y / ${activePatient?.gender || 'M'}`;
  const bloodGroup = activePatient?.bloodGroup || 'O+';
  const pulse = document.getElementById('consultPulse')?.value || '78';
  const bp = document.getElementById('consultBp')?.value || '120/80';
  const spo2 = document.getElementById('consultSpo2')?.value || '99';
  const temp = document.getElementById('consultTemp')?.value || '98.6°F';
  const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  let medsHtml = '';
  document.querySelectorAll('#rxMedicationsTableBody tr').forEach(tr => {
    const name = tr.querySelector('.rx-med-name')?.value;
    const dosage = tr.querySelector('.rx-med-dosage')?.value;
    const frequency = tr.querySelector('.rx-med-freq')?.value;
    const duration = tr.querySelector('.rx-med-duration')?.value;
    const instructions = tr.querySelector('.rx-med-instructions')?.value;
    if (name) {
      medsHtml += `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${dosage}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${frequency}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd;">${duration}</td>
          <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #555;">${instructions}</td>
        </tr>
      `;
    }
  });

  const printWin = window.open('', '_blank', 'width=800,height=900');
  printWin.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Digital Prescription — ${patientName}</title>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #111; padding: 40px; }
        .header { border-bottom: 3px solid #111; padding-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
        .brand { font-size: 24px; font-weight: 900; letter-spacing: -1px; }
        .doc-details { font-size: 13px; text-align: right; }
        .pat-bar { margin-top: 20px; padding: 12px; background: #f4f4f5; border: 1px solid #111; display: flex; justify-content: space-between; font-size: 13px; }
        .vitals-bar { margin-top: 10px; font-size: 12px; font-family: monospace; color: #333; }
        .rx-symbol { font-size: 32px; font-weight: 900; font-family: serif; margin-top: 25px; color: #E11D2E; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
        th { text-align: left; padding: 8px; border-bottom: 2px solid #111; font-family: monospace; text-transform: uppercase; }
        .footer { margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end; }
        .sig-line { border-top: 1px solid #111; width: 200px; text-align: center; padding-top: 6px; font-size: 12px; font-weight: bold; }
        @media print { body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">LIFEQR MEDICAL NETWORK</div>
          <div style="font-size: 12px; font-family: monospace; color: #666;">Verified Clinical Consultation Slip</div>
        </div>
        <div class="doc-details">
          <strong>Dr. ${doctorName}</strong><br>
          Emergency Medicine &amp; Clinical Care<br>
          Reg No: MCI-DEL-2018-84920
        </div>
      </div>

      <div class="pat-bar">
        <div><strong>Patient:</strong> ${patientName} (${ageGender})</div>
        <div><strong>Blood Group:</strong> <span style="color: #E11D2E; font-weight: bold;">${bloodGroup}</span></div>
        <div><strong>LifeQR ID:</strong> ${qrCodeId}</div>
        <div><strong>Date:</strong> ${dateStr}</div>
      </div>

      <div class="vitals-bar">
        <strong>VITALS:</strong> Pulse: ${pulse} bpm | BP: ${bp} mmHg | SpO2: ${spo2}% | Temp: ${temp}
      </div>

      <div style="margin-top: 18px; font-size: 14px;">
        <strong>DIAGNOSIS:</strong> <span style="font-weight: bold; color: #111;">${diagnosis}</span>
      </div>

      <div class="rx-symbol">&#8478;</div>

      <table>
        <thead>
          <tr>
            <th>Medication</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
            <th>Instructions</th>
          </tr>
        </thead>
        <tbody>
          ${medsHtml || '<tr><td colspan="5" style="padding: 12px; text-align: center; color: #888;">No medications prescribed.</td></tr>'}
        </tbody>
      </table>

      <div class="footer">
        <div style="font-size: 11px; font-family: monospace; color: #666;">
          Digitally authenticated by LifeQR Zero-Knowledge Health Vault.<br>
          Direct Emergency Pass: lifeqr.com/e/${qrCodeId}
        </div>
        <div class="sig-line">
          Dr. ${doctorName}<br>
          <span style="font-size: 10px; font-weight: normal; color: #666;">Authorized Signature</span>
        </div>
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWin.document.close();
};

function setupDoctorSocketQueue() {
  if (typeof io !== 'undefined') {
    try {
      const socket = io({ withCredentials: true });
      socket.on('connect', () => {
        socket.emit('join-room', 'doctor:all');
        socket.emit('join-room', 'hospital:er');
        if (typeof currentUser !== 'undefined' && currentUser && currentUser.id) {
          socket.emit('join-room', `doctor:${currentUser.id}`);
        }
      });
      socket.on('patient-queued', (item) => {
        showToast(`🔔 New patient in waiting queue: ${item.patientName} (Token #${item.tokenNumber})`, 'warning');
        loadDoctorWaitingQueue(true);
        loadAuthorizedPatients();
      });
      socket.on('calling-patient', (data) => {
        loadDoctorWaitingQueue(true);
      });
    } catch (e) {
      console.warn('Socket setup fallback:', e);
    }
  }
}

// ============================================================
// DOCTOR HELP & ADMIN ASSISTANCE TICKET WORKFLOW
// ============================================================
window.openHelpModal = function() {
  const modal = document.getElementById('doctorHelpModal');
  if (!modal) return;
  modal.classList.remove('hidden');

  // Auto-fill active patient ID if present
  const patInput = document.getElementById('helpPatientId');
  if (patInput && activePatient && activePatient.qrCodeId) {
    patInput.value = activePatient.qrCodeId;
  }

  loadDoctorHelpTickets();
};

window.closeHelpModal = function() {
  const modal = document.getElementById('doctorHelpModal');
  if (modal) modal.classList.add('hidden');
};

window.switchHelpTab = function(tab) {
  const newBtn = document.getElementById('helpTabNewBtn');
  const histBtn = document.getElementById('helpTabHistoryBtn');
  const formPane = document.getElementById('doctorHelpForm');
  const histPane = document.getElementById('doctorHelpHistoryPane');

  if (tab === 'new') {
    if (newBtn) newBtn.className = 'px-3 py-1.5 border-2 border-[#111111] bg-[#111111] text-white font-bold uppercase tracking-wider';
    if (histBtn) histBtn.className = 'px-3 py-1.5 border-2 border-[#111111] bg-white text-[#111111] font-bold uppercase tracking-wider hover:bg-gray-50 flex items-center gap-1.5';
    if (formPane) formPane.classList.remove('hidden');
    if (histPane) histPane.classList.add('hidden');
  } else {
    if (histBtn) histBtn.className = 'px-3 py-1.5 border-2 border-[#111111] bg-[#111111] text-white font-bold uppercase tracking-wider flex items-center gap-1.5';
    if (newBtn) newBtn.className = 'px-3 py-1.5 border-2 border-[#111111] bg-white text-[#111111] font-bold uppercase tracking-wider hover:bg-gray-50';
    if (formPane) formPane.classList.add('hidden');
    if (histPane) histPane.classList.remove('hidden');
    loadDoctorHelpTickets();
  }
};

window.handleDoctorHelpSubmit = async function(e) {
  e.preventDefault();
  const subject = document.getElementById('helpSubject')?.value?.trim();
  const message = document.getElementById('helpMessage')?.value?.trim();
  const category = document.getElementById('helpCategory')?.value;
  const priority = document.getElementById('helpPriority')?.value;
  const patientQrCodeId = document.getElementById('helpPatientId')?.value?.trim();

  if (!subject || !message) {
    showToast('Please provide both subject and detailed message.', 'warning');
    return;
  }

  const submitBtn = document.getElementById('helpSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Dispatching...</span>';
  }

  try {
    const res = await doctorApiFetch('/help-tickets', {
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

    showToast('✅ Help ticket dispatched to System Administrators!', 'success');
    document.getElementById('doctorHelpForm').reset();
    switchHelpTab('history');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">send</span><span>Dispatch Help Request to Admins</span>';
    }
  }
};

window.loadDoctorHelpTickets = async function() {
  try {
    const res = await doctorApiFetch('/help-tickets/my');
    if (!res.ok) return;
    const data = await res.json();
    const tickets = data.tickets || [];

    const badge = document.getElementById('helpMyTicketsBadge');
    if (badge) badge.textContent = tickets.length;

    const dot = document.getElementById('helpPendingDot');
    const hasPending = tickets.some(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS');
    if (dot) {
      if (hasPending) dot.classList.remove('hidden');
      else dot.classList.add('hidden');
    }

    const list = document.getElementById('doctorHelpHistoryList');
    if (!list) return;

    if (tickets.length === 0) {
      list.innerHTML = `
        <div class="p-6 border-2 border-dashed border-[#111111]/30 text-center text-gray-500 font-mono text-xs">
          No help tickets submitted yet. If you encounter any technical difficulty or emergency consult block, submit a request above.
        </div>
      `;
      return;
    }

    list.innerHTML = tickets.map(t => {
      let statusBadge = '';
      if (t.status === 'RESOLVED') {
        statusBadge = '<span class="px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase">RESOLVED</span>';
      } else if (t.status === 'IN_PROGRESS') {
        statusBadge = '<span class="px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-900 text-[10px] font-mono font-bold uppercase">IN PROGRESS</span>';
      } else {
        statusBadge = '<span class="px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-900 text-[10px] font-mono font-bold uppercase">PENDING ADMIN CHECK</span>';
      }

      const priorityBadge = t.priority === 'CRITICAL' 
        ? '<span class="px-1.5 py-0.2 bg-red-100 text-[#E11D2E] border border-[#E11D2E] text-[9px] font-mono font-bold">CRITICAL</span>'
        : (t.priority === 'HIGH' ? '<span class="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-500 text-[9px] font-mono font-bold">HIGH</span>' : '');

      const dateStr = new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="p-3.5 bg-white border-2 border-[#111111] space-y-2">
          <div class="flex items-center justify-between gap-2 flex-wrap pb-1.5 border-b border-[#111111]/15">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-mono font-black text-xs text-[#E11D2E]">${t.ticketId}</span>
              ${priorityBadge}
              <span class="text-xs font-bold text-[#111111]">${t.subject}</span>
            </div>
            <div class="flex items-center gap-2">
              ${statusBadge}
              <span class="text-[10px] font-mono text-gray-500">${dateStr}</span>
            </div>
          </div>

          <p class="text-xs text-[#111111]/80 font-sans leading-relaxed">${t.message}</p>

          ${t.patientQrCodeId ? `
            <div class="font-mono text-[11px] text-gray-600">
              Related Patient: <strong class="text-[#E11D2E]">${t.patientQrCodeId}</strong>
            </div>
          ` : ''}

          ${t.adminNotes ? `
            <div class="p-2.5 bg-[#f9fafb] border-l-4 border-emerald-600 text-xs font-sans space-y-1">
              <span class="font-mono text-[10px] font-bold text-emerald-800 uppercase block">Admin Resolution Response:</span>
              <p class="text-[#111111] font-medium">${t.adminNotes}</p>
            </div>
          ` : `
            <div class="text-[10px] font-mono text-gray-500 italic">
              Ticket logged. Awaiting administrator review and clearance.
            </div>
          `}
        </div>
      `;
    }).join('');
  } catch (err) {
    console.warn('Failed to load doctor help tickets:', err);
  }
};

// ==================== HOSPITAL INPATIENT ADMISSION & BED ALLOCATION ====================

window.updateSuggestedBed = function(ward) {
  const bedInput = document.getElementById('admitHospitalBed');
  if (!bedInput) return;
  if (ward.includes('Trauma Bay 1')) bedInput.value = 'TB-01';
  else if (ward.includes('Trauma Bay 2')) bedInput.value = 'TB-02';
  else if (ward.includes('ICU')) bedInput.value = 'ICU-04';
  else if (ward.includes('General')) bedInput.value = 'GW-12';
  else if (ward.includes('Cardiology')) bedInput.value = 'CCU-02';
  else bedInput.value = 'OBS-03';
};

async function loadDoctorHospitalBedMetrics() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/hospitals/metrics') : '/api/v1/hospitals/metrics';
    const res = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    if (!res.ok) return;
    const data = await res.json();
    const badge = document.getElementById('hospitalBedAvailabilityBadge');
    if (badge && data.beds) {
      const avail = (data.beds.traumaBaysAvailable || 0) + (data.beds.icuAvailable || 0) + (data.beds.generalAvailable || 0);
      badge.textContent = `Beds Available: ${avail} / ${data.beds.total || 30}`;
    }
  } catch (e) {
    console.warn('loadDoctorHospitalBedMetrics notice:', e.message);
  }
}

window.admitPatientToHospital = async function() {
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please search or call an active patient before admitting.', 'warning');
    return;
  }

  const facility = document.getElementById('admitHospitalFacility')?.value || 'Metro City Central Emergency & Trauma Center';
  const ward = document.getElementById('admitHospitalWard')?.value || 'Trauma Bay 1 (Resuscitation Alpha)';
  const bedNumber = document.getElementById('admitHospitalBed')?.value.trim() || 'TB-01';
  const triageLevel = document.getElementById('admitHospitalTriage')?.value || 'URGENT';
  const reason = document.getElementById('admitHospitalReason')?.value.trim() 
    || document.getElementById('consultDiagnosis')?.value 
    || 'Inpatient admission from physician workstation';

  const vitals = {
    hr: document.getElementById('consultPulse')?.value || 84,
    bp: document.getElementById('consultBp')?.value || '120/80',
    spo2: document.getElementById('consultSpo2')?.value || 99,
    temp: document.getElementById('consultTemp')?.value || '98.6°F'
  };

  const attendingName = (currentUser && currentUser.name) ? currentUser.name : 'Attending Physician';

  try {
    showToast('Transmitting hospital inpatient admission protocol...', 'info');
    const apiUrl = window.getApiUrl ? window.getApiUrl('/hospitals/admissions') : '/api/v1/hospitals/admissions';
    const fetchFn = window.authFetch || fetch;

    const res = await fetchFn(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        qrCodeId: activePatient.qrCodeId,
        patientName: activePatient.name || 'Admitted Patient',
        bloodGroup: activePatient.bloodGroup || 'O+',
        age: activePatient.age || 30,
        gender: activePatient.gender || 'Other',
        ward,
        bedNumber,
        attendingDoctor: attendingName,
        triageLevel,
        vitals
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to complete admission');

    // Also record clinical treatment history note for the patient
    try {
      await doctorApiFetch(`/history/add/${encodeURIComponent(activePatient.qrCodeId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'treatment',
          title: `Hospital Admission: ${ward} (${bedNumber})`,
          description: `Patient admitted to ${facility}. Ward: ${ward}, Bed: ${bedNumber}. Triage: ${triageLevel}. Reason: ${reason}`
        })
      });
    } catch(e) {}

    const admissionId = data.admission?.id || 'CONFIRMED';
    showToast(`🏥 Patient ${activePatient.name} admitted successfully to ${ward} (${bedNumber})! Admission ID: ${admissionId}`, 'success');

    // Update beds badge and refresh medical history timeline
    await loadDoctorHospitalBedMetrics();
    if (activePatient.qrCodeId) {
      await loadPatientMedicalHistory(activePatient.qrCodeId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

