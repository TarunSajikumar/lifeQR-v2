/**
 * QR Code Scanner Module using Camera, File Upload, and jsQR library
 * Provides camera access, image file QR decoding, and clean modal management.
 */

class QRScanner {
  constructor(options = {}) {
    this.onSuccess = options.onSuccess || (() => {});
    this.onError = options.onError || ((err) => alert(err));
    this.videoStream = null;
    this.isScanning = false;
    this.modal = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.fileInputElement = null;
  }

  createModal() {
    let modal = document.getElementById('qrScannerModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'qrScannerModal';
      modal.className = 'hidden fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4';

      modal.innerHTML = `
        <div class="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
          <!-- Header -->
          <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 text-white flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
                <span class="material-symbols-outlined text-xl">qr_code_scanner</span>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Scan Patient QR Code</h3>
                <p class="text-white/80 text-xs font-medium">Use live camera or upload image</p>
              </div>
            </div>
            <button id="qrModalCloseBtn" class="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <!-- Camera View Area -->
          <div class="relative bg-slate-950 aspect-square overflow-hidden flex items-center justify-center">
            <video 
              id="qrModalVideo" 
              autoplay 
              muted 
              playsinline
              class="w-full h-full object-cover"
            ></video>
            <canvas id="qrModalCanvas" class="hidden"></canvas>

            <!-- Target Frame Overlay -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="relative w-56 h-56 border-2 border-emerald-400/80 rounded-2xl shadow-[0_0_15px_rgba(52,211,153,0.3)]">
                <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl"></div>
                <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl"></div>
                <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl"></div>
                <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl"></div>
              </div>
            </div>

            <!-- Status Indicator -->
            <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-none">
              <div class="flex items-center gap-2 text-white bg-slate-900/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full backdrop-blur text-xs font-semibold shadow-lg">
                <span id="qrStatusDot" class="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
                <span id="qrStatusText">Scanning live camera...</span>
              </div>
            </div>
          </div>

          <!-- File Upload Option & Footer -->
          <div class="p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
            <div class="flex items-center justify-between gap-3">
              <label class="flex-1 cursor-pointer inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition border border-indigo-200 shadow-sm">
                <span class="material-symbols-outlined text-lg">upload_file</span>
                Upload QR Image
                <input type="file" id="qrFileInput" accept="image/*" class="hidden">
              </label>
              <button id="qrModalCancelBtn" class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2.5 px-5 rounded-xl text-xs transition">
                Cancel
              </button>
            </div>
            <p id="qrFileNotice" class="text-[11px] text-slate-500 text-center">
              Tip: If camera is unavailable or black, pick a saved QR photo or screenshot.
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    this.modal = modal;
    this.videoElement = modal.querySelector('#qrModalVideo');
    this.canvasElement = modal.querySelector('#qrModalCanvas');
    this.fileInputElement = modal.querySelector('#qrFileInput');

    // Attach button listeners
    modal.querySelector('#qrModalCloseBtn').onclick = () => this.stop();
    modal.querySelector('#qrModalCancelBtn').onclick = () => this.stop();

    // Attach file input change listener
    this.fileInputElement.onchange = (e) => this.handleFileUpload(e);
  }

  async start() {
    this.createModal();
    this.modal.classList.remove('hidden');

    // Reset status
    const statusText = this.modal.querySelector('#qrStatusText');
    const statusDot = this.modal.querySelector('#qrStatusDot');
    if (statusText && statusDot) {
      statusText.textContent = 'Scanning live camera...';
      statusDot.className = 'w-2 h-2 bg-emerald-400 rounded-full animate-ping';
    }

    try {
      if (!navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('CAMERA_API_NOT_AVAILABLE');
      }

      // Tiered camera constraints fallback
      let stream = null;
      const constraintList = [
        { video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        { video: { facingMode: { ideal: 'environment' } }, audio: false },
        { video: true, audio: false }
      ];

      for (const constraints of constraintList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (e) {
          console.warn('Constraint attempt failed, trying next:', constraints, e);
        }
      }

      if (!stream) {
        throw new Error('Could not access camera feed');
      }

      this.videoStream = stream;
      this.videoElement.srcObject = stream;

      await new Promise((resolve) => {
        if (this.videoElement.readyState >= 2) {
          resolve();
        } else {
          this.videoElement.onloadedmetadata = () => resolve();
          setTimeout(resolve, 1500);
        }
      });

      await this.videoElement.play().catch(e => console.warn('Video play catch:', e));
      this.isScanning = true;
      this.scanFrame();

    } catch (error) {
      console.warn('Camera initialization failed/restricted:', error);
      if (statusText && statusDot) {
        statusText.textContent = 'Camera unavailable - Upload QR image below';
        statusDot.className = 'w-2 h-2 bg-amber-400 rounded-full';
      }
    }
  }

  stop() {
    this.isScanning = false;

    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    if (this.modal) {
      this.modal.classList.add('hidden');
    }
  }

  scanFrame() {
    if (!this.isScanning) return;

    if (!this.videoElement || !this.canvasElement) return;

    const video = this.videoElement;
    const canvas = this.canvasElement;
    const context = canvas.getContext('2d');

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        if (typeof jsQR !== 'undefined') {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code && code.data) {
            console.log('✅ Live QR Code detected:', code.data);
            const qrValue = this.extractQRId(code.data);
            this.stop();
            this.onSuccess(qrValue);
            return;
          }
        }
      } catch (err) {
        console.error('Frame decode error:', err);
      }
    }

    requestAnimationFrame(() => this.scanFrame());
  }

  handleFileUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = this.canvasElement || document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (typeof jsQR === 'undefined') {
          alert('QR decoder library missing.');
          return;
        }

        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (code && code.data) {
          const qrValue = this.extractQRId(code.data);
          this.stop();
          this.onSuccess(qrValue);
        } else {
          alert('No valid QR code found in this image. Please upload a clear QR code image.');
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  extractQRId(qrData) {
    if (qrData.includes('id=')) {
      try {
        const url = new URL(qrData);
        return url.searchParams.get('id');
      } catch (e) {}
    }
    if (qrData.includes('/')) {
      const parts = qrData.split('/');
      return parts[parts.length - 1];
    }
    return qrData;
  }
}

// Global scanner instance and helpers
window.qrScanner = null;

window.initQRScanner = function(onSuccess, onError) {
  window.qrScanner = new QRScanner({ onSuccess, onError });
};

window.startQRScanner = function() {
  if (!window.qrScanner) {
    window.initQRScanner(
      (qrValue) => console.log('Scanned QR:', qrValue),
      (err) => console.error('QR Error:', err)
    );
  }
  window.qrScanner.start();
};

window.stopQRScanner = function() {
  if (window.qrScanner) {
    window.qrScanner.stop();
  }
};
