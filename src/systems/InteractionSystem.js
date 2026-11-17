import Phaser from 'phaser';
import { EVENTS, MISSION_STATUS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
import { investigationSystem } from './InvestigationSystem.js';
import { missionManager } from './MissionManager.js';

export class InteractionSystem {
  constructor(scene, interactableConfigs = [], eventBusInstance = eventBus) {
    this.scene = scene;
    this.eventBus = eventBusInstance;
    this.nodes = [];
    this.activeTarget = null;
    this.unsubscribers = [];

    this.buildNodes(interactableConfigs);
    this.syncMissionStates();

    this.unsubscribers.push(
      this.eventBus.on(EVENTS.MISSION_UPDATED, () => {
        this.syncMissionStates();
      })
    );
  }

  buildNodes(configs) {
    configs.forEach((cfg) => {
      const baseCircle = this.scene.add.circle(cfg.x, cfg.y, cfg.radius, cfg.color, 0.08);
      baseCircle.setStrokeStyle(1, cfg.color, 0.35);
      baseCircle.setDepth(2);

      const textureKey =
        cfg.type === 'npc'
          ? 'npc-mentor'
          : cfg.type === 'prop'
            ? 'office-prop'
            : 'station-terminal';

      const sprite = this.scene.physics.add.staticSprite(cfg.x, cfg.y, textureKey);
      sprite.setDepth(4);
      sprite.setTint(cfg.color);

      const codeLabel = this.scene.add
        .text(cfg.x, cfg.y - 36, cfg.code, {
          fontFamily: 'Press Start 2P, monospace',
          fontSize: '8px',
          color: '#f8fafc',
          backgroundColor: 'rgba(11, 16, 33, 0.88)',
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(6);

      const statusLabel = this.scene.add
        .text(
          cfg.x,
          cfg.y - 21,
          cfg.objectCategory ? `[${cfg.objectCategory.toUpperCase()}]` : '',
          {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '9px',
            color: '#cbd5e1',
            backgroundColor: 'rgba(7, 11, 20, 0.85)',
            padding: { x: 4, y: 1 },
          }
        )
        .setOrigin(0.5)
        .setDepth(6);

      const promptBadge = this.scene.add
        .text(cfg.x, cfg.y + 32, `[E] ${cfg.name}`, {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          fontStyle: 'bold',
          color: '#070b14',
          backgroundColor: '#00e5ff',
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(8)
        .setVisible(false);

      this.nodes.push({
        config: cfg,
        baseCircle,
        sprite,
        codeLabel,
        statusLabel,
        promptBadge,
      });
    });
  }

  syncMissionStates() {
    this.nodes.forEach((node) => {
      const { missionId, name } = node.config;
      if (!missionId) return;

      const status = missionManager.getMissionStatus(missionId);
      node.statusLabel.setText(`[${status}]`);

      if (status === MISSION_STATUS.LOCKED) {
        node.statusLabel.setColor('#94a3b8');
        node.sprite.setAlpha(0.55);
        node.promptBadge.setText(`[E] KHÓA // ${name}`);
        node.promptBadge.setBackgroundColor('#64748b');
      } else if (status === MISSION_STATUS.COMPLETED) {
        node.statusLabel.setColor('#10b981');
        node.sprite.setAlpha(1);
        node.promptBadge.setText(`[E] ĐÃ KHÔI PHỤC // ${name}`);
        node.promptBadge.setBackgroundColor('#10b981');
      } else {
        node.statusLabel.setColor('#fbbf24');
        node.sprite.setAlpha(1);
        node.promptBadge.setText(`[E] QUÉT & SỬA LỖI // ${name}`);
        node.promptBadge.setBackgroundColor('#00e5ff');
      }
    });
  }

  getStaticSprites() {
    return this.nodes.map((node) => node.sprite);
  }

  update(playerPos) {
    let closestNode = null;
    let minDistance = Infinity;

    this.nodes.forEach((node) => {
      const dist = Phaser.Math.Distance.Between(
        playerPos.x,
        playerPos.y,
        node.config.x,
        node.config.y
      );

      if (dist <= node.config.radius && dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    });

    const nextTarget = closestNode ? closestNode.config : null;
    const prevId = this.activeTarget ? this.activeTarget.id : null;
    const nextId = nextTarget ? nextTarget.id : null;

    if (prevId !== nextId) {
      this.nodes.forEach((node) => {
        const isCurrent = closestNode === node;
        node.promptBadge.setVisible(isCurrent);
        node.baseCircle.setFillStyle(node.config.color, isCurrent ? 0.24 : 0.08);
        node.baseCircle.setStrokeStyle(
          isCurrent ? 2 : 1,
          node.config.color,
          isCurrent ? 0.92 : 0.35
        );
      });

      this.activeTarget = nextTarget;

      if (nextTarget) {
        audioManager.playProximityEnter();
      }

      this.eventBus.emit(EVENTS.INTERACTION_TARGET_CHANGED, {
        target: nextTarget,
      });
    }
  }

  tryInteract() {
    if (!this.activeTarget) {
      return false;
    }

    audioManager.playInteract();
    investigationSystem.markObjectInspected(this.activeTarget);
    this.eventBus.emit(EVENTS.INTERACTION_TRIGGERED, {
      target: this.activeTarget,
    });
    return true;
  }

  destroy() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }
}

export default InteractionSystem;
