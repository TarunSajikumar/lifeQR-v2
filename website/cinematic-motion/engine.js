/**
 * LifeQR Cinematic Motion Engine — Core Studio Renderer & Video Exporter
 * Implements the deterministic 60 FPS Canvas Player, Interactive Studio Controls,
 * Keyboard Shortcuts, and Real-time MediaRecorder 1080p 60fps Video Export.
 */

class MotionEngine {
  constructor(canvasId, containerId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.container = document.getElementById(containerId);

    // Fixed internal resolution: 1920x1080 (Full HD / 60fps)
    this.width = 1920;
    this.height = 1080;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.audio = new MotionAudioEngine();
    this.timeline = new MotionSceneTimeline(this.audio);

    this.currentTime = 0;
    this.isPlaying = false;
    this.playbackRate = 1.0;
    this.fps = 60;
    this.frameDuration = 1 / 60;
    this.lastFrameTimestamp = 0;
    this.loopCurrentPlate = false;
    this.isUiHidden = false;

    // Video Recording State
    this.isRecording = false;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recordStartTime = 0;

    this.initControls();
    this.initKeyboardShortcuts();
    this.fitCanvas();
    window.addEventListener('resize', () => this.fitCanvas());

    // Render initial frame
    this.renderFrame(0, true);
  }

  fitCanvas() {
    if (!this.container) return;
    const cw = this.container.clientWidth;
    const ch = this.container.clientHeight;
    const aspect = 1920 / 1080;

    let targetW = cw;
    let targetH = cw / aspect;

    if (targetH > ch) {
      targetH = ch;
      targetW = ch * aspect;
    }

    this.canvas.style.width = `${targetW}px`;
    this.canvas.style.height = `${targetH}px`;
  }

  initControls() {
    // UI elements
    this.playBtn = document.getElementById('playBtn');
    this.timecodeDisplay = document.getElementById('timecodeDisplay');
    this.scrubber = document.getElementById('timelineScrubber');
    this.plateSelect = document.getElementById('plateSelect');
    this.loopBtn = document.getElementById('loopBtn');
    this.muteBtn = document.getElementById('muteBtn');
    this.exportBtn = document.getElementById('exportBtn');
    this.recordStatus = document.getElementById('recordStatus');

    // Populate plate dropdown
    this.refreshPlateDropdown();

    // Language buttons
    this.langEnBtn = document.getElementById('langEnBtn');
    this.langKnBtn = document.getElementById('langKnBtn');
    this.langHiBtn = document.getElementById('langHiBtn');

    if (this.langEnBtn) this.langEnBtn.addEventListener('click', () => this.setLanguage('en_in'));
    if (this.langKnBtn) this.langKnBtn.addEventListener('click', () => this.setLanguage('kn'));
    if (this.langHiBtn) this.langHiBtn.addEventListener('click', () => this.setLanguage('hi'));

    // Audio tone buttons
    this.toneFriendlyBtn = document.getElementById('toneFriendlyBtn');
    this.toneEmergencyBtn = document.getElementById('toneEmergencyBtn');
    this.toneCinematicBtn = document.getElementById('toneCinematicBtn');

    if (this.toneFriendlyBtn) this.toneFriendlyBtn.addEventListener('click', () => this.setTone('friendly'));
    if (this.toneEmergencyBtn) this.toneEmergencyBtn.addEventListener('click', () => this.setTone('emergency'));
    if (this.toneCinematicBtn) this.toneCinematicBtn.addEventListener('click', () => this.setTone('cinematic'));

    // Test Voice Narration button
    this.testVoiceBtn = document.getElementById('testVoiceBtn');
    if (this.testVoiceBtn) {
      this.testVoiceBtn.addEventListener('click', () => this.testVoice());
    }

    // Render initial multilingual sequence breakdown
    this.renderSequenceBreakdown(this.timeline.currentLanguage);

    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }

    if (this.scrubber) {
      this.scrubber.addEventListener('input', (e) => {
        const ratio = parseFloat(e.target.value) / 1000;
        this.seekTo(ratio * this.timeline.totalDuration);
      });
    }

    if (this.loopBtn) {
      this.loopBtn.addEventListener('click', () => {
        this.loopCurrentPlate = !this.loopCurrentPlate;
        this.loopBtn.classList.toggle('active', this.loopCurrentPlate);
        this.loopBtn.style.color = this.loopCurrentPlate ? '#00f0ff' : '#ffffff';
      });
    }

