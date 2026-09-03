// Patient Dashboard JS Module
let currentUser = null;
let currentProfile = null;
let reportsPage = 1;
let activitiesPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
  // Pre-populate username and cached fields from localStorage if available
  const cachedName = localStorage.getItem('userName');
  if (cachedName) {
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = cachedName;
  }
  const cachedQr = localStorage.getItem('offline_qrCode');
  const cachedQrId = localStorage.getItem('offline_qrCodeId');
  if (cachedQr) {
    const qrImg = document.getElementById('qrCodeImage');
    if (qrImg) qrImg.src = cachedQr;
  }
  if (cachedQrId) {
    const qrVal = document.getElementById('qrCodeIdValue');
    if (qrVal) qrVal.textContent = cachedQrId;
  }

  // Check auth and role
  currentUser = await checkDashboardAccess(['patient']);
  if (!currentUser) return;

  // Immediately render data received from auth verification
  if (currentUser.name) {
    const nameEl = document.getElementById('userName');
    if (nameEl) nameEl.textContent = currentUser.name;
    const nameInput = document.getElementById('profileName');
    if (nameInput && !nameInput.value) nameInput.value = currentUser.name;
  }
  if (currentUser.qrCode) {
    const qrImg = document.getElementById('qrCodeImage');
    if (qrImg) qrImg.src = currentUser.qrCode;
    const qrVal = document.getElementById('qrCodeIdValue');
    if (qrVal && currentUser.qrCodeId) qrVal.textContent = currentUser.qrCodeId;
  }

  // Initialize Socket.IO connection for notifications
  initSocketConnection();

  // Load patient data
  await loadDashboardData();

  // Setup form listeners
  setupFormListeners();
});

function initSocketConnection() {
  try {
    const socketUrl = (typeof window !== 'undefined' && window.API_URL)
      ? window.API_URL.replace(/\/api\/v1\/?$/, '')
      : window.location.origin;
    const socket = io(socketUrl, { withCredentials: true });
    
    // Listen for authorized doctor accesses or SOS status updates
    socket.on('sos-acknowledged', (data) => {
      showToast(`Emergency crew (${data.responderName}) acknowledged your SOS alert!`, 'info');
      loadDashboardData();
    });
  } catch (e) {
    console.warn('Socket.IO connection failed. Offline notifications unavailable.');
  }
}

async function loadDashboardData() {
  showSkeletons();
  try {
    const response = await (window.authFetch 
      ? window.authFetch('/api/v1/patient/me') 
      : fetch((window.getApiUrl ? window.getApiUrl('/patient/me') : '/api/v1/patient/me'), { credentials: 'include' }));
    
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.error || 'Failed to load details');
    
    currentUser = data.user || currentUser;
    currentProfile = data.profile || {};

    renderProfileDetails();
    renderQRDetails();
    await loadReports();
    await loadActivities();
    await loadAccessRequests();
    await loadMedicalHistory();

  } catch (err) {
    console.error('loadDashboardData error:', err);
    showToast(err.message || 'Failed to load details', 'error');
    if (currentUser) {
      renderProfileDetails();
      renderQRDetails();
    }
  } finally {
    hideSkeletons();
  }
}

function showSkeletons() {
  document.querySelectorAll('.dashboard-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.dashboard-skeleton').forEach(el => el.classList.remove('hidden'));
}

function hideSkeletons() {
  document.querySelectorAll('.dashboard-skeleton').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.dashboard-content').forEach(el => el.classList.remove('hidden'));
}

