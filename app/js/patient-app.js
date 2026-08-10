/**
 * LifeQR - Patient MVP Application Controller
 * Handles Splash, Auth, OTP, Profile Setup, and Home (5 Sub-Views).
 */

const AppState = {
  user: null,
  profile: null,
  qrProfile: null,
  contacts: [],
  records: [],
  pendingAuth: {
    userId: null,
    email: null,
    phone: null,
    otpDemo: null
  },
  activeScreen: 'splash',
  activeTab: 'qr',
  otpTimerInterval: null,
  otpCountdown: 60
};

// --- Toast System ---
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✅';
  if (type === 'error') icon = '⚠️';

  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// --- Screen Router ---
function showScreen(screenId) {
  AppState.activeScreen = screenId;
  document.querySelectorAll('.app-screen').forEach(el => el.classList.remove('active'));
  
  const target = document.getElementById(`screen-${screenId}`);
  if (target) {
    target.classList.add('active');
  }

  // Hook actions when entering specific screens
  if (screenId === 'otp') {
    startOtpCountdown();
    focusFirstOtpBox();
  }
}

// --- Tab Router (Home Sub-Views) ---
function showTab(tabId) {
  AppState.activeTab = tabId;
  document.querySelectorAll('.home-subview').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  const subview = document.getElementById(`tab-view-${tabId}`);
  const navBtn = document.getElementById(`nav-btn-${tabId}`);
  
  if (subview) subview.classList.add('active');
  if (navBtn) navBtn.classList.add('active');
}

// --- API Helpers ---
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(endpoint, options);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, status: 0, data: { error: 'Network error or server unreachable' } };
  }
}