    if (this.muteBtn) {
      this.muteBtn.addEventListener('click', () => {
        const muted = this.audio.toggleMute();
        this.muteBtn.textContent = muted ? '🔇 MUTED' : '🔊 AUDIO';
        this.muteBtn.classList.toggle('muted', muted);
      });
    }

    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.startExport());
    }
  }

  initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      // Don't capture when typing in text inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.seekTo(this.currentTime - (e.shiftKey ? 5.0 : 1.0));
          break;
        case 'ArrowRight':
          e.preventDefault();
          this.seekTo(this.currentTime + (e.shiftKey ? 5.0 : 1.0));
          break;
        case ',':
          e.preventDefault();
          this.seekTo(this.currentTime - this.frameDuration);
          break;
        case '.':
          e.preventDefault();
          this.seekTo(this.currentTime + this.frameDuration);
          break;
        case '[':
          e.preventDefault();
          this.jumpPlate(-1);
          break;
        case ']':
          e.preventDefault();
          this.jumpPlate(1);
          break;
        case 'l':
        case 'L':
          e.preventDefault();
          this.loopCurrentPlate = !this.loopCurrentPlate;
          if (this.loopBtn) {
            this.loopBtn.classList.toggle('active', this.loopCurrentPlate);
            this.loopBtn.style.color = this.loopCurrentPlate ? '#00f0ff' : '#ffffff';
          }
          break;
        case 'h':
        case 'H':
          e.preventDefault();
          this.toggleUi();
          break;
        case 'e':
        case 'E':
          e.preventDefault();
          this.startExport();
          break;
      }
    });
  }

  refreshPlateDropdown() {
    if (!this.plateSelect) return;
    const currentVal = this.plateSelect.value;
    this.plateSelect.innerHTML = '';
    this.timeline.plates.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `Plate ${idx + 1}: ${p.title} (${p.start.toFixed(1)}s - ${p.end.toFixed(1)}s)`;
      this.plateSelect.appendChild(opt);
    });
    if (currentVal !== undefined && currentVal !== '') {
      this.plateSelect.value = currentVal;
    }
    this.plateSelect.onchange = (e) => {
      const idx = parseInt(e.target.value, 10);
      this.seekTo(this.timeline.plates[idx].start);
    };
  }

  setLanguage(lang) {
    this.timeline.setLanguage(lang);
    this.refreshPlateDropdown();

    // Update active state on language buttons
    const btns = { en_in: this.langEnBtn, kn: this.langKnBtn, hi: this.langHiBtn };
    Object.entries(btns).forEach(([k, btn]) => {
      if (!btn) return;
      if (k === lang) {
        btn.classList.add('active');
        btn.style.borderColor = '#00f0ff';
        btn.style.color = '#00f0ff';
        btn.style.background = 'rgba(0, 240, 255, 0.15)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = '#283144';
        btn.style.color = '#ffffff';
        btn.style.background = '#131722';
      }
    });

    // Re-render current frame with new language
    this.renderFrame(this.currentTime, true);

    // Re-render breakdown cards below canvas into selected language
    this.renderSequenceBreakdown(lang);
  }

  setTone(tone) {
    this.audio.setAudioTone(tone);
    const toneBtns = {
      friendly: this.toneFriendlyBtn,
      emergency: this.toneEmergencyBtn,
      cinematic: this.toneCinematicBtn
    };
    Object.entries(toneBtns).forEach(([k, btn]) => {
      if (!btn) return;
      if (k === tone) {
        btn.classList.add('active');
        btn.style.borderColor = '#00f0ff';
        btn.style.color = '#00f0ff';
        btn.style.background = 'rgba(0, 240, 255, 0.15)';
      } else {
        btn.classList.remove('active');
        btn.style.borderColor = '#283144';
        btn.style.color = '#ffffff';
        btn.style.background = '#131722';
      }
    });
  }

  renderSequenceBreakdown(lang) {
    const grid = document.getElementById('plateCardsGrid');
    const titleEl = document.getElementById('sequenceTitle');
    const descEl = document.getElementById('sequenceDesc');
    const badgeEl = document.getElementById('sequenceBadge');

    if (!grid) return;

    if (lang === 'kn') {
      if (titleEl) titleEl.textContent = '9-ಹಂತಗಳ ವೀಡಿಯೊ ದೃಶ್ಯಾವಳಿ (ಸರಳ ಕನ್ನಡ ಮತ್ತು ಹೈ-ಡೆಫಿನಿಷನ್ ಮೋಷನ್)';
      if (descEl) descEl.textContent = 'ಆಫ್ಟರ್ ಎಫೆಕ್ಟ್ಸ್ ಮಾದರಿಯ ಪ್ರೊಸೀಜರಲ್ ಮೋಷನ್ ಗ್ರಾಫಿಕ್ಸ್ ಮತ್ತು ಸ್ಪಷ್ಟ ಧ್ವನಿ ವಿವರಣೆ.';
      if (badgeEl) badgeEl.textContent = 'ಹೈ-ಡೆಫಿನಿಷನ್ ಮೋಷನ್ ಆಸ್ ಕೋಡ್ // ಸರಳ ಕನ್ನಡ';
    } else if (lang === 'hi') {
      if (titleEl) titleEl.textContent = '9-सीन्स का मोशन सीक्वेंस (सरल हिंदी बातचीत और हाई-डेफ मोशन)';
      if (descEl) descEl.textContent = 'आफ्टर इफेक्ट्स ग्रेड प्रोसीजरल मोशन ग्राफिक्स और आसान वॉयस नरेशन.';
      if (badgeEl) badgeEl.textContent = 'हाई-डेफिनेशन मोशन एज कोड // सरल बातचीत';
    } else {
      if (titleEl) titleEl.textContent = '9-Scene Motion Sequence (Simple Talk & High-Def Graphics)';
      if (descEl) descEl.textContent = 'Clear, easy-to-understand explanations with After Effects-grade procedural motion graphics and multi-language audio narration.';
      if (badgeEl) badgeEl.textContent = 'HIGH-DEFINITION MOTION AS CODE // SIMPLE TALK';
    }

    const plates = this.timeline.getPlates();
    grid.innerHTML = '';

    plates.forEach((p, idx) => {
      const card = document.createElement('div');
      card.className = 'bg-[#121622] border border-[#21293a] rounded-lg p-5 flex flex-col justify-between hover:border-[#00f0ff] transition-all group shadow-lg';
      
      const borderColor = idx % 3 === 0 ? '#E11D2E' : (idx % 3 === 1 ? '#00f0ff' : '#10B981');
      const jumpText = lang === 'kn' ? `▶ ದೃಶ್ಯ ${idx + 1} ಕ್ಕೆ ಜಂಪ್ ಮಾಡಿ (${p.start.toFixed(1)}s)` : (lang === 'hi' ? `▶ सीन ${idx + 1} पर जाएं (${p.start.toFixed(1)}s)` : `▶ Jump to Scene ${idx + 1} (${p.start.toFixed(1)}s)`);

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-mono font-bold" style="color: ${borderColor}">${p.subtitle}</span>
            <span class="text-xs font-mono text-gray-400">${p.start.toFixed(1)}s — ${p.end.toFixed(1)}s</span>
          </div>
          <h3 class="text-lg font-black text-white mb-2">${p.title}</h3>
          <p class="text-xs text-gray-300 leading-relaxed mb-4">
            ${p.script}
          </p>
        </div>
        <button onclick="window.motionPlayer.seekTo(${p.start}); window.motionPlayer.play();" class="studio-btn text-[11px] w-full justify-center">
          ${jumpText}
        </button>
      `;
      grid.appendChild(card);
    });
  }

  testVoice() {
    this.audio.ensureContext();
    this.audio.playNfcTap();
    const { plate, index } = this.timeline.getPlateAt(this.currentTime);
    const lang = this.timeline.currentLanguage;
    this.audio.playSceneNarration(index, lang, plate.script);
  }

  toggleUi() {
    this.isUiHidden = !this.isUiHidden;
    const hud = document.getElementById('studioHudBar');
    if (hud) hud.style.display = this.isUiHidden ? 'none' : 'flex';
  }

  jumpPlate(delta) {
    const { index } = this.timeline.getPlateAt(this.currentTime);
    const targetIdx = Math.max(0, Math.min(this.timeline.plates.length - 1, index + delta));
    this.seekTo(this.timeline.plates[targetIdx].start);
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    this.audio.ensureContext();
    this.isPlaying = true;
    if (this.playBtn) this.playBtn.textContent = '⏸ PAUSE';
    if (this.timeline) this.timeline.lastPlayedIndex = -1;
    this.lastFrameTimestamp = performance.now();
    requestAnimationFrame((ts) => this.tick(ts));
  }

  pause() {
    this.isPlaying = false;
    if (this.playBtn) this.playBtn.textContent = '▶ PLAY';
    this.audio.stopAll();
  }

  seekTo(time) {
    const dur = this.timeline.totalDuration;
    this.currentTime = Math.max(0, Math.min(dur, time));

    // Check plate loop
    if (this.loopCurrentPlate) {
      const { plate } = this.timeline.getPlateAt(this.currentTime);
      if (this.currentTime >= plate.end) {
        this.currentTime = plate.start;
      }
    }

    if (this.isPlaying && this.timeline) {
      this.timeline.lastPlayedIndex = -1;
    }

    this.renderFrame(this.currentTime, true);
    this.updateControls();
  }

  tick(timestamp) {
    if (!this.isPlaying) return;

    const delta = (timestamp - this.lastFrameTimestamp) / 1000;
    this.lastFrameTimestamp = timestamp;

    this.currentTime += delta * this.playbackRate;

    // Check loop or end of timeline
    if (this.loopCurrentPlate) {
      const { plate } = this.timeline.getPlateAt(this.currentTime);
      if (this.currentTime >= plate.end) {
        this.currentTime = plate.start;
      }
    } else if (this.currentTime >= this.timeline.totalDuration) {
      if (this.isRecording) {
        this.stopExport();
        return;
      }
      this.currentTime = 0; // Loop back to frame 0 as specified in the PDF!
    }

    this.renderFrame(this.currentTime, false);
    this.updateControls();

    requestAnimationFrame((ts) => this.tick(ts));
  }

  renderFrame(t, seeked) {
    const f = {
      t: t,
      lt: 0,
      p: 0,
      seeked: seeked
    };
    this.timeline.render(f, this.ctx);
  }

  updateControls() {
    const curMins = Math.floor(this.currentTime / 60).toString().padStart(2, '0');
    const curSecs = (this.currentTime % 60).toFixed(2).padStart(5, '0');
    const totMins = Math.floor(this.timeline.totalDuration / 60).toString().padStart(2, '0');
    const totSecs = (this.timeline.totalDuration % 60).toFixed(2).padStart(5, '0');

    if (this.timecodeDisplay) {
      this.timecodeDisplay.textContent = `${curMins}:${curSecs} / ${totMins}:${totSecs}`;
    }

    if (this.scrubber) {
      this.scrubber.value = (this.currentTime / this.timeline.totalDuration) * 1000;
    }

    if (this.plateSelect) {
      const { index } = this.timeline.getPlateAt(this.currentTime);
      if (this.plateSelect.selectedIndex !== index) {
        this.plateSelect.selectedIndex = index;
      }
    }

    if (this.isRecording && this.recordStatus) {
      const pct = Math.floor((this.currentTime / this.timeline.totalDuration) * 100);
      this.recordStatus.textContent = `🔴 RECORDING 1080P: ${pct}% [${curMins}:${curSecs}]`;
    }
  }

  // High-Quality Video Export Engine via MediaRecorder
  startExport() {
    if (this.isRecording) return;
    this.pause();
    this.audio.ensureContext();

    if (!window.MediaRecorder) {
      alert("MediaRecorder is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }

    try {
      const canvasStream = this.canvas.captureStream(60);
      const audioTrack = this.audio.getAudioStreamTrack();

      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach(track => combinedStream.addTrack(track));
      if (audioTrack) {
        combinedStream.addTrack(audioTrack);
      }

      const mimeOptions = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm'
      ];
      let selectedMime = mimeOptions.find(m => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 12000000 // 12 Mbps ultra-high quality
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecordedFile();
      };

      this.isRecording = true;
      if (this.exportBtn) {
        this.exportBtn.textContent = '⏹ STOP RECORDING';
        this.exportBtn.style.background = '#E11D2E';
      }
      if (this.recordStatus) {
        this.recordStatus.style.display = 'inline-block';
        this.recordStatus.textContent = '🔴 RECORDING 1080P: 0%';
      }

      this.seekTo(0);
      this.mediaRecorder.start(250); // Record chunks every 250ms
      this.play();
    } catch (err) {
      console.error("Export initialization failed:", err);
      alert("Video export initialization error: " + err.message);
    }
  }

  stopExport() {
    if (!this.isRecording) return;
    this.isRecording = false;
    this.pause();

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.exportBtn) {
      this.exportBtn.textContent = '⚡ EXPORT 1080P MP4/WEBM';
      this.exportBtn.style.background = '#10B981';
    }
    if (this.recordStatus) {
      this.recordStatus.textContent = '💾 PACKAGING VIDEO FILE...';
    }
  }

  async stopExportAsync() {
    return new Promise((resolve) => {
      this.isRecording = false;
      this.pause();

      const encodeAndResolve = () => {
        if (!this.recordedChunks || this.recordedChunks.length === 0) {
          console.warn("stopExportAsync: No recorded chunks available.");
          return resolve(null);
        }
        try {
          const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = reader.result ? reader.result.split(',')[1] : null;
            resolve(base64);
          };
          reader.onerror = (err) => {
            console.error("FileReader error:", err);
            resolve(null);
          };
          reader.readAsDataURL(blob);
        } catch (err) {
          console.error("Blob encode error:", err);
          resolve(null);
        }
      };

      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = () => {
          encodeAndResolve();
        };
        this.mediaRecorder.stop();
      } else {
        encodeAndResolve();
      }
    });
  }

  saveRecordedFile() {
    const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    const langSuffix = this.timeline.currentLanguage.toUpperCase();
    a.download = `LifeQR_Project_Plan_Cinematic_${langSuffix}_1080p60.webm`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      if (this.recordStatus) {
        this.recordStatus.textContent = '✓ VIDEO DOWNLOADED SUCCESSFULLY';
        setTimeout(() => { this.recordStatus.style.display = 'none'; }, 4000);
      }
    }, 1000);
  }
}

window.MotionEngine = MotionEngine;
