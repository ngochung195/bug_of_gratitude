import { EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';

const PENTATONIC_FREQS = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];

export class AudioManager {
  constructor(eventBusInstance = eventBus) {
    this.eventBus = eventBusInstance;
    this.enabled = true;
    this.ctx = null;
    this.ambientTimer = null;
    this.ambientActive = false;
    this.ambientNoteIndex = 0;

    this.eventBus.on(EVENTS.SOUND_TOGGLED, ({ enabled }) => {
      this.enabled = Boolean(enabled);
      if (!this.enabled) {
        this.pauseSkyAmbientTimer();
      } else if (this.ambientActive) {
        this.scheduleNextAmbientNote();
      }
    });
  }

  setEnabled(enabled) {
    const next = Boolean(enabled);
    this.enabled = next;
    this.eventBus.emit(EVENTS.SOUND_TOGGLED, { enabled: next });
    return this.enabled;
  }

  toggleEnabled() {
    return this.setEnabled(!this.enabled);
  }

  getContext() {
    if (!this.enabled) return null;
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
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignore audio autoplay restriction errors until user interacts
    }
  }

  playStep() {
    this.playTone({ freq: 180, duration: 0.035, type: 'triangle', volume: 0.025 });
  }

  playProximityEnter() {
    this.playTone({ freq: 520, duration: 0.06, type: 'sine', volume: 0.035 });
  }

  playInteract() {
    this.playTone({ freq: 660, duration: 0.08, type: 'square', volume: 0.045 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 880, duration: 0.1, type: 'square', volume: 0.045 });
      }, 65);
    }
  }

  playSuccess() {
    this.playTone({ freq: 523.25, duration: 0.09, type: 'triangle', volume: 0.05 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 659.25, duration: 0.09, type: 'triangle', volume: 0.05 });
      }, 85);
      window.setTimeout(() => {
        this.playTone({ freq: 783.99, duration: 0.16, type: 'triangle', volume: 0.055 });
      }, 170);
    }
  }

  playError() {
    this.playTone({ freq: 240, duration: 0.11, type: 'sawtooth', volume: 0.045 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 180, duration: 0.14, type: 'sawtooth', volume: 0.045 });
      }, 95);
    }
  }

  playCriticalAlert() {
    this.playTone({ freq: 196, duration: 0.18, type: 'sawtooth', volume: 0.055 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 146.83, duration: 0.22, type: 'sawtooth', volume: 0.06 });
      }, 200);
      window.setTimeout(() => {
        this.playTone({ freq: 196, duration: 0.18, type: 'sawtooth', volume: 0.055 });
      }, 440);
    }
  }

  playWarmChime() {
    this.playTone({ freq: 440, duration: 0.18, type: 'sine', volume: 0.045 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 554.37, duration: 0.22, type: 'sine', volume: 0.045 });
      }, 140);
      window.setTimeout(() => {
        this.playTone({ freq: 659.25, duration: 0.35, type: 'sine', volume: 0.05 });
      }, 290);
    }
  }

  playHeartReaction() {
    this.playTone({ freq: 587.33, duration: 0.14, type: 'sine', volume: 0.04 });
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        this.playTone({ freq: 880, duration: 0.24, type: 'sine', volume: 0.045 });
      }, 90);
    }
  }

  startSkyAmbient() {
    this.ambientActive = true;
    if (!this.enabled) return;
    this.scheduleNextAmbientNote(400);
  }

  scheduleNextAmbientNote(delayMs = 2800) {
    this.pauseSkyAmbientTimer();
    if (!this.ambientActive || !this.enabled || typeof window === 'undefined') {
      return;
    }

    this.ambientTimer = window.setTimeout(() => {
      if (!this.ambientActive || !this.enabled) return;
      if (typeof document !== 'undefined' && document.hidden) {
        this.scheduleNextAmbientNote(3200);
        return;
      }

      const freq =
        PENTATONIC_FREQS[this.ambientNoteIndex % PENTATONIC_FREQS.length];
      this.ambientNoteIndex += 1;

      this.playTone({
        freq,
        duration: 0.85,
        type: 'sine',
        volume: 0.016,
      });

      const nextInterval = 2600 + (this.ambientNoteIndex % 3) * 650;
      this.scheduleNextAmbientNote(nextInterval);
    }, delayMs);
  }

  pauseSkyAmbientTimer() {
    if (this.ambientTimer && typeof window !== 'undefined') {
      window.clearTimeout(this.ambientTimer);
      this.ambientTimer = null;
    }
  }

  stopSkyAmbient() {
    this.ambientActive = false;
    this.pauseSkyAmbientTimer();
  }
}

export const audioManager = new AudioManager();
export default AudioManager;