// --- 1. Startup & Session Check (Splash Screen) ---
async function initApp() {
  // Theme check
  const savedTheme = localStorage.getItem('lifeqr_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Show splash for at least 1.2s for pleasant UX
  const startTime = Date.now();
  const res = await apiCall('/api/v1/auth/me');
  const elapsed = Date.now() - startTime;
  const remainingWait = Math.max(0, 1200 - elapsed);

  setTimeout(async () => {
    if (res.ok && res.data.authenticated && res.data.user) {
      AppState.user = res.data.user;
      
      if (res.data.user.role !== 'patient') {
        showToast(`Logged in as ${res.data.user.role}. Redirecting to portal...`, 'info');
        window.location.href = res.data.user.role === 'crew' 
          ? '/app/CrewAmbulance_dashboard.html' 
          : res.data.user.role === 'doctor'
            ? '/app/doctor_dashboard.html'
            : '/app/admin_dashboard.html';
        return;
      }

      if (!res.data.user.isPhoneVerified && res.data.user.phone) {
        AppState.pendingAuth.userId = res.data.user.id;
        AppState.pendingAuth.phone = res.data.user.phone;
        AppState.pendingAuth.email = res.data.user.email;
        showScreen('otp');
        return;
      }

      if (!res.data.user.isProfileComplete) {
        showScreen('profile-setup');
        return;
      }

      await loadPatientFullData();
      showScreen('home');
      showTab('qr');
    } else {
      showScreen('login');
    }
  }, remainingWait);
}

// --- 2. Load Full Patient Data ---
async function loadPatientFullData() {
  const res = await apiCall('/api/v1/patient-app/profile');
  if (res.ok && res.data.success) {
    AppState.user = res.data.user;
    AppState.profile = res.data.profile;
    AppState.contacts = res.data.contacts || [];
    AppState.qrProfile = res.data.qrProfile;
    AppState.records = res.data.records || [];

    renderHeader();
    renderQRTab();
    renderMedicalTab();
    renderContactsTab();
    renderRecordsTab();
    renderSettingsTab();
  }
}

// --- 3. Authentication Handlers ---
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('btn-login-submit');

  if (!email || !password) {
    showToast('Please enter both email and password', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Signing in...';

  const res = await apiCall('/api/v1/auth/login', 'POST', { email, password });
  btn.disabled = false;
  btn.innerText = 'Sign In to LifeQR';

  if (res.ok) {
    showToast('Login successful', 'success');
    AppState.user = res.data.user;

    // Check if role is patient
    if (res.data.user.role !== 'patient') {
      window.location.href = res.data.user.role === 'crew' 
        ? '/app/CrewAmbulance_dashboard.html' 
        : '/app/doctor_dashboard.html';
      return;
    }

    const meRes = await apiCall('/api/v1/auth/me');
    if (meRes.ok && meRes.data.user && !meRes.data.user.isProfileComplete) {
      showScreen('profile-setup');
    } else {
      await loadPatientFullData();
      showScreen('home');
      showTab('qr');
    }
  } else {
    showToast(res.data.error || 'Invalid email or password', 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const gender = document.getElementById('signup-gender').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-password-confirm').value;
  const btn = document.getElementById('btn-signup-submit');

  if (!name || !email || !phone || !password) {
    showToast('Please fill out all required fields', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showToast('Passwords do not match', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Creating account...';

  const res = await apiCall('/api/v1/auth/register', 'POST', {
    name,
    email,
    phone,
    gender,
    password,
    role: 'patient'
  });

  btn.disabled = false;
  btn.innerText = 'Create Patient Account';

  if (res.ok) {
    showToast('Account created! Please verify OTP.', 'success');
    AppState.pendingAuth.userId = res.data.user.id;
    AppState.pendingAuth.email = email;
    AppState.pendingAuth.phone = phone;
    AppState.pendingAuth.otpDemo = res.data.otpCodeDemo;

    document.getElementById('otp-sent-target').innerText = phone || email;
    
    // Update Demo Chip
    const demoChip = document.getElementById('otp-demo-chip');
    if (demoChip && res.data.otpCodeDemo) {
      demoChip.style.display = 'inline-flex';
      demoChip.innerText = `Demo Code: ${res.data.otpCodeDemo} (Click to Fill)`;
      demoChip.onclick = () => fillOtp(res.data.otpCodeDemo);
    }

    showScreen('otp');
  } else {
    showToast(res.data.error || 'Signup failed', 'error');
  }
}

// --- 4. OTP Handlers ---
function startOtpCountdown() {
  clearInterval(AppState.otpTimerInterval);
  AppState.otpCountdown = 60;
  const timerEl = document.getElementById('otp-timer-display');
  const resendBtn = document.getElementById('btn-resend-otp');
  
  if (resendBtn) resendBtn.disabled = true;

  AppState.otpTimerInterval = setInterval(() => {
    AppState.otpCountdown--;
    if (timerEl) timerEl.innerText = `0:${AppState.otpCountdown.toString().padStart(2, '0')}`;
    
    if (AppState.otpCountdown <= 0) {
      clearInterval(AppState.otpTimerInterval);
      if (timerEl) timerEl.innerText = '0:00';
      if (resendBtn) resendBtn.disabled = false;
    }
  }, 1000);
}

function focusFirstOtpBox() {
  const first = document.querySelector('.otp-box');
  if (first) first.focus();
}

function fillOtp(code) {
  const boxes = document.querySelectorAll('.otp-box');
  const digits = code.toString().split('');
  boxes.forEach((box, i) => {
    if (digits[i]) box.value = digits[i];
  });
  if (boxes[5]) boxes[5].focus();
}

function setupOtpInputListeners() {
  const boxes = document.querySelectorAll('.otp-box');
  boxes.forEach((box, index) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value;
      if (val.length >= 1) {
        e.target.value = val.slice(-1); // Single digit
        if (index < boxes.length - 1) {
          boxes[index + 1].focus();
        }
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        boxes[index - 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d{6}$/.test(pasted)) {
        fillOtp(pasted);
      }
    });
  });
}

async function handleVerifyOtp(e) {
  if (e) e.preventDefault();
  const boxes = document.querySelectorAll('.otp-box');
  let otp = '';
  boxes.forEach(b => otp += b.value);

  if (otp.length < 6) {
    showToast('Please enter the full 6-digit code', 'error');
    return;
  }

  const btn = document.getElementById('btn-verify-otp-submit');
  btn.disabled = true;
  btn.innerText = 'Verifying...';

  const res = await apiCall('/api/v1/auth/verify-otp', 'POST', {
    userId: AppState.pendingAuth.userId,
    email: AppState.pendingAuth.email,
    phone: AppState.pendingAuth.phone,
    otp
  });

  btn.disabled = false;
  btn.innerText = 'Verify & Continue';

  if (res.ok) {
    showToast('Phone verified successfully!', 'success');
    AppState.user = res.data.user;

    if (!res.data.isProfileComplete) {
      showScreen('profile-setup');
    } else {
      await loadPatientFullData();
      showScreen('home');
      showTab('qr');
    }
  } else {
    showToast(res.data.error || 'Invalid OTP code', 'error');
  }
}

async function handleResendOtp() {
  const btn = document.getElementById('btn-resend-otp');
  btn.disabled = true;
  btn.innerText = 'Sending...';

  const res = await apiCall('/api/v1/auth/send-otp', 'POST', {
    userId: AppState.pendingAuth.userId,
    email: AppState.pendingAuth.email,
    phone: AppState.pendingAuth.phone
  });

  btn.innerText = 'Resend Code';

  if (res.ok) {
    showToast('New verification code sent', 'success');
    startOtpCountdown();
    if (res.data.otpCodeDemo) {
      const demoChip = document.getElementById('otp-demo-chip');
      if (demoChip) {
        demoChip.style.display = 'inline-flex';
        demoChip.innerText = `Demo Code: ${res.data.otpCodeDemo} (Click to Fill)`;
        demoChip.onclick = () => fillOtp(res.data.otpCodeDemo);
      }
    }
  } else {
    showToast(res.data.error || 'Failed to resend code', 'error');
    btn.disabled = false;
  }
}

// --- 5. Patient Profile Setup Handlers ---
let selectedBloodGroup = '';

function setupProfileFormChips() {
  // Blood group chips
  document.querySelectorAll('#blood-group-chips .chip-select').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('#blood-group-chips .chip-select').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedBloodGroup = chip.getAttribute('data-val');
    });
  });

  // Allergy quick chips
  document.querySelectorAll('#allergy-chips .chip-select').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateInputFromChips('allergy-chips', 'setup-allergies');
    });
  });

  // Condition quick chips
  document.querySelectorAll('#condition-chips .chip-select').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      updateInputFromChips('condition-chips', 'setup-conditions');
    });
  });
}

