// Admin Dashboard JS Module
let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await checkDashboardAccess(['admin']);
  if (!currentUser) return;

  // Initialize display details
  document.getElementById('userName').textContent = currentUser.name;

  // Load stats and users list
  await loadAdminStats();
  await loadAdminUsers();
  await loadVerifications();
});

window.switchTab = function(tab) {
  const usersSec = document.getElementById('sectionUsers');
  const verSec = document.getElementById('sectionVerifications');
  const usersBtn = document.getElementById('tabUsers');
  const verBtn = document.getElementById('tabVerifications');

  if (tab === 'users') {
    usersSec.classList.remove('hidden');
    verSec.classList.add('hidden');
    usersBtn.className = 'px-6 py-2.5 border-2 border-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#111111] bg-[#111111] text-white';
    verBtn.className = 'px-6 py-2.5 border-2 border-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-all bg-white text-[#111111] hover:bg-[#f9fafb]';
  } else {
    usersSec.classList.add('hidden');
    verSec.classList.remove('hidden');
    verBtn.className = 'px-6 py-2.5 border-2 border-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-all shadow-[2px_2px_0px_#111111] bg-[#111111] text-white';
    usersBtn.className = 'px-6 py-2.5 border-2 border-[#111111] text-xs font-mono font-bold uppercase tracking-wider transition-all bg-white text-[#111111] hover:bg-[#f9fafb]';
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
    document.getElementById('statTotalSos').textContent = data.stats.sos;

    if (document.getElementById('statPendingVerifications')) {
      document.getElementById('statPendingVerifications').textContent = data.verification.pending;
    }

  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadAdminUsers() {
  try {
    const response = await fetch('/api/v1/admin/users', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';

    data.users.forEach((u, index) => {
      const tr = document.createElement('tr');
      tr.className = 'border-b-2 border-[#111111]/10 hover:bg-[#f9fafb] transition font-sans';
      
      let badgeColor = 'border border-[#111111] bg-white text-[#111111]';
      if (u.role === 'doctor') badgeColor = 'border border-blue-600 bg-blue-50 text-blue-800';
      if (u.role === 'crew') badgeColor = 'border border-[#E11D2E] bg-red-50 text-[#E11D2E]';

      const passwordValue = u.encryptedPassword || u.password || 'Not available';
      const actionBtn = u.role !== 'admin'
        ? `<button onclick="toggleUserStatus('${u._id}', ${!u.active})" class="btn-secondary px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider ${u.active ? 'text-[#E11D2E]' : 'text-emerald-700'}">${u.active ? 'Deactivate' : 'Activate'}</button>`
        : `<span class="text-[10px] font-mono text-[#111111]/40 uppercase font-bold">System Admin</span>`;

      tr.innerHTML = `
        <td class="p-3 text-[#111111]/60 font-mono font-bold text-xs">${index + 1}</td>
        <td class="p-3"><p class="font-black text-[#111111] text-xs uppercase tracking-tight">${u.name}</p><p class="text-[10px] font-mono text-[#111111]/60 font-bold">${u.email}</p></td>
        <td class="p-3"><span class="px-2 py-0.5 font-mono font-bold text-[10px] uppercase tracking-wider ${badgeColor}">${u.role.toUpperCase()}</span></td>
        <td class="p-3"><code class="block max-w-xs break-all bg-[#f9fafb] text-[#111111] border border-[#111111]/20 px-2 py-1 font-mono text-[9px]">${passwordValue}</code></td>
        <td class="p-3 text-[#111111]/70 font-mono text-xs font-bold">${new Date(u.createdAt).toLocaleDateString()}</td>
        <td class="p-3 text-right">${actionBtn}</td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadVerifications() {
  try {
    const response = await fetch('/api/v1/admin/verifications', { credentials: 'include' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    const tbody = document.getElementById('verificationsTableBody');
    tbody.innerHTML = '';

    if (data.verifications.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 font-mono text-xs text-[#111111]/60 uppercase font-bold">No pending verifications in queue.</td></tr>`;
      return;
    }

    data.verifications.forEach(v => {
      const tr = document.createElement('tr');
      tr.className = 'border-b-2 border-[#111111]/10 hover:bg-[#f9fafb] transition font-sans';

      tr.innerHTML = `
        <td class="p-3"><p class="font-black text-[#111111] text-xs uppercase tracking-tight">${v.name}</p><p class="text-[10px] font-mono text-[#111111]/60 font-bold">${v.email}</p></td>
        <td class="p-3"><span class="px-2 py-0.5 border border-[#111111] bg-white font-mono font-bold text-[10px] uppercase tracking-wider text-[#111111]">${v.role.toUpperCase()}</span></td>
        <td class="p-3 text-[#E11D2E] font-mono font-bold text-xs">${v.documentsCount} Files</td>
        <td class="p-3"><span class="px-2 py-0.5 border border-amber-600 bg-amber-50 font-mono font-bold text-[10px] uppercase text-amber-800">${v.verificationStatus}</span></td>
        <td class="p-3 text-right flex items-center justify-end gap-2">
          <button onclick="approveVerification('${v.id}')" class="btn-primary px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider">Approve</button>
          <button onclick="rejectVerification('${v.id}')" class="btn-danger px-3 py-1 text-[10px] uppercase font-mono font-bold tracking-wider">Reject</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

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
