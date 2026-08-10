/**
 * LifeQR PWA & App Download Controller
 * Handles 1-click native PWA installation + guided fallback modal for:
 *   - 'mobile'  → Android & iOS (native prompt or Add to Home Screen)
 *   - 'windows' / 'desktop' → Windows / Mac / Linux desktop install
 */

window.deferredPrompt = null;

// Register Service Worker immediately
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker active on scope:', reg.scope);
        // Initialize OneSignal Push Notifications after SW is ready
        initOneSignal();
      })
      .catch(err => console.warn('Service Worker registration warning:', err));
  });
}

/**
 * Initialize OneSignal SDK for System-level Push Notifications
 */
async function initOneSignal() {
  try {
    // 1. Fetch public config from API
    const res = await fetch('/api/v1/config');
    const config = await res.json();

    if (!config.oneSignalAppId) {
      console.log('ℹ️ OneSignal App ID not configured. Push notifications disabled.');
      return;
    }

    // 2. Load OneSignal SDK Dynamically
    if (!window.OneSignal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignal.plugin.js';
      script.async = true;
      document.head.appendChild(script);

      script.onload = () => {
        window.OneSignal = window.OneSignal || [];
        OneSignal.push(function() {
          OneSignal.init({
            appId: config.oneSignalAppId,
            safari_web_id: "web.onesignal.auto.19837f68-963d-4c3e-8c3e-8c3e8c3e8c3e", // Standard placeholder
            notifyButton: {
              enable: true,
              size: 'small',
              theme: 'dark',
              position: 'bottom-left',
              text: {
                'tip.state.unsubscribed': 'Click to receive emergency SOS alerts',
                'tip.state.subscribed': "You're subscribed to SOS alerts",
                'tip.state.blocked': "You've blocked SOS alerts",
                'message.prenotify': 'Click to subscribe to emergency SOS alerts',
                'message.action.subscribed': "Thanks for subscribing!",
                'message.action.resubscribed': "You're back! Ready for emergency alerts.",
                'message.action.unsubscribed': "You won't receive SOS alerts anymore.",
                'dialog.main.title': 'LifeQR Emergency Alerts',
                'dialog.main.button.subscribe': 'SUBSCRIBE',
                'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
                'dialog.blocked.title': 'Unblock SOS Alerts',
                'dialog.blocked.message': "Follow these instructions to allow notifications:"
              }
            },
            allowLocalhostAsSecureOrigin: true,
          });
        });
      };
    }
  } catch (err) {
    console.error('Failed to initialize OneSignal:', err);
  }
}

// Listen for native install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  console.log('✅ LifeQR PWA 1-Click Install Prompt is Ready');

  document.querySelectorAll('.pwa-install-btn').forEach(btn => {
    btn.classList.remove('hidden');
    btn.style.display = 'inline-flex';
  });
});

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  console.log('🎉 LifeQR App installed successfully!');
  alert('🎉 LifeQR has been successfully installed on your device! You can now launch it directly from your Home Screen or App Drawer.');
});

/**
 * Triggers native PWA install prompt, or opens modal for manual guidance.
 * @param {string|null} platform - 'mobile' | 'desktop' | 'windows' | null
 */
async function triggerAppDownload(platform = null) {
  // Normalize platform string
  if (platform === 'desktop') platform = 'windows';
  if (platform === 'android' || platform === 'ios') platform = 'mobile';

  // If native prompt is available (Chrome Android, Edge, Chrome Desktop)
  if (window.deferredPrompt) {
    try {
      console.log('🚀 Triggering native PWA install dialog...');
      window.deferredPrompt.prompt();
      const choiceResult = await window.deferredPrompt.userChoice;
      console.log(`PWA User Choice: ${choiceResult.outcome}`);
      if (choiceResult.outcome === 'accepted') {
        window.deferredPrompt = null;
        return;
      }
    } catch (err) {
      console.warn('Native prompt error, opening fallback modal:', err);
    }
  }

  // Check if iOS Safari
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;

  if (isIOS) {
    openAppDownloadModal('mobile');
    return;
  }

  // If no native prompt was available yet, show the guided modal
  openAppDownloadModal(platform || 'mobile');
}

/**
 * Opens the App Install Modal, focused on the given platform.
 * @param {string|null} platform - 'mobile' | 'windows' | null (auto-detects)
 */
