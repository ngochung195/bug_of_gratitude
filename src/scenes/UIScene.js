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
      .text(24, 68, 'SECTOR: RECEPTION // POS X: 816 Y: 860', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: '#94a3b8',
        backgroundColor: 'rgba(7, 11, 20, 0.72)',
        padding: { x: 6, y: 3 },
      })
      .setScrollFactor(0)
      .setDepth(20);

    this.targetText = this.add
      .text(1256, 68, 'SCANNER // STANDBY', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        color: '#38bdf8',
        backgroundColor: 'rgba(7, 11, 20, 0.72)',
        padding: { x: 6, y: 3 },
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(20);

    let currentSectorName = 'RECEPTION';

    this.unsubscribers.push(
      eventBus.on(EVENTS.SECTOR_CHANGED, ({ sector }) => {
        if (sector && sector.name) {
          currentSectorName = sector.name;
        }
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.PLAYER_MOVED, ({ x, y }) => {
        if (this.telemetryText) {
          this.telemetryText.setText(
            `SECTOR: ${currentSectorName} // POS X: ${x} Y: ${y}`
          );
        }
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.INTERACTION_TARGET_CHANGED, ({ target }) => {
        if (!this.targetText) return;
        if (target) {
          this.targetText.setText(`SCAN LOCK // ${target.code}: ${target.name}`);
          this.targetText.setColor('#fbbf24');
        } else {
          this.targetText.setText('SCANNER // STANDBY');
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