function updateInputFromChips(containerId, inputId) {
  const activeChips = Array.from(document.querySelectorAll(`#${containerId} .chip-select.active`))
    .map(c => c.getAttribute('data-val'));
  const input = document.getElementById(inputId);
  if (input) {
    input.value = activeChips.join(', ');
  }
}

async function handleSaveProfileSetup(e) {
  e.preventDefault();
  const age = document.getElementById('setup-age').value;
  const allergies = document.getElementById('setup-allergies').value.trim();
  const healthIssues = document.getElementById('setup-conditions').value.trim();
  const medications = document.getElementById('setup-medications').value.trim();
  const contactName = document.getElementById('setup-contact-name').value.trim();
  const contactPhone = document.getElementById('setup-contact-phone').value.trim();
  const contactRel = document.getElementById('setup-contact-rel').value;
  const btn = document.getElementById('btn-save-profile-setup');

  if (!selectedBloodGroup) {
    showToast('Please select your Blood Group', 'error');
    return;
  }

  btn.disabled = true;
  btn.innerText = 'Generating Your LifeQR...';

  // 1. Save Profile
  const res = await apiCall('/api/v1/patient-app/profile', 'POST', {
    age,
    bloodGroup: selectedBloodGroup,
    allergies,
    healthIssues,
    medications
  });

  // 2. Save Primary Contact if provided
  if (contactName && contactPhone) {
    await apiCall('/api/v1/patient-app/contacts', 'POST', {
      name: contactName,
      phone: contactPhone,
      relationship: contactRel,
      isPrimary: true
    });
  }

  btn.disabled = false;
  btn.innerText = 'Complete & Launch LifeQR';

  if (res.ok) {
    showToast('Your Emergency LifeQR is Ready! 🎉', 'success');
    await loadPatientFullData();
    showScreen('home');
    showTab('qr');
  } else {
    showToast(res.data.error || 'Failed to save profile', 'error');
  }
}

