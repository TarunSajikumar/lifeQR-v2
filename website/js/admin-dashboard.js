// Admin Dashboard JS Module
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await checkDashboardAccess(['admin']);
  if (!currentUser) return;

  // Initialize display details
  document.getElementById('userName').textContent = currentUser.name;

  // Load stats, users, verifications, and help tickets
  await loadAdminStats();
  await loadAdminUsers();
  await loadVerifications();
  await loadAdminHelpTickets();

  // Wire up Enter key on AI Chat Input
  const chatInput = document.getElementById('aiChatInput');
  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submitAiOpsQuery();
    });
  }
});

window.switchTab = function(tab) {
  const usersSec = document.getElementById('sectionUsers');
  const verSec = document.getElementById('sectionVerifications');
  const helpSec = document.getElementById('sectionHelpTickets');
  const aiSec = document.getElementById('sectionAiOps');
  const usersBtn = document.getElementById('tabUsers');
  const verBtn = document.getElementById('tabVerifications');
  const helpBtn = document.getElementById('tabHelpTickets');
  const aiBtn = document.getElementById('tabAiOps');

  // Hide all sections
  if (usersSec) usersSec.classList.add('hidden');
  if (verSec) verSec.classList.add('hidden');
  if (helpSec) helpSec.classList.add('hidden');
  if (aiSec) aiSec.classList.add('hidden');

  const activeClass = 'btn-primary px-5 py-2.5 uppercase tracking-wider font-bold shadow-[2px_2px_0px_#111111]';
  const inactiveClass = 'btn-secondary px-5 py-2.5 uppercase tracking-wider font-bold';

  if (usersBtn) usersBtn.className = inactiveClass;
  if (verBtn) verBtn.className = inactiveClass;
  if (helpBtn) helpBtn.className = inactiveClass + ' flex items-center gap-1.5 text-blue-700 hover:text-white';
  if (aiBtn) aiBtn.className = inactiveClass + ' flex items-center gap-1.5 text-[#E11D2E] hover:text-white';

  if (tab === 'users') {
    if (usersSec) usersSec.classList.remove('hidden');
    if (usersBtn) usersBtn.className = activeClass;
  } else if (tab === 'verifications') {
    if (verSec) verSec.classList.remove('hidden');
    if (verBtn) verBtn.className = activeClass;
  } else if (tab === 'helpTickets') {
    if (helpSec) helpSec.classList.remove('hidden');
    if (helpBtn) helpBtn.className = activeClass + ' flex items-center gap-1.5';
    loadAdminHelpTickets();
  } else if (tab === 'aiOps') {
    if (aiSec) aiSec.classList.remove('hidden');
    if (aiBtn) aiBtn.className = activeClass + ' flex items-center gap-1.5';
    loadAiOpsBrief();
  }
};

