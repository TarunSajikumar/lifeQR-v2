// Emergency Access JS Module (LifeQR Swiss/Editorial Standard)
let currentPatient = null;
let currentLanguage = 'en';

function isResponderLoggedIn() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.role === 'crew' || user.role === 'doctor';
  } catch(e) {
    return false;
  }
}

// Track whether viewing in normal phone/bystander mode or ambulance crew mode
let isCrewMode = isResponderLoggedIn() || sessionStorage.getItem('lifeqr_crew_unlocked') === 'true' || new URLSearchParams(window.location.search).get('mode') === 'crew';

const translations = {
  en: {
    title: "Emergency Medical Profile",
    subtitle: "Verify vital clinical parameters and trigger 1-tap emergency contacts below",
    bloodGroup: "Blood Group",
    allergies: "Severe Allergies",
    medications: "Active Prescriptions & Dosages",
    conditions: "Critical Medical Issues",
    contacts: "Emergency Contacts (ICE)",
    callContact: "Call Now",
    callPatient: "Call Patient",
    openMap: "Open in Maps",
    age: "Age",
    gender: "Gender",
    phone: "Phone Number",
    address: "Registered Location",
    emergencyBadge: "BYSTANDER RESCUE LIFELINE",
    crewBadge: "PARAMEDIC / AMBULANCE CREW MODE",
    credentialId: "PASSPORT ID",
    reports: "Diagnostic Reports & Medical Documents",
    history: "Clinical Medical History Timeline",
    organDonor: "Organ Donor",
    insurance: "Medical Insurance"
  },
  hi: {
    title: "आपातकालीन चिकित्सा प्रोफ़ाइल",
    subtitle: "महत्वपूर्ण स्वास्थ्य विवरण सत्यापित करें और संपर्क करें",
    bloodGroup: "रक्त समूह",
    allergies: "गंभीर एलर्जी",
    medications: "सक्रिय दवाएं और खुराक",
    conditions: "महत्वपूर्ण स्वास्थ्य समस्याएं",
    contacts: "आपातकालीन संपर्क (ICE)",
    callContact: "कॉल करें",
    callPatient: "मरीज़ को कॉल करें",
    openMap: "मानचित्र में देखें",
    age: "आयु",
    gender: "लिंग",
    phone: "फ़ोन नंबर",
    address: "पंजीकृत पता",
    emergencyBadge: "आपातकालीन जीवन रेखा",
    crewBadge: "एंबुलेंस क्रू / पैरामेडिक मोड",
    credentialId: "पासपोर्ट पहचान",
    reports: "चिकित्सा रिपोर्ट और दस्तावेज़",
    history: "क्लिनिकल इतिहास समयरेखा",
    organDonor: "अंग दाता",
    insurance: "स्वास्थ्य बीमा"
  },
  kn: {
    title: "ತುರ್ತು ವೈದ್ಯಕೀಯ ವಿವರಗಳು",
    subtitle: "ವೈದ್ಯಕೀಯ ಜೀವರೇಖೆ ವಿವರಗಳನ್ನು ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ",
    bloodGroup: "ರಕ್ತದ ಗುಂಪು",
    allergies: "ತೀವ್ರ ಅಲರ್ಜಿಗಳು",
    medications: "ಪ್ರಸ್ತುತ ಔಷಧಿಗಳು",
    conditions: "ಆರೋಗ್ಯ ಸ್ಥಿತಿಗಳು",
    contacts: "ತುರ್ತು ಸಂಪರ್ಕಗಳು",
    callContact: "ಕರೆ ಮಾಡಿ",
    callPatient: "ರೋಗಿಗೆ ಕರೆ ಮಾಡಿ",
    openMap: "ನಕ್ಷೆಯಲ್ಲಿ ನೋಡಿ",
    age: "ವಯಸ್ಸು",
    gender: "ಲಿಂಗ",
    phone: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    address: "ವಿಳಾಸ",
    emergencyBadge: "ತುರ್ತು ಜೀವರೇಖೆ",
    crewBadge: "ಆಂಬ್ಯುಲೆನ್ಸ್ ಸಿಬ್ಬಂದಿ ಮೋಡ್",
    credentialId: "ಪಾಸ್ಪೋರ್ಟ್ ಗುರುತು",
    reports: "ವೈದ್ಯಕೀಯ ವರದಿಗಳು",
    history: "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ",
    organDonor: "ಅಂಗದಾನಿ",
    insurance: "ವಿಮೆ"
  },
  ta: {
    title: "அவசர மருத்துவ சுயவிவரம்",
    subtitle: "மருத்துவ விவரங்களை உடனடியாக சரிபார்க்கவும்",
    bloodGroup: "இரத்த வகை",
    allergies: "தீவிர ஒவ்வாமைகள்",
    medications: "தற்போதைய மருந்துகள்",
    conditions: "மருத்துவ நிலைமைகள்",
    contacts: "அவசர தொடர்புகள்",
    callContact: "அழைக்க",
    callPatient: "நோயாளிக்கு அழைக்க",
    openMap: "வரைபடத்தில் காண்க",
    age: "வயது",
    gender: "பாலினம்",
    phone: "தொலைபேசி எண்",
    address: "முகவரி",
    emergencyBadge: "அவசர அணுகல்",
    crewBadge: "ஆம்புலன்ஸ் பணியாளர் முறை",
    credentialId: "பாஸ்போர்ட் எண்",
    reports: "மருத்துவ அறிக்கைகள்",
    history: "மருத்துவ வரலாறு",
    organDonor: "உறுப்பு தானம்",
    insurance: "காப்பீடு"
  },
  es: {
    title: "Perfil Médico de Emergencia",
    subtitle: "Verifique parámetros clínicos vitales y contacte emergencias",
    bloodGroup: "Grupo Sanguíneo",
    allergies: "Alergias Severas",
    medications: "Medicamentos Activos y Dosis",
    conditions: "Condiciones Médicas Críticas",
    contacts: "Contactos de Emergencia (ICE)",
    callContact: "Llamar",
    callPatient: "Llamar al Paciente",
    openMap: "Ver en Mapas",
    age: "Edad",
    gender: "Género",
    phone: "Teléfono",
    address: "Ubicación Registrada",
    emergencyBadge: "LÍNEA DE EMERGENCIA",
    crewBadge: "MODO AMBULANCIA / PARAMÉDICO",
    credentialId: "ID PASAPORTE",
    reports: "Informes Médicos y Diagnósticos",
    history: "Historial Clínico Cronológico",
    organDonor: "Donante de Órganos",
    insurance: "Seguro Médico"
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const pathToken = pathParts[pathParts.length - 1];
  const token = (pathToken && pathToken !== 'emergency_access.html' && pathToken !== 'e')
    ? pathToken
    : (urlParams.get('token') || urlParams.get('id'));

  if (!token) {
    if (typeof showToast === 'function') showToast('Invalid Access URL: emergency token missing', 'error');
    document.getElementById('emergencyDetailsCard').innerHTML = `
      <div class="text-center p-8 border-2 border-[#E11D2E] bg-red-50 text-[#111111]">
        <span class="material-symbols-outlined text-4xl text-[#E11D2E]">warning</span>
        <p class="font-black text-lg mt-2 uppercase">QR Token Not Found</p>
        <p class="text-xs mt-1 font-mono text-[#111111]/70">Scan a registered LifeQR card or emergency badge to view medical records.</p>
      </div>
    `;
    return;
  }

  // Update direct link in modal to preserve patient id
  const directCrewLink = document.getElementById('crewDashboardDirectLink');
  if (directCrewLink) {
    directCrewLink.href = `CrewAmbulance_dashboard.html?qrId=${encodeURIComponent(token)}`;
  }

  await fetchEmergencyProfile(token);

  const langSelect = document.getElementById('languageSelector');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      currentLanguage = e.target.value;
      translateLabels();
    });
  }
});

