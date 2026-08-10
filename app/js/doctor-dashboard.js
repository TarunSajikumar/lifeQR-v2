// Doctor Dashboard JS Module
let currentUser = null;
let activePatient = null;
let scannerInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
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
    const res = await fetch('/api/v1/verification/status', { credentials: 'include' });
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
    <div class="mb-6 p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-600/10 border border-amber-300/80 rounded-3xl shadow-lg backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-start sm:items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">verified_user</span>
        </div>
        <div>
          <h4 class="font-bold text-amber-950 text-sm flex items-center gap-2">
            Professional Account Verification Required
            <span class="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] uppercase font-extrabold tracking-wider">${status}</span>
          </h4>
          <p class="text-xs text-amber-800/90 font-medium mt-0.5">
            Your medical practitioner account is pending verification by system administrators before accessing full patient records.
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2 w-full md:w-auto flex-shrink-0">
        <span class="px-4 py-2 bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5">
          <span class="material-symbols-outlined text-base">pending_actions</span>
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
    const response = await fetch('/api/v1/doctor-access/patients', {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 403 && data.error === 'Account not verified') {
        container.innerHTML = `<div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-800 text-center">Your account is pending professional verification. Once admin review is complete, you’ll be able to access patient records and add clinical notes.</div>`;
        return;
      }
      throw new Error(data.error);
    }

    container.innerHTML = '';

    if (data.patients.length === 0) {
      container.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">No authorized patients connected yet.</p>`;
      return;
    }

    data.patients.forEach(p => {
      const card = document.createElement('div');
      card.className = 'p-3.5 bg-indigo-50/50 hover:bg-indigo-100/60 border border-indigo-100 rounded-2xl flex items-center justify-between cursor-pointer transition shadow-xs group';
      card.onclick = () => {
        document.getElementById('patientQrId').value = p.qrCodeId;
        searchPatient();
      };
      
      const photo = p.profilePhoto || 'https://www.w3schools.com/howto/img_avatar.png';
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <img src="${photo}" class="w-9 h-9 rounded-xl object-cover border border-indigo-200 shadow-xs">
          <div>
            <p class="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">${p.name}</p>
            <p class="text-[10px] text-slate-500 font-mono">ID: ${p.qrCodeId} • Blood: <span class="font-bold text-rose-600">${p.bloodGroup || 'N/A'}</span></p>
          </div>
        </div>
        <span class="material-symbols-outlined text-base text-indigo-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all">chevron_right</span>
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
  const qrId = qrIdInput ? qrIdInput.value.trim() : '';
  if (!qrId) {
    showToast('Please enter a patient QR Code ID', 'warning');
    return;
  }

  showPatientSkeleton();

  try {
    const response = await fetch(`/api/v1/doctor-access/status/${qrId}`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (!response.ok) {
      if (response.status === 403 && data.error === 'Account not verified') {
        renderVerificationBanner('PENDING');
        showToast('Your doctor account requires verification before accessing patient data. Complete the review process with admin approval to unlock patient records.', 'warning');
        hidePatientView();
        return;
      }
      throw new Error(data.error || 'Patient not found');
    }

    activePatient = data;
    activePatient.qrCodeId = qrId;

    // Log the scan activity
    await logDoctorScan(qrId);

    renderPatientDetails();
  } catch (err) {
    showToast(err.message, 'error');
    hidePatientView();
  }
};

async function logDoctorScan(qrCodeId) {
  try {
    await fetch(`/api/v1/patient/log-scan/${qrCodeId}`, {
      method: 'POST',
      credentials: 'include'
    });
  } catch (e) {
    console.warn('Failed to log scan.');
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

  document.getElementById('patName').textContent = activePatient.name;
  document.getElementById('patId').textContent = activePatient.qrCodeId;
  document.getElementById('patGender').textContent = activePatient.gender ? activePatient.gender.toUpperCase() : 'N/A';
  document.getElementById('patPhone').textContent = activePatient.phone || 'N/A';

  const photoEl = document.getElementById('patPhoto');
  if (activePatient.profilePhoto) {
    photoEl.src = activePatient.profilePhoto;
  } else {
    photoEl.src = 'https://www.w3schools.com/howto/img_avatar.png';
  }

  // Handle permission statuses
  const statusContainer = document.getElementById('accessStatusContainer');
  const detailsContainer = document.getElementById('authorizedDetailsContainer');
  
  if (statusContainer) statusContainer.innerHTML = '';
  if (detailsContainer) detailsContainer.classList.add('hidden');

  if (activePatient.isAuthorized) {
    if (statusContainer) {
      statusContainer.innerHTML = `
        <div class="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between gap-2 text-xs font-bold shadow-xs">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-emerald-600 text-lg">verified_user</span>
            <span>Authorized Medical Access Granted — You can view medical history and log treatment entries.</span>
          </div>
          <span class="px-2.5 py-0.5 bg-emerald-600 text-white rounded-full text-[10px] uppercase tracking-wider font-extrabold">Active</span>
        </div>
      `;
    }
    if (detailsContainer) detailsContainer.classList.remove('hidden');
    loadPatientMedicalHistory(activePatient.qrCodeId);
    loadPatientReports(activePatient.qrCodeId);
  } else {
    if (activePatient.hasPending) {
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div class="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold">
            <span class="flex items-center gap-2">
              <span class="material-symbols-outlined text-amber-600 text-lg animate-spin">hourglass_empty</span>
              Access request sent. Awaiting patient approval from their dashboard.
            </span>
          </div>
        `;
      }
    } else {
      if (statusContainer) {
        statusContainer.innerHTML = `
          <div class="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-lg space-y-3">
            <div class="flex items-center gap-2.5 text-xs font-bold">
              <span class="material-symbols-outlined text-rose-400 text-xl">lock</span>
              <span>Patient Profile Protected — Full medical records are currently private.</span>
            </div>
            <p class="text-xs text-slate-300">Send an authorization request to the patient's LifeQR account to unlock detailed medical history, prescriptions, and diagnostic reports.</p>
            <button onclick="requestAccess()" class="px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2">
              <span class="material-symbols-outlined text-base">key</span>
              <span>Request Medical Profile Access</span>
            </button>
          </div>
        `;
      }
    }
    
    if (activePatient.publicProfile) {
      if (detailsContainer) detailsContainer.classList.remove('hidden');
      loadPatientMedicalHistory(activePatient.qrCodeId);
      loadPatientReports(activePatient.qrCodeId);
    }
  }
}

window.requestAccess = async function() {
  try {
    const response = await fetch('/api/v1/doctor-access/request-access', {
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
    const response = await fetch(`/api/v1/history/${qrCodeId}`, {
      credentials: 'include'
    });
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
        <div class="absolute left-[11px] top-4 bottom-0 w-0.5 bg-slate-200 group-last:hidden"></div>
        
        <!-- Timeline node dot -->
        <span class="absolute left-0 top-0.5 w-6 h-6 rounded-full ${dotBg} text-white flex items-center justify-center shadow-md border-2 border-white z-10">
          <span class="material-symbols-outlined text-[12px]">${icon}</span>
        </span>
        
        <!-- Timeline card content -->
        <div class="bg-white/90 backdrop-blur p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <h5 class="font-bold text-slate-900 text-xs sm:text-sm tracking-tight">${h.title}</h5>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${badgeClass}">${h.type || 'entry'}</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed font-medium mb-3">${h.description}</p>
          <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
            <span class="flex items-center gap-1 text-slate-500">
              <span class="material-symbols-outlined text-xs text-indigo-500">person</span>
              Logged by <strong class="text-slate-700">${authorName}</strong> (${authorRole})
            </span>
            <span class="font-mono text-slate-400">${dateStr}</span>
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

      const response = await fetch(`/api/v1/history/add/${activePatient.qrCodeId}`, {
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
      btn.className = 'track-tab-btn active px-3.5 py-2 rounded-xl bg-indigo-600 text-white transition flex items-center gap-1.5 flex-shrink-0';
    } else {
      btn.className = 'track-tab-btn px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition flex items-center gap-1.5 flex-shrink-0';
    }
  });
  renderDecisionTrack(trackId);
};

function renderDecisionTrack(trackId) {
  const container = document.getElementById('decisionTrackContent');
  if (!container) return;

  if (!decisionTreeSchema || !decisionTreeSchema.tracks) {
    container.innerHTML = `<div class="p-6 text-center text-xs text-slate-400">Loading Clinical Decision Tree...</div>`;
    return;
  }

  const track = decisionTreeSchema.tracks.find(t => t.id === trackId);
  if (!track) return;

  let stagesHtml = '';
  track.stages.forEach(stage => {
    let actionButtons = '';
    
    if (stage.options) {
      actionButtons = stage.options.map(opt => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', '${opt}', 'Triage Priority Set: ${opt}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition flex items-center gap-1">
          <span>${opt}</span>
        </button>
      `).join('');
    } else if (stage.actions) {
      actionButtons = stage.actions.map(act => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', '${act}', 'Clinical action executed: ${act}')" class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1">
          <span class="material-symbols-outlined text-xs">play_arrow</span> ${act}
        </button>
      `).join('');
    } else if (stage.elements) {
      actionButtons = stage.elements.map(el => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', 'Audited ${el}', 'Verified and reviewed patient ${el}')" class="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-semibold transition">
          ✓ ${el}
        </button>
      `).join('');
    } else if (stage.categories) {
      actionButtons = stage.categories.map(c => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', 'Allergy Check: ${c}', 'Audited ${c} allergy safety matrix')" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition">
          ⚠️ ${c} Allergy
        </button>
      `).join('');
    } else if (stage.examples || stage.systems || stage.vitals || stage.levels || stage.types || stage.choices || stage.forms || stage.list || stage.steps || stage.specialties || stage.units || stage.protocols || stage.destinations || stage.panels || stage.docs || stage.topics || stage.intervals) {
      const items = stage.examples || stage.systems || stage.vitals || stage.levels || stage.types || stage.choices || stage.forms || stage.list || stage.steps || stage.specialties || stage.units || stage.protocols || stage.destinations || stage.panels || stage.docs || stage.topics || stage.intervals;
      actionButtons = items.map(item => `
        <button onclick="executeDecisionStage(${stage.id}, '${stage.name}', '${item}', 'Clinical Decision Protocol: ${item}')" class="px-2.5 py-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition">
          ${item}
        </button>
      `).join('');
    }

    stagesHtml += `
      <div class="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2.5 hover:border-indigo-300 transition">
        <div class="flex items-center justify-between">
          <h4 class="font-bold text-xs text-slate-900 flex items-center gap-2">
            <span class="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] flex items-center justify-center font-mono font-bold">${stage.id}</span>
            <span>${stage.name}</span>
          </h4>
          <span class="text-[10px] text-slate-400 font-medium">Stage ${stage.id} of 26</span>
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
});