// --- 6. RENDER HOME SUB-VIEWS ---

function renderHeader() {
  const nameEl = document.getElementById('header-user-name');
  const avatarEl = document.getElementById('header-user-avatar');
  if (nameEl && AppState.user) nameEl.innerText = AppState.user.name;
  if (avatarEl && AppState.user) {
    const initials = AppState.user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    avatarEl.innerText = initials || 'ME';
  }
}

// Tab 1: My LifeQR
function renderQRTab() {
  if (!AppState.qrProfile) return;

  const qrImg = document.getElementById('live-qr-image');
  const qrIdEl = document.getElementById('live-qr-id');
  const bgBadge = document.getElementById('live-blood-badge');
  const scanCountEl = document.getElementById('stat-scan-count');

  if (qrImg) qrImg.src = AppState.qrProfile.qrImageUrl;
  if (qrIdEl) qrIdEl.innerText = `ID: ${AppState.qrProfile.qrCodeId}`;
  if (bgBadge) bgBadge.innerText = AppState.profile ? (AppState.profile.bloodGroup || 'Blood: N/A') : 'N/A';
  if (scanCountEl) scanCountEl.innerText = AppState.qrProfile.scanCount || 0;
}

// Tab 2: Medical Profile
function renderMedicalTab() {
  const p = AppState.profile || {};
  const u = AppState.user || {};

  document.getElementById('med-val-blood').innerText = p.bloodGroup || 'Not Specified';
  document.getElementById('med-val-age').innerText = p.age ? `${p.age} years` : 'Not Specified';
  document.getElementById('med-val-gender').innerText = u.gender ? u.gender.toUpperCase() : 'Not Specified';

  // Allergies
  const allergiesEl = document.getElementById('med-allergies-list');
  if (allergiesEl) {
    if (p.allergies) {
      const items = p.allergies.split(',').map(s => s.trim()).filter(Boolean);
      allergiesEl.innerHTML = items.map(item => `
        <span class="badge-emergency">⚠️ ${item}</span>
      `).join('');
    } else {
      allergiesEl.innerHTML = '<span class="text-dim" style="font-size: 13px;">No known severe allergies recorded.</span>';
    }
  }

  // Conditions
  const conditionsEl = document.getElementById('med-conditions-list');
  if (conditionsEl) {
    if (p.healthIssues) {
      const items = p.healthIssues.split(',').map(s => s.trim()).filter(Boolean);
      conditionsEl.innerHTML = items.map(item => `
        <span class="badge-warning" style="background: var(--warning-light); color: var(--warning); padding: 4px 10px; border-radius: var(--radius-full); font-size: 12px; font-weight: 600;">🩺 ${item}</span>
      `).join('');
    } else {
      conditionsEl.innerHTML = '<span class="text-dim" style="font-size: 13px;">No chronic conditions listed.</span>';
    }
  }

  // Medications
  const medsEl = document.getElementById('med-medications-list');
  if (medsEl) {
    if (p.medications) {
      const items = p.medications.split(',').map(s => s.trim()).filter(Boolean);
      medsEl.innerHTML = items.map(item => `
        <span class="badge-success">💊 ${item}</span>
      `).join('');
    } else {
      medsEl.innerHTML = '<span class="text-dim" style="font-size: 13px;">No active daily prescriptions.</span>';
    }
  }
}