async function fetchEmergencyProfile(token) {
  try {
    const response = await fetch(`/api/v1/emergency-access/${token}`);
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || 'Failed to fetch medical details');

    currentPatient = data;
    renderEmergencyDetails();
  } catch (err) {
    if (typeof showToast === 'function') showToast(err.message, 'error');
    document.getElementById('emergencyDetailsCard').innerHTML = `
      <div class="text-center p-8 border-2 border-[#E11D2E] bg-red-50 text-[#111111]">
        <span class="material-symbols-outlined text-4xl text-[#E11D2E]">error</span>
        <p class="font-black text-lg mt-2 uppercase">Patient Details Unavailable</p>
        <p class="text-xs mt-1 font-mono text-[#111111]/70">${err.message}</p>
      </div>
    `;
  }
}

// Switch between Normal Phone (Bystander) and Ambulance Crew Modes
window.switchAccessMode = function(toCrew) {
  isCrewMode = !!toCrew;
  renderEmergencyDetails();
  if (typeof showToast === 'function') {
    showToast(isCrewMode ? 'Switched to Ambulance Crew Full Access' : 'Switched to Normal Phone Bystander View', 'info');
  }
};

window.openCrewUnlockModal = function() {
  const modal = document.getElementById('crewUnlockModal');
  if (modal) modal.classList.remove('hidden');
};