function renderProfileDetails() {
  if (!currentUser) return;

  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = currentUser.name || 'Patient';

  const nameInput = document.getElementById('profileName');
  if (nameInput) nameInput.value = currentUser.name || '';

  const phoneInput = document.getElementById('profilePhone');
  if (phoneInput) phoneInput.value = currentUser.phone || '+91 ';

  const addrInput = document.getElementById('profileAddress');
  if (addrInput) addrInput.value = currentUser.address || '';

  const cityInput = document.getElementById('profileCity');
  if (cityInput) cityInput.value = currentUser.city || '';

  const stateInput = document.getElementById('profileState');
  if (stateInput) stateInput.value = currentUser.state || '';

  const genderInput = document.getElementById('profileGender');
  if (genderInput) genderInput.value = currentUser.gender || '';
  
  const ageInput = document.getElementById('profileAge');
  if (ageInput) ageInput.value = currentProfile?.age || '';

  const bloodInput = document.getElementById('profileBloodGroup');
  if (bloodInput) bloodInput.value = currentProfile?.bloodGroup || '';

  const allergiesInput = document.getElementById('profileAllergies');
  if (allergiesInput) allergiesInput.value = currentProfile?.allergies || '';

  const medsInput = document.getElementById('profileMedications');
  if (medsInput) medsInput.value = currentProfile?.medications || '';

  const healthIssuesInput = document.getElementById('profileHealthIssues');
  if (healthIssuesInput) healthIssuesInput.value = currentProfile?.healthIssues || '';

  // Render profile photo
  const photoEl = document.getElementById('userProfilePhoto');
  if (photoEl) {
    if (currentUser.profilePhoto) {
      photoEl.src = window.getApiUrl ? window.getApiUrl('/patient/photo') : '/api/v1/patient/photo';
    } else {
      photoEl.src = 'https://www.w3schools.com/howto/img_avatar.png'; // default avatar
    }
  }

  // Set toggle visibility state
  const toggle = document.getElementById('publicProfileToggle');
  if (toggle) toggle.checked = currentProfile?.publicProfile !== false;

  // Render multiple emergency contacts
  const contactsList = document.getElementById('emergencyContactsContainer');
  if (contactsList) {
    contactsList.innerHTML = '';
    const contacts = currentProfile?.emergencyContacts || [];
    if (contacts.length === 0) {
      contactsList.innerHTML = `<p class="text-xs text-[#111111]/60 font-mono italic">No emergency contacts configured.</p>`;
    } else {
      contacts.forEach((c) => {
        const contactRow = document.createElement('div');
        contactRow.className = 'flex justify-between items-center p-3.5 bg-[#f9fafb] border-2 border-[#111111]';
        contactRow.innerHTML = `
          <div>
            <p class="font-black text-[#111111] text-xs uppercase tracking-tight">${c.name} <span class="text-[#E11D2E] font-mono font-bold">(${c.relationship || 'ICE'})</span></p>
            <p class="text-xs font-mono font-bold text-[#111111]/70 mt-0.5">${c.phone}</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 border border-[#111111] bg-white text-[#111111] text-[10px] font-mono font-bold uppercase">Priority ${c.priority || 1}</span>
            <a href="tel:${c.phone}" class="p-1.5 bg-[#111111] text-white hover:bg-[#E11D2E] transition flex items-center justify-center">
              <span class="material-symbols-outlined text-sm">call</span>
            </a>
          </div>
        `;
        contactsList.appendChild(contactRow);
      });
    }
  }

  // Populate emergency contact form fields
  const contacts = currentProfile?.emergencyContacts || [];
  for (let i = 1; i <= 3; i++) {
    const contact = contacts[i - 1] || {};
    const nameInput = document.getElementById(`emergencyContactName${i}`);
    const phoneInput = document.getElementById(`emergencyContactPhone${i}`);
    const relInput = document.getElementById(`emergencyContactRelationship${i}`);
    if (nameInput) nameInput.value = contact.name || '';
    if (phoneInput) phoneInput.value = contact.phone || '+91 ';
    if (relInput) relInput.value = contact.relationship || '';
  }
}

function renderQRDetails() {
  const qrCode = currentProfile?.qrCode || currentUser?.qrCode;
  const qrCodeId = currentProfile?.qrCodeId || currentUser?.qrCodeId;

  if (qrCode) {
    const qrImg = document.getElementById('qrCodeImage');
    if (qrImg) qrImg.src = qrCode;
    localStorage.setItem('offline_qrCode', qrCode);
  }
  if (qrCodeId) {
    const qrVal = document.getElementById('qrCodeIdValue');
    if (qrVal) qrVal.textContent = qrCodeId;
    localStorage.setItem('offline_qrCodeId', qrCodeId);
  }
  if (currentUser?.name) {
    localStorage.setItem('offline_name', currentUser.name);
  }
  if (currentProfile?.bloodGroup) {
    localStorage.setItem('offline_bloodGroup', currentProfile.bloodGroup);
  }
}

