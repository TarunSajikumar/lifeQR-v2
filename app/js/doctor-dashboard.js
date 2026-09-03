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

  // Check account verification status
  await checkVerificationStatus();

  // Load list of authorized patients
  await loadAuthorizedPatients();

  // Handle forms
  setupDoctorListeners();
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
      contactEl.textContent = `${c.name || 'ICE'} (${c.phone || c.relationship || 'Emergency'})`;
      contactEl.title = `${c.name} - ${c.phone} (${c.relationship || 'ICE Contact'})`;
    } else {
      contactEl.textContent = activePatient.phone || 'Registered ICE Contact';
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

// Helper to show AI loading state
function showAiLoading(toolName) {
  const container = document.getElementById('aiOutputContainer');
  if (!container) return;
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="flex items-center gap-3 p-2 text-indigo-300 font-semibold">
      <span class="material-symbols-outlined text-lg animate-spin">progress_activity</span>
      <span>AI Clinical Engine running ${toolName}...</span>
    </div>
  `;
}

// 1. ⭐⭐⭐⭐⭐ AI PATIENT SUMMARY
window.runAiPatientSummary = async function() {
  if (!activePatient || !activePatient.qrCodeId) {
    showToast('Please search and select a patient first.', 'warning');
    return;
  }
  showAiLoading('AI Patient Summary');

  try {
    const res = await fetch('/api/v1/ai-clinical/patient-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ qrCodeId: activePatient.qrCodeId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const container = document.getElementById('aiOutputContainer');
    container.classList.remove('hidden');
    
    let alertsHtml = '';
    if (data.alerts && data.alerts.length > 0) {
      alertsHtml = `
        <div class="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 font-bold space-y-1">
          ${data.alerts.map(a => `<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm text-amber-400">warning</span> ${a}</div>`).join('')}
        </div>
      `;
    }

    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-2">
        <h4 class="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
          <span class="material-symbols-outlined text-sm">summarize</span> AI Pre-Consultation Summary for ${data.patientName}
        </h4>
        <span class="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-[10px] font-bold">Confidence ${data.confidenceScore}</span>
      </div>
      ${alertsHtml}
      <p class="text-slate-200 leading-relaxed font-medium">${data.summary}</p>
      <div class="pt-2 border-t border-indigo-500/20">
        <p class="font-bold text-indigo-300 mb-1">Recommended Focus Areas:</p>
        <ul class="list-disc list-inside space-y-0.5 text-slate-300">
          ${data.recommendedFocus.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 2. ⭐⭐⭐⭐⭐ AI MEDICAL SCRIBE (Auto Note-Taking)
window.openAiScribeModal = async function() {
  const input = prompt('🎙️ AI Medical Scribe: Type or paste your consultation dictation notes below:\n\nExample: "Patient has 3 days dry cough, fever 101F, chest congestion. BP 120/80. Prescribed paracetamol 500mg tid and azithromycin 500mg daily."');
  if (!input || !input.trim()) return;

  showAiLoading('AI Medical Scribe');
  try {
    const res = await fetch('/api/v1/ai-clinical/medical-scribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ dictationText: input })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const note = data.structuredNote;
    const container = document.getElementById('aiOutputContainer');
    container.classList.remove('hidden');

    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-2">
        <h4 class="font-bold text-purple-300 flex items-center gap-1.5 text-xs">
          <span class="material-symbols-outlined text-sm">mic</span> AI Structured Clinical Note
        </h4>
        <button onclick="insertScribeToForm('${encodeURIComponent(note.title)}', '${encodeURIComponent(note.formattedObservations)}')" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1">
          <span class="material-symbols-outlined text-xs">download</span> Insert into Treatment Form
        </button>
      </div>
      <div class="space-y-1.5">
        <p><strong class="text-purple-300">Diagnosis:</strong> ${note.diagnosis}</p>
        <p><strong class="text-purple-300">Observations:</strong> ${note.formattedObservations}</p>
        ${note.prescriptions.length > 0 ? `<p><strong class="text-purple-300">Extracted Rx:</strong> ${note.prescriptions.join(', ')}</p>` : ''}
        <p class="text-slate-400 text-[11px]"><em>Next Steps: ${note.suggestedNextSteps}</em></p>
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.insertScribeToForm = function(encodedTitle, encodedDesc) {
  const title = decodeURIComponent(encodedTitle);
  const desc = decodeURIComponent(encodedDesc);

  const titleInput = document.getElementById('treatmentTitle');
  const descInput = document.getElementById('treatmentDesc');
  if (titleInput) titleInput.value = title;
  if (descInput) descInput.value = desc;

  showToast('Scribe notes inserted into Treatment Form!', 'success');
};

// 3. ⭐⭐⭐⭐⭐ AI DIFFERENTIAL DIAGNOSIS
window.runAiDifferential = async function() {
  const symptoms = prompt('🧠 AI Differential Diagnosis: Enter patient symptoms or chief complaints:', 'Dry cough, fever 101F, chest congestion, fatigue');
  if (!symptoms || !symptoms.trim()) return;

  showAiLoading('AI Differential Diagnosis');
  try {
    const res = await fetch('/api/v1/ai-clinical/differential-diagnosis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ symptoms })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const container = document.getElementById('aiOutputContainer');
    container.classList.remove('hidden');

    const diffsHtml = data.differentials.map(d => `
      <div class="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-xl">
        <span class="font-bold text-slate-100">${d.diagnosis}</span>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full font-mono text-[10px] font-bold">${d.probability} Probability</span>
          <span class="px-2 py-0.5 ${d.urgency === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300' : 'bg-amber-500/20 text-amber-300'} rounded-full text-[10px] font-bold">${d.urgency}</span>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-2">
        <h4 class="font-bold text-teal-300 flex items-center gap-1.5 text-xs">
          <span class="material-symbols-outlined text-sm">diagnostics</span> AI Differential Diagnosis Copilot
        </h4>
      </div>
      <div class="space-y-2">
        <p class="font-bold text-slate-300">Top Potential Diagnoses:</p>
        ${diffsHtml}
      </div>
      <div class="pt-2 border-t border-indigo-500/20">
        <p class="font-bold text-teal-300 mb-1">Recommended Labs & Investigations:</p>
        <p class="text-slate-300 font-medium">${data.recommendedLabs.join(' • ')}</p>
      </div>
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 4. ⭐⭐⭐⭐⭐ AI PRESCRIPTION SAFETY CHECKER
window.checkPrescriptionSafety = async function() {
  const rxInput = document.getElementById('treatmentTitle')?.value + ' ' + document.getElementById('treatmentDesc')?.value;
  if (!rxInput || !rxInput.trim()) {
    showToast('Please type prescription details in the Clinical Note form first.', 'warning');
    return;
  }

  showAiLoading('Rx Safety Checker');
  try {
    const res = await fetch('/api/v1/ai-clinical/prescription-checker', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        qrCodeId: activePatient ? activePatient.qrCodeId : null,
        prescriptionText: rxInput
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const container = document.getElementById('aiOutputContainer');
    container.classList.remove('hidden');

    const isSafe = data.status === 'SAFE';
    const statusBg = isSafe ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border-rose-500/40';

    let warningsHtml = '';
    if (data.warnings.length > 0) {
      warningsHtml = `<div class="p-2 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-200 font-bold space-y-1">${data.warnings.map(w => `<div>${w}</div>`).join('')}</div>`;
    }
    if (data.interactions.length > 0) {
      warningsHtml += `<div class="p-2 bg-amber-950/80 border border-amber-500/50 rounded-xl text-amber-200 font-bold space-y-1">${data.interactions.map(i => `<div>${i}</div>`).join('')}</div>`;
    }

    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-2">
        <h4 class="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
          <span class="material-symbols-outlined text-sm">verified_user</span> AI Prescription Safety Validator
        </h4>
        <span class="px-2.5 py-0.5 ${statusBg} border rounded-full text-[10px] font-bold">Safety Score: ${data.safetyScore} (${data.status})</span>
      </div>
      ${warningsHtml || `<p class="text-emerald-300 font-bold">✅ No drug-allergy or drug-drug interaction warnings detected. Safe to prescribe.</p>`}
      ${data.alternativeSuggestions.length > 0 ? `<p class="text-indigo-300 font-medium">💡 Alternative Suggestions: ${data.alternativeSuggestions.join(' • ')}</p>` : ''}
    `;
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// 5. ⭐⭐⭐⭐⭐ AI CONSULTATION NOTES (SOAP Generator)
window.generateSoapNote = async function() {
  const title = document.getElementById('treatmentTitle')?.value.trim();
  const desc = document.getElementById('treatmentDesc')?.value.trim();

  if (!title || !desc) {
    showToast('Please fill in Note Title and Clinical Observations in the form first.', 'warning');
    return;
  }

  showAiLoading('AI SOAP Generator');
  try {
    const res = await fetch('/api/v1/ai-clinical/soap-generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, description: desc })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const descInput = document.getElementById('treatmentDesc');
    if (descInput) {
      descInput.value = data.formattedText;
    }

    const container = document.getElementById('aiOutputContainer');
    container.classList.remove('hidden');
    container.innerHTML = `
      <div class="flex items-center justify-between border-b border-indigo-500/30 pb-2">
        <h4 class="font-bold text-blue-300 flex items-center gap-1.5 text-xs">
          <span class="material-symbols-outlined text-sm">post_add</span> AI Standardized SOAP Note Generated
        </h4>
        <span class="text-emerald-400 font-bold text-[10px]">Auto-inserted into Clinical Form</span>
      </div>
      <div class="space-y-1 font-mono text-[11px] text-slate-300">
        <p><strong class="text-blue-300">Subjective:</strong> ${data.soap.subjective}</p>
        <p><strong class="text-blue-300">Objective:</strong> ${data.soap.objective}</p>
        <p><strong class="text-blue-300">Assessment:</strong> ${data.soap.assessment}</p>
        <p><strong class="text-blue-300">Plan:</strong> ${data.soap.plan.replace(/\n/g, ' ')}</p>
      </div>
    `;

    showToast('SOAP note formatted & auto-inserted into Clinical Note form!', 'success');
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

function renderWaitingQueue(queue, nowCalling) {
  const container = document.getElementById('doctorWaitingQueueContainer');
  const badgeCount = document.getElementById('waitingQueueCountBadge');
  if (!container) return;

  const activeWaiting = queue.filter(q => q.status === 'waiting' || q.status === 'in_consultation');
  if (badgeCount) badgeCount.textContent = `${activeWaiting.length} Waiting Outside`;

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
    const borderCls = isCalling ? 'border-2 border-[#E11D2E] bg-red-50/40 shadow-[4px_4px_0px_#E11D2E]' : 'border-2 border-[#111111] bg-white shadow-[4px_4px_0px_#111111]';
    const statusBadge = isCalling 
      ? '<span class="px-2 py-0.5 border border-[#E11D2E] bg-[#E11D2E] text-white font-mono text-[10px] font-black uppercase animate-pulse">IN CONSULTATION</span>'
      : '<span class="px-2 py-0.5 border border-[#111111] bg-amber-50 text-amber-900 font-mono text-[10px] font-bold uppercase">WAITING</span>';

    return `
      <div class="p-4 ${borderCls} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 border-2 border-[#111111] bg-[#111111] text-white flex flex-col items-center justify-center font-mono flex-shrink-0">
            <span class="text-[9px] font-bold uppercase leading-none text-white/60">TKN</span>
            <span class="text-base font-black leading-none">${item.tokenNumber}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h4 class="font-black text-sm uppercase text-[#111111]">${item.patientName}</h4>
              ${statusBadge}
              <span class="px-1.5 py-0.2 border border-[#111111] font-mono text-[10px] font-bold text-[#E11D2E]">${item.bloodGroup}</span>
            </div>
            <p class="font-mono text-[11px] text-[#111111]/70 font-semibold mt-0.5">
              ${item.qrCodeId} &bull; ${item.age}y &bull; ${item.gender}
            </p>
            <p class="text-xs text-[#111111] font-sans font-medium mt-1">
              <strong class="font-mono text-[10px] uppercase text-[#E11D2E]">Complaints:</strong> ${item.chiefComplaint}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 font-mono">
          <button onclick="callPatientIn(${item.tokenNumber}, '${item.qrCodeId}')" class="${isCalling ? 'btn-primary' : 'btn-secondary'} px-3.5 py-2 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm">${isCalling ? 'play_arrow' : 'campaign'}</span>
            <span>${isCalling ? 'Resume Chart' : 'Call Patient In'}</span>
          </button>
        </div>
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
};

window.closeNewPatientModal = function() {
  const modal = document.getElementById('doctorNewPatientModal');
  if (modal) modal.classList.add('hidden');
};

window.handleNewPatientSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById('docNewName').value;
  const age = document.getElementById('docNewAge').value;
  const gender = document.getElementById('docNewGender').value;
  const phone = document.getElementById('docNewPhone').value;
  const bloodGroup = document.getElementById('docNewBlood').value;
  const allergies = document.getElementById('docNewAllergies').value;
  const chiefComplaint = document.getElementById('docNewComplaint').value;

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
    document.getElementById('doctorNewPatientForm').reset();
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
      socket.on('patient-queued', (item) => {
        showToast(`🔔 New patient in waiting queue: ${item.patientName} (Token #${item.tokenNumber})`, 'warning');
        loadDoctorWaitingQueue(true);
      });
      socket.on('calling-patient', (data) => {
        loadDoctorWaitingQueue(true);
      });
    } catch (e) {
      console.warn('Socket setup fallback:', e);
    }
  }
}