window.closeCrewUnlockModal = function() {
  const modal = document.getElementById('crewUnlockModal');
  if (modal) modal.classList.add('hidden');
};

window.verifyCrewPin = function() {
  const input = document.getElementById('crewPinInput');
  const val = input ? input.value.trim() : '';
  if (!val) {
    if (typeof showToast === 'function') showToast('Please enter a responder PIN', 'warning');
    return;
  }
  // Standard emergency PIN or 4+ digits
  if (val === '9999' || val.length >= 4) {
    sessionStorage.setItem('lifeqr_crew_unlocked', 'true');
    isCrewMode = true;
    closeCrewUnlockModal();
    renderEmergencyDetails();
    if (typeof showToast === 'function') showToast('✓ Paramedic Clearance Approved. All Clinical Records Unlocked.', 'success');
  } else {
    if (typeof showToast === 'function') showToast('Invalid Crew PIN. Use standard 9999 or activate instant override.', 'error');
  }
};

window.activateFieldEmergencyOverride = function() {
  sessionStorage.setItem('lifeqr_crew_unlocked', 'true');
  isCrewMode = true;
  closeCrewUnlockModal();
  renderEmergencyDetails();
  if (typeof showToast === 'function') {
    showToast('🚨 Field Trauma Override Activated: Full Clinical Records Unlocked', 'emergency');
  }
};