async function loadReports() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl(`/reports?page=${reportsPage}&limit=4`) : `/api/v1/reports?page=${reportsPage}&limit=4`;
    const response = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const container = document.getElementById('medicalReportsList');
    if (!container) return;
    container.innerHTML = '';

    if (!data.reports || data.reports.length === 0) {
      container.innerHTML = `
        <div class="text-center p-8 bg-[#f9fafb] border-2 border-[#111111]">
          <span class="material-symbols-outlined text-4xl text-[#111111]/40">description</span>
          <p class="text-xs font-mono font-bold text-[#111111]/60 mt-2 uppercase tracking-wider">No medical reports uploaded yet.</p>
        </div>
      `;
      const pagEl = document.getElementById('reportsPagination');
      if (pagEl) pagEl.innerHTML = '';
      return;
    }

    data.reports.forEach(r => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-white border-2 border-[#111111] shadow-[4px_4px_0px_#111111] flex justify-between items-center transition hover:-translate-y-0.5';
      card.innerHTML = `
        <div style="flex-1; min-width: 0;">
          <h4 class="font-black text-[#111111] text-xs sm:text-sm uppercase tracking-tight truncate">${r.originalName}</h4>
          <p class="text-[10px] font-mono font-bold text-[#E11D2E] uppercase mt-0.5">${r.category} &bull; ${new Date(r.uploadedAt).toLocaleDateString()}</p>
          <p class="text-xs text-[#111111]/70 truncate mt-1 font-medium italic">${r.description || 'No description'}</p>
        </div>
        <a href="${r.url}" target="_blank" class="p-2 border-2 border-[#111111] bg-white hover:bg-[#111111] hover:text-white transition flex items-center justify-center">
          <span class="material-symbols-outlined text-sm">visibility</span>
        </a>
      `;
      container.appendChild(card);
    });

    renderPagination('reportsPagination', data.pagination || {}, 'reportsPage', loadReports);

  } catch (err) {
    console.warn('loadReports notice:', err.message);
  }
}

async function loadActivities() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/patient/me') : '/api/v1/patient/me';
    const response = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const list = (data.profile && data.profile.activities) || [];
    const container = document.getElementById('activitiesList');
    if (!container) return;
    container.innerHTML = '';

    // Paginate manually on client
    const limit = 4;
    const startIndex = (activitiesPage - 1) * limit;
    const paginated = list.slice(startIndex, startIndex + limit);

    if (paginated.length === 0) {
      container.innerHTML = `
        <div class="text-center p-6 bg-[#f9fafb] border-2 border-[#111111]">
          <p class="text-xs font-mono font-bold text-[#111111]/60 uppercase tracking-wider">No activity recorded yet.</p>
        </div>
      `;
      const pagEl = document.getElementById('activitiesPagination');
      if (pagEl) pagEl.innerHTML = '';
      return;
    }

    paginated.forEach(a => {
      const row = document.createElement('div');
      row.className = 'flex gap-3 items-start border-b-2 border-[#111111]/10 pb-3 last:border-b-0 last:pb-0';
      row.innerHTML = `
        <div class="w-8 h-8 border-2 border-[#111111] bg-white flex items-center justify-center text-[#E11D2E] flex-shrink-0">
          <span class="material-symbols-outlined text-sm">history</span>
        </div>
        <div style="flex-1;">
          <p class="text-xs font-black text-[#111111] uppercase tracking-tight">${a.title}</p>
          <p class="text-xs text-[#111111]/70 mt-0.5 font-medium">${a.description}</p>
          <span class="text-[10px] font-mono text-[#111111]/50 block mt-1 uppercase font-bold">${new Date(a.timestamp).toLocaleString()}</span>
        </div>
      `;
      container.appendChild(row);
    });

    const paginationData = {
      currentPage: activitiesPage,
      totalPages: Math.ceil(list.length / limit) || 1,
      hasNextPage: startIndex + limit < list.length,
      hasPrevPage: activitiesPage > 1
    };
    renderPagination('activitiesPagination', paginationData, 'activitiesPage', loadActivities);

  } catch (err) {
    console.warn('loadActivities notice:', err.message);
  }
}

