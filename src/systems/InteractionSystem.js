import Phaser from 'phaser';
import { EVENTS, MISSION_STATUS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { audioManager } from './AudioManager.js';
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

      const textureKey = cfg.type === 'npc' ? 'npc-mentor' : 'station-terminal';
      const sprite = this.scene.physics.add.staticSprite(cfg.x, cfg.y, textureKey);
      sprite.setDepth(4);
      sprite.setTint(cfg.color);

      const codeLabel = this.scene.add
        .text(cfg.x, cfg.y - 36, cfg.code, {
          fontFamily: 'Press Start 2P, monospace',
          fontSize: '9px',
          color: '#f8fafc',
          backgroundColor: 'rgba(11, 16, 33, 0.85)',
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(6);

      const statusLabel = this.scene.add
        .text(cfg.x, cfg.y - 21, '', {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          color: '#94a3b8',
          backgroundColor: 'rgba(7, 11, 20, 0.85)',
          padding: { x: 4, y: 1 },
        })
        .setOrigin(0.5)
        .setDepth(6)
        .setVisible(Boolean(cfg.missionId));

      const promptBadge = this.scene.add
        .text(cfg.x, cfg.y + 34, '[E] INTERACT', {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#070b14',
          backgroundColor: '#00e5ff',
          padding: { x: 6, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(7)
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
      const { missionId } = node.config;
      if (!missionId) return;

      const status = missionManager.getMissionStatus(missionId);
      node.statusLabel.setText(`[${status}]`);

      if (status === MISSION_STATUS.LOCKED) {
        node.statusLabel.setColor('#94a3b8');
        node.sprite.setAlpha(0.5);
        node.promptBadge.setText('[E] LOCKED');
        node.promptBadge.setBackgroundColor('#64748b');
      } else if (status === MISSION_STATUS.COMPLETED) {
        node.statusLabel.setColor('#10b981');
        node.sprite.setAlpha(1);
        node.promptBadge.setText('[E] REVIEW');
        node.promptBadge.setBackgroundColor('#10b981');
      } else {
        node.statusLabel.setColor('#00e5ff');
        node.sprite.setAlpha(1);
        node.promptBadge.setText('[E] DEBUG');
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
        node.baseCircle.setFillStyle(node.config.color, isCurrent ? 0.22 : 0.08);
        node.baseCircle.setStrokeStyle(
          isCurrent ? 2 : 1,
          node.config.color,
          isCurrent ? 0.9 : 0.35
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
