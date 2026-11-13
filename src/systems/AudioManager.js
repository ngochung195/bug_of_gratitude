import { EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';

export class AudioManager {
  constructor(eventBusInstance = eventBus) {
    this.eventBus = eventBusInstance;
    this.enabled = true;
    this.ctx = null;

    this.eventBus.on(EVENTS.SOUND_TOGGLED, ({ enabled }) => {
      this.enabled = Boolean(enabled);
    });
  }

  getContext() {
    if (!this.enabled) return null;
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
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

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
    window.setTimeout(() => {
      this.playTone({ freq: 880, duration: 0.1, type: 'square', volume: 0.045 });
    }, 65);
  }
}

export const audioManager = new AudioManager();
export default AudioManager;
