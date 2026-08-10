// Hospital ER Reception Triage & Command Center JS Module
let currentUser = null;
let erMapInstance = null;
let erMarkers = {};
let activeIncomingData = [];

document.addEventListener('DOMContentLoaded', async () => {
  currentUser = await checkDashboardAccess(['doctor', 'crew', 'admin']);
  if (!currentUser) return;

  const nameEl = document.getElementById('userName');
  if (nameEl) nameEl.textContent = currentUser.name || 'ER Desk';

  // Initialize Socket.IO connection for live ER telemetry stream
  initERSocketConnection();

  // Initialize Map
  initERMap();

  // Load incoming ambulances
  await loadIncomingAmbulances();
});

function initERSocketConnection() {
  try {
    const socket = io({ withCredentials: true });
    
    socket.on('connect', () => {
      console.log('⚡ Connected to Hospital ER Socket Stream');
    });

    socket.on('incoming-ambulance-update', (data) => {
      showToast(`🚨 IN-TRANSIT VITALS STREAM: Unit ${data.vehicleNumber} updated ETA ${data.etaMinutes}m!`, 'emergency', 8000);
      loadIncomingAmbulances();
    });

    socket.on('trauma-bay-assigned', (data) => {
      showToast(`✅ Trauma Bay ${data.assignedBay} reserved for ${data.patientName}`, 'success');
      loadIncomingAmbulances();
    });

    socket.on('handover-completed', (data) => {
      showToast(`🏥 Handover completed at ER desk`, 'info');
      loadIncomingAmbulances();
    });
  } catch (e) {
    console.warn('Real-time Socket.IO connection failed on ER dashboard:', e);
  }
}

