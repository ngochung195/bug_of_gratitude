import Phaser from 'phaser';
import { EVENTS, SCENE_KEYS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.UI });
    this.telemetryText = null;
    this.targetText = null;
    this.unsubscribers = [];
  }

  create() {
    this.telemetryText = this.add
      .text(110, 74, 'POS // X: 640 Y: 360 | STATE: IDLE', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: '#94a3b8',
      })
      .setDepth(20);

    this.targetText = this.add
      .text(1170, 74, 'SCAN // NO TARGET IN RANGE', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: '#38bdf8',
      })
      .setOrigin(1, 0)
      .setDepth(20);

    this.unsubscribers.push(
      eventBus.on(EVENTS.PLAYER_MOVED, ({ x, y, state }) => {
        if (this.telemetryText) {
          this.telemetryText.setText(
            `POS // X: ${x} Y: ${y} | STATE: ${state.toUpperCase()}`
          );
        }
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.INTERACTION_TARGET_CHANGED, ({ target }) => {
        if (!this.targetText) return;
        if (target) {
          this.targetText.setText(`LOCKED // ${target.code}: ${target.name.toUpperCase()}`);
          this.targetText.setColor('#fbbf24');
        } else {
          this.targetText.setText('SCAN // NO TARGET IN RANGE');
          this.targetText.setColor('#38bdf8');
        }
      })
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribers.forEach((unsub) => unsub());
      this.unsubscribers = [];
    });
  }
}

export default UIScene;