// Tab 3: Emergency Contacts
function renderContactsTab() {
  const container = document.getElementById('contacts-list-container');
  if (!container) return;

  if (AppState.contacts.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align: center; padding: 30px 20px;">
        <div style="font-size: 36px; margin-bottom: 12px;">👥</div>
        <h4 style="margin-bottom: 6px;">No Emergency Contacts</h4>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Add family or doctors who should be contacted in a medical crisis.</p>
        <button class="btn-primary" onclick="openAddContactModal()" style="width: auto; padding: 10px 20px;">+ Add Contact</button>
      </div>
    `;
    return;
  }

  container.innerHTML = AppState.contacts.map(c => `
    <div class="glass-card" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <div style="width: 42px; height: 42px; border-radius: 12px; background: ${c.isPrimary ? 'var(--emergency-light)' : 'var(--primary-light)'}; display: flex; align-items: center; justify-content: center; font-size: 18px;">
          ${c.isPrimary ? '🚨' : '📞'}
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong style="font-size: 15px;">${c.name}</strong>
            ${c.isPrimary ? '<span class="badge-emergency" style="font-size: 10px; padding: 2px 6px;">PRIMARY</span>' : ''}
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">${c.relationship} • ${c.phone}</div>
        </div>
      </div>
      <div style="display: flex; gap: 8px;">
        <a href="tel:${c.phone}" class="btn-secondary" style="padding: 8px 12px; font-size: 13px; text-decoration: none; color: var(--success);" title="Call Contact">
          📞 Call
        </a>
        <button class="btn-secondary" onclick="deleteContact('${c._id}')" style="padding: 8px; color: var(--emergency);" title="Remove">
          ✕
        </button>
      </div>
    </div>
  `).join('');
}

// Tab 4: Medical Records
let activeCategoryFilter = 'All';

function renderRecordsTab() {
  const container = document.getElementById('records-list-container');
  if (!container) return;

  const filtered = activeCategoryFilter === 'All'
    ? AppState.records
    : AppState.records.filter(r => r.category === activeCategoryFilter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-card" style="text-align: center; padding: 30px 20px;">
        <div style="font-size: 36px; margin-bottom: 12px;">📁</div>
        <h4 style="margin-bottom: 6px;">No Records in "${activeCategoryFilter}"</h4>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 16px;">Keep lab tests, doctor summaries, and prescriptions easily accessible.</p>
        <button class="btn-primary" onclick="openAddRecordModal()" style="width: auto; padding: 10px 20px;">+ Add Record</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="glass-card" style="margin-bottom: 12px; position: relative;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
        <div>
          <span style="font-size: 11px; font-weight: 700; color: var(--secondary); text-transform: uppercase; letter-spacing: 0.5px;">${r.category}</span>
          <h4 style="font-size: 16px; margin: 2px 0 4px 0;">${r.title}</h4>
          <div style="font-size: 12px; color: var(--text-muted);">
            ${r.doctorOrHospital ? `🏥 ${r.doctorOrHospital} • ` : ''} 📅 ${new Date(r.recordDate).toLocaleDateString()}
          </div>
        </div>
        <button onclick="deleteRecord('${r._id}')" style="background: none; border: none; color: var(--text-dim); cursor: pointer; padding: 4px;">
          ✕
        </button>
      </div>
      ${r.notes ? `<p style="font-size: 13px; color: var(--text-main); margin-top: 8px; padding: 8px; background: rgba(0,0,0,0.2); border-radius: var(--radius-sm);">${r.notes}</p>` : ''}
    </div>
  `).join('');
}

function filterRecords(cat) {
  activeCategoryFilter = cat;
  document.querySelectorAll('#record-filter-chips .chip-select').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-cat') === cat);
  });
  renderRecordsTab();
}

// Tab 5: Settings
function renderSettingsTab() {
  if (!AppState.user) return;

  const emailEl = document.getElementById('settings-user-email');
  const phoneEl = document.getElementById('settings-user-phone');
  const verifiedBadge = document.getElementById('settings-phone-badge');

  if (emailEl) emailEl.innerText = AppState.user.email;
  if (phoneEl) phoneEl.innerText = AppState.user.phone || 'No phone linked';
  if (verifiedBadge) {
    verifiedBadge.innerText = AppState.user.isPhoneVerified ? 'Verified' : 'Unverified';
    verifiedBadge.className = AppState.user.isPhoneVerified ? 'badge-success' : 'badge-emergency';
  }
}

