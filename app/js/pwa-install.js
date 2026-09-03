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
      btn.className = 'flex-1 py-2.5 px-3 border-2 border-[#111111] bg-[#111111] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#111111]';
      content.classList.remove('hidden');
    } else {
      btn.className = 'flex-1 py-2.5 px-3 border-2 border-[#111111] bg-white text-[#111111] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-all';
      content.classList.add('hidden');
    }
  });
}

/**
 * Injects the 2-tab App Install Modal into the DOM.
 */
function createAppDownloadModal() {
  const modalHtml = `
    <div id="appDownloadModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div class="relative bg-white text-[#111111] border-2 border-[#111111] max-w-md w-full p-6 shadow-[8px_8px_0px_#111111] flex flex-col gap-5">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-3 border-b-2 border-[#111111]">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 border-2 border-[#111111] bg-[#111111] text-white flex items-center justify-center">
              <span class="material-symbols-outlined text-xl text-[#E11D2E]">download_for_offline</span>
            </div>
            <div>
              <h3 class="font-black text-base uppercase tracking-tight text-[#111111]">Install LifeQR App</h3>
              <p class="text-[11px] font-mono font-bold text-[#E11D2E] uppercase">1-Tap Install &bull; Direct PWA</p>
            </div>
          </div>
          <button onclick="closeAppDownloadModal()" class="w-8 h-8 border-2 border-[#111111] bg-white hover:bg-[#E11D2E] hover:text-white transition flex items-center justify-center">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        <!-- 2-Tab Switcher -->
        <div class="flex gap-2 p-1 bg-[#f9fafb] border-2 border-[#111111]">
          <button id="tab-btn-mobile" onclick="switchPlatformTab('mobile')"
            class="flex-1 py-2.5 px-3 border-2 border-[#111111] bg-[#111111] text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#111111]">
            <span class="material-symbols-outlined text-sm">phone_android</span>
            Mobile (Android / iOS)
          </button>
          <button id="tab-btn-windows" onclick="switchPlatformTab('windows')"
            class="flex-1 py-2.5 px-3 border-2 border-[#111111] bg-white text-[#111111] font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-all">
            <span class="material-symbols-outlined text-sm">laptop_windows</span>
            Desktop (Windows / Mac)
          </button>
        </div>

        <!-- MOBILE TAB (Android + iOS) -->
        <div id="tab-content-mobile" class="flex flex-col gap-4">
          <!-- Install Now CTA Button -->
          <button onclick="triggerAppDownload('mobile')" class="btn-danger w-full py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#111111]">
            <span class="material-symbols-outlined text-base">download</span>
            <span>Install Mobile Web App Now</span>
          </button>

          <!-- Side-by-side instructions -->
          <div class="grid grid-cols-2 gap-3">
            <!-- Android -->
            <div class="bg-[#f9fafb] border-2 border-[#111111] p-3 flex flex-col gap-2">
              <div class="flex items-center gap-1.5 text-[#111111] text-xs font-black uppercase">
                <span class="material-symbols-outlined text-base text-emerald-600">android</span>
                Android
              </div>
              <ol class="text-[11px] text-[#111111]/80 space-y-1 font-sans font-medium list-none">
                <li class="flex gap-1.5"><span class="font-mono font-bold text-[#E11D2E]">1.</span> Tap menu <strong>&vellip;</strong> in Chrome</li>
                <li class="flex gap-1.5"><span class="font-mono font-bold text-[#E11D2E]">2.</span> Tap <strong>"Install app"</strong></li>
                <li class="flex gap-1.5"><span class="font-mono font-bold text-[#E11D2E]">3.</span> Confirm <strong>"Install"</strong></li>
              </ol>
            </div>

            <!-- iOS -->
            <div class="bg-[#f9fafb] border-2 border-[#111111] p-3 flex flex-col gap-2">
              <div class="flex items-center gap-1.5 text-[#111111] text-xs font-black uppercase">
                <span class="material-symbols-outlined text-base text-blue-600">ios</span>
                Apple iOS
              </div>
              <ol class="text-[11px] text-[#111111]/80 space-y-1 font-sans font-medium list-none">
                <li class="flex gap-1.5"><span class="font-mono font-bold text-[#E11D2E]">1.</span> Open in <strong>Safari</strong></li>
                <li class="flex gap-1.5"><span class="font-mono font-bold text-[#E11D2E]">2.</span> Tap <strong>Share &uarr;</strong></li>
                <li class="flex gap-1.5"><span class="font-mono font-bold text-[#E11D2E]">3.</span> Tap <strong>"Add to Home Screen"</strong></li>
              </ol>
            </div>
          </div>
        </div>

        <!-- WINDOWS / DESKTOP TAB -->
        <div id="tab-content-windows" class="flex flex-col gap-4 hidden">
          <!-- Install Now CTA Button -->
          <button onclick="triggerAppDownload('windows')" class="btn-primary w-full py-3.5 px-4 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[4px_4px_0px_#111111]">
            <span class="material-symbols-outlined text-base">desktop_windows</span>
            <span>Install Desktop App Now</span>
          </button>

          <!-- Step-by-step instructions -->
          <div class="bg-[#f9fafb] border-2 border-[#111111] p-4 flex flex-col gap-2.5">
            <div class="text-xs font-black uppercase tracking-tight text-[#111111] flex items-center gap-1.5">
              <span class="material-symbols-outlined text-base text-[#E11D2E]">devices</span>
              Desktop Installation Guide:
            </div>
            <ol class="space-y-2 text-[11px] text-[#111111]/80 font-sans font-medium">
              <li class="flex items-start gap-2">
                <span class="w-4 h-4 border border-[#111111] bg-white text-[#111111] font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                Look for the <strong>Install icon &oplus;</strong> on the right side of the browser URL address bar in Chrome or Edge.
              </li>
              <li class="flex items-start gap-2">
                <span class="w-4 h-4 border border-[#111111] bg-white text-[#111111] font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                Click <strong>"Install"</strong> to add LifeQR to your Start Menu, Taskbar, or Applications.
              </li>
            </ol>
          </div>
        </div>

      </div>
    </div>
  `;

  const container = document.createElement('div');
  container.innerHTML = modalHtml.trim();
  document.body.appendChild(container.firstElementChild);
}