async function loadAccessRequests() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/doctor-access/requests') : '/api/v1/doctor-access/requests';
    const response = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const container = document.getElementById('doctorAccessRequests');
    if (!container) return;
    container.innerHTML = '';

    if (!data.requests || data.requests.length === 0) {
      container.innerHTML = `<p class="text-xs text-[#111111]/60 font-mono italic">No pending doctor requests.</p>`;
      return;
    }

    data.requests.forEach(r => {
      const row = document.createElement('div');
      row.className = 'p-3.5 bg-[#f9fafb] border-2 border-[#111111] space-y-3';
      row.innerHTML = `
        <div class="flex justify-between items-start">
          <div>
            <p class="text-xs font-black text-[#111111] uppercase tracking-tight">Dr. ${r.metadata?.doctorName || 'Doctor'}</p>
            <p class="text-[10px] font-mono font-bold text-[#111111]/60 mt-0.5 uppercase">${r.metadata?.specialization || ''} &bull; ${r.metadata?.hospital || ''}</p>
          </div>
          <span class="px-2 py-0.5 border border-[#111111] bg-amber-100 text-amber-900 text-[9px] font-mono font-bold uppercase tracking-wider">Pending</span>
        </div>
        <div class="flex gap-2 justify-end pt-1 border-t border-[#111111]/10">
          <button onclick="respondToRequest('${r.metadata?.requestId}', false)" class="btn-secondary text-xs px-3 py-1 uppercase font-mono tracking-wider font-bold">Decline</button>
          <button onclick="respondToRequest('${r.metadata?.requestId}', true)" class="btn-primary text-xs px-3 py-1 uppercase font-mono tracking-wider font-bold">Approve</button>
        </div>
      `;
      container.appendChild(row);
    });
  } catch (err) {
    console.warn('loadAccessRequests notice:', err.message);
  }
}

window.respondToRequest = async function(requestId, approve) {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/doctor-access/respond') : '/api/v1/doctor-access/respond';
    const response = await (window.authFetch 
      ? window.authFetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, approve })
        })
      : fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ requestId, approve })
        }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    
    showToast(approve ? 'Request approved successfully!' : 'Request rejected successfully.', 'success');
    await loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

