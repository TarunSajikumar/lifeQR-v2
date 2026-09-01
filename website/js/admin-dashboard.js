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
    usersBtn.className = 'px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm bg-indigo-600 text-white';
    verBtn.className = 'px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
  } else {
    usersSec.classList.add('hidden');
    verSec.classList.remove('hidden');
    verBtn.className = 'px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm bg-indigo-600 text-white';
    usersBtn.className = 'px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm bg-white text-slate-600 border border-slate-200 hover:bg-slate-50';
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
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition';
      
      let badgeColor = 'bg-purple-100 text-purple-800';
      if (u.role === 'doctor') badgeColor = 'bg-blue-100 text-blue-800';
      if (u.role === 'crew') badgeColor = 'bg-rose-100 text-rose-800';

      const passwordValue = u.encryptedPassword || u.password || 'Not available';
      const actionBtn = u.role !== 'admin'
        ? `<button onclick="toggleUserStatus('${u._id}', ${!u.active})" class="px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${u.active ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}">${u.active ? 'Deactivate' : 'Activate'}</button>`
        : `<span class="text-[10px] text-slate-400 italic">System Admin</span>`;

      tr.innerHTML = `
        <td class="p-3 text-slate-400 font-bold">${index + 1}</td>
        <td class="p-3"><p class="font-bold text-slate-800">${u.name}</p><p class="text-[10px] text-slate-400">${u.email}</p></td>
        <td class="p-3"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${badgeColor}">${u.role.toUpperCase()}</span></td>
        <td class="p-3"><code class="block max-w-xs break-all bg-slate-100 text-slate-700 rounded px-2 py-1 font-mono text-[9px]">${passwordValue}</code></td>
        <td class="p-3 text-slate-500">${new Date(u.createdAt).toLocaleDateString()}</td>
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
      tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-slate-400 italic">No pending verifications in queue.</td></tr>`;
      return;
    }

    data.verifications.forEach(v => {
      const tr = document.createElement('tr');
      tr.className = 'border-b border-slate-100 hover:bg-slate-50/50 transition';

      tr.innerHTML = `
        <td class="p-3"><p class="font-bold text-slate-800">${v.name}</p><p class="text-[10px] text-slate-400">${v.email}</p></td>
        <td class="p-3"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-700">${v.role.toUpperCase()}</span></td>
        <td class="p-3 text-indigo-600 font-bold">${v.documentsCount} Files</td>
        <td class="p-3"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] bg-amber-100 text-amber-800">${v.verificationStatus}</span></td>
        <td class="p-3 text-right flex items-center justify-end gap-2">
          <button onclick="approveVerification('${v.id}')" class="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold shadow-sm hover:bg-emerald-600 transition">Approve</button>
          <button onclick="rejectVerification('${v.id}')" class="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold hover:bg-rose-100 transition">Reject</button>
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