function openAppDownloadModal(platform = null) {
  let modal = document.getElementById('appDownloadModal');
  if (!modal) {
    createAppDownloadModal();
    modal = document.getElementById('appDownloadModal');
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Auto-detect platform if not provided
    if (!platform) {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod|Android/i.test(ua)) platform = 'mobile';
      else platform = 'windows';
    }
    if (platform === 'desktop' || platform === 'windows') platform = 'windows';
    if (platform === 'android' || platform === 'ios') platform = 'mobile';

    switchPlatformTab(platform);
  }
}

/**
 * Closes the modal.
 */
function closeAppDownloadModal() {
  const modal = document.getElementById('appDownloadModal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/**
 * Switches the active platform tab in the modal.
 * @param {string} platform - 'mobile' | 'windows'
 */
function switchPlatformTab(platform) {
  const tabs = ['mobile', 'windows'];
  tabs.forEach(p => {
    const btn = document.getElementById(`tab-btn-${p}`);
    const content = document.getElementById(`tab-content-${p}`);
    if (!btn || !content) return;

    if (p === platform) {
      btn.className = 'flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white shadow-md transition-all ' +
        (p === 'mobile'
          ? 'bg-gradient-to-r from-violet-600 to-indigo-600'
          : 'bg-gradient-to-r from-cyan-700 to-blue-700');
      content.classList.remove('hidden');
    } else {
      btn.className = 'flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 bg-slate-800/80 text-slate-400 border border-slate-700/80 hover:bg-slate-700/80 transition-all';
      content.classList.add('hidden');
    }
  });
}

/**
 * Injects the 2-tab App Install Modal into the DOM.
 */
function createAppDownloadModal() {
  const modalHtml = `
    <div id="appDownloadModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div class="relative bg-gradient-to-br from-slate-900 via-[#0f1128] to-slate-900 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/10 flex flex-col gap-5 overflow-hidden">
        
        <!-- Ambient glow -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -z-0"></div>

        <!-- Header -->
        <div class="relative z-10 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <svg class="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="5" y="2" width="14" height="20" rx="2" stroke-width="2"></rect>
                <line x1="12" y1="18" x2="12" y2="18.01" stroke-width="2" stroke-linecap="round"></line>
              </svg>
            </div>
            <div>
              <h3 class="font-headline font-extrabold text-base text-white">Install LifeQR App</h3>
              <p class="text-[11px] text-slate-400">1-Tap Install — No App Store Needed</p>
            </div>
          </div>
          <button onclick="closeAppDownloadModal()" class="text-slate-500 hover:text-white p-1.5 rounded-full hover:bg-slate-700/80 transition flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- 2-Tab Switcher -->
        <div class="relative z-10 flex gap-2 p-1 bg-slate-950/60 rounded-2xl border border-slate-800/80">
          <button id="tab-btn-mobile" onclick="switchPlatformTab('mobile')"
            class="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 text-white shadow-md transition-all bg-gradient-to-r from-violet-600 to-indigo-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="2" width="14" height="20" rx="2" stroke-width="2"></rect>
              <line x1="12" y1="18" x2="12" y2="18.01" stroke-width="2" stroke-linecap="round"></line>
            </svg>
            Mobile (Android &amp; iOS)
          </button>
          <button id="tab-btn-windows" onclick="switchPlatformTab('windows')"
            class="flex-1 py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 bg-slate-800/80 text-slate-400 border border-slate-700/80 hover:bg-slate-700/80 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21" stroke-width="2"></line>
              <line x1="12" y1="17" x2="12" y2="21" stroke-width="2"></line>
            </svg>
            Windows / Desktop
          </button>
        </div>

        <!-- MOBILE TAB (Android + iOS) -->
        <div id="tab-content-mobile" class="relative z-10 flex flex-col gap-4">
          <!-- Install Now CTA Button -->
          <button onclick="triggerAppDownload('mobile')" class="w-full text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition hover:scale-[1.01] shadow-lg cursor-pointer" style="background: linear-gradient(135deg, #7c3aed, #4f46e5, #2563eb); border: 1px solid rgba(139,92,246,0.4);">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Install LifeQR App Now
          </button>

          <!-- Side-by-side instructions -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Android -->
            <div class="bg-emerald-950/50 border border-emerald-500/25 rounded-xl p-3 flex flex-col gap-2">
              <div class="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.523 15.3414C17.067 15.3414 16.697 14.9714 16.697 14.5154C16.697 14.0594 17.067 13.6894 17.523 13.6894C17.979 13.6894 18.349 14.0594 18.349 14.5154C18.349 14.9714 17.979 15.3414 17.523 15.3414ZM6.477 15.3414C6.021 15.3414 5.651 14.9714 5.651 14.5154C5.651 14.0594 6.021 13.6894 6.477 13.6894C6.933 13.6894 7.303 14.0594 7.303 14.5154C7.303 14.9714 6.933 15.3414 6.477 15.3414ZM17.954 10.0294L19.742 6.9314C19.902 6.6544 19.807 6.3014 19.53 6.1414C19.253 5.9814 18.9 6.0764 18.74 6.3534L16.918 9.5084C15.485 8.8574 13.829 8.4894 12 8.4894C10.171 8.4894 8.515 8.8574 7.082 9.5084L5.26 6.3534C5.1 6.0764 4.747 5.9814 4.47 6.1414C4.193 6.3014 4.098 6.6544 4.258 6.9314L6.046 10.0294C2.753 11.9064 0.547 15.3784 0.5 19.3974H23.5C23.453 15.3784 21.247 11.9064 17.954 10.0294Z"/>
                </svg>
                Android (Chrome)
              </div>
              <ol class="text-[11px] text-slate-300 space-y-1 list-none">
                <li class="flex gap-1.5"><span class="text-emerald-500 font-bold">1.</span> Tap menu <strong>⋮</strong> in Chrome</li>
                <li class="flex gap-1.5"><span class="text-emerald-500 font-bold">2.</span> Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                <li class="flex gap-1.5"><span class="text-emerald-500 font-bold">3.</span> Confirm <strong>"Install"</strong></li>
              </ol>
            </div>

            <!-- iOS -->
            <div class="bg-indigo-950/50 border border-indigo-500/25 rounded-xl p-3 flex flex-col gap-2">
              <div class="flex items-center gap-1.5 text-indigo-300 text-xs font-bold">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.9-1.03 3.12.01.24.02.37.02.93 0 2.06-.58 2.61-1.46z"/>
                </svg>
                iPhone / iPad
              </div>
              <ol class="text-[11px] text-slate-300 space-y-1 list-none">
                <li class="flex gap-1.5"><span class="text-indigo-400 font-bold">1.</span> Open in <strong>Safari</strong></li>
                <li class="flex gap-1.5"><span class="text-indigo-400 font-bold">2.</span> Tap <strong>Share ⎋</strong> at bottom</li>
                <li class="flex gap-1.5"><span class="text-indigo-400 font-bold">3.</span> Tap <strong>"Add to Home Screen" ➕</strong></li>
              </ol>
            </div>
          </div>
        </div>

        <!-- WINDOWS / DESKTOP TAB -->
        <div id="tab-content-windows" class="relative z-10 flex flex-col gap-4 hidden">
          <!-- Install Now CTA Button -->
          <button onclick="triggerAppDownload('windows')" class="w-full text-white font-bold text-sm py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition hover:scale-[1.01] shadow-lg cursor-pointer" style="background: linear-gradient(135deg, #0e7490, #0369a1, #1e40af); border: 1px solid rgba(34,211,238,0.25);">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Install Desktop App Now
          </button>

          <!-- Step-by-step instructions -->
          <div class="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 flex flex-col gap-3">
            <div class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <svg class="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="20" height="14" rx="2" stroke-width="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21" stroke-width="2"></line>
                <line x1="12" y1="17" x2="12" y2="21" stroke-width="2"></line>
              </svg>
              Desktop Installation:
            </div>
            <ol class="space-y-2 text-[11px] text-slate-300">
              <li class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">1</span>
                Look for the <strong>Install icon ⊕</strong> on the right side of the browser URL address bar in Chrome or Edge.
              </li>
              <li class="flex items-start gap-2">
                <span class="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0">2</span>
                Click <strong>"Install"</strong> to add LifeQR to your Start Menu, Taskbar, or Applications.
              </li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
}
