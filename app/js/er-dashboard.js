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
      <div class="bezel-hud-shell">
        <div class="bezel-hud-core p-8 text-center space-y-3">
          <div class="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center justify-center mx-auto shadow-inner">
            <span class="material-symbols-outlined text-2xl">local_shipping</span>
          </div>
          <h4 class="font-display font-bold text-white text-base">No Ambulance En Route Currently</h4>
          <p class="text-xs text-slate-400 font-medium max-w-sm mx-auto">When paramedics trigger an in-transit vitals stream, live telemetry, GPS routing, and trauma bay allocations will appear here instantly.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = '';

  list.forEach(item => {
    const vitals = item.vitals || {};
    const card = document.createElement('div');
    card.className = 'bezel-hud-shell';

    const isCritical = item.triageLevel === 'CRITICAL';
    const triageBadgeClass = isCritical 
      ? 'bg-rose-500 text-white font-extrabold animate-pulse'
      : 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40';

    card.innerHTML = `
      <div class="bezel-hud-core p-5 sm:p-6 space-y-4">
        
        <div class="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div class="flex items-center gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 font-display font-extrabold text-base shadow-md">
              ${item.bloodGroup || 'O+'}
            </div>
            <div>
              <h3 class="font-display font-extrabold text-white text-base flex items-center gap-2">
                ${item.patientName || 'Emergency Patient'}
                <span class="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${triageBadgeClass}">${item.triageLevel || 'CRITICAL'}</span>
              </h3>
              <p class="text-xs text-slate-400 font-medium mt-0.5">
                Unit: <strong class="text-white">${item.vehicleNumber}</strong> • Complaint: <span class="text-rose-300 font-semibold">${item.chiefComplaint || 'Acute Trauma'}</span>
              </p>
            </div>
          </div>

          <div class="text-right">
            <div class="text-[10px] font-extrabold tracking-wider text-slate-400 uppercase">ETA COUNTDOWN</div>
            <div class="text-xl sm:text-2xl font-black text-rose-400 font-mono flex items-center justify-end gap-1 mt-0.5">
              <span class="material-symbols-outlined text-base animate-spin">schedule</span>
              <span>${item.etaMinutes || 8} Mins</span>
            </div>
          </div>
        </div>

        <!-- Severe Allergy Warning Banner -->
        <div class="px-3.5 py-2.5 bg-rose-950/60 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs text-rose-300">
          <span class="flex items-center gap-2 font-bold">
            <span class="material-symbols-outlined text-base text-rose-400">warning</span>
            <span>Critical Allergies: <strong>${item.allergies || 'None Reported'}</strong></span>
          </span>
          <span class="text-[10px] text-slate-400 font-mono">QR ID: ${item.qrCodeId || 'N/A'}</span>
        </div>

        <!-- Live Vitals Telemetry Metrics Grid -->
        <div class="grid grid-cols-4 gap-2.5 bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800/80 text-center font-tabular">
          <div class="space-y-0.5">
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">PULSE (HR)</p>
            <p class="text-base sm:text-lg font-extrabold text-rose-400">${vitals.heartRate ? vitals.heartRate + ' <span class="text-[10px] font-normal text-slate-400">bpm</span>' : '--'}</p>
          </div>
          <div class="space-y-0.5">
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">BLOOD PRESSURE</p>
            <p class="text-base sm:text-lg font-extrabold text-indigo-300">${vitals.bpSystolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic || 80}` : '--'}</p>
          </div>
          <div class="space-y-0.5">
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SpO2</p>
            <p class="text-base sm:text-lg font-extrabold text-emerald-400">${vitals.spO2 ? vitals.spO2 + '%' : '--'}</p>
          </div>
          <div class="space-y-0.5">
            <p class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">GCS SCORE</p>
            <p class="text-base sm:text-lg font-extrabold text-amber-300">${vitals.gcs ? vitals.gcs + '/15' : '--'}</p>
          </div>
        </div>

        <!-- Trauma Bay Reservation Dispatcher -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div class="text-xs text-slate-300 font-medium">
            Assigned Trauma Bay: <strong class="text-white bg-slate-800/90 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">${item.assignedBay || 'PENDING ASSIGNMENT'}</strong>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="reserveTraumaBay('${item._id}', 'Bay 1 - Critical')" class="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-sm">meeting_room</span>
              <span>Reserve Bay 1</span>
            </button>
            <button onclick="reserveTraumaBay('${item._id}', 'Bay 2 - Resuscitation')" class="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-sm">meeting_room</span>
              <span>Reserve Bay 2</span>
            </button>
          </div>
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

  try {
    erMapInstance = L.map('erMap').setView([defaultLat, defaultLng], 12);
    
    // CartoDB Dark Matter tiles for tactical HUD styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap, © CARTO'
    }).addTo(erMapInstance);

    // Hospital ER Marker
    const hospitalIcon = L.divIcon({
      className: 'custom-er-icon',
      html: '<div style="width:32px;height:32px;background:#e11d48;border:2px solid #ffffff;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 0 15px #e11d48;">🏥</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([defaultLat, defaultLng], { icon: hospitalIcon }).addTo(erMapInstance)
      .bindPopup('<b>Central Hospital ER Trauma Center</b><br>37.7749° N, 122.4194° W')
      .openPopup();

    setTimeout(() => {
      if (erMapInstance) erMapInstance.invalidateSize();
    }, 300);
  } catch (e) {
    console.warn('Failed to initialize Leaflet map on ER dashboard:', e);
  }
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