async function loadMedicalHistory() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/history') : '/api/v1/history';
    const response = await (window.authFetch ? window.authFetch(apiUrl) : fetch(apiUrl, { credentials: 'include' }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const container = document.getElementById('historyTimelineContainer');
    if (!container) return;
    container.innerHTML = '';

    if (!data.history || data.history.length === 0) {
      container.innerHTML = `
        <div class="text-center p-8 bg-[#f9fafb] border-2 border-[#111111]">
          <div class="w-12 h-12 border-2 border-[#111111] bg-white text-[#E11D2E] flex items-center justify-center mx-auto mb-2">
            <span class="material-symbols-outlined text-2xl">timeline</span>
          </div>
          <p class="text-xs font-black text-[#111111] uppercase tracking-tight">No medical history logged yet</p>
          <p class="text-[11px] font-mono font-bold text-[#111111]/60 mt-0.5 uppercase">Use the form below to record symptoms or vital measurements.</p>
        </div>
      `;
      return;
    }

    data.history.forEach(h => {
      const item = document.createElement('div');
      item.className = 'relative pl-7 pb-5 last:pb-0 group';
      
      let icon = 'medical_services';
      let badgeClass = 'border border-[#111111] bg-white text-[#111111]';
      let dotBg = 'bg-[#111111]';
      
      if (h.type === 'vital') {
        icon = 'favorite';
        badgeClass = 'border border-[#E11D2E] bg-red-50 text-[#E11D2E]';
        dotBg = 'bg-[#E11D2E]';
      } else if (h.type === 'symptom') {
        icon = 'thermostat';
        badgeClass = 'border border-amber-600 bg-amber-50 text-amber-800';
        dotBg = 'bg-amber-600';
      } else if (h.type === 'treatment') {
        icon = 'medication';
        badgeClass = 'border border-blue-600 bg-blue-50 text-blue-800';
        dotBg = 'bg-blue-600';
      }

      const authorRole = h.author ? h.author.role : 'patient';
      const authorName = h.author ? h.author.name : 'Self';
      const dateStr = new Date(h.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      item.innerHTML = `
        <!-- Vertical connecting line -->
        <div class="absolute left-[11px] top-4 bottom-0 w-0.5 bg-[#111111] group-last:hidden"></div>
        
        <!-- Timeline node dot -->
        <span class="absolute left-0 top-0.5 w-6 h-6 border-2 border-[#111111] ${dotBg} text-white flex items-center justify-center z-10">
          <span class="material-symbols-outlined text-[12px]">${icon}</span>
        </span>
        
        <!-- Timeline card content -->
        <div class="bg-white p-4 border-2 border-[#111111] shadow-[4px_4px_0px_#111111] transition hover:-translate-y-0.5">
          <div class="flex items-center justify-between gap-2 mb-1.5 pb-2 border-b-2 border-[#111111]/10">
            <h5 class="font-black text-[#111111] text-xs sm:text-sm tracking-tight uppercase">${h.title}</h5>
            <span class="px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider font-bold ${badgeClass}">${h.type || 'entry'}</span>
          </div>
          <p class="text-xs text-[#111111]/80 leading-relaxed font-medium mb-3">${h.description}</p>
          <div class="flex items-center justify-between pt-2 border-t border-[#111111]/10 text-[10px] font-mono font-bold text-[#111111]/60">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-xs text-[#E11D2E]">person</span>
              LOGGED BY <strong class="text-[#111111]">${authorName}</strong> (${authorRole.toUpperCase()})
            </span>
            <span>${dateStr}</span>
          </div>
        </div>
      `;
      container.appendChild(item);
    });
  } catch (err) {
    console.warn('loadMedicalHistory notice:', err.message);
  }
}

function renderPagination(containerId, pagination, pageVarName, callback) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  
  if (!pagination || pagination.totalPages <= 1) return;

  const btnPrev = document.createElement('button');
  btnPrev.className = `btn-secondary text-xs px-3 py-1.5 uppercase font-mono font-bold tracking-wider ${pagination.hasPrevPage ? '' : 'opacity-40 cursor-not-allowed pointer-events-none'}`;
  btnPrev.textContent = 'Prev';
  btnPrev.disabled = !pagination.hasPrevPage;
  btnPrev.onclick = () => {
    if (pageVarName === 'reportsPage') reportsPage--;
    if (pageVarName === 'activitiesPage') activitiesPage--;
    callback();
  };

  const pageNum = document.createElement('span');
  pageNum.className = 'text-xs font-mono font-bold text-[#111111] px-3 flex items-center uppercase';
  pageNum.textContent = `Page ${pagination.currentPage || 1} / ${pagination.totalPages || 1}`;

  const btnNext = document.createElement('button');
  btnNext.className = `btn-secondary text-xs px-3 py-1.5 uppercase font-mono font-bold tracking-wider ${pagination.hasNextPage ? '' : 'opacity-40 cursor-not-allowed'}`;
  btnNext.textContent = 'Next';
  btnNext.disabled = !pagination.hasNextPage;
  btnNext.onclick = () => {
    if (pageVarName === 'reportsPage') reportsPage++;
    if (pageVarName === 'activitiesPage') activitiesPage++;
    callback();
  };

  container.appendChild(btnPrev);
  container.appendChild(pageNum);
  container.appendChild(btnNext);
}