function renderEmergencyDetails() {
  const container = document.getElementById('emergencyDetailsCard');
  if (!container || !currentPatient) return;

  const t = translations[currentLanguage] || translations.en;
  const patientName = currentPatient.firstName || currentPatient.name || (currentPatient.user && currentPatient.user.name) || 'Emergency Patient';
  const qrId = currentPatient.qrCodeId || currentPatient.credentialId || 'LQR-EMERGENCY';
  const photo = currentPatient.photo ? `/api/v1/emergency-access/${encodeURIComponent(qrId)}/photo` : '/LifeQR.png';
  const phone = currentPatient.phone || '+91 N/A';
  const address = currentPatient.address || 'Address on record';
  const bloodGroup = currentPatient.bloodGroup || 'N/A';
  
  const allergies = Array.isArray(currentPatient.allergies) ? currentPatient.allergies.join(', ') : (currentPatient.allergies || 'None Reported');
  const medications = Array.isArray(currentPatient.currentMedications) ? currentPatient.currentMedications.join(', ') : (currentPatient.currentMedications || currentPatient.medications || 'None Reported');
  const conditions = Array.isArray(currentPatient.medicalConditions) ? currentPatient.medicalConditions.join(', ') : (currentPatient.medicalConditions || currentPatient.healthIssues || 'None Reported');
  const contacts = currentPatient.emergencyContacts || (currentPatient.profile && currentPatient.profile.emergencyContacts) || [];
  const reports = currentPatient.reports || [];
  const history = currentPatient.medicalHistory || [];

  // Build ICE Contacts HTML
  let contactsHTML = '';
  if (contacts.length === 0) {
    contactsHTML = `<p class="text-xs font-mono text-[#111111]/50 italic text-center py-4 border-2 border-dashed border-[#111111]/20">No emergency contacts registered for this profile.</p>`;
  } else {
    contactsHTML = `<div class="grid sm:grid-cols-2 gap-3">`;
    contacts.forEach((c) => {
      contactsHTML += `
        <div class="p-4 border-2 border-[#111111] bg-white flex items-center justify-between gap-3 shadow-[3px_3px_0px_#111111]">
          <div>
            <p class="font-black text-sm text-[#111111] uppercase tracking-tight">${c.name} <span class="text-xs font-mono text-[#E11D2E]">(${c.relationship || 'ICE Contact'})</span></p>
            <p class="text-xs font-mono font-bold text-[#111111]/70 mt-0.5">${c.phone}</p>
          </div>
          <a href="tel:${c.phone}" class="btn-call px-4 py-2 text-xs font-mono uppercase tracking-wider font-bold">
            <span class="material-symbols-outlined text-sm">phone</span>
            <span>${t.callContact}</span>
          </a>
        </div>
      `;
    });
    contactsHTML += `</div>`;
  }

  // SITUATION A: NORMAL PHONE / BYSTANDER SCAN
  // Strict requirement: Patient Name, Phone Number, Address, Blood Group, Medical Issues / Severe Allergies, Emergency Contacts
  if (!isCrewMode) {
    container.innerHTML = `
      <!-- Top Responder Mode Clearance Prompt -->
      <div class="mb-6 p-4 border-2 border-[#111111] bg-[#f9fafb] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#111111] no-print">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-[#111111] text-white flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-[#E11D2E] text-2xl">ambulance</span>
          </div>
          <div>
            <p class="text-xs font-black uppercase text-[#111111] tracking-wider">Are you an Ambulance Crew or Doctor?</p>
            <p class="text-[11px] text-[#111111]/70 font-mono">Unlock full clinical records, active medications, diagnostic reports & ER telemetry.</p>
          </div>
        </div>
        <button onclick="openCrewUnlockModal()" class="btn-primary py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 shadow-[2px_2px_0px_#111111]">
          <span class="material-symbols-outlined text-sm">lock_open</span>
          <span>Ambulance Crew Access</span>
        </button>
      </div>

      <!-- Top Bystander Telemetry Header -->
      <div class="flex flex-wrap items-center justify-between gap-3 pb-5 border-b-2 border-[#111111]">
        <div class="inline-flex items-center gap-2 px-3 py-1 bg-[#111111] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
          <span class="live-dot"></span>
          <span>${t.emergencyBadge}</span>
        </div>
        <div class="font-mono text-xs font-bold text-[#111111]">
          <span class="text-[#111111]/50 uppercase">${t.credentialId}:</span>
          <span class="text-[#E11D2E]">${qrId}</span>
        </div>
      </div>

      <!-- 1. Patient Name & Identification -->
      <div class="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b-2 border-[#111111]">
        <img src="${photo}" alt="Patient Photo" class="w-20 h-20 border-2 border-[#111111] object-cover bg-gray-100 flex-shrink-0 shadow-[4px_4px_0px_#111111]" onerror="this.src='/LifeQR.png'">
        <div class="text-center sm:text-left flex-1">
          <h2 class="font-black text-2xl sm:text-3xl text-[#111111] tracking-tight uppercase">${patientName}</h2>
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 font-mono text-xs text-[#111111]/70 font-bold">
            <span>${t.age}: <strong class="text-[#111111]">${currentPatient.age || 'N/A'}</strong></span>
            <span>&bull;</span>
            <span>${t.gender}: <strong class="text-[#111111] capitalize">${currentPatient.gender || 'N/A'}</strong></span>
          </div>
        </div>
        <!-- 4. Blood Group Highlight Box -->
        <div class="border-2 border-[#E11D2E] bg-red-50 p-3 text-center sm:min-w-[130px] shadow-[4px_4px_0px_#E11D2E]">
          <p class="font-mono text-[10px] font-bold uppercase text-[#E11D2E] tracking-wider">${t.bloodGroup}</p>
          <p class="font-black text-4xl text-[#E11D2E] mt-0.5 leading-none">${bloodGroup}</p>
        </div>
      </div>

      <!-- 2 & 3. Phone Number & Address / Location Bar -->
      <div class="py-5 border-b-2 border-[#111111] grid sm:grid-cols-2 gap-4">
        <!-- Phone Number with Direct Call -->
        <div class="p-4 border-2 border-[#111111] bg-[#f9fafb] flex items-center justify-between gap-3">
          <div>
            <p class="text-[10px] font-mono font-bold uppercase text-[#111111]/60 tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">call</span> ${t.phone}
            </p>
            <p class="font-black text-base text-[#111111] font-mono mt-0.5">${phone}</p>
          </div>
          <a href="tel:${phone}" class="btn-primary py-1.5 px-3 text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_#111111]">
            <span class="material-symbols-outlined text-xs">phone</span> Call
          </a>
        </div>

        <!-- Address / Location with Maps link -->
        <div class="p-4 border-2 border-[#111111] bg-[#f9fafb] flex items-center justify-between gap-3">
          <div class="truncate mr-2">
            <p class="text-[10px] font-mono font-bold uppercase text-[#111111]/60 tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">location_on</span> ${t.address}
            </p>
            <p class="font-bold text-xs text-[#111111] mt-0.5 truncate" title="${address}">${address}</p>
          </div>
          <a href="https://maps.google.com/?q=${encodeURIComponent(address)}" target="_blank" class="btn-secondary py-1.5 px-3 text-xs font-mono uppercase font-bold tracking-wider flex items-center gap-1 flex-shrink-0">
            <span class="material-symbols-outlined text-xs">map</span> Maps
          </a>
        </div>
      </div>

      <!-- 5. Medical Issues & Severe Allergies Grid -->
      <div class="py-6 border-b-2 border-[#111111] space-y-4">
        <div class="grid sm:grid-cols-2 gap-4">
          <!-- Severe Allergies -->
          <div class="p-4 border-2 border-[#E11D2E] bg-red-50 shadow-[3px_3px_0px_#E11D2E]">
            <div class="flex items-center gap-1.5 text-[#E11D2E] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <span class="material-symbols-outlined text-sm">warning</span>
              <span>${t.allergies}</span>
            </div>
            <p class="font-bold text-sm text-[#111111]">${allergies}</p>
          </div>

          <!-- Medical Issues / Critical Conditions -->
          <div class="p-4 border-2 border-[#111111] bg-white shadow-[3px_3px_0px_#111111]">
            <div class="flex items-center gap-1.5 text-[#111111] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <span class="material-symbols-outlined text-sm">monitor_heart</span>
              <span>${t.conditions}</span>
            </div>
            <p class="font-bold text-sm text-[#111111]">${conditions}</p>
          </div>
        </div>
      </div>

      <!-- 6. Emergency Contacts (ICE) -->
      <div class="pt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-black text-sm uppercase text-[#111111] tracking-wider flex items-center gap-2">
            <span class="material-symbols-outlined text-base text-[#E11D2E]">contact_emergency</span>
            <span>${t.contacts}</span>
          </h3>
          <span class="font-mono text-[11px] text-[#111111]/50 font-bold uppercase">1-Tap Direct Trigger</span>
        </div>
        ${contactsHTML}
      </div>
    `;
    return;
  }

  // SITUATION B: AMBULANCE CREW / PARAMEDIC SCAN
  // Strict requirement: Shows EVERY DETAIL (Medications, Reports/PDFs, Medical History Timeline, ER Telemetry, etc.)
  
  // Format Reports List
  let reportsHTML = '';
  if (reports.length === 0) {
    reportsHTML = `
      <div class="p-4 border-2 border-dashed border-[#111111]/30 text-center text-xs font-mono text-[#111111]/60">
        No external diagnostic reports or lab files registered in patient vault.
      </div>
    `;
  } else {
    reportsHTML = `<div class="grid sm:grid-cols-2 gap-3">`;
    reports.forEach(r => {
      reportsHTML += `
        <div class="p-3.5 border-2 border-[#111111] bg-white flex items-center justify-between gap-3 shadow-[2px_2px_0px_#111111]">
          <div class="truncate mr-2">
            <div class="flex items-center gap-1.5 mb-1">
              <span class="px-1.5 py-0.5 bg-[#111111] text-white text-[9px] font-mono font-bold uppercase">${r.category || 'Diagnostic'}</span>
              <span class="text-[10px] font-mono text-[#111111]/60 font-bold">${r.recordDate ? new Date(r.recordDate).toLocaleDateString() : 'Recent'}</span>
            </div>
            <p class="font-bold text-xs text-[#111111] truncate" title="${r.title}">${r.title}</p>
            ${r.doctorOrHospital ? `<p class="text-[10px] font-mono text-[#111111]/60 truncate">${r.doctorOrHospital}</p>` : ''}
          </div>
          <div class="flex items-center gap-1.5 flex-shrink-0">
            ${r.fileUrl ? `
              <a href="${r.fileUrl}" target="_blank" class="btn-secondary py-1 px-2.5 text-[11px] font-mono font-bold uppercase flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">visibility</span> View
              </a>
            ` : ''}
          </div>
        </div>
      `;
    });
    reportsHTML += `</div>`;
  }

  // Format Medical History Timeline
  let historyHTML = '';
  if (history.length === 0) {
    historyHTML = `
      <div class="p-4 border-2 border-dashed border-[#111111]/30 text-center text-xs font-mono text-[#111111]/60">
        No prior clinical interventions or incident logs recorded in history timeline.
      </div>
    `;
  } else {
    historyHTML = `<div class="space-y-2.5">`;
    history.forEach(h => {
      historyHTML += `
        <div class="p-3 border-l-4 border-l-[#E11D2E] border-2 border-[#111111] bg-white shadow-[2px_2px_0px_#111111]">
          <div class="flex items-center justify-between text-[10px] font-mono text-[#111111]/60 mb-0.5">
            <span class="font-bold uppercase text-[#E11D2E]">${h.type || 'Event'}</span>
            <span>${h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}</span>
          </div>
          <p class="font-bold text-xs text-[#111111]">${h.title}</p>
          ${h.description ? `<p class="text-xs text-[#111111]/80 mt-0.5">${h.description}</p>` : ''}
        </div>
      `;
    });
    historyHTML += `</div>`;
  }

  container.innerHTML = `
    <!-- Top Active Crew Mode Cleared Bar -->
    <div class="mb-6 p-4 border-2 border-[#10b981] bg-emerald-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[3px_3px_0px_#10b981] no-print">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-[#10b981] text-white flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-2xl">verified_user</span>
        </div>
        <div>
          <p class="text-xs font-black uppercase text-emerald-950 tracking-wider flex items-center gap-2">
            Ambulance Crew / Paramedic Clearance Active
            <span class="px-2 py-0.5 bg-emerald-600 text-white text-[9px] font-mono font-bold uppercase">All Records Unlocked</span>
          </p>
          <p class="text-[11px] text-emerald-800 font-mono">Viewing complete clinical records, active medications, uploaded reports & ER dispatch telemetry.</p>
        </div>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <a href="CrewAmbulance_dashboard.html?qrId=${encodeURIComponent(qrId)}" class="btn-primary py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0px_#000000]">
          <span class="material-symbols-outlined text-sm">local_shipping</span> Open Crew Terminal
        </a>
        <button onclick="switchAccessMode(false)" class="btn-secondary py-2 px-3 text-xs font-mono font-bold uppercase tracking-wider">
          Switch to Bystander
        </button>
      </div>
    </div>

    <!-- Telemetry Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-5 border-b-2 border-[#111111]">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-[#10b981] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
        <span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
        <span>${t.crewBadge}</span>
      </div>
      <div class="font-mono text-xs font-bold text-[#111111]">
        <span class="text-[#111111]/50 uppercase">${t.credentialId}:</span>
        <span class="text-[#E11D2E]">${qrId}</span>
      </div>
    </div>

    <!-- Patient Complete Demographics Header -->
    <div class="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b-2 border-[#111111]">
      <img src="${photo}" alt="Patient Photo" class="w-24 h-24 border-2 border-[#111111] object-cover bg-gray-100 flex-shrink-0 shadow-[4px_4px_0px_#111111]" onerror="this.src='/LifeQR.png'">
      <div class="text-center sm:text-left flex-1 space-y-1">
        <h2 class="font-black text-2xl sm:text-3xl text-[#111111] tracking-tight uppercase">${patientName}</h2>
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-3 font-mono text-xs text-[#111111]/70 font-bold">
          <span class="px-2 py-0.5 bg-red-50 border border-[#E11D2E] text-[#E11D2E]">${t.age}: ${currentPatient.age || 'N/A'} YRS</span>
          <span class="px-2 py-0.5 bg-gray-100 border border-[#111111] text-[#111111] capitalize">${t.gender}: ${currentPatient.gender || 'N/A'}</span>
          <span class="px-2 py-0.5 bg-gray-100 border border-[#111111] text-[#111111]">TEL: ${phone}</span>
        </div>
        <p class="text-xs text-[#111111]/80 font-sans font-medium mt-2 flex items-center justify-center sm:justify-start gap-1">
          <span class="material-symbols-outlined text-xs text-[#E11D2E]">location_on</span>
          <span>${address}</span>
        </p>
      </div>
      <!-- Blood Group Highlight Box -->
      <div class="border-2 border-[#E11D2E] bg-red-50 p-4 text-center sm:min-w-[140px] shadow-[4px_4px_0px_#E11D2E]">
        <p class="font-mono text-[10px] font-bold uppercase text-[#E11D2E] tracking-wider">${t.bloodGroup}</p>
        <p class="font-black text-4xl text-[#E11D2E] mt-0.5 leading-none">${bloodGroup}</p>
        ${currentPatient.organDonor ? `<span class="mt-2 inline-block px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-mono font-bold uppercase">Organ Donor</span>` : ''}
      </div>
    </div>

    <!-- Critical Triage Alerts Matrix -->
    <div class="py-6 border-b-2 border-[#111111] space-y-4">
      <div class="grid md:grid-cols-2 gap-4">
        <!-- Severe Allergies -->
        <div class="p-4 border-2 border-[#E11D2E] bg-red-50 shadow-[3px_3px_0px_#E11D2E]">
          <div class="flex items-center gap-1.5 text-[#E11D2E] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>${t.allergies}</span>
          </div>
          <p class="font-bold text-sm text-[#111111]">${allergies}</p>
        </div>

        <!-- Chronic Conditions -->
        <div class="p-4 border-2 border-[#111111] bg-white shadow-[3px_3px_0px_#111111]">
          <div class="flex items-center gap-1.5 text-[#111111] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span class="material-symbols-outlined text-sm">monitor_heart</span>
            <span>${t.conditions}</span>
          </div>
          <p class="font-bold text-sm text-[#111111]">${conditions}</p>
        </div>
      </div>

      <!-- Active Medications & Prescriptions -->
      <div class="p-4 border-2 border-[#111111] bg-[#f9fafb]">
        <div class="flex items-center gap-1.5 text-[#111111] font-mono text-[11px] font-bold uppercase tracking-wider mb-2">
          <span class="material-symbols-outlined text-sm text-[#E11D2E]">medication</span>
          <span>${t.medications}</span>
        </div>
        <p class="font-bold text-sm text-[#111111] font-mono leading-relaxed">${medications}</p>
      </div>
    </div>

    <!-- Uploaded Medical Reports & Clinical Documents -->
    <div class="py-6 border-b-2 border-[#111111] space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-black text-sm uppercase text-[#111111] tracking-wider flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-[#111111]">folder_open</span>
          <span>${t.reports}</span>
        </h3>
        <span class="font-mono text-[11px] text-[#111111]/60 font-bold uppercase">${reports.length} Documents On File</span>
      </div>
      ${reportsHTML}
    </div>

    <!-- Clinical Medical History Timeline -->
    <div class="py-6 border-b-2 border-[#111111] space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-black text-sm uppercase text-[#111111] tracking-wider flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-[#111111]">history</span>
          <span>${t.history}</span>
        </h3>
        <span class="font-mono text-[11px] text-[#111111]/60 font-bold uppercase">Chronological Records</span>
      </div>
      ${historyHTML}
    </div>

    <!-- Emergency Contacts Section -->
    <div class="py-6 border-b-2 border-[#111111]">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-black text-sm uppercase text-[#111111] tracking-wider flex items-center gap-2">
          <span class="material-symbols-outlined text-base text-[#E11D2E]">contact_emergency</span>
          <span>${t.contacts}</span>
        </h3>
        <span class="font-mono text-[11px] text-[#111111]/50 font-bold uppercase">1-Tap Direct Trigger</span>
      </div>
      ${contactsHTML}
    </div>

    <!-- Hospital ER Telemetry & Nearest Care Handover -->
    <div class="pt-6">
      <div class="p-5 border-2 border-[#E11D2E] bg-red-50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[4px_4px_0px_#E11D2E]">
        <div class="flex items-center gap-3.5">
          <div class="w-12 h-12 bg-white border-2 border-[#E11D2E] text-[#E11D2E] flex items-center justify-center font-bold flex-shrink-0">
            <span class="material-symbols-outlined text-2xl animate-pulse">sensors</span>
          </div>
          <div>
            <h4 class="font-black text-sm uppercase text-[#111111]">Stream In-Transit Vitals to Hospital ER</h4>
            <p class="text-xs text-[#111111]/70 font-mono mt-0.5">Broadcast GCS, SpO2, heart rate and patient ETA directly to trauma bay triage desk.</p>
          </div>
        </div>
        <a href="CrewAmbulance_dashboard.html?qrId=${encodeURIComponent(qrId)}" class="btn-danger py-2.5 px-5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 flex-shrink-0 shadow-[2px_2px_0px_#111111]">
          <span class="material-symbols-outlined text-sm">local_hospital</span>
          <span>Open Dispatch Terminal</span>
        </a>
      </div>
    </div>
  `;
}

function translateLabels() {
  if (!currentPatient) return;
  renderEmergencyDetails();
  const t = translations[currentLanguage] || translations.en;
  const titleEl = document.getElementById('mainTitle');
  const subEl = document.getElementById('mainSubtitle');
  if (titleEl) titleEl.textContent = t.title;
  if (subEl) subEl.textContent = t.subtitle;
}