async function loadAdminStats() {
  try {
    const response = await fetch('/api/v1/admin/stats', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    document.getElementById('statTotalUsers').textContent = data.users.total;
    document.getElementById('statPatients').textContent = data.users.patient;
    document.getElementById('statDoctors').textContent = data.users.doctor;
    document.getElementById('statCrew').textContent = data.users.crew;
    document.getElementById('statTotalScans').textContent = data.stats.scans;
    if (document.getElementById('statTotalSos')) {
      document.getElementById('statTotalSos').textContent = data.stats?.sos || 0;
    }

    if (document.getElementById('statPendingVerifications')) {
      document.getElementById('statPendingVerifications').textContent = data.verification.pending;
    }

    if (data.helpTickets) {
      const statHelp = document.getElementById('statHelpTickets');
      if (statHelp) statHelp.textContent = data.helpTickets.pending || 0;

      const tabBadge = document.getElementById('statHelpTicketsTabBadge');
      if (tabBadge) {
        tabBadge.textContent = `${data.helpTickets.pending || 0} Pending`;
        if (data.helpTickets.pending > 0) tabBadge.classList.remove('hidden');
        else tabBadge.classList.add('hidden');
      }
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

// State variables for user management
let cachedAdminUsers = [];
let activeUserRoleFilter = 'ALL';
let activeUserSearchQuery = '';
let currentInspectedUserForProfile = null;
let currentInspectedTicket = null;

async function loadAdminUsers() {
  try {
    const response = await fetch('/api/v1/admin/users', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    cachedAdminUsers = data.users || [];

    // Calculate role counts
    const total = cachedAdminUsers.length;
    const patients = cachedAdminUsers.filter(u => u.role === 'patient').length;
    const doctors = cachedAdminUsers.filter(u => u.role === 'doctor').length;
    const crew = cachedAdminUsers.filter(u => u.role === 'crew').length;
    const admins = cachedAdminUsers.filter(u => u.role === 'admin').length;

    const elAll = document.getElementById('countRoleAll');
    if (elAll) elAll.textContent = total;
    const elPat = document.getElementById('filterRolePatient');
    if (elPat) elPat.textContent = `Patients (${patients})`;
    const elDoc = document.getElementById('filterRoleDoctor');
    if (elDoc) elDoc.textContent = `Doctors (${doctors})`;
    const elCrew = document.getElementById('filterRoleCrew');
    if (elCrew) elCrew.textContent = `Crew (${crew})`;
    const elAdmin = document.getElementById('filterRoleAdmin');
    if (elAdmin) elAdmin.textContent = `Admins (${admins})`;

    renderAdminUsersTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function filterAdminUsers(role) {
  activeUserRoleFilter = role;

  const btnAll = document.getElementById('filterRoleAll');
  const btnPat = document.getElementById('filterRolePatient');
  const btnDoc = document.getElementById('filterRoleDoctor');
  const btnCrew = document.getElementById('filterRoleCrew');
  const btnAdmin = document.getElementById('filterRoleAdmin');

  const activeClass = 'px-3 py-1.5 bg-[#111111] text-white transition';
  const inactiveClass = 'px-3 py-1.5 bg-white text-[#111111] hover:bg-gray-100 transition border-l border-[#111111]';

  if (btnAll) btnAll.className = role === 'ALL' ? activeClass : inactiveClass.replace('border-l border-[#111111]', '');
  if (btnPat) btnPat.className = role === 'patient' ? activeClass : inactiveClass;
  if (btnDoc) btnDoc.className = role === 'doctor' ? activeClass : inactiveClass;
  if (btnCrew) btnCrew.className = role === 'crew' ? activeClass : inactiveClass;
  if (btnAdmin) btnAdmin.className = role === 'admin' ? activeClass : inactiveClass;

  renderAdminUsersTable();
}

function handleAdminUserSearch(query) {
  activeUserSearchQuery = (query || '').toLowerCase().trim();
  renderAdminUsersTable();
}

function renderAdminUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [...cachedAdminUsers];
  if (activeUserRoleFilter !== 'ALL') {
    list = list.filter(u => u.role === activeUserRoleFilter);
  }
  if (activeUserSearchQuery) {
    list = list.filter(u => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const phone = (u.phone || '').toLowerCase();
      const qrid = (u.roleDetails?.qrCodeId || '').toLowerCase();
      const lic = (u.roleDetails?.licenseNumber || '').toLowerCase();
      const veh = (u.roleDetails?.vehicleNumber || '').toLowerCase();
      return name.includes(activeUserSearchQuery) ||
             email.includes(activeUserSearchQuery) ||
             phone.includes(activeUserSearchQuery) ||
             qrid.includes(activeUserSearchQuery) ||
             lic.includes(activeUserSearchQuery) ||
             veh.includes(activeUserSearchQuery);
    });
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center p-8 font-mono text-xs text-[#111111]/60 uppercase font-bold">No user accounts found matching selected criteria.</td></tr>`;
    return;
  }

  list.forEach((u, index) => {
    const tr = document.createElement('tr');
    tr.className = 'border-b-2 border-[#111111]/10 hover:bg-[#f9fafb] transition font-sans';

    let roleBadge = '<span class="px-2 py-0.5 border border-[#111111] bg-gray-50 text-[#111111] font-mono font-bold text-[10px] uppercase">PATIENT</span>';
    if (u.role === 'doctor') {
      roleBadge = '<span class="px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-800 font-mono font-bold text-[10px] uppercase">DOCTOR</span>';
    } else if (u.role === 'crew') {
      roleBadge = '<span class="px-2 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] font-mono font-bold text-[10px] uppercase">PARAMEDIC</span>';
    } else if (u.role === 'admin') {
      roleBadge = '<span class="px-2 py-0.5 border border-[#111111] bg-[#111111] text-white font-mono font-bold text-[10px] uppercase">ADMIN</span>';
    }

    let summaryHtml = '<span class="text-gray-400 font-mono text-[10px]">-</span>';
    if (u.role === 'patient') {
      summaryHtml = `
        <div class="font-mono text-xs leading-tight">
          <span class="font-bold text-[#E11D2E]">${u.roleDetails?.qrCodeId || 'No QR'}</span>
          <span class="text-gray-500 text-[10px] block">&bull; Blood: ${u.roleDetails?.bloodGroup || 'N/A'} &bull; ${u.roleDetails?.contactsCount || 0} Contacts</span>
        </div>
      `;
    } else if (u.role === 'doctor') {
      summaryHtml = `
        <div class="font-mono text-xs leading-tight">
          <span class="font-bold text-blue-800">${u.roleDetails?.licenseNumber || 'Lic: Pending'}</span>
          <span class="text-gray-500 text-[10px] block">&bull; ${u.roleDetails?.specialization || 'Practitioner'} &bull; ${u.roleDetails?.hospital || 'Clinic'}</span>
        </div>
      `;
    } else if (u.role === 'crew') {
      summaryHtml = `
        <div class="font-mono text-xs leading-tight">
          <span class="font-bold text-[#E11D2E]">${u.roleDetails?.vehicleNumber || 'Unit: Pending'}</span>
          <span class="text-gray-500 text-[10px] block">&bull; ${u.roleDetails?.crewType || 'ambulance'} &bull; ${u.roleDetails?.station || 'Base Station'}</span>
        </div>
      `;
    } else if (u.role === 'admin') {
      summaryHtml = `<span class="font-mono text-[10px] font-bold text-gray-700 uppercase">Tier-1 Root Security</span>`;
    }

    let verBadge = '<span class="px-1.5 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 font-mono text-[9px] font-bold uppercase">VERIFIED</span>';
    if (u.verificationStatus === 'PENDING') {
      verBadge = '<span class="px-1.5 py-0.5 border border-amber-600 bg-amber-50 text-amber-900 font-mono text-[9px] font-bold uppercase">PENDING</span>';
    } else if (u.verificationStatus === 'UNDER_REVIEW') {
      verBadge = '<span class="px-1.5 py-0.5 border border-blue-600 bg-blue-50 text-blue-900 font-mono text-[9px] font-bold uppercase">REVIEW</span>';
    } else if (u.verificationStatus === 'SUSPENDED' || u.verificationStatus === 'REVOKED') {
      verBadge = '<span class="px-1.5 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] font-mono text-[9px] font-bold uppercase">SUSPENDED</span>';
    }

    const activePill = u.active
      ? '<span class="px-1.5 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 font-mono text-[9px] font-bold uppercase">Active</span>'
      : '<span class="px-1.5 py-0.5 border border-gray-400 bg-gray-100 text-gray-600 font-mono text-[9px] font-bold uppercase">Inactive</span>';

    const ticketBadge = (u.pendingTickets && u.pendingTickets > 0)
      ? `<button onclick="openAdminUserProfile('${u._id}')" class="px-2 py-0.5 border border-[#E11D2E] bg-red-100 text-[#E11D2E] font-mono text-[10px] font-bold rounded-full hover:bg-red-200 transition" title="Click to troubleshoot open tickets">${u.pendingTickets} Open</button>`
      : '<span class="text-gray-400 font-mono text-[10px]">None</span>';

    const toggleBtn = u.role !== 'admin'
      ? `<button onclick="toggleUserStatus('${u._id}', ${!u.active})" class="btn-secondary px-2.5 py-1 text-[10px] uppercase font-mono font-bold tracking-wider ${u.active ? 'text-[#E11D2E]' : 'text-emerald-700'}" title="${u.active ? 'Deactivate Account' : 'Activate Account'}">${u.active ? 'Disable' : 'Enable'}</button>`
      : '';

    tr.innerHTML = `
      <td class="p-3 text-[#111111]/60 font-mono font-bold text-xs">${index + 1}</td>
      <td class="p-3">
        <p class="font-black text-[#111111] text-xs uppercase tracking-tight">${escapeHtml(u.name)}</p>
        <p class="text-[10px] font-mono text-[#111111]/60 font-bold">${escapeHtml(u.email)}</p>
        ${u.phone ? `<p class="text-[9px] font-mono text-gray-500">${escapeHtml(u.phone)}</p>` : ''}
      </td>
      <td class="p-3">
        ${roleBadge}
        <span class="block text-[9px] font-mono text-gray-400 mt-1">${new Date(u.createdAt).toLocaleDateString()}</span>
      </td>
      <td class="p-3">${summaryHtml}</td>
      <td class="p-3">
        <div class="flex items-center gap-1.5 flex-wrap">
          ${activePill}
          ${verBadge}
        </div>
      </td>
      <td class="p-3 text-center">${ticketBadge}</td>
      <td class="p-3 text-right">
        <div class="flex items-center justify-end gap-1.5 font-mono">
          <button onclick="openAdminUserProfile('${u._id}')" class="btn-primary text-[10px] px-2.5 py-1 uppercase font-bold tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_#111111]" title="Inspect, Edit, and Fix User Profile">
            <span class="material-symbols-outlined text-xs text-[#E11D2E]">edit_square</span>
            <span>Manage &amp; Fix</span>
          </button>
          ${toggleBtn}
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// State variables for verifications and AI Sentinel
let cachedVerifications = [];
let aiAuditCache = {};
let activeVerificationFilter = 'ALL';
let currentInspectedUser = null;
let currentInspectedAudit = null;

async function loadVerifications() {
  try {
    const response = await fetch('/api/v1/admin/verifications', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    cachedVerifications = data.verifications || [];

    // Update filter counts
    const totalCount = cachedVerifications.length;
    const missingCount = cachedVerifications.filter(v => v.documentsCount === 0).length;
    const docsCount = cachedVerifications.filter(v => v.documentsCount > 0).length;

    const elTotal = document.getElementById('countFilterAll');
    const elMissing = document.getElementById('countFilterMissing');
    const elDocs = document.getElementById('countFilterDocs');
    if (elTotal) elTotal.textContent = totalCount;
    if (elMissing) elMissing.textContent = missingCount;
    if (elDocs) elDocs.textContent = docsCount;

    const aiTotal = document.getElementById('aiStatTotal');
    if (aiTotal) aiTotal.textContent = totalCount;

    renderVerificationsTable();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderVerificationsTable() {
  const tbody = document.getElementById('verificationsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = [...cachedVerifications];
  if (activeVerificationFilter === 'MISSING') {
    list = list.filter(v => v.documentsCount === 0);
  } else if (activeVerificationFilter === 'DOCS_PRESENT') {
    list = list.filter(v => v.documentsCount > 0);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center p-8 font-mono text-xs text-[#111111]/60 uppercase font-bold">No verifications matching selected filter.</td></tr>`;
    return;
  }

  list.forEach(v => {
    const tr = document.createElement('tr');
    tr.className = 'border-b-2 border-[#111111]/10 hover:bg-[#f9fafb] transition font-sans';

    // AI Column presentation
    const audit = aiAuditCache[v.id];
    let aiBadgeHtml = '';

    if (audit) {
      if (audit.riskLevel === 'HIGH') {
        aiBadgeHtml = `
          <button onclick="inspectWithAI('${v.id}')" class="px-2.5 py-1 border border-[#E11D2E] bg-red-50 hover:bg-red-100 text-[#E11D2E] font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition" title="Click to view AI findings">
            <span class="w-2 h-2 rounded-full bg-[#E11D2E] animate-pulse"></span>
            <span>HIGH RISK (${audit.score}%)</span>
          </button>
        `;
      } else if (audit.riskLevel === 'MEDIUM') {
        aiBadgeHtml = `
          <button onclick="inspectWithAI('${v.id}')" class="px-2.5 py-1 border border-amber-600 bg-amber-50 hover:bg-amber-100 text-amber-800 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition" title="Click to view AI findings">
            <span class="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>MED RISK (${audit.score}%)</span>
          </button>
        `;
      } else {
        aiBadgeHtml = `
          <button onclick="inspectWithAI('${v.id}')" class="px-2.5 py-1 border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition" title="Click to view AI findings">
            <span class="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>VERIFIED (${audit.score}%)</span>
          </button>
        `;
      }
    } else {
      aiBadgeHtml = `
        <button onclick="inspectWithAI('${v.id}')" class="px-2.5 py-1 border border-[#111111]/40 bg-white hover:bg-gray-100 text-[#111111] font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition" title="Run AI Audit">
          <span class="material-symbols-outlined text-xs text-[#E11D2E]">auto_awesome</span>
          <span>AI Audit</span>
        </button>
      `;
    }

    const docCountColor = v.documentsCount === 0 ? 'text-[#E11D2E]' : 'text-emerald-700';

    tr.innerHTML = `
      <td class="p-3">
        <p class="font-black text-[#111111] text-xs uppercase tracking-tight">${v.name}</p>
        <p class="text-[10px] font-mono text-[#111111]/60 font-bold">${v.email}</p>
      </td>
      <td class="p-3">
        <span class="px-2 py-0.5 border border-[#111111] bg-white font-mono font-bold text-[10px] uppercase tracking-wider text-[#111111]">${v.role.toUpperCase()}</span>
      </td>
      <td class="p-3 ${docCountColor} font-mono font-bold text-xs">${v.documentsCount} Files</td>
      <td class="p-3">${aiBadgeHtml}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 border border-amber-600 bg-amber-50 font-mono font-bold text-[10px] uppercase text-amber-800">${v.verificationStatus}</span>
      </td>
      <td class="p-3 text-right flex items-center justify-end gap-1.5 flex-wrap">
        <button onclick="inspectWithAI('${v.id}')" class="btn-secondary px-2.5 py-1 text-[10px] uppercase font-mono font-bold tracking-wider flex items-center gap-1" title="View AI Credential Audit">
          <span class="material-symbols-outlined text-xs text-[#E11D2E]">psychology</span>
          <span class="hidden sm:inline">AI Inspect</span>
        </button>
        <button onclick="approveVerification('${v.id}')" class="btn-primary px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider">Approve</button>
        <button onclick="rejectVerification('${v.id}')" class="btn-danger px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider">Reject</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

window.filterVerifications = function(type) {
  activeVerificationFilter = type;
  const btnAll = document.getElementById('filterBtnAll');
  const btnMissing = document.getElementById('filterBtnMissing');
  const btnDocs = document.getElementById('filterBtnDocs');

  if (btnAll) btnAll.className = type === 'ALL' ? 'px-3 py-1 border-2 border-[#111111] bg-[#111111] text-white font-bold uppercase tracking-wider' : 'px-3 py-1 border-2 border-[#111111] bg-white text-[#111111] font-bold uppercase tracking-wider hover:bg-[#f9fafb]';
  if (btnMissing) btnMissing.className = type === 'MISSING' ? 'px-3 py-1 border-2 border-[#111111] bg-[#111111] text-white font-bold uppercase tracking-wider' : 'px-3 py-1 border-2 border-[#111111] bg-white text-[#E11D2E] font-bold uppercase tracking-wider hover:bg-[#f9fafb]';
  if (btnDocs) btnDocs.className = type === 'DOCS_PRESENT' ? 'px-3 py-1 border-2 border-[#111111] bg-[#111111] text-white font-bold uppercase tracking-wider' : 'px-3 py-1 border-2 border-[#111111] bg-white text-emerald-700 font-bold uppercase tracking-wider hover:bg-[#f9fafb]';

  renderVerificationsTable();
};

window.runBatchAIAudit = async function() {
  const btn = document.getElementById('btnAiBatchAudit');
  const originalText = btn ? btn.innerHTML : '';
  if (btn) {
    btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">refresh</span><span>Screening Queue...</span>`;
    btn.disabled = true;
  }

  try {
    const res = await fetch('/api/v1/admin/ai-batch-audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Cache results
    data.results.forEach(r => {
      aiAuditCache[r.userId] = r;
    });

    // Update KPI UI
    const elHigh = document.getElementById('aiStatHighRisk');
    const elLow = document.getElementById('aiStatLowRisk');
    const elAvg = document.getElementById('aiStatAvgScore');
    if (elHigh) elHigh.textContent = data.summary.highRisk;
    if (elLow) elLow.textContent = data.summary.lowRisk;
    if (elAvg) elAvg.textContent = `${data.summary.averageScore}%`;

    renderVerificationsTable();
    showToast(`AI Sentinel screened ${data.summary.total} practitioners (${data.summary.highRisk} High Risk, ${data.summary.lowRisk} Low Risk)`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (btn) {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }
};

window.inspectWithAI = async function(userId) {
  const modal = document.getElementById('aiInspectionModal');
  if (!modal) return;

  const target = cachedVerifications.find(v => v.id === userId);
  currentInspectedUser = target || { id: userId, name: 'Practitioner', role: 'doctor' };

  modal.classList.remove('hidden');

  // Populate basic info
  document.getElementById('aiModalPractitionerSub').textContent = `${(currentInspectedUser.name || 'Practitioner').toUpperCase()} • ${(currentInspectedUser.role || '').toUpperCase()}`;
  document.getElementById('aiModalTrustScoreText').textContent = 'Analyzing...';
  document.getElementById('aiModalProgressBar').style.width = '20%';
  document.getElementById('aiModalFlagsList').innerHTML = '<div class="text-[#111111]/50 italic">AI evaluating council & credential files...</div>';
  document.getElementById('aiModalSignalsList').innerHTML = '';
  document.getElementById('aiModalSummaryText').textContent = 'Running neural credential verification heuristics...';

  try {
    let audit = aiAuditCache[userId];
    if (!audit) {
      const res = await fetch(`/api/v1/admin/ai-verify/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      audit = data.audit;
      aiAuditCache[userId] = audit;
      renderVerificationsTable();
    }

    currentInspectedAudit = audit;

    // Update modal UI
    document.getElementById('aiModalTrustScoreText').textContent = `${audit.score} / 100`;
    const bar = document.getElementById('aiModalProgressBar');
    bar.style.width = `${audit.score}%`;

    const badge = document.getElementById('aiModalRiskBadge');
    if (audit.riskLevel === 'HIGH') {
      bar.className = 'h-full bg-[#E11D2E] transition-all duration-500';
      badge.className = 'px-2 py-0.5 border border-[#E11D2E] bg-red-100 text-[#E11D2E] font-mono font-bold';
      badge.textContent = `HIGH RISK (${audit.score}%)`;
    } else if (audit.riskLevel === 'MEDIUM') {
      bar.className = 'h-full bg-amber-500 transition-all duration-500';
      badge.className = 'px-2 py-0.5 border border-amber-600 bg-amber-100 text-amber-800 font-mono font-bold';
      badge.textContent = `MEDIUM RISK (${audit.score}%)`;
    } else {
      bar.className = 'h-full bg-emerald-600 transition-all duration-500';
      badge.className = 'px-2 py-0.5 border border-emerald-600 bg-emerald-100 text-emerald-800 font-mono font-bold';
      badge.textContent = `VERIFIED / LOW RISK (${audit.score}%)`;
    }

    document.getElementById('aiModalRecBadge').textContent = audit.recommendation.replace(/_/g, ' ');

    // Flags
    const flagsList = document.getElementById('aiModalFlagsList');
    if (audit.flags.length === 0) {
      flagsList.innerHTML = '<p class="text-emerald-700 font-mono text-[11px]">✔ Zero anomalies detected. Clean verification profile.</p>';
    } else {
      flagsList.innerHTML = audit.flags.map(f => `
        <div class="flex items-start gap-1.5 text-xs text-[#E11D2E]">
          <span class="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">error</span>
          <span>${f}</span>
        </div>
      `).join('');
    }

    // Signals
    const signalsList = document.getElementById('aiModalSignalsList');
    if (audit.positiveSignals.length === 0) {
      signalsList.innerHTML = '<p class="text-[#111111]/50 font-mono text-[11px]">No verified council registry signals found.</p>';
    } else {
      signalsList.innerHTML = audit.positiveSignals.map(s => `
        <div class="flex items-start gap-1.5 text-xs text-emerald-800">
          <span class="material-symbols-outlined text-sm flex-shrink-0 mt-0.5">verified</span>
          <span>${s}</span>
        </div>
      `).join('');
    }

    document.getElementById('aiModalSummaryText').textContent = audit.summary;

  } catch (err) {
    showToast(err.message, 'error');
    document.getElementById('aiModalSummaryText').textContent = `AI Audit Failed: ${err.message}`;
  }
};

window.closeAiModal = function() {
  const modal = document.getElementById('aiInspectionModal');
  if (modal) modal.classList.add('hidden');
};

window.applyAiApprove = async function() {
  if (!currentInspectedUser) return;
  if (!confirm(`Confirm AI-cleared approval for ${currentInspectedUser.name}?`)) return;
  closeAiModal();
  await updateVerification(currentInspectedUser.id, 'VERIFIED', 'Verified by Admin via AI Sentinel clearance');
};

window.applyAiReject = async function() {
  if (!currentInspectedUser) return;
  const reason = currentInspectedAudit ? currentInspectedAudit.summary : 'Documents incomplete or invalid';
  closeAiModal();
  await updateVerification(currentInspectedUser.id, 'REVOKED', reason);
};

window.autoRejectMissingCredentials = async function() {
  const missingCount = cachedVerifications.filter(v => v.documentsCount === 0).length;
  if (missingCount === 0) {
    showToast('No pending accounts with 0 documents found.', 'info');
    return;
  }

  if (!confirm(`Are you sure you want AI Sentinel to auto-reject ${missingCount} account(s) that have 0 uploaded credentials?`)) {
    return;
  }

  try {
    const res = await fetch('/api/v1/admin/ai-batch-reject-missing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(data.message, 'success');
    await loadAdminStats();
    await loadVerifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.approveVerification = async function(userId) {
  if (!confirm('Are you sure you want to approve this professional practitioner?')) return;
  updateVerification(userId, 'VERIFIED', 'Verified by Admin');
};

window.rejectVerification = async function(userId) {
  const note = prompt('Reason for rejection:');
  if (note === null) return;
  updateVerification(userId, 'REVOKED', note || 'Documents incomplete or invalid');
};

async function updateVerification(userId, status, note) {
  try {
    const res = await fetch(`/api/v1/admin/verifications/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, note })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Practitioner ${status.toLowerCase()} successfully!`, 'success');
    await loadAdminStats();
    await loadVerifications();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.toggleUserStatus = async function(userId, activeState) {
  try {
    const response = await fetch(`/api/v1/admin/users/${userId}/toggle-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ active: activeState })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    showToast(data.message, 'success');
    await loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

// ============================================================
// AI Operations & Copilot Module Functions
// ============================================================

window.loadAiOpsBrief = async function() {
  try {
    const res = await fetch('/api/v1/admin/ai-ops/system-brief', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const brief = data.brief;
    const elHealth = document.getElementById('aiOpsHealthScore');
    const elThreat = document.getElementById('aiOpsThreatLevel');
    const elTime = document.getElementById('aiOpsBriefTimestamp');
    if (elHealth) elHealth.textContent = brief.healthScore;
    if (elThreat) elThreat.textContent = brief.threatLevel;
    if (elTime) elTime.textContent = `Updated: ${new Date(brief.timestamp).toLocaleTimeString()}`;

    const signalsList = document.getElementById('aiOpsSignalsList');
    if (signalsList) {
      signalsList.innerHTML = brief.aiInsights.map(item => `
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-xs text-[#E11D2E] mt-0.5 flex-shrink-0">check_circle</span>
          <span>${item}</span>
        </li>
      `).join('');
    }

    const recsList = document.getElementById('aiOpsRecsList');
    if (recsList) {
      recsList.innerHTML = brief.aiRecommendations.map(item => `
        <li class="flex items-start gap-2">
          <span class="material-symbols-outlined text-xs text-emerald-700 mt-0.5 flex-shrink-0">lightbulb</span>
          <span>${item}</span>
        </li>
      `).join('');
    }

    showToast('AI Executive Brief refreshed successfully!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.askAiQuery = function(text) {
  const input = document.getElementById('aiChatInput');
  if (input) input.value = text;
  submitAiOpsQuery();
};

window.submitAiOpsQuery = async function() {
  const input = document.getElementById('aiChatInput');
  const chatLog = document.getElementById('aiChatLog');
  const btn = document.getElementById('aiChatSubmitBtn');
  if (!input || !chatLog) return;

  const query = input.value.trim();
  if (!query) return;

  // Append user message
  const userDiv = document.createElement('div');
  userDiv.className = 'flex items-start justify-end gap-2.5';
  userDiv.innerHTML = `
    <div class="bg-[#111111] text-white p-3 border border-[#111111] max-w-xl text-right leading-relaxed font-sans">
      <p class="font-mono text-[10px] text-white/60 mb-0.5 uppercase font-bold">You (Admin):</p>
      <p>${escapeHtml(query)}</p>
    </div>
    <div class="w-6 h-6 rounded-full bg-[#E11D2E] text-white flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold">ME</div>
  `;
  chatLog.appendChild(userDiv);
  input.value = '';
  chatLog.scrollTop = chatLog.scrollHeight;

  // Append loading assistant bubble
  const aiLoadingDiv = document.createElement('div');
  aiLoadingDiv.className = 'flex items-start gap-2.5';
  aiLoadingDiv.id = 'aiTempLoadingBubble';
  aiLoadingDiv.innerHTML = `
    <div class="w-6 h-6 rounded-full bg-[#111111] text-[#E11D2E] flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold">AI</div>
    <div class="bg-gray-100 p-3 border border-[#111111]/20 max-w-xl text-[#111111] leading-relaxed flex items-center gap-2 font-mono text-[11px]">
      <span class="material-symbols-outlined text-sm animate-spin text-[#E11D2E]">refresh</span>
      <span>Querying neural operational telemetries...</span>
    </div>
  `;
  chatLog.appendChild(aiLoadingDiv);
  chatLog.scrollTop = chatLog.scrollHeight;

  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/v1/admin/ai-ops/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const temp = document.getElementById('aiTempLoadingBubble');
    if (temp) temp.remove();

    // Format markdown-like bold and bullet text
    const formattedAnswer = (data.answer || '')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/• (.*?)(<br>|$)/g, '<li class="ml-4 list-disc">$1</li>');

    const aiDiv = document.createElement('div');
    aiDiv.className = 'flex items-start gap-2.5';
    aiDiv.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-[#111111] text-[#E11D2E] flex items-center justify-center flex-shrink-0 font-mono text-[10px] font-bold">AI</div>
      <div class="bg-gray-100 p-3.5 border border-[#111111]/20 max-w-xl text-[#111111] leading-relaxed">
        <p class="font-bold font-mono text-[11px] text-[#E11D2E] mb-1 uppercase tracking-wider flex items-center gap-1">
          <span class="material-symbols-outlined text-xs">auto_awesome</span>
          <span>LifeQR Operations Sentinel:</span>
        </p>
        <div class="font-sans text-xs space-y-1">${formattedAnswer}</div>
      </div>
    `;
    chatLog.appendChild(aiDiv);
    chatLog.scrollTop = chatLog.scrollHeight;

  } catch (err) {
    const temp = document.getElementById('aiTempLoadingBubble');
    if (temp) temp.remove();

    const errDiv = document.createElement('div');
    errDiv.className = 'flex items-start gap-2.5 text-xs text-[#E11D2E] font-mono p-2 border border-[#E11D2E] bg-red-50';
    errDiv.textContent = `AI Copilot Error: ${err.message}`;
    chatLog.appendChild(errDiv);
  } finally {
    if (btn) btn.disabled = false;
  }
};

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// ADMIN HELP & SUPPORT TICKETS MANAGEMENT
// ============================================================
let adminTickets = [];
let activeTicketFilter = 'ALL';

async function loadAdminHelpTickets() {
  try {
    const res = await fetch('/api/v1/help-tickets/admin', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    adminTickets = data.tickets || [];
    const counts = data.counts || { total: 0, pending: 0, inProgress: 0, resolved: 0, critical: 0 };

    // Update filter counts
    const countAll = document.getElementById('ticketCountAll');
    const countPending = document.getElementById('ticketCountPending');
    const countInProgress = document.getElementById('ticketCountInProgress');
    const countResolved = document.getElementById('ticketCountResolved');
    const countCritical = document.getElementById('ticketCountCritical');

    if (countAll) countAll.textContent = counts.total;
    if (countPending) countPending.textContent = counts.pending;
    if (countInProgress) countInProgress.textContent = counts.inProgress;
    if (countResolved) countResolved.textContent = counts.resolved;
    if (countCritical) countCritical.textContent = counts.critical;

    // Update stat cards and tab badge
    const statHelp = document.getElementById('statHelpTickets');
    if (statHelp) statHelp.textContent = counts.pending;

    const tabBadge = document.getElementById('statHelpTicketsTabBadge');
    if (tabBadge) {
      tabBadge.textContent = `${counts.pending} Pending`;
      if (counts.pending > 0) tabBadge.classList.remove('hidden');
      else tabBadge.classList.add('hidden');
    }

    renderAdminTickets();
  } catch (err) {
    console.warn('Failed to load admin help tickets:', err);
  }
}

window.filterAdminTickets = function(filter) {
  activeTicketFilter = filter;
  const filterBtns = {
    'ALL': document.getElementById('ticketFilterAll'),
    'PENDING': document.getElementById('ticketFilterPending'),
    'IN_PROGRESS': document.getElementById('ticketFilterInProgress'),
    'RESOLVED': document.getElementById('ticketFilterResolved'),
    'CRITICAL': document.getElementById('ticketFilterCritical')
  };

  Object.keys(filterBtns).forEach(k => {
    const btn = filterBtns[k];
    if (!btn) return;
    if (k === filter) {
      btn.className = 'px-3 py-1 border-2 border-[#111111] bg-[#111111] text-white font-bold uppercase tracking-wider';
    } else {
      btn.className = 'px-3 py-1 border-2 border-[#111111] bg-white text-[#111111] font-bold uppercase tracking-wider hover:bg-[#f9fafb]';
    }
  });

  renderAdminTickets();
};

function renderAdminTickets() {
  const tbody = document.getElementById('helpTicketsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let list = adminTickets;
  if (activeTicketFilter === 'PENDING') {
    list = adminTickets.filter(t => t.status === 'PENDING');
  } else if (activeTicketFilter === 'IN_PROGRESS') {
    list = adminTickets.filter(t => t.status === 'IN_PROGRESS');
  } else if (activeTicketFilter === 'RESOLVED') {
    list = adminTickets.filter(t => t.status === 'RESOLVED');
  } else if (activeTicketFilter === 'CRITICAL') {
    list = adminTickets.filter(t => t.priority === 'CRITICAL');
  }

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="p-8 text-center text-gray-500 font-mono text-xs">
          No help tickets found in this filter view.
        </td>
      </tr>
    `;
    return;
  }

  list.forEach(t => {
    const tr = document.createElement('tr');
    tr.className = 'border-b-2 border-[#111111]/10 hover:bg-[#f9fafb] transition font-sans text-xs';

    let priorityBadge = '<span class="px-2 py-0.5 border border-gray-400 bg-gray-100 text-gray-700 text-[10px] font-mono font-bold">NORMAL</span>';
    if (t.priority === 'HIGH') {
      priorityBadge = '<span class="px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-900 text-[10px] font-mono font-bold">HIGH</span>';
    } else if (t.priority === 'CRITICAL') {
      priorityBadge = '<span class="px-2 py-0.5 border border-[#E11D2E] bg-red-100 text-[#E11D2E] text-[10px] font-mono font-black animate-pulse">🚨 CRITICAL</span>';
    }

    let statusBadge = '<span class="px-2 py-0.5 border border-amber-600 bg-amber-50 text-amber-900 text-[10px] font-mono font-bold uppercase">PENDING</span>';
    if (t.status === 'IN_PROGRESS') {
      statusBadge = '<span class="px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-900 text-[10px] font-mono font-bold uppercase">IN PROGRESS</span>';
    } else if (t.status === 'RESOLVED') {
      statusBadge = '<span class="px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase">RESOLVED</span>';
    }

    let roleBadge = 'border border-[#111111] bg-gray-100 text-[#111111]';
    if (t.requesterRole === 'doctor') roleBadge = 'border border-blue-600 bg-blue-50 text-blue-800';
    if (t.requesterRole === 'crew') roleBadge = 'border border-[#E11D2E] bg-red-50 text-[#E11D2E]';

    const dateStr = new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

    tr.innerHTML = `
      <td class="p-3 font-mono font-bold text-[#E11D2E]">${t.ticketId}</td>
      <td class="p-3">
        <div class="font-bold text-[#111111]">${escapeHtml(t.requesterName)}</div>
        <div class="text-[10px] font-mono text-gray-500">${escapeHtml(t.requesterEmail)}</div>
        <span class="inline-block mt-0.5 px-1.5 py-0.2 rounded-none ${roleBadge} text-[9px] font-mono font-bold uppercase">${t.requesterRole}</span>
      </td>
      <td class="p-3">
        <span class="block font-mono text-[9px] font-bold text-gray-500 uppercase">${t.category.replace(/_/g, ' ')}</span>
        <strong class="text-xs text-[#111111]">${escapeHtml(t.subject)}</strong>
        <p class="text-[11px] text-gray-600 font-sans truncate max-w-xs mt-0.5">${escapeHtml(t.message)}</p>
      </td>
      <td class="p-3 font-mono text-xs">
        ${t.patientQrCodeId ? `<span class="font-bold text-[#E11D2E]">${t.patientQrCodeId}</span>` : '<span class="text-gray-400">-</span>'}
      </td>
      <td class="p-3">${priorityBadge}</td>
      <td class="p-3">${statusBadge}</td>
      <td class="p-3 font-mono text-[10px] text-gray-500">${dateStr}</td>
      <td class="p-3 text-right">
        <div class="flex items-center justify-end gap-1.5 font-mono">
          <button onclick="openAdminTicketModal('${t.ticketId}')" class="btn-primary text-[10px] px-2.5 py-1 uppercase font-bold tracking-wider flex items-center gap-1 shadow-[1px_1px_0px_#111111]">
            <span class="material-symbols-outlined text-xs">edit_note</span>
            <span>Review &amp; Reply</span>
          </button>
          ${t.status !== 'RESOLVED' ? `
            <button onclick="quickResolveAdminTicket('${t.ticketId}')" class="btn-secondary text-[10px] px-2 py-1 uppercase font-bold tracking-wider text-emerald-800 hover:text-white" title="Quick Resolve">
              ✓
            </button>
          ` : ''}
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

window.openAdminTicketModal = function(ticketId) {
  const ticket = adminTickets.find(t => t.ticketId === ticketId);
  if (!ticket) return;

  currentInspectedTicket = ticket;
  const modal = document.getElementById('adminTicketModal');
  if (!modal) return;

  document.getElementById('adminModalTicketId').textContent = ticket.ticketId;
  document.getElementById('adminModalHiddenTicketId').value = ticket.ticketId;
  document.getElementById('adminModalRequester').textContent = `${ticket.requesterName} (${ticket.requesterEmail}) - Role: ${ticket.requesterRole.toUpperCase()}`;
  document.getElementById('adminModalSubject').textContent = ticket.subject;
  document.getElementById('adminModalMessage').textContent = ticket.message;

  const patContext = document.getElementById('adminModalPatientContext');
  if (patContext) {
    if (ticket.patientQrCodeId) {
      patContext.innerHTML = `Associated Patient QR Code: <strong class="text-[#E11D2E]">${ticket.patientQrCodeId}</strong>`;
    } else {
      patContext.innerHTML = 'Associated Patient: <span class="text-gray-400">None specified</span>';
    }
  }

  const prioBadge = document.getElementById('adminModalPriorityBadge');
  if (prioBadge) {
    prioBadge.textContent = ticket.priority;
    if (ticket.priority === 'CRITICAL') {
      prioBadge.className = 'px-2 py-0.5 border border-[#E11D2E] bg-red-100 text-[#E11D2E] font-mono text-[10px] font-bold uppercase animate-pulse';
    } else if (ticket.priority === 'HIGH') {
      prioBadge.className = 'px-2 py-0.5 border border-amber-500 bg-amber-100 text-amber-900 font-mono text-[10px] font-bold uppercase';
    } else {
      prioBadge.className = 'px-2 py-0.5 border border-gray-400 bg-gray-100 text-gray-700 font-mono text-[10px] font-bold uppercase';
    }
  }

  const statusSel = document.getElementById('adminModalStatusSelect');
  if (statusSel) statusSel.value = ticket.status;

  const notesInput = document.getElementById('adminModalNotesInput');
  if (notesInput) notesInput.value = ticket.adminNotes || '';

  const timeInput = document.getElementById('adminModalTimestamp');
  if (timeInput) {
    timeInput.value = new Date(ticket.createdAt).toLocaleString();
  }

  modal.classList.remove('hidden');
};

window.closeAdminTicketModal = function() {
  const modal = document.getElementById('adminTicketModal');
  if (modal) modal.classList.add('hidden');
};

window.handleAdminTicketSubmit = async function(e) {
  e.preventDefault();
  const ticketId = document.getElementById('adminModalHiddenTicketId').value;
  const status = document.getElementById('adminModalStatusSelect').value;
  const adminNotes = document.getElementById('adminModalNotesInput').value.trim();

  const submitBtn = document.getElementById('adminTicketSubmitBtn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Updating...</span>';
  }

  try {
    const res = await fetch(`/api/v1/admin/help-tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, adminNotes })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update ticket');

    showToast(`✅ Ticket ${ticketId} updated to ${status}!`, 'success');
    closeAdminTicketModal();
    await loadAdminHelpTickets();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span class="material-symbols-outlined text-sm">check_circle</span><span>Save &amp; Notify Requester</span>';
    }
  }
};

window.quickResolveAdminTicket = async function(ticketId) {
  try {
    const res = await fetch(`/api/v1/admin/help-tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        status: 'RESOLVED',
        adminNotes: 'Resolved and cleared by System Administrator.'
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve ticket');

    showToast(`✅ Ticket ${ticketId} marked as RESOLVED!`, 'success');
    await loadAdminHelpTickets();
    await loadAdminStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.adminFixProfileFromCurrentTicket = function() {
  if (!currentInspectedTicket) return;
  const reqId = currentInspectedTicket.requesterId?._id || currentInspectedTicket.requesterId;
  closeAdminTicketModal();
  openAdminUserProfile(reqId, currentInspectedTicket.ticketId);
};

// ============================================================
// UNIVERSAL ALL USER TYPES PROFILE HANDLING & TROUBLESHOOTING
// ============================================================

window.openAdminUserProfile = async function(userId, sourceTicketId = null) {
  try {
    const modal = document.getElementById('adminUserProfileModal');
    if (!modal) return;

    showToast('Retrieving comprehensive user profile...', 'info');
    const res = await fetch(`/api/v1/admin/users/${userId}/profile`, { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch user profile');

    currentInspectedUserForProfile = data;
    const user = data.user;
    const profile = data.profile || {};
    const tickets = data.tickets || [];

    // Header info
    document.getElementById('adminUserModalName').textContent = user.name;
    document.getElementById('adminUserModalId').textContent = user.id;
    document.getElementById('adminUserModalEmail').textContent = user.email;

    const roleBadge = document.getElementById('adminUserModalRoleBadge');
    if (roleBadge) {
      roleBadge.textContent = user.role.toUpperCase();
      if (user.role === 'doctor') roleBadge.className = 'px-2 py-0.5 border border-blue-600 bg-blue-50 text-blue-800 text-[10px] font-mono font-bold uppercase';
      else if (user.role === 'crew') roleBadge.className = 'px-2 py-0.5 border border-[#E11D2E] bg-red-50 text-[#E11D2E] text-[10px] font-mono font-bold uppercase';
      else if (user.role === 'admin') roleBadge.className = 'px-2 py-0.5 border border-[#111111] bg-[#111111] text-white text-[10px] font-mono font-bold uppercase';
      else roleBadge.className = 'px-2 py-0.5 border border-[#111111] bg-gray-50 text-[#111111] text-[10px] font-mono font-bold uppercase';
    }

    const activeBadge = document.getElementById('adminUserModalActiveBadge');
    if (activeBadge) {
      activeBadge.textContent = user.active ? 'ACTIVE' : 'DEACTIVATED';
      activeBadge.className = user.active
        ? 'px-2 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase'
        : 'px-2 py-0.5 border border-[#E11D2E] bg-red-100 text-[#E11D2E] text-[10px] font-mono font-bold uppercase';
    }

    // Hidden inputs
    document.getElementById('adminUserHiddenId').value = user.id;
    document.getElementById('adminUserHiddenRole').value = user.role;
    document.getElementById('adminUserHiddenSourceTicketId').value = sourceTicketId || '';

    // Core fields
    document.getElementById('adminProfName').value = user.name || '';
    document.getElementById('adminProfEmail').value = user.email || '';
    document.getElementById('adminProfPhone').value = user.phone || '';
    document.getElementById('adminProfGender').value = user.gender || 'other';
    document.getElementById('adminProfActive').value = user.active ? 'true' : 'false';
    document.getElementById('adminProfVerificationStatus').value = user.verificationStatus || 'PENDING';
    document.getElementById('adminProfAddress').value = user.address || '';
    document.getElementById('adminProfCity').value = user.city || '';
    document.getElementById('adminProfState').value = user.state || '';
    document.getElementById('adminProfVerificationNote').value = user.verificationNote || '';
    document.getElementById('adminProfNewPassword').value = '';

    // Quick Actions Bar
    const qBar = document.getElementById('adminUserQuickActions');
    if (qBar) {
      let qHtml = `<div>Member Since: <strong>${new Date(user.createdAt).toLocaleDateString()}</strong></div>`;
      if (user.role === 'patient') {
        qHtml += `
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="adminRegenerateUserQR('${user.id}')" class="btn-secondary px-3 py-1 font-bold text-xs uppercase text-[#E11D2E] flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">cached</span> Regenerate Patient QR
            </button>
            <a href="/emergency_access.html" target="_blank" class="btn-secondary px-3 py-1 font-bold text-xs uppercase flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">open_in_new</span> Test Emergency View
            </a>
          </div>
        `;
      } else if (user.role === 'doctor' || user.role === 'crew') {
        qHtml += `
          <div class="flex items-center gap-2 flex-wrap">
            <button type="button" onclick="document.getElementById('adminProfVerificationStatus').value = 'VERIFIED'; showToast('Verification status set to VERIFIED', 'info');" class="btn-secondary px-3 py-1 font-bold text-xs uppercase text-emerald-800 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">verified</span> Quick Set Verified
            </button>
            <button type="button" onclick="document.getElementById('adminProfVerificationStatus').value = 'SUSPENDED'; showToast('Verification status set to SUSPENDED', 'warning');" class="btn-secondary px-3 py-1 font-bold text-xs uppercase text-[#E11D2E] flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">block</span> Quick Suspend
            </button>
          </div>
        `;
      }
      qBar.innerHTML = qHtml;
    }

    // Render Role Specific Form Section
    renderRoleSpecificForm(user.role, profile, user);

    // Render User Tickets
    const tBadge = document.getElementById('adminUserTicketCountBadge');
    if (tBadge) tBadge.textContent = `${tickets.length} Tickets Filed`;

    const tList = document.getElementById('adminUserTicketList');
    if (tList) {
      if (tickets.length === 0) {
        tList.innerHTML = `<div class="p-3 border border-dashed border-[#111111]/20 text-gray-500 text-center">No help tickets on file from this user.</div>`;
      } else {
        tList.innerHTML = tickets.map(t => {
          let sBadge = '<span class="px-1.5 py-0.5 border border-amber-600 bg-amber-50 text-amber-900 text-[9px] font-bold uppercase">PENDING</span>';
          if (t.status === 'RESOLVED') sBadge = '<span class="px-1.5 py-0.5 border border-emerald-600 bg-emerald-50 text-emerald-800 text-[9px] font-bold uppercase">RESOLVED</span>';
          else if (t.status === 'IN_PROGRESS') sBadge = '<span class="px-1.5 py-0.5 border border-blue-600 bg-blue-50 text-blue-900 text-[9px] font-bold uppercase">IN PROGRESS</span>';

          const isSelected = sourceTicketId === t.ticketId;
          return `
            <div class="p-2.5 border-2 ${isSelected ? 'border-[#E11D2E] bg-red-50/40' : 'border-[#111111] bg-white'} flex items-start justify-between gap-2">
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <strong class="text-xs uppercase text-[#111111]">${escapeHtml(t.subject)}</strong>
                  <span class="text-[9px] font-mono text-gray-500">#${t.ticketId}</span>
                  ${sBadge}
                </div>
                <p class="font-sans text-xs text-gray-700 mt-1 whitespace-pre-wrap">${escapeHtml(t.message)}</p>
                ${t.adminNotes ? `<div class="mt-1 p-1.5 border border-emerald-600 bg-emerald-50 text-emerald-900 text-[10px] font-mono"><strong>Admin Note:</strong> ${escapeHtml(t.adminNotes)}</div>` : ''}
              </div>
              <button type="button" onclick="selectTicketForAutoResolution('${t.ticketId}')" class="btn-secondary px-2 py-1 text-[10px] uppercase font-bold text-blue-700 hover:text-white flex-shrink-0">
                ${isSelected ? 'Linked' : 'Link to Fix'}
              </button>
            </div>
          `;
        }).join('');
      }
    }

    // Resolution note setup
    const resNoteInput = document.getElementById('adminProfTicketResolutionNote');
    if (resNoteInput) {
      if (sourceTicketId) {
        resNoteInput.value = `Issue resolved: Updated ${user.role} profile parameters in response to ticket #${sourceTicketId}.`;
      } else {
        resNoteInput.value = '';
      }
    }

    modal.classList.remove('hidden');
  } catch (err) {
    showToast(err.message, 'error');
  }
};

window.closeAdminUserProfile = function() {
  const modal = document.getElementById('adminUserProfileModal');
  if (modal) modal.classList.add('hidden');
};

window.selectTicketForAutoResolution = function(ticketId) {
  document.getElementById('adminUserHiddenSourceTicketId').value = ticketId;
  const resNote = document.getElementById('adminProfTicketResolutionNote');
  if (resNote && !resNote.value.trim()) {
    resNote.value = `Issue resolved: Updated profile parameters in response to ticket #${ticketId}.`;
  }
  showToast(`Ticket #${ticketId} linked for auto-resolution on save`, 'info');
};

function renderRoleSpecificForm(role, profile, user) {
  const container = document.getElementById('adminRoleSpecificSection');
  if (!container) return;

  if (role === 'patient') {
    const bgList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-[#111111]/20 pb-2">
          <h4 class="font-black text-xs uppercase font-mono text-[#111111] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm text-[#E11D2E]">medical_services</span>
            <span>2. Patient Clinical Parameters &amp; Emergency Medical ID</span>
          </h4>
          <span class="text-[10px] font-mono font-bold text-[#E11D2E]">QR: ${profile?.qrCodeId || 'Unassigned'}</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Blood Group</label>
            <select id="adminPatBloodGroup" class="w-full p-2.5 text-xs font-bold border-2 border-[#111111]">
              <option value="" ${!profile?.bloodGroup ? 'selected' : ''}>Not Specified</option>
              ${bgList.map(bg => `<option value="${bg}" ${profile?.bloodGroup === bg ? 'selected' : ''}>${bg}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Age</label>
            <input type="number" id="adminPatAge" value="${profile?.age || ''}" placeholder="E.g. 32" class="w-full p-2.5 text-xs font-mono border-2 border-[#111111]">
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Public Emergency Visibility</label>
            <select id="adminPatPublicProfile" class="w-full p-2.5 text-xs font-bold border-2 border-[#111111]">
              <option value="true" ${profile?.publicProfile !== false ? 'selected' : ''}>Public Emergency Access (Enabled)</option>
              <option value="false" ${profile?.publicProfile === false ? 'selected' : ''}>Restricted Access Only</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Severe Allergies (Critical)</label>
            <textarea id="adminPatAllergies" rows="3" class="w-full p-2.5 text-xs font-sans border-2 border-[#111111]" placeholder="E.g. Penicillin, Peanuts (Severe Anaphylaxis)">${profile?.allergies || ''}</textarea>
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Active Chronic Conditions</label>
            <textarea id="adminPatHealthIssues" rows="3" class="w-full p-2.5 text-xs font-sans border-2 border-[#111111]" placeholder="E.g. Type 1 Diabetes, Asthma">${profile?.healthIssues || ''}</textarea>
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Current Medications</label>
            <textarea id="adminPatMedications" rows="3" class="w-full p-2.5 text-xs font-sans border-2 border-[#111111]" placeholder="E.g. Insulin Glargine 20u qHS, Albuterol">${profile?.medications || ''}</textarea>
          </div>
        </div>

        <!-- Emergency Contacts Section -->
        <div class="border border-[#111111]/30 p-3 bg-gray-50/50 space-y-2">
          <div class="flex items-center justify-between">
            <label class="block font-mono text-[10px] font-bold uppercase text-[#111111]">Emergency Contacts (First Responders Dial Directly)</label>
            <button type="button" onclick="addPatientContactRow()" class="btn-secondary px-2.5 py-1 text-[10px] font-mono font-bold uppercase flex items-center gap-1">
              <span class="material-symbols-outlined text-xs">add</span> Add Contact
            </button>
          </div>
          <div id="adminPatContactsContainer" class="space-y-2">
            <!-- Dynamically populated contacts -->
          </div>
        </div>

        ${profile?.qrCode ? `
          <div class="flex items-center justify-between p-3 border-2 border-[#111111] bg-white gap-4 flex-wrap">
            <div class="flex items-center gap-3">
              <img id="adminPatQrImg" src="${profile.qrCode}" class="w-16 h-16 border border-[#111111] object-contain">
              <div>
                <span id="adminPatQrIdTxt" class="font-bold text-xs font-mono uppercase block">Active Medical QR: ${profile.qrCodeId}</span>
                <span class="text-[10px] font-mono text-gray-500">Scanning opens encrypted emergency medical profile</span>
              </div>
            </div>
            <button type="button" onclick="adminRegenerateUserQR('${user.id || user._id}')" class="btn-secondary text-xs px-3 py-1.5 uppercase font-mono font-bold flex items-center gap-1.5 text-[#E11D2E]">
              <span class="material-symbols-outlined text-sm">cached</span>
              <span>Regenerate Fresh QR</span>
            </button>
          </div>
        ` : ''}
      </div>
    `;

    // Populate contacts rows
    const cContainer = document.getElementById('adminPatContactsContainer');
    const contacts = profile?.emergencyContacts || [];
    if (contacts.length === 0) {
      addPatientContactRow();
    } else {
      contacts.forEach(c => addPatientContactRow(c.name, c.phone, c.relationship));
    }

  } else if (role === 'doctor') {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-[#111111]/20 pb-2">
          <h4 class="font-black text-xs uppercase font-mono text-[#111111] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm text-blue-700">stethoscope</span>
            <span>2. Practitioner Clinical &amp; Registry Credentials</span>
          </h4>
          <span class="text-[10px] font-mono font-bold text-blue-800">DOCTOR PROFILE</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Medical Specialization *</label>
            <input type="text" id="adminDocSpec" value="${escapeHtml(profile?.specialization || '')}" placeholder="E.g. Cardiology, Emergency Physician" class="w-full p-2.5 text-xs font-bold border-2 border-[#111111]">
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Medical License Number *</label>
            <input type="text" id="adminDocLic" value="${escapeHtml(profile?.licenseNumber || '')}" placeholder="E.g. MMC-2018-99214" class="w-full p-2.5 text-xs font-mono font-bold border-2 border-[#111111]">
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Primary Hospital / Clinic *</label>
            <input type="text" id="adminDocHosp" value="${escapeHtml(profile?.hospital || '')}" placeholder="E.g. Apollo Multi-Specialty Hospital" class="w-full p-2.5 text-xs font-bold border-2 border-[#111111]">
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Registration State Council</label>
            <input type="text" id="adminDocCouncil" value="${escapeHtml(profile?.registrationCouncil || '')}" placeholder="E.g. Delhi Medical Council" class="w-full p-2.5 text-xs font-mono border-2 border-[#111111]">
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Registration Year</label>
            <input type="number" id="adminDocYear" value="${profile?.registrationYear || ''}" placeholder="E.g. 2018" class="w-full p-2.5 text-xs font-mono border-2 border-[#111111]">
          </div>
        </div>
      </div>
    `;

  } else if (role === 'crew') {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-[#111111]/20 pb-2">
          <h4 class="font-black text-xs uppercase font-mono text-[#111111] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm text-[#E11D2E]">airport_shuttle</span>
            <span>2. Paramedic &amp; Dispatch Fleet Credentials</span>
          </h4>
          <span class="text-[10px] font-mono font-bold text-[#E11D2E]">AMBULANCE CREW</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Vehicle / Ambulance Number *</label>
            <input type="text" id="adminCrewVehicle" value="${escapeHtml(profile?.vehicleNumber || '')}" placeholder="E.g. DL-01-AMB-4402" class="w-full p-2.5 text-xs font-mono font-bold border-2 border-[#111111]">
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Crew Classification</label>
            <select id="adminCrewType" class="w-full p-2.5 text-xs font-bold border-2 border-[#111111]">
              <option value="ambulance" ${profile?.crewType === 'ambulance' ? 'selected' : ''}>Ambulance Emergency Medical Service (EMS)</option>
              <option value="fire" ${profile?.crewType === 'fire' ? 'selected' : ''}>Fire &amp; Rescue Paramedic</option>
              <option value="police" ${profile?.crewType === 'police' ? 'selected' : ''}>Police Tactical Responder</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Assigned Base Station *</label>
            <input type="text" id="adminCrewStation" value="${escapeHtml(profile?.station || '')}" placeholder="E.g. South Metro Central Base" class="w-full p-2.5 text-xs font-bold border-2 border-[#111111]">
          </div>
          <div>
            <label class="block font-mono text-[10px] font-bold uppercase mb-1">Department / Organization</label>
            <input type="text" id="adminCrewOrg" value="${escapeHtml(profile?.organization || '')}" placeholder="E.g. National Emergency Ambulance Service" class="w-full p-2.5 text-xs font-mono border-2 border-[#111111]">
          </div>
        </div>
      </div>
    `;

  } else if (role === 'admin') {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between border-b border-[#111111]/20 pb-2">
          <h4 class="font-black text-xs uppercase font-mono text-[#111111] flex items-center gap-1.5">
            <span class="material-symbols-outlined text-sm text-gray-800">shield</span>
            <span>2. Administrator Privileges &amp; Security Permissions</span>
          </h4>
          <span class="text-[10px] font-mono font-bold text-gray-800">ROOT CLEARANCE</span>
        </div>
        <div class="p-3 border-2 border-[#111111] bg-gray-50 text-xs font-mono">
          <p class="font-bold text-[#111111]">Tier-1 System Administrator</p>
          <p class="text-gray-600 mt-1">Granted unconstrained database override, user profile troubleshooting, audit inspection, and help desk dispatch capabilities.</p>
        </div>
      </div>
    `;
  }
}

window.addPatientContactRow = function(name = '', phone = '', rel = '') {
  const container = document.getElementById('adminPatContactsContainer');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'patient-contact-row grid grid-cols-1 sm:grid-cols-12 gap-2 items-center';
  div.innerHTML = `
    <div class="sm:col-span-4">
      <input type="text" placeholder="Contact Name" value="${escapeHtml(name)}" class="contact-name w-full p-1.5 text-xs border border-[#111111]">
    </div>
    <div class="sm:col-span-4">
      <input type="tel" placeholder="Phone Number" value="${escapeHtml(phone)}" class="contact-phone w-full p-1.5 text-xs font-mono border border-[#111111]">
    </div>
    <div class="sm:col-span-3">
      <input type="text" placeholder="Relationship" value="${escapeHtml(rel)}" class="contact-rel w-full p-1.5 text-xs border border-[#111111]">
    </div>
    <div class="sm:col-span-1 text-right">
      <button type="button" onclick="this.closest('.patient-contact-row').remove()" class="p-1 text-[#E11D2E] hover:bg-red-50" title="Remove Contact">
        <span class="material-symbols-outlined text-base">delete</span>
      </button>
    </div>
  `;
  container.appendChild(div);
};

window.handleAdminProfileSave = async function(e) {
  e.preventDefault();
  const userId = document.getElementById('adminUserHiddenId').value;
  const role = document.getElementById('adminUserHiddenRole').value;
  const sourceTicketId = document.getElementById('adminUserHiddenSourceTicketId').value;
  const ticketResolutionNote = document.getElementById('adminProfTicketResolutionNote').value;

  const name = document.getElementById('adminProfName').value.trim();
  const email = document.getElementById('adminProfEmail').value.trim();
  const phone = document.getElementById('adminProfPhone').value.trim();
  const gender = document.getElementById('adminProfGender').value;
  const active = document.getElementById('adminProfActive').value === 'true';
  const verificationStatus = document.getElementById('adminProfVerificationStatus').value;
  const address = document.getElementById('adminProfAddress').value.trim();
  const city = document.getElementById('adminProfCity').value.trim();
  const state = document.getElementById('adminProfState').value.trim();
  const verificationNote = document.getElementById('adminProfVerificationNote').value.trim();
  const newPassword = document.getElementById('adminProfNewPassword').value.trim();

  const payload = {
    name, email, phone, gender, active,
    verificationStatus, address, city, state,
    verificationNote, newPassword,
    sourceTicketId, ticketResolutionNote
  };

  if (role === 'patient') {
    const age = document.getElementById('adminPatAge')?.value;
    const bloodGroup = document.getElementById('adminPatBloodGroup')?.value;
    const publicProfile = document.getElementById('adminPatPublicProfile')?.value === 'true';
    const allergies = document.getElementById('adminPatAllergies')?.value;
    const healthIssues = document.getElementById('adminPatHealthIssues')?.value;
    const medications = document.getElementById('adminPatMedications')?.value;

    const contactRows = document.querySelectorAll('#adminPatContactsContainer .patient-contact-row');
    const emergencyContacts = [];
    contactRows.forEach((row, i) => {
      const cName = row.querySelector('.contact-name')?.value?.trim();
      const cPhone = row.querySelector('.contact-phone')?.value?.trim();
      const cRel = row.querySelector('.contact-rel')?.value?.trim();
      if (cName || cPhone) {
        emergencyContacts.push({ name: cName, phone: cPhone, relationship: cRel, priority: i + 1 });
      }
    });

    payload.patientDetails = { age, bloodGroup, publicProfile, allergies, healthIssues, medications, emergencyContacts };
  } else if (role === 'doctor') {
    const specialization = document.getElementById('adminDocSpec')?.value;
    const licenseNumber = document.getElementById('adminDocLic')?.value;
    const hospital = document.getElementById('adminDocHosp')?.value;
    const registrationCouncil = document.getElementById('adminDocCouncil')?.value;
    const registrationYear = document.getElementById('adminDocYear')?.value;

    payload.doctorDetails = { specialization, licenseNumber, hospital, registrationCouncil, registrationYear };
  } else if (role === 'crew') {
    const vehicleNumber = document.getElementById('adminCrewVehicle')?.value;
    const crewType = document.getElementById('adminCrewType')?.value;
    const station = document.getElementById('adminCrewStation')?.value;
    const organization = document.getElementById('adminCrewOrg')?.value;

    payload.crewDetails = { vehicleNumber, crewType, station, organization };
  }

  const saveBtn = document.getElementById('adminProfSaveBtn');
  const origHtml = saveBtn.innerHTML;

  try {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span><span>Applying Fixes...</span>';

    const res = await fetch(`/api/v1/admin/users/${userId}/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user profile');

    showToast(`✅ Profile for ${data.user?.name} updated and resolved successfully!`, 'success');
    closeAdminUserProfile();
    await loadAdminUsers();
    await loadAdminHelpTickets();
    await loadAdminStats();
    await loadVerifications();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = origHtml;
    }
  }
};

window.adminRegenerateUserQR = async function(userId) {
  if (!confirm('Are you sure you want to regenerate this patient\'s QR code? Previous QR links will be rotated.')) return;
  try {
    const res = await fetch(`/api/v1/admin/users/${userId}/regenerate-qr`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to regenerate QR');

    showToast(`✅ ${data.message}! New ID: ${data.qrCodeId}`, 'success');
    openAdminUserProfile(userId);
    await loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
};