// --- 7. MODAL ACTIONS & EXTRA FEATURES ---

// Add Contact Modal
function openAddContactModal() {
  document.getElementById('modal-add-contact').classList.add('active');
}

function closeAddContactModal() {
  document.getElementById('modal-add-contact').classList.remove('active');
}

async function handleSaveContact(e) {
  e.preventDefault();
  const name = document.getElementById('modal-contact-name').value.trim();
  const phone = document.getElementById('modal-contact-phone').value.trim();
  const relationship = document.getElementById('modal-contact-rel').value;
  const isPrimary = document.getElementById('modal-contact-primary').checked;

  if (!name || !phone) {
    showToast('Name and phone are required', 'error');
    return;
  }

  const res = await apiCall('/api/v1/patient-app/contacts', 'POST', {
    name,
    phone,
    relationship,
    isPrimary
  });

  if (res.ok) {
    showToast('Contact added', 'success');
    closeAddContactModal();
    document.getElementById('form-add-contact').reset();
    await loadPatientFullData();
  } else {
    showToast(res.data.error || 'Failed to add contact', 'error');
  }
}

async function deleteContact(id) {
  if (!confirm('Are you sure you want to remove this emergency contact?')) return;
  const res = await apiCall(`/api/v1/patient-app/contacts/${id}`, 'DELETE');
  if (res.ok) {
    showToast('Contact removed', 'success');
    await loadPatientFullData();
  }
}

// Add Medical Record Modal
function openAddRecordModal() {
  document.getElementById('modal-add-record').classList.add('active');
}

function closeAddRecordModal() {
  document.getElementById('modal-add-record').classList.remove('active');
}

async function handleSaveRecord(e) {
  e.preventDefault();
  const title = document.getElementById('record-title').value.trim();
  const category = document.getElementById('record-category').value;
  const doctorOrHospital = document.getElementById('record-doctor').value.trim();
  const recordDate = document.getElementById('record-date').value;
  const notes = document.getElementById('record-notes').value.trim();

  if (!title) {
    showToast('Record title is required', 'error');
    return;
  }

  const res = await apiCall('/api/v1/patient-app/records', 'POST', {
    title,
    category,
    doctorOrHospital,
    recordDate: recordDate || new Date(),
    notes
  });

  if (res.ok) {
    showToast('Medical record added', 'success');
    closeAddRecordModal();
    document.getElementById('form-add-record').reset();
    await loadPatientFullData();
  } else {
    showToast(res.data.error || 'Failed to add record', 'error');
  }
}

async function deleteRecord(id) {
  if (!confirm('Delete this medical record?')) return;
  const res = await apiCall(`/api/v1/patient-app/records/${id}`, 'DELETE');
  if (res.ok) {
    showToast('Record deleted', 'success');
    await loadPatientFullData();
  }
}