function setupFormListeners() {
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('saveProfileBtn') || e.target.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Saving...';
      }

      try {
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        
        // Restructure emergency contacts
        const contacts = [];
        for (let i = 1; i <= 3; i++) {
          const nameInput = document.getElementById(`emergencyContactName${i}`);
          const phoneInput = document.getElementById(`emergencyContactPhone${i}`);
          const relInput = document.getElementById(`emergencyContactRelationship${i}`);
          const nameVal = nameInput ? nameInput.value.trim() : '';
          const phoneVal = phoneInput ? phoneInput.value.trim() : '';
          const relVal = relInput ? relInput.value.trim() : '';
          if (nameVal && phoneVal && phoneVal !== '+91' && phoneVal !== '+91 ') {
            contacts.push({ name: nameVal, phone: phoneVal, relationship: relVal });
          }
        }
        data.emergencyContacts = contacts;

        const apiUrl = window.getApiUrl ? window.getApiUrl('/patient/update') : '/api/v1/patient/update';
        const response = await (window.authFetch 
          ? window.authFetch(apiUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            })
          : fetch(apiUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(data)
            }));
        const res = await response.json();
        if (!response.ok) throw new Error(res.error);

        showToast('Profile updated successfully!', 'success');
        await loadDashboardData();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Save Changes';
        }
      }
    });
  }

  // Report Upload Listener
  const reportForm = document.getElementById('reportUploadForm');
  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('uploadReportBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Uploading...';
      }

      try {
        const formData = new FormData(e.target);
        const apiUrl = window.getApiUrl ? window.getApiUrl('/reports/upload') : '/api/v1/reports/upload';
        const response = await (window.authFetch 
          ? window.authFetch(apiUrl, { method: 'POST', body: formData })
          : fetch(apiUrl, { method: 'POST', credentials: 'include', body: formData }));
        const res = await response.json();
        if (!response.ok) throw new Error(res.error);

        showToast('Report uploaded successfully!', 'success');
        e.target.reset();
        await loadReports();
        await loadActivities();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Upload Document';
        }
      }
    });
  }

  // Toggle Visibility Listener
  const toggleBtn = document.getElementById('publicProfileToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('change', async (e) => {
      try {
        const apiUrl = window.getApiUrl ? window.getApiUrl('/patient/visibility') : '/api/v1/patient/visibility';
        const response = await (window.authFetch 
          ? window.authFetch(apiUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicProfile: e.target.checked })
            })
          : fetch(apiUrl, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ publicProfile: e.target.checked })
            }));
        const res = await response.json();
        if (!response.ok) throw new Error(res.error);
        showToast(`Profile visibility changed to ${e.target.checked ? 'Public' : 'Private'}.`, 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Symptom / Vital add listener (if form is present)
  const symptomForm = document.getElementById('symptomForm');
  if (symptomForm) {
    symptomForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('addHistoryBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Adding...';
      }

      try {
        const type = document.getElementById('historyType').value;
        const title = document.getElementById('historyTitle').value;
        const description = document.getElementById('historyDesc').value;

        const apiUrl = window.getApiUrl ? window.getApiUrl('/history/add') : '/api/v1/history/add';
        const response = await (window.authFetch 
          ? window.authFetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, title, description })
            })
          : fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ type, title, description })
            }));
        const res = await response.json();
        if (!response.ok) throw new Error(res.error);

        showToast('Timeline entry added successfully!', 'success');
        e.target.reset();
        await loadMedicalHistory();
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Add Entry';
        }
      }
    });
  }
}

// Upload profile photo
window.uploadProfilePhoto = async function() {
  const fileInput = document.getElementById('profilePhotoInput');
  if (!fileInput || fileInput.files.length === 0) return;

  const formData = new FormData();
  formData.append('photo', fileInput.files[0]);

  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/patient/upload-photo') : '/api/v1/patient/upload-photo';
    const response = await (window.authFetch 
      ? window.authFetch(apiUrl, { method: 'POST', body: formData })
      : fetch(apiUrl, { method: 'POST', credentials: 'include', body: formData }));
    const res = await response.json();
    if (!response.ok) throw new Error(res.error);

    showToast('Profile photo updated successfully!', 'success');
    const photoEl = document.getElementById('userProfilePhoto');
    if (photoEl) photoEl.src = res.profilePhoto;
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Regenerate QR
window.regenerateQR = async function() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/patient/regenerate-qr') : '/api/v1/patient/regenerate-qr';
    const response = await (window.authFetch 
      ? window.authFetch(apiUrl, { method: 'POST' })
      : fetch(apiUrl, { method: 'POST', credentials: 'include' }));
    const res = await response.json();
    if (!response.ok) throw new Error(res.error);
    showToast('QR Code successfully regenerated!', 'success');
    await loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// Trigger SOS
window.triggerEmergencySOS = async function() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser.', 'error');
    return;
  }

  showToast('Acquiring location coordinates...', 'info');

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;

    try {
      const apiUrl = window.getApiUrl ? window.getApiUrl('/sos/sos') : '/api/v1/sos/sos';
      const response = await (window.authFetch 
        ? window.authFetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat, lng, message: 'Emergency Patient SOS Triggered!' })
          })
        : fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ lat, lng, message: 'Emergency Patient SOS Triggered!' })
          }));
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      showToast('🚨 SOS Emergency broadcasted successfully!', 'emergency', 10000);
      await loadDashboardData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, (err) => {
    showToast(`Location access denied: ${err.message}. Triggering generic SOS...`, 'warning');
    // Fallback SOS without live coordinates
    triggerSOSWithFallback();
  }, { enableHighAccuracy: true });
};

