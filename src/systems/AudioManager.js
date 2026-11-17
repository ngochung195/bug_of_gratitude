import { EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';

const AUDIO_STORAGE_KEY = 'bog_audio_settings_v1';

export const BGM_TRACKS = {
  opening: '/assets/audio/bgm/opening.mp3',
  'hacker-attack': '/assets/audio/bgm/hacker-attack.mp3',
  exploration: '/assets/audio/bgm/exploration.mp3',
  investigation: '/assets/audio/bgm/investigation.mp3',
  'fix-bug': '/assets/audio/bgm/fix-bug.mp3',
  'final-bug': '/assets/audio/bgm/final-bug.mp3',
  'student-letter': '/assets/audio/bgm/student-letter.mp3',
  'personal-letter': '/assets/audio/bgm/student-letter.mp3',
  'teachers-letter': '/assets/audio/bgm/teachers-letter.mp3',
  'rain-of-gratitude': '/assets/audio/bgm/rain-of-gratitude.mp3',
  'gratitude-sky': '/assets/audio/bgm/gratitude-sky.mp3',
};

function clamp01(val, fallback = 0.8) {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.max(0, Math.min(1, num));
}

export class AudioManager {
  constructor(eventBusInstance = eventBus) {
    this.eventBus = eventBusInstance;

    // Persisted Volume & Mute Settings
    this.masterVolume = 0.8;
    this.musicVolume = 0.65;
    this.sfxVolume = 0.75;
    this.muted = false;
    this.enabled = true;

    this.loadSettings();

    // Web Audio API Context for synthesized SFX
    this.ctx = null;

    // HTML5 Audio BGM State
    this.audioCache = new Map();
    this.currentTrackKey = null;
    this.currentAudio = null;
    this.pendingTrackKey = null;
    this.pendingTrackOptions = null;
    this.fadeTimers = new Map();
    this.userInteracted = false;
    this.lastTypeTickAt = 0;

    // Legacy ambient compatibility state
    this.ambientTimer = null;
    this.ambientActive = false;
    this.ambientMode = 'sky';

    this.setupUnlockListeners();

    this.eventBus.on(EVENTS.SOUND_TOGGLED, ({ enabled }) => {
      const shouldMute = !enabled;
      if (this.muted !== shouldMute) {
        this.setMuted(shouldMute, false);
      }
    });
  }

  loadSettings() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = window.localStorage.getItem(AUDIO_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        this.masterVolume = clamp01(parsed.masterVolume, 0.8);
        this.musicVolume = clamp01(parsed.musicVolume, 0.65);
        this.sfxVolume = clamp01(parsed.sfxVolume, 0.75);
        this.muted = Boolean(parsed.muted);
        this.enabled = !this.muted;
      }
    } catch {
      // Ignore storage errors in restricted environments
    }
  }

  saveSettings() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({
          masterVolume: this.masterVolume,
          musicVolume: this.musicVolume,
          sfxVolume: this.sfxVolume,
          muted: this.muted,
        })
      );
    } catch {
      // Ignore storage errors
    }
  }

  getSettings() {
    return {
      masterVolume: this.masterVolume,
      musicVolume: this.musicVolume,
      sfxVolume: this.sfxVolume,
      muted: this.muted,
      enabled: !this.muted,
    };
  }

  getEffectiveMusicVolume() {
    if (this.muted || !this.enabled) return 0;
    return clamp01(this.masterVolume * this.musicVolume, 0);
  }

  getEffectiveSFXVolume(baseGain = 0.04) {
    if (this.muted || !this.enabled) return 0;
    return Math.max(0, baseGain * this.masterVolume * this.sfxVolume);
  }

  setMasterVolume(value) {
    this.masterVolume = clamp01(value, this.masterVolume);
    this.applyCurrentMusicVolume();
    this.saveSettings();
    return this.masterVolume;
  }

  setMusicVolume(value) {
    this.musicVolume = clamp01(value, this.musicVolume);
    this.applyCurrentMusicVolume();
    this.saveSettings();
    return this.musicVolume;
  }

  setSFXVolume(value) {
    this.sfxVolume = clamp01(value, this.sfxVolume);
    this.saveSettings();
    return this.sfxVolume;
  }

  setMuted(muted, emitEvent = true) {
    this.muted = Boolean(muted);
    this.enabled = !this.muted;
    this.applyCurrentMusicVolume();

    if (!this.muted && this.currentTrackKey && this.currentAudio) {
      if (this.currentAudio.paused) {
        this.currentAudio.play().catch(() => {});
      }
    }

    this.saveSettings();
    if (emitEvent) {
      this.eventBus.emit(EVENTS.SOUND_TOGGLED, {
        enabled: this.enabled,
        muted: this.muted,
      });
    }
    return this.muted;
  }

  toggleMute() {
    this.setMuted(!this.muted, true);
    return this.muted;
  }

  setEnabled(enabled) {
    this.setMuted(!enabled, true);
    return this.enabled;
  }

  toggleEnabled() {
    this.toggleMute();
    return this.enabled;
  }

  applyCurrentMusicVolume() {
    if (!this.currentAudio) return;
    // Clear any active fade on currentAudio so manual slider change takes immediate effect
    this.clearFadeTimer(this.currentAudio);
    try {
      this.currentAudio.volume = this.getEffectiveMusicVolume();
    } catch {
      // Ignore volume assignment errors
    }
  }

  setupUnlockListeners() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.userInteracted = true;
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      if (this.pendingTrackKey && !this.muted) {
        const keyToPlay = this.pendingTrackKey;
        const opts = this.pendingTrackOptions || {};
        this.pendingTrackKey = null;
        this.pendingTrackOptions = null;
        this.playBGM(keyToPlay, opts);
      } else if (this.currentAudio && this.currentAudio.paused && !this.muted) {
        const targetVol = this.getEffectiveMusicVolume();
        this.currentAudio
          .play()
          .then(() => {
            this.fadeIn(this.currentAudio, targetVol, 500);
          })
          .catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  normalizeTrackKey(trackKey) {
    if (!trackKey) return null;
    if (trackKey === 'personal-letter') return 'student-letter';
    return BGM_TRACKS[trackKey] ? trackKey : null;
  }

  getOrCreateAudioElement(trackKey) {
    const normalized = this.normalizeTrackKey(trackKey);
    if (!normalized || typeof window === 'undefined' || typeof Audio === 'undefined') {
      return null;
    }

    if (this.audioCache.has(normalized)) {
      return this.audioCache.get(normalized);
    }

    const src = BGM_TRACKS[normalized];
    if (!src) return null;

    try {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.loop = true;
      audio.volume = 0;

      audio.addEventListener('error', () => {
        console.warn(`[AudioManager] Could not load audio asset: ${src}`);
      });

      this.audioCache.set(normalized, audio);
      return audio;
    } catch {
      return null;
    }
  }

  clearFadeTimer(audioEl) {
    if (!audioEl) return;
    const timer = this.fadeTimers.get(audioEl);
    if (timer) {
      if (typeof window !== 'undefined') {
        window.clearInterval(timer);
      } else {
        clearInterval(timer);
      }
      this.fadeTimers.delete(audioEl);
    }
  }

  fadeIn(audioEl, targetVolume = this.getEffectiveMusicVolume(), durationMs = 600) {
    if (!audioEl) return;
    this.clearFadeTimer(audioEl);

    const safeTarget = clamp01(targetVolume, 0);
    if (durationMs <= 0 || typeof window === 'undefined') {
      try {
        audioEl.volume = safeTarget;
      } catch {
        // Ignore
      }
      return;
    }

    const steps = Math.max(6, Math.floor(durationMs / 35));
    const stepMs = durationMs / steps;
    const startVol = clamp01(audioEl.volume || 0, 0);
    let currentStep = 0;

    const timer = window.setInterval(() => {
      currentStep += 1;
      const ratio = Math.min(1, currentStep / steps);
      // Always respect live volume changes if user adjusts sliders mid-fade
      const liveTarget = Math.min(safeTarget, this.getEffectiveMusicVolume());
      try {
        audioEl.volume = clamp01(startVol + (liveTarget - startVol) * ratio, 0);
      } catch {
        // Ignore
      }
      if (currentStep >= steps) {
        this.clearFadeTimer(audioEl);
      }
    }, stepMs);

    this.fadeTimers.set(audioEl, timer);
  }

  fadeOut(audioEl, durationMs = 450, pauseOnComplete = true, resetTime = false) {
    if (!audioEl) return;
    this.clearFadeTimer(audioEl);

    if (durationMs <= 0 || typeof window === 'undefined') {
      try {
        audioEl.volume = 0;
        if (pauseOnComplete) audioEl.pause();
        if (resetTime) audioEl.currentTime = 0;
      } catch {
        // Ignore
      }
      return;
    }

    const steps = Math.max(5, Math.floor(durationMs / 35));
    const stepMs = durationMs / steps;
    const startVol = clamp01(audioEl.volume || 0, 0);
    let currentStep = 0;

    const timer = window.setInterval(() => {
      currentStep += 1;
      const ratio = Math.min(1, currentStep / steps);
      try {
        audioEl.volume = clamp01(startVol * (1 - ratio), 0);
      } catch {
        // Ignore
      }
      if (currentStep >= steps) {
        this.clearFadeTimer(audioEl);
        try {
          audioEl.volume = 0;
          if (pauseOnComplete) audioEl.pause();
          if (resetTime) audioEl.currentTime = 0;
        } catch {
          // Ignore
        }
      }
    }, stepMs);

    this.fadeTimers.set(audioEl, timer);
  }

  /**
   * Plays a BGM track with smooth fade-in and prevents unintended duplicate/overlapping playback.
   */
  playBGM(trackKey, { loop = true, fadeMs = 600, restart = false } = {}) {
    const normalized = this.normalizeTrackKey(trackKey);
    if (!normalized) return false;

    const nextAudio = this.getOrCreateAudioElement(normalized);
    if (!nextAudio) return false;

    nextAudio.loop = Boolean(loop);

    // If the exact same track is already active, do NOT restart it unless requested
    if (this.currentTrackKey === normalized && this.currentAudio === nextAudio) {
      if (restart) {
        try {
          nextAudio.currentTime = 0;
        } catch {
          // Ignore
        }
      }
      if (!this.muted && nextAudio.paused) {
        nextAudio
          .play()
          .then(() => {
            this.fadeIn(nextAudio, this.getEffectiveMusicVolume(), fadeMs);
          })
          .catch(() => {
            this.pendingTrackKey = normalized;
            this.pendingTrackOptions = { loop, fadeMs, restart: false };
          });
      } else if (!this.muted) {
        this.fadeIn(nextAudio, this.getEffectiveMusicVolume(), Math.min(300, fadeMs));
      }
      return true;
    }

    // Stop or fade out any other playing audio elements so 2 BGMs never overlap unintentionally
    this.audioCache.forEach((audioEl, key) => {
      if (key !== normalized && !audioEl.paused) {
        this.fadeOut(audioEl, Math.min(400, fadeMs), true, false);
      }
    });

    this.currentTrackKey = normalized;
    this.currentAudio = nextAudio;

    if (restart) {
      try {
        nextAudio.currentTime = 0;
      } catch {
        // Ignore
      }
    }

    try {
      nextAudio.volume = 0;
    } catch {
      // Ignore
    }

    const playPromise = nextAudio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          this.pendingTrackKey = null;
          this.pendingTrackOptions = null;
          this.fadeIn(nextAudio, this.getEffectiveMusicVolume(), fadeMs);
        })
        .catch(() => {
          // Browser blocked autoplay prior to user interaction; queue for unlock
          this.pendingTrackKey = normalized;
          this.pendingTrackOptions = { loop, fadeMs, restart };
        });
    }

    return true;
  }

  /**
   * Smoothly crossfades from the currently playing BGM track to `nextTrackKey`.
   */
  crossFade(nextTrackKey, { durationMs = 900, loop = true, restart = false } = {}) {
    const normalized = this.normalizeTrackKey(nextTrackKey);
    if (!normalized) return false;

    if (this.currentTrackKey === normalized && this.currentAudio && !this.currentAudio.paused) {
      return true;
    }

    const prevAudio = this.currentAudio;
    const nextAudio = this.getOrCreateAudioElement(normalized);
    if (!nextAudio) return false;

    nextAudio.loop = Boolean(loop);
    if (restart) {
      try {
        nextAudio.currentTime = 0;
      } catch {
        // Ignore
      }
    }

    if (prevAudio && prevAudio !== nextAudio && !prevAudio.paused) {
      this.fadeOut(prevAudio, durationMs, true, false);
    }

    // Also ensure any other cached audio is silent
    this.audioCache.forEach((audioEl) => {
      if (audioEl !== prevAudio && audioEl !== nextAudio && !audioEl.paused) {
        this.fadeOut(audioEl, Math.min(350, durationMs), true, false);
      }
    });

    this.currentTrackKey = normalized;
    this.currentAudio = nextAudio;

    try {
      nextAudio.volume = 0;
    } catch {
      // Ignore
    }

    const playPromise = nextAudio.play();
    if (playPromise && typeof playPromise.then === 'function') {
      playPromise
        .then(() => {
          this.pendingTrackKey = null;
          this.pendingTrackOptions = null;
          this.fadeIn(nextAudio, this.getEffectiveMusicVolume(), durationMs);
        })
        .catch(() => {
          this.pendingTrackKey = normalized;
          this.pendingTrackOptions = { loop, fadeMs: durationMs, restart };
        });
    }

    return true;
  }

  /**
   * Stops the active BGM with a smooth fade-out.
   */
  stopBGM({ fadeMs = 450, resetTime = false } = {}) {
    this.pendingTrackKey = null;
    this.pendingTrackOptions = null;

    this.audioCache.forEach((audioEl) => {
      if (!audioEl.paused) {
        this.fadeOut(audioEl, fadeMs, true, resetTime);
      }
    });

    this.currentTrackKey = null;
    this.currentAudio = null;
  }

  getContext() {
    if (this.muted || !this.enabled) return null;
    if (typeof window === 'undefined') return null;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone({ freq = 440, duration = 0.08, type = 'square', volume = 0.04 } = {}) {
    const effectiveVol = this.getEffectiveSFXVolume(volume);
    if (effectiveVol <= 0.0001) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(effectiveVol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0005, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio autoplay restriction errors until user interacts
    }
  }

  /**
   * Unified SFX dispatcher supporting named sound effects.
   */
  playSFX(sfxName, options = {}) {
    switch (sfxName) {
      case 'step':
        this.playStep();
        break;
      case 'proximity':
        this.playProximityEnter();
        break;
      case 'interact':
      case 'click':
        this.playInteract();
        break;
      case 'success':
        this.playSuccess();
        break;
      case 'error':
        this.playError();
        break;
      case 'critical-alert':
        this.playCriticalAlert();
        break;
      case 'warm-chime':
        this.playWarmChime();
        break;
      case 'heart':
        this.playHeartReaction();
        break;
      case 'type-blip':
        this.playTypeBlip(options.speaker);
        break;
      case 'key-tick':
        this.playSoftKeyTick();
        break;
      case 'paper-open':
        this.playPaperOpen();
        break;
      case 'closing-chord':
        this.playPianoClosingChord();
        break;
      default:
        this.playInteract();
        break;
    }
  }

  playStep() {
    this.playTone({ freq: 180, duration: 0.035, type: 'triangle', volume: 0.022 });
  }

  playProximityEnter() {
    this.playTone({ freq: 520, duration: 0.06, type: 'sine', volume: 0.032 });
  }

  playInteract() {
    this.playTone({ freq: 660, duration: 0.075, type: 'square', volume: 0.04 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 880, duration: 0.09, type: 'square', volume: 0.04 });
      }, 65);
    }
  }

  playSuccess() {
    this.playTone({ freq: 523.25, duration: 0.09, type: 'triangle', volume: 0.048 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 659.25, duration: 0.09, type: 'triangle', volume: 0.048 });
      }, 85);
      window.setTimeout(() => {
        this.playTone({ freq: 783.99, duration: 0.16, type: 'triangle', volume: 0.052 });
      }, 170);
    }
  }

  playError() {
    this.playTone({ freq: 240, duration: 0.11, type: 'sawtooth', volume: 0.042 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 180, duration: 0.14, type: 'sawtooth', volume: 0.042 });
      }, 95);
    }
  }

  playCriticalAlert() {
    this.playTone({ freq: 196, duration: 0.18, type: 'sawtooth', volume: 0.05 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 146.83, duration: 0.22, type: 'sawtooth', volume: 0.055 });
      }, 200);
      window.setTimeout(() => {
        this.playTone({ freq: 196, duration: 0.18, type: 'sawtooth', volume: 0.05 });
      }, 440);
    }
  }

  playWarmChime() {
    this.playTone({ freq: 440, duration: 0.18, type: 'sine', volume: 0.042 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 554.37, duration: 0.22, type: 'sine', volume: 0.042 });
      }, 140);
      window.setTimeout(() => {
        this.playTone({ freq: 659.25, duration: 0.35, type: 'sine', volume: 0.048 });
      }, 290);
    }
  }

  playHeartReaction() {
    this.playTone({ freq: 587.33, duration: 0.14, type: 'sine', volume: 0.038 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 880, duration: 0.24, type: 'sine', volume: 0.042 });
      }, 90);
    }
  }

  playTypeBlip(speaker = 'SYSTEM') {
    const now = Date.now();
    if (now - this.lastTypeTickAt < 75) return;
    this.lastTypeTickAt = now;

    const freqMap = {
      PLAYER: 540,
      UNKNOWN: 260,
      SYSTEM: 680,
    };
    const freq = freqMap[speaker] || 520;
    this.playTone({
      freq,
      duration: 0.022,
      type: speaker === 'UNKNOWN' ? 'sawtooth' : 'triangle',
      volume: 0.012,
    });
  }

  playSoftKeyTick() {
    const now = Date.now();
    if (now - this.lastTypeTickAt < 85) return;
    this.lastTypeTickAt = now;

    this.playTone({
      freq: 480,
      duration: 0.018,
      type: 'sine',
      volume: 0.006,
    });
  }

  playPaperOpen() {
    this.playTone({ freq: 330, duration: 0.16, type: 'sine', volume: 0.018 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 440, duration: 0.22, type: 'sine', volume: 0.02 });
      }, 95);
    }
  }

  playPianoClosingChord() {
    const chord = [261.63, 329.63, 392.0, 493.88, 587.33];
    chord.forEach((freq, idx) => {
      if (typeof window !== 'undefined') {
        window.setTimeout(() => {
          this.playTone({
            freq,
            duration: 1.1,
            type: 'sine',
            volume: 0.022,
          });
        }, idx * 90);
      } else {
        this.playTone({ freq, duration: 0.8, type: 'sine', volume: 0.02 });
      }
    });
  }

  // Compatibility helpers mapped to real BGM tracks
  startGentlePianoMelody() {
    this.playBGM('teachers-letter', { loop: true, fadeMs: 700 });
  }

  stopGentlePianoMelody() {
    if (this.currentTrackKey === 'teachers-letter') {
      this.stopBGM({ fadeMs: 450 });
    }
  }

  startMysteryAmbient() {
    this.playBGM('opening', { loop: true, fadeMs: 650 });
  }

  stopMysteryAmbient() {
    if (this.currentTrackKey === 'opening' || this.currentTrackKey === 'hacker-attack') {
      this.stopBGM({ fadeMs: 450 });
    }
  }

  startSkyAmbient() {
    this.playBGM('rain-of-gratitude', { loop: true, fadeMs: 750 });
  }

  stopSkyAmbient() {
    if (
      this.currentTrackKey === 'rain-of-gratitude' ||
      this.currentTrackKey === 'gratitude-sky'
    ) {
      this.stopBGM({ fadeMs: 450 });
    }
  }
}

export const audioManager = new AudioManager();
export default AudioManager;
