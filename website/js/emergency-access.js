// Emergency Access JS Module (LifeQR Swiss/Editorial Standard)
let currentPatient = null;
let currentLanguage = 'en';

const translations = {
  en: {
    title: "Emergency Medical Profile",
    subtitle: "Verify vital clinical parameters and trigger 1-tap emergency contacts below",
    bloodGroup: "Blood Group",
    allergies: "Severe Allergies",
    medications: "Active Medications",
    conditions: "Medical Conditions",
    contacts: "Emergency Contacts",
    callContact: "Call Now",
    privateMessage: "This profile is private. Rescuer access is restricted.",
    age: "Age",
    gender: "Gender",
    phone: "Phone Number",
    address: "Location",
    emergencyBadge: "EMERGENCY LIFELINE VERIFIED",
    credentialId: "QR CREDENTIAL"
  },
  hi: {
    title: "आपातकालीन चिकित्सा प्रोफ़ाइल",
    subtitle: "महत्वपूर्ण स्वास्थ्य विवरण सत्यापित करें और संपर्क करें",
    bloodGroup: "रक्त समूह",
    allergies: "गंभीर एलर्जी",
    medications: "सक्रिय दवाएं",
    conditions: "स्वास्थ्य स्थितियां",
    contacts: "आपातकालीन संपर्क",
    callContact: "कॉल करें",
    privateMessage: "यह प्रोफ़ाइल निजी है। बचावकर्ता पहुंच प्रतिबंधित है।",
    age: "आयु",
    gender: "लिंग",
    phone: "फ़ोन नंबर",
    address: "पता",
    emergencyBadge: "आपातकालीन जीवन रेखा सत्यापित",
    credentialId: "क्यूआर पहचान"
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
    privateMessage: "ಈ ಪ್ರೊಫೈಲ್ ಖಾಸಗಿಯಾಗಿದೆ.",
    age: "ವಯಸ್ಸು",
    gender: "ಲಿಂಗ",
    phone: "ದೂರವಾಣಿ ಸಂಖ್ಯೆ",
    address: "ವಿಳಾಸ",
    emergencyBadge: "ತುರ್ತು ಜೀವರೇಖೆ ದೃಢೀಕರಿಸಲಾಗಿದೆ",
    credentialId: "ಕ್ಯೂಆರ್ ಗುರುತು"
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
    privateMessage: "இந்த சுயவிவரம் தனிப்பட்டது.",
    age: "வயது",
    gender: "பாலினம்",
    phone: "தொலைபேசி எண்",
    address: "முகவரி",
    emergencyBadge: "அவசர அணுகல் சரிபார்க்கப்பட்டது",
    credentialId: "க்யூஆர் அடையாள எண்"
  },
  es: {
    title: "Perfil Médico de Emergencia",
    subtitle: "Verifique parámetros clínicos vitales y contacte emergencias",
    bloodGroup: "Grupo Sanguíneo",
    allergies: "Alergias Severas",
    medications: "Medicamentos Activos",
    conditions: "Condiciones Médicas",
    contacts: "Contactos de Emergencia",
    callContact: "Llamar",
    privateMessage: "Este perfil es privado.",
    age: "Edad",
    gender: "Género",
    phone: "Teléfono",
    address: "Ubicación",
    emergencyBadge: "LÍNEA DE EMERGENCIA VERIFICADA",
    credentialId: "CREDENCIAL QR"
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

function renderEmergencyDetails() {
  const container = document.getElementById('emergencyDetailsCard');
  if (!container || !currentPatient) return;

  const t = translations[currentLanguage] || translations.en;
  const patientName = currentPatient.firstName || currentPatient.name || (currentPatient.user && currentPatient.user.name) || 'Emergency Patient';
  const qrId = currentPatient.qrCodeId || currentPatient.credentialId || 'LQR-EMERGENCY';
  const photo = currentPatient.photo ? `/api/v1/emergency-access/${window.location.pathname.split('/').filter(Boolean).pop()}/photo` : 'LifeQR.png';
  
  const allergies = currentPatient.allergies?.join ? currentPatient.allergies.join(', ') : (currentPatient.allergies || 'None Reported');
  const medications = currentPatient.currentMedications?.join ? currentPatient.currentMedications.join(', ') : (currentPatient.currentMedications || currentPatient.medications || 'None Reported');
  const conditions = currentPatient.medicalConditions?.join ? currentPatient.medicalConditions.join(', ') : (currentPatient.medicalConditions || currentPatient.healthIssues || 'None Reported');
  
  const contacts = currentPatient.emergencyContacts || (currentPatient.profile && currentPatient.profile.emergencyContacts) || [];

  let contactsHTML = '';
  if (contacts.length === 0) {
    contactsHTML = `<p class="text-xs font-mono text-[#111111]/50 italic text-center py-4 border-2 border-dashed border-[#111111]/20">No emergency contacts registered for this profile.</p>`;
  } else {
    contactsHTML = `<div class="grid sm:grid-cols-2 gap-3">`;
    contacts.forEach((c) => {
      contactsHTML += `
        <div class="p-4 border-2 border-[#111111] bg-white flex items-center justify-between gap-3 shadow-[3px_3px_0px_#111111]">
          <div>
            <p class="font-black text-sm text-[#111111] uppercase tracking-tight">${c.name} <span class="text-xs font-mono text-[#E11D2E]">(${c.relationship || 'Contact'})</span></p>
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

  container.innerHTML = `
    <!-- Top Verification Badge -->
    <div class="flex flex-wrap items-center justify-between gap-3 pb-6 border-b-2 border-[#111111]">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-[#111111] text-white text-[10px] font-mono font-bold uppercase tracking-widest">
        <span class="live-dot"></span>
        <span>${t.emergencyBadge}</span>
      </div>
      <div class="font-mono text-xs font-bold text-[#111111]">
        <span class="text-[#111111]/50 uppercase">${t.credentialId}:</span>
        <span class="text-[#E11D2E]">${qrId}</span>
      </div>
    </div>

    <!-- Patient Identity Header -->
    <div class="py-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 border-b-2 border-[#111111]">
      <img src="${photo}" alt="Patient Photo" class="w-20 h-20 border-2 border-[#111111] object-cover bg-gray-100 flex-shrink-0 shadow-[4px_4px_0px_#111111]" onerror="this.src='LifeQR.png'">
      <div class="text-center sm:text-left flex-1">
        <h2 class="font-black text-2xl sm:text-3xl text-[#111111] tracking-tight uppercase">${patientName}</h2>
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 font-mono text-xs text-[#111111]/70 font-bold">
          <span>${t.age}: <strong class="text-[#111111]">${currentPatient.age || 'N/A'}</strong></span>
          <span>&bull;</span>
          <span>${t.gender}: <strong class="text-[#111111] capitalize">${currentPatient.gender || 'N/A'}</strong></span>
          <span>&bull;</span>
          <span>${t.phone}: <strong class="text-[#111111]">${currentPatient.phone || 'N/A'}</strong></span>
        </div>
      </div>
      <!-- Blood Group Highlight Box -->
      <div class="border-2 border-[#E11D2E] bg-red-50 p-3 text-center sm:min-w-[120px] shadow-[4px_4px_0px_#E11D2E]">
        <p class="font-mono text-[10px] font-bold uppercase text-[#E11D2E] tracking-wider">${t.bloodGroup}</p>
        <p class="font-black text-3xl text-[#E11D2E] mt-0.5 leading-none">${currentPatient.bloodGroup || 'N/A'}</p>
      </div>
    </div>

    <!-- Clinical Warning Parameters -->
    <div class="py-6 border-b-2 border-[#111111] space-y-4">
      <div class="grid md:grid-cols-3 gap-4">
        
        <!-- Severe Allergies -->
        <div class="p-4 border-2 border-[#111111] bg-white">
          <div class="flex items-center gap-1.5 text-[#E11D2E] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span class="material-symbols-outlined text-sm">warning</span>
            <span>${t.allergies}</span>
          </div>
          <p class="font-bold text-sm text-[#111111]">${allergies}</p>
        </div>

        <!-- Active Medications -->
        <div class="p-4 border-2 border-[#111111] bg-white">
          <div class="flex items-center gap-1.5 text-[#111111] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span class="material-symbols-outlined text-sm">medication</span>
            <span>${t.medications}</span>
          </div>
          <p class="font-bold text-sm text-[#111111]">${medications}</p>
        </div>

        <!-- Medical Conditions -->
        <div class="p-4 border-2 border-[#111111] bg-white">
          <div class="flex items-center gap-1.5 text-[#111111] font-mono text-[11px] font-bold uppercase tracking-wider mb-1.5">
            <span class="material-symbols-outlined text-sm">monitor_heart</span>
            <span>${t.conditions}</span>
          </div>
          <p class="font-bold text-sm text-[#111111]">${conditions}</p>
        </div>

      </div>
    </div>

    <!-- Emergency Contacts Section -->
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