async function triggerSOSWithFallback() {
  try {
    const apiUrl = window.getApiUrl ? window.getApiUrl('/sos/sos') : '/api/v1/sos/sos';
    const response = await (window.authFetch 
      ? window.authFetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat: 0, lng: 0, message: 'SOS Alert - Geolocation unavailable' })
        })
      : fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ lat: 0, lng: 0, message: 'SOS Alert - Geolocation unavailable' })
        }));
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    showToast('🚨 Emergency SOS alert sent without location.', 'emergency', 10000);
    await loadDashboardData();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Share live location coordinate updates
window.shareLiveLocation = function() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported.', 'error');
    return;
  }

  showToast('Starting live location tracking...', 'info');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const apiUrl = window.getApiUrl ? window.getApiUrl('/patient/location') : '/api/v1/patient/location';
      const response = await (window.authFetch 
        ? window.authFetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          })
        : fetch(apiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          }));
      if (!response.ok) throw new Error();
      showToast('Live location coordinates updated!', 'success');
    } catch (e) {
      showToast('Failed to update live coordinates.', 'error');
    }
  });
};

// Wallet card print download logic
window.downloadWalletCard = function() {
  // Create wallet card container dynamically
  const card = document.createElement('div');
  card.className = 'wallet-card-container wallet-card-print';
  card.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <h2>🚑 LifeQR ID</h2>
        <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 13px;">${currentUser.name}</p>
        <p style="margin: 2px 0 0 0; font-size: 10px; color: #4b5563;">QR Code ID: ${currentProfile.qrCodeId}</p>
      </div>
      <div>
        <div style="display: flex; gap: 8px; margin-bottom: 4px;">
          <span style="background: #fef2f2; color: #dc2626; padding: 2px 6px; border-radius: 4px; font-weight: bold;">Blood: ${currentProfile.bloodGroup || 'N/A'}</span>
        </div>
        <p style="margin: 0; font-size: 9px; color: #dc2626; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          Allergies: ${currentProfile.allergies || 'None'}
        </p>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; border-left: 1px dashed #d1d5db; padding-left: 4mm;">
      <img src="${currentProfile.qrCode}" class="wallet-card-qr" />
      <span style="font-size: 8px; margin-top: 2px; font-weight: bold;">SCAN FOR LIFE</span>
    </div>
  `;

  document.body.appendChild(card);
  window.print();
  
  // Clean up
  setTimeout(() => {
    card.remove();
  }, 1000);
};

// Traditional Medical ID Download using browser print layout
window.downloadQR = function() {
  window.print();
};

// Auto-fill and format +91 for phone inputs in patient dashboard
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('focus', () => {
      if (!input.value.trim()) {
        input.value = '+91 ';
      }
    });
    input.addEventListener('input', () => {
      const raw = input.value.trim();
      if (!raw.startsWith('+91')) {
        const digits = raw.replace(/[^0-9]/g, '');
        if (digits.startsWith('91')) {
          input.value = '+' + digits.slice(0, 2) + ' ' + digits.slice(2);
        } else if (digits.length > 0) {
          input.value = '+91 ' + digits;
        }
      }
    });
  });
});