async function loadIncomingAmbulances() {
  const container = document.getElementById('incomingContainer');
  try {
    const res = await fetch('/api/v1/er/incoming', { credentials: 'include' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    activeIncomingData = data.incoming || [];
    renderIncomingAmbulances(activeIncomingData);
    updateMetrics(activeIncomingData);
    updateERMap(activeIncomingData);
  } catch (err) {
    console.error('Failed to load incoming ER handovers:', err);
    if (container) {
      container.innerHTML = `
        <div class="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-3xl">
          <span class="material-symbols-outlined text-4xl text-rose-500 mb-2">signal_cellular_off</span>
          <p class="text-xs text-rose-300 font-bold">No active in-transit ambulances reported.</p>
          <p class="text-[11px] text-slate-400 mt-1">Waiting for paramedic vitals telemetry stream...</p>
        </div>
      `;
    }
  }
}

function updateMetrics(list) {
  const countEl = document.getElementById('metricIncomingCount');
  const criticalEl = document.getElementById('metricCriticalCount');
  const avgEtaEl = document.getElementById('metricAvgEta');

  if (countEl) countEl.textContent = list.length;
  if (criticalEl) {
    const criticalCount = list.filter(i => i.triageLevel === 'CRITICAL').length;
    criticalEl.textContent = criticalCount;
  }
  if (avgEtaEl && list.length > 0) {
    const avg = Math.round(list.reduce((acc, i) => acc + (i.etaMinutes || 10), 0) / list.length);
    avgEtaEl.textContent = `${avg} Mins`;
  }
}

function renderIncomingAmbulances(list) {
  const container = document.getElementById('incomingContainer');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center bg-slate-900/80 border border-slate-800 rounded-3xl backdrop-blur-md">
        <div class="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-2xl">local_shipping</span>
        </div>
        <h4 class="font-bold text-white text-sm">No Ambulance En Route Currently</h4>
        <p class="text-xs text-slate-400 font-medium mt-1">When paramedics trigger an in-transit vitals stream, live telemetry will appear here.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  list.forEach(item => {
    const vitals = item.vitals || {};
    const card = document.createElement('div');
    card.className = 'p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/40 border-2 border-rose-500/50 rounded-3xl shadow-xl space-y-4 backdrop-blur-md';

    const isCritical = item.triageLevel === 'CRITICAL';
    const triageBadgeClass = isCritical 
      ? 'bg-rose-500 text-white font-extrabold animate-pulse'
      : 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40';

    card.innerHTML = `
      <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-2xl bg-rose-600/30 border border-rose-500/50 flex items-center justify-center text-rose-400 font-extrabold text-sm">
            ${item.bloodGroup || 'O+'}
          </div>
          <div>
            <h3 class="font-headline font-extrabold text-white text-base flex items-center gap-2">
              ${item.patientName || 'Emergency Patient'}
              <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${triageBadgeClass}">${item.triageLevel || 'CRITICAL'}</span>
            </h3>
            <p class="text-xs text-slate-400 font-medium">Unit: <strong class="text-white">${item.vehicleNumber}</strong> • Complaint: <span class="text-rose-300">${item.chiefComplaint || 'Acute Trauma'}</span></p>
          </div>
        </div>

        <div class="text-right">
          <div class="text-xs font-bold text-slate-400">ETA COUNTDOWN</div>
          <div class="text-xl font-extrabold text-rose-400 font-mono flex items-center justify-end gap-1">
            <span class="material-symbols-outlined text-sm animate-spin">schedule</span> ${item.etaMinutes} Mins
          </div>
        </div>
      </div>

      <!-- Severe Allergy Warning Banner -->
      <div class="px-3.5 py-2 bg-rose-950/60 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300">
        <span class="flex items-center gap-1.5 font-bold">
          <span class="material-symbols-outlined text-base text-rose-400">warning</span>
          Critical Allergies: ${item.allergies || 'None Reported'}
        </span>
        <span class="text-[10px] text-slate-400 font-mono">QR ID: ${item.qrCodeId}</span>
      </div>

      <!-- Live Vitals Telemetry Metrics Grid -->
      <div class="grid grid-cols-4 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800 text-center">
        <div>
          <p class="text-[10px] font-bold text-slate-400">PULSE (HR)</p>
          <p class="text-base font-extrabold text-rose-400">${vitals.heartRate ? vitals.heartRate + ' <span class="text-[9px] font-normal text-slate-400">bpm</span>' : '--'}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-slate-400">BLOOD PRESSURE</p>
          <p class="text-base font-extrabold text-indigo-300">${vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic || 80}` : '--'}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-slate-400">SpO2</p>
          <p class="text-base font-extrabold text-emerald-400">${vitals.spO2 ? vitals.spO2 + '%' : '--'}</p>
        </div>
        <div>
          <p class="text-[10px] font-bold text-slate-400">GCS SCORE</p>
          <p class="text-base font-extrabold text-amber-300">${vitals.gcs ? vitals.gcs + '/15' : '--'}</p>
        </div>
      </div>

      <!-- Trauma Bay Reservation Dispatcher -->
      <div class="flex items-center justify-between gap-3 pt-1">
        <div class="text-xs text-slate-300 font-medium">
          Assigned Location: <strong class="text-white bg-slate-800 px-2 py-1 rounded-lg border border-slate-700">${item.assignedBay || 'PENDING'}</strong>
        </div>

        <div class="flex items-center gap-2">
          <button onclick="reserveTraumaBay('${item._id}', 'Bay 1 - Critical')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md">
            Reserve Bay 1
          </button>
          <button onclick="reserveTraumaBay('${item._id}', 'Bay 2 - Resuscitation')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md">
            Reserve Bay 2
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

window.reserveTraumaBay = async function(handoverId, bayName) {
  try {
    const res = await fetch('/api/v1/er/assign-bay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ handoverId, assignedBay: bayName })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    showToast(`Assigned ${bayName} successfully!`, 'success');
    loadIncomingAmbulances();
  } catch (err) {
    showToast(err.message, 'error');
  }
};

function initERMap() {
  const container = document.getElementById('erMap');
  if (!container) return;

  const defaultLat = 37.7749;
  const defaultLng = -122.4194;

  erMapInstance = L.map('erMap').setView([defaultLat, defaultLng], 12);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(erMapInstance);

  // Hospital ER Marker
  L.marker([defaultLat, defaultLng]).addTo(erMapInstance)
    .bindPopup('<b>Central Hospital ER Trauma Center</b>')
    .openPopup();
}

function updateERMap(list) {
  if (!erMapInstance) return;

  list.forEach(item => {
    if (item.location && item.location.lat) {
      const { lat, lng } = item.location;
      if (erMarkers[item._id]) {
        erMarkers[item._id].setLatLng([lat, lng]);
      } else {
        erMarkers[item._id] = L.marker([lat, lng]).addTo(erMapInstance)
          .bindPopup(`<b>Unit ${item.vehicleNumber}</b><br>${item.patientName} (ETA ${item.etaMinutes}m)`);
      }
    }
  });
}