// Lock Screen Wallpaper Generator
function generateLockScreenWallpaper() {
  if (!AppState.qrProfile) return;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');

  // Background Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  grad.addColorStop(0, '#090d16');
  grad.addColorStop(0.5, '#1e1b4b');
  grad.addColorStop(1, '#090d16');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Header Banner
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(80, 200, 920, 120);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMERGENCY MEDICAL ID', 540, 275);

  // Patient Info
  ctx.font = 'bold 58px sans-serif';
  ctx.fillText(AppState.user.name, 540, 420);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '36px sans-serif';
  const blood = AppState.profile ? AppState.profile.bloodGroup : 'N/A';
  ctx.fillText(`Blood Group: ${blood}`, 540, 480);

  // QR Code Image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    // White background box
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(240, 560, 600, 600, 40);
    ctx.fill();

    ctx.drawImage(img, 280, 600, 520, 520);

    // Call to action
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText('SCAN IN AN EMERGENCY', 540, 1260);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '32px sans-serif';
    ctx.fillText('Instant Access to Allergies, Blood Type & Contacts', 540, 1320);

    // Footer
    ctx.font = '28px sans-serif';
    ctx.fillText('LifeQR Emergency Network', 540, 1800);

    // Trigger download
    const link = document.createElement('a');
    link.download = `LifeQR-LockScreen-${AppState.user.name.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    showToast('Lock Screen Wallpaper downloaded!', 'success');
  };
  img.src = AppState.qrProfile.qrImageUrl;
}

// Download Badge
function downloadBadge() {
  if (!AppState.qrProfile) return;
  const link = document.createElement('a');
  link.download = `LifeQR-Badge-${AppState.qrProfile.qrCodeId}.png`;
  link.href = AppState.qrProfile.qrImageUrl;
  link.click();
  showToast('QR Badge downloaded', 'success');
}

// Share Emergency Link
function shareEmergencyLink() {
  if (!AppState.qrProfile) return;
  const url = AppState.qrProfile.emergencyAccessUrl;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Emergency Access link copied to clipboard!', 'success');
    });
  } else {
    prompt('Copy Emergency Link:', url);
  }
}

// Emergency Preview Modal
function previewEmergencyView() {
  if (!AppState.qrProfile) return;
  window.open(AppState.qrProfile.emergencyAccessUrl, '_blank');
}

// Theme Toggle
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('lifeqr_theme', next);
  showToast(`Theme switched to ${next} mode`, 'info');
}

// Logout
async function handleLogout() {
  if (!confirm('Are you sure you want to sign out?')) return;
  await apiCall('/api/v1/auth/logout', 'POST');
  AppState.user = null;
  AppState.profile = null;
  showToast('Signed out successfully', 'info');
  showScreen('login');
}

// Emergency SOS Trigger (The Golden Hour)
async function triggerAppSOS() {
  if (!confirm('🚨 Are you sure you want to trigger an EMERGENCY SOS? This will alert family and nearby ambulance crews with your live location.')) return;

  const btn = document.getElementById('btn-panic-sos');
  btn.disabled = true;
  btn.style.opacity = '0.7';

  // Get current position
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;

    const res = await apiCall('/api/v1/sos/sos', 'POST', {
      lat: latitude,
      lng: longitude,
      message: 'Mobile App User SOS - Critical Distress Triggered'
    });

    btn.disabled = false;
    btn.style.opacity = '1';

    if (res.ok) {
      showToast('SOS Beacon Broadcasted! Stay Calm, help is on the way.', 'success');
      // If PWA background sync kicked in, it will show the offline message
      if (res.data.offline) {
        showToast(res.data.message, 'warning');
      }
    } else {
      showToast(res.data.error || 'SOS trigger failed', 'error');
    }
  }, (err) => {
    showToast('Failed to get GPS location. Enabling emergency broadcast anyway...', 'warning');
    // Fallback: Trigger without location if GPS fails
    apiCall('/api/v1/sos/sos', 'POST', {
      lat: 0,
      lng: 0,
      message: 'Mobile App SOS (GPS Blocked)'
    }).then(res => {
      btn.disabled = false;
      btn.style.opacity = '1';
      if (res.ok) showToast('Emergency broadcasted without location.', 'success');
    });
  }, { enableHighAccuracy: true });
}

// --- DOM Initializer ---
document.addEventListener('DOMContentLoaded', () => {
  setupOtpInputListeners();
  setupProfileFormChips();

  // Form submits
  const loginForm = document.getElementById('form-login');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);

  const signupForm = document.getElementById('form-signup');
  if (signupForm) signupForm.addEventListener('submit', handleSignup);

  const otpForm = document.getElementById('form-otp');
  if (otpForm) otpForm.addEventListener('submit', handleVerifyOtp);

  const setupForm = document.getElementById('form-profile-setup');
  if (setupForm) setupForm.addEventListener('submit', handleSaveProfileSetup);

  const contactForm = document.getElementById('form-add-contact');
  if (contactForm) contactForm.addEventListener('submit', handleSaveContact);

  const recordForm = document.getElementById('form-add-record');
  if (recordForm) recordForm.addEventListener('submit', handleSaveRecord);

  // Run initial session probe
  initApp();
});
