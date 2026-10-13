/**
 * LifeQR Cinematic Motion Engine — Studio Web Audio SFX & Multi-Language Audio Pipeline
 * Features:
 * - High-Fidelity Decoded Voice Narration (Indian English, Simple Kannada, Simple Hindi)
 * - Piped directly into Web Audio master bus & MediaStreamDestination (guaranteed audio in exported video)
 * - Cinematic procedural sound design (48Hz sub-bass, 120BPM heartbeat pulses, metallic whooshes,
 *   13.56 MHz resonant chimes, ECG monitor beeps, and emergency paramedic sirens)
 * - SpeechSynthesis fallback layer with keep-alive reference
 */

class MotionAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.ambientGain = null;
    this.voiceGain = null;
    this.destNode = null; // MediaRecorder stream destination
    this.isMuted = false;
    this.voiceEnabled = true;
    this.currentLanguage = 'en_in'; // 'en_in', 'kn', 'hi'
    this.audioTone = 'friendly';    // 'friendly', 'emergency', 'cinematic'

    // Audio Buffers Cache
    this.voiceBuffers = {
      en_in: {},
      kn: {},
      hi: {}
    };
    this.activeVoiceSource = null;

    // SpeechSynthesis fallback
    this.speechSynth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.ambientOsc = null;
    this.ambientSub = null;
    this.musicInterval = null;
    this.initialized = false;

    this.initVoices();
  }

  initVoices() {
    if (!this.speechSynth) return;
    const loadVoices = () => {
      try {
        this.voices = this.speechSynth.getVoices() || [];
      } catch (e) {
        this.voices = [];
      }
    };
    if (this.speechSynth.onvoiceschanged !== undefined) {
      this.speechSynth.onvoiceschanged = loadVoices;
    }
    loadVoices();
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    this.stopNarration();
    if (this.speechSynth) {
      try { this.speechSynth.cancel(); } catch (e) {}
    }
    // Preload newly selected language buffers
    if (this.ctx) {
      this.preloadLanguage(lang);
    }
  }

  setAudioTone(tone) {
    this.audioTone = tone;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.92, this.ctx.currentTime);

      this.voiceGain = this.ctx.createGain();
      this.voiceGain.gain.setValueAtTime(1.15, this.ctx.currentTime);
      this.voiceGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.30, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      // Connect to speakers
      this.masterGain.connect(this.ctx.destination);

      // Connect to MediaRecorder stream
      this.destNode = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.destNode);

      this.initialized = true;
      this.startAmbientBed();
      this.startCinematicPulse();

      // Preload current language
      this.preloadLanguage(this.currentLanguage);
      // Background preload other languages
      setTimeout(() => {
        ['en_in', 'kn', 'hi'].forEach(l => {
          if (l !== this.currentLanguage) this.preloadLanguage(l);
        });
      }, 1000);
    }

    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(e => console.log('AudioContext resume deferred:', e));
    }
  }

  getAudioStreamTrack() {
    this.ensureContext();
    return this.destNode ? this.destNode.stream.getAudioTracks()[0] : null;
  }

  // Preload authentic MP3 audio clips for seamless zero-latency playback
  async preloadLanguage(lang) {
    if (!this.ctx) return;
    const basePath = 'cinematic-motion/audio/' + lang;
    for (let i = 1; i <= 9; i++) {
      if (this.voiceBuffers[lang][i]) continue;
      const fileUrl = `${basePath}/plate_${i}.mp3`;
      try {
        const resp = await fetch(fileUrl);
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          const decoded = await this.ctx.decodeAudioData(arrayBuf);
          this.voiceBuffers[lang][i] = decoded;
        }
      } catch (err) {
        // Fetch might fail if running offline without dev server
        console.warn(`Voice buffer preload skipped for ${lang} plate ${i}:`, err.message);
      }
    }
  }

  stopNarration() {
    if (this.activeVoiceSource) {
      try {
        this.activeVoiceSource.stop();
        this.activeVoiceSource.disconnect();
      } catch (e) {}
      this.activeVoiceSource = null;
    }
    if (this.speechSynth) {
      try { this.speechSynth.cancel(); } catch (e) {}
    }
  }

  // Plays authentic native narration clip for plate (1-indexed or 0-indexed)
  async playSceneNarration(plateIndex, lang = this.currentLanguage, fallbackScript = '') {
    if (!this.voiceEnabled || this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    this.stopNarration();

    const plateNum = plateIndex + 1;
    let buffer = this.voiceBuffers[lang] ? this.voiceBuffers[lang][plateNum] : null;

    if (!buffer) {
      // Attempt instant on-demand fetch
      const fileUrl = `cinematic-motion/audio/${lang}/plate_${plateNum}.mp3`;
      try {
        const resp = await fetch(fileUrl);
        if (resp.ok) {
          const arrayBuf = await resp.arrayBuffer();
          buffer = await this.ctx.decodeAudioData(arrayBuf);
          if (!this.voiceBuffers[lang]) this.voiceBuffers[lang] = {};
          this.voiceBuffers[lang][plateNum] = buffer;
        }
      } catch (e) {
        console.warn('Direct fetch error, falling back to speech synthesis:', e);
      }
    }

    if (buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Apply pitch / playbackRate subtle modulation based on tone
        if (this.audioTone === 'emergency') {
          source.playbackRate.setValueAtTime(1.04, this.ctx.currentTime);
        } else if (this.audioTone === 'cinematic') {
          source.playbackRate.setValueAtTime(0.96, this.ctx.currentTime);
        } else {
          source.playbackRate.setValueAtTime(1.00, this.ctx.currentTime);
        }

        source.connect(this.voiceGain);
        source.start(0);
        this.activeVoiceSource = source;
        return;
      } catch (e) {
        console.warn('Error playing audio buffer:', e);
      }
    }

    // Fallback to speech synthesis if buffer is unavailable
    if (fallbackScript) {
      this.speakLine(fallbackScript, lang);
    }
  }

  // Atmospheric cinematic sub-bass bed (48Hz resonant drone + harmonic texture)
  startAmbientBed() {
    if (!this.ctx || this.ambientOsc) return;
    try {
      const t = this.ctx.currentTime;
      this.ambientOsc = this.ctx.createOscillator();
      this.ambientSub = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();

      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.setValueAtTime(48, t); // Deep 48Hz resonant drone

      this.ambientSub.type = 'triangle';
      this.ambientSub.frequency.setValueAtTime(96, t); // Harmonic octave

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, t);

      this.ambientOsc.connect(filter);
      this.ambientSub.connect(filter);
      filter.connect(this.ambientGain);

      this.ambientOsc.start(t);
      this.ambientSub.start(t);
    } catch (e) {
      console.warn("Ambient bed failed to start:", e);
    }
  }

  // Cinematic Trailer Pulse & Rhythmic Score
  startCinematicPulse() {
    if (!this.ctx) return;
    let step = 0;
    const intervalMs = 500; // 120 BPM rhythmic trailer pulse

    if (this.musicInterval) clearInterval(this.musicInterval);

    this.musicInterval = setInterval(() => {
      if (this.isMuted || !this.ctx || this.ctx.state !== 'running') return;
      step++;
      const t = this.ctx.currentTime;

      // Bass heartbeat on beat 1 & 3
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(65, t);
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.18);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(g);
        g.connect(this.musicGain);
        osc.start(t);
        osc.stop(t + 0.25);
      }

      // Metallic high tick on every beat
      if (step % 4 === 1 || step % 4 === 3) {
        const osc2 = this.ctx.createOscillator();
        const g2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1200, t);
        osc2.frequency.exponentialRampToValueAtTime(300, t + 0.05);
        g2.gain.setValueAtTime(0.08, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
        osc2.connect(g2);
        g2.connect(this.musicGain);
        osc2.start(t);
        osc2.stop(t + 0.08);
      }
    }, intervalMs);
  }

  // 1. Sub-Bass Impact Hit (Scene Transitions / Drops)
  playImpact(strength = 1.0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(36, t + 0.45);

    gain.gain.setValueAtTime(0.75 * strength, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.9);
  }

  // 2. Whoosh Transition / Fast Sweep
  playWhoosh(speed = 1.0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const dur = 0.35 / speed;

    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(2800, t + dur * 0.6);
    filter.frequency.exponentialRampToValueAtTime(200, t + dur);
    filter.Q.value = 3.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.35, t + dur * 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + dur);
  }

  // 3. Resonant NFC Contact Chime (13.56 MHz stylized sound)
  playNfcTap() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [1356, 2034, 2712]; // Harmonics derived from 13.56 MHz
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);

      gain.gain.setValueAtTime(0.35 / (idx + 1), t + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.7);
    });
  }

  // 4. Clinical ECG Monitor Beep
  playHeartbeat(rate = 1.0) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t); // 880 Hz standard hospital monitor beep

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // 5. Paramedic Ambulance Siren Burst
  playAmbulanceSiren() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(960, t);
    osc.frequency.setValueAtTime(720, t + 0.25);
    osc.frequency.setValueAtTime(960, t + 0.5);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1600, t);

    gain.gain.setValueAtTime(0.40, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.8);
  }

  // 6. Emergency Allergy Alert Buzzer
  playAllergyAlarm() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.setValueAtTime(220, t + 0.15);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // Fallback Voiceover narrator
  speakLine(text, lang = this.currentLanguage) {
    if (!this.voiceEnabled || this.isMuted || !this.speechSynth) return;
    try {
      this.speechSynth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      window.__activeUtterance = u;

      if (this.audioTone === 'emergency') {
        u.rate = 1.02;
        u.pitch = 1.05;
      } else if (this.audioTone === 'cinematic') {
        u.rate = 0.88;
        u.pitch = 0.92;
      } else {
        u.rate = 0.94;
        u.pitch = 1.0;
      }

      u.volume = 1.0;
      const voiceList = this.voices || [];
      const match = voiceList.find(v => v.lang.startsWith(lang.slice(0, 2)));
      if (match) u.voice = match;

      u.onend = () => { window.__activeUtterance = null; };
      u.onerror = () => { window.__activeUtterance = null; };

      this.speechSynth.speak(u);
    } catch (e) {
      console.warn("Speech fallback error:", e);
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.92, this.ctx.currentTime);
    }
    if (this.isMuted) {
      this.stopNarration();
    }
    return this.isMuted;
  }

  stopAll() {
    this.stopNarration();
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

window.MotionAudioEngine = MotionAudioEngine;
