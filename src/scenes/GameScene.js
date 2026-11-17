import Phaser from 'phaser';
import { EVENTS, SCENE_KEYS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import {
  GRID_SIZE,
  INTERACTABLE_OBJECTS,
  LAB_BOUNDS,
  LAB_OBSTACLES,
  ROOM_DOORS,
  SECTOR_STATUS,
  SECTORS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../data/labEnvironment.js';
import { InputManager } from '../systems/InputManager.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import {
  investigationSystem,
  SECTOR_STATUS_LABELS,
} from '../systems/InvestigationSystem.js';
import { PlayerController } from '../systems/PlayerController.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
    this.playerController = null;
    this.inputManager = null;
    this.interactionSystem = null;
    this.obstaclesGroup = null;
    this.sectorBorders = new Map();
    this.sectorStatusTexts = new Map();
    this.isPaused = false;
    this.isLastBugLocked = false;
    this.unsubscribers = [];
  }

  create() {
    this.isPaused = false;
    this.isLastBugLocked = false;
    this.sectorBorders.clear();
    this.sectorStatusTexts.clear();

    this.physics.world.setBounds(
      LAB_BOUNDS.x,
      LAB_BOUNDS.y,
      LAB_BOUNDS.width,
      LAB_BOUNDS.height
    );

    this.drawHeadquartersFloor();
    this.drawSectorsAndSigns();
    this.drawDoors();
    this.placeOfficialBrandElements();
    this.createObstacles();

    this.interactionSystem = new InteractionSystem(this, INTERACTABLE_OBJECTS);
    this.playerController = new PlayerController(this);
    this.inputManager = new InputManager(this);

    // Camera follows player smoothly within map bounds
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.startFollow(this.playerController.sprite, true, 0.14, 0.14);

    this.physics.add.collider(this.playerController.sprite, this.obstaclesGroup);

    const interactSprites = this.interactionSystem.getStaticSprites();
    interactSprites.forEach((staticSprite) => {
      this.physics.add.collider(this.playerController.sprite, staticSprite);
    });

    if (!this.scene.isActive(SCENE_KEYS.UI)) {
      this.scene.launch(SCENE_KEYS.UI);
    }

    this.registerBusListeners();
    this.syncSectorVisuals();

    const startPos = this.playerController.getPosition();
    investigationSystem.updatePlayerPosition(startPos.x, startPos.y);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanup();
    });
  }

  drawHeadquartersFloor() {
    const graphics = this.add.graphics();
    graphics.setDepth(1);

    // Outer HQ floor surface
    graphics.fillStyle(0x090f21, 0.96);
    graphics.fillRoundedRect(
      LAB_BOUNDS.x - 16,
      LAB_BOUNDS.y - 16,
      LAB_BOUNDS.width + 32,
      LAB_BOUNDS.height + 32,
      10
    );

    // Outer Neon Perimeter Wall
    graphics.lineStyle(3, 0x00e5ff, 0.55);
    graphics.strokeRoundedRect(
      LAB_BOUNDS.x - 16,
      LAB_BOUNDS.y - 16,
      LAB_BOUNDS.width + 32,
      LAB_BOUNDS.height + 32,
      10
    );

    // 48x48 Grid Lines across corridors and rooms
    graphics.lineStyle(1, 0x1e293b, 0.55);
    for (
      let x = LAB_BOUNDS.x;
      x <= LAB_BOUNDS.x + LAB_BOUNDS.width;
      x += GRID_SIZE
    ) {
      graphics.moveTo(x, LAB_BOUNDS.y);
      graphics.lineTo(x, LAB_BOUNDS.y + LAB_BOUNDS.height);
    }
    for (
      let y = LAB_BOUNDS.y;
      y <= LAB_BOUNDS.y + LAB_BOUNDS.height;
      y += GRID_SIZE
    ) {
      graphics.moveTo(LAB_BOUNDS.x, y);
      graphics.lineTo(LAB_BOUNDS.x + LAB_BOUNDS.width, y);
    }
    graphics.strokePath();
  }

  drawSectorsAndSigns() {
    SECTORS.forEach((sec) => {
      const cx = sec.x + sec.width / 2;
      const cy = sec.y + sec.height / 2;

      const floorRect = this.add.rectangle(
        cx,
        cy,
        sec.width,
        sec.height,
        sec.floorColor,
        0.78
      );
      floorRect.setStrokeStyle(2, sec.accentColor, 0.55);
      floorRect.setDepth(1.5);
      this.sectorBorders.set(sec.id, floorRect);

      // Room Name Signboard ("Biển tên phòng")
      this.add
        .text(cx, sec.y + 20, `${sec.name} // ${sec.viName.toUpperCase()}`, {
          fontFamily: 'Press Start 2P, monospace',
          fontSize: '9px',
          color: '#fef3c7',
          backgroundColor: 'rgba(7, 11, 20, 0.88)',
          padding: { x: 8, y: 4 },
        })
        .setOrigin(0.5)
        .setDepth(3);

      const statusBadge = this.add
        .text(cx, sec.y + 40, '', {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '10px',
          color: '#38bdf8',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(3);

      this.sectorStatusTexts.set(sec.id, statusBadge);
    });
  }

  drawDoors() {
    ROOM_DOORS.forEach((door) => {
      const doorPad = this.add.rectangle(
        door.x,
        door.y,
        door.width,
        door.height,
        0x00e5ff,
        0.18
      );
      doorPad.setStrokeStyle(1, 0x38bdf8, 0.65);
      doorPad.setDepth(2);

      this.add
        .text(door.x, door.y, door.label, {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '8px',
          color: '#bae6fd',
        })
        .setOrigin(0.5)
        .setDepth(2.5);
    });
  }

  placeOfficialBrandElements() {
    // Official CodeGym Wordmark in Reception Lobby (Preserving exact 1:1 original aspect ratio)
    if (this.textures.exists('codegym-wordmark')) {
      const receptionBanner = this.add.image(816, 750, 'codegym-wordmark');
      receptionBanner.setDisplaySize(92, 92);
      receptionBanner.setAlpha(0.92);
      receptionBanner.setDepth(2);
    }

    // Official CodeGym Icon at Central Control Mainframe
    if (this.textures.exists('codegym-icon')) {
      const controlEmblem = this.add.image(680, 145, 'codegym-icon');
      controlEmblem.setDisplaySize(44, 44);
      controlEmblem.setAlpha(0.92);
      controlEmblem.setDepth(2.5);
    }
  }

  createObstacles() {
    this.obstaclesGroup = this.physics.add.staticGroup();

    LAB_OBSTACLES.forEach((obs) => {
      const isWall = obs.kind === 'wall';
      const isPillar = obs.kind === 'pillar';

      const fillColor = isWall
        ? 0x1e293b
        : isPillar
          ? 0x282973
          : 0x16213e;
      const strokeColor = isWall
        ? 0x38bdf8
        : isPillar
          ? 0xf59e0b
          : 0x8b5cf6;

      const rect = this.add.rectangle(
        obs.x,
        obs.y,
        obs.width,
        obs.height,
        fillColor,
        0.96
      );
      rect.setStrokeStyle(isWall ? 1.5 : 2, strokeColor, 0.75);
      rect.setDepth(3);

      if (!isWall && obs.label) {
        this.add
          .text(obs.x, obs.y, obs.label, {
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '8px',
            color: '#cbd5e1',
          })
          .setOrigin(0.5)
          .setDepth(4);
      }

      this.physics.add.existing(rect, true);
      this.obstaclesGroup.add(rect);
    });
  }

  syncSectorVisuals() {
    const sectorsWithStatus = investigationSystem.getAllSectorsWithStatus();
    sectorsWithStatus.forEach((sec) => {
      const borderRect = this.sectorBorders.get(sec.id);
      const statusText = this.sectorStatusTexts.get(sec.id);
      const label = SECTOR_STATUS_LABELS[sec.status] || sec.status;

      if (statusText) {
        statusText.setText(`[${label.toUpperCase()}]`);
        if (sec.status === SECTOR_STATUS.RESTORED) {
          statusText.setColor('#10b981');
        } else if (sec.status === SECTOR_STATUS.ANOMALY_DETECTED) {
          statusText.setColor('#f43f5e');
        } else if (sec.status === SECTOR_STATUS.EXPLORED) {
          statusText.setColor('#38bdf8');
        } else {
          statusText.setColor('#94a3b8');
        }
      }

      if (borderRect) {
        if (sec.status === SECTOR_STATUS.RESTORED) {
          borderRect.setStrokeStyle(2.5, 0x10b981, 0.85);
        } else if (sec.status === SECTOR_STATUS.ANOMALY_DETECTED) {
          borderRect.setStrokeStyle(2.5, 0xf43f5e, 0.85);
        } else {
          borderRect.setStrokeStyle(2, sec.accentColor, 0.55);
        }
      }
    });
  }

  playScanPulseEffect(x, y, color = 0x00e5ff) {
    const scanCircle = this.add.circle(x, y, 12, color, 0.25);
    scanCircle.setStrokeStyle(2.5, color, 0.95);
    scanCircle.setDepth(9);

    this.tweens.add({
      targets: scanCircle,
      radius: 115,
      alpha: 0,
      duration: 580,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        scanCircle.destroy();
      },
    });
  }

  registerBusListeners() {
    this.cleanupBusListeners();

    const syncPauseState = (shouldPause) => {
      if (this.isLastBugLocked) return;
      this.isPaused = Boolean(shouldPause);
      if (this.inputManager) {
        this.inputManager.setEnabled(!this.isPaused);
      }
      if (this.isPaused) {
        this.physics.world.pause();
      } else {
        this.physics.world.resume();
      }
    };

    this.unsubscribers.push(
      eventBus.on(EVENTS.SECTOR_STATUS_UPDATED, () => {
        this.syncSectorVisuals();
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.SCAN_PULSE_TRIGGERED, ({ x, y, color }) => {
        this.playScanPulseEffect(x, y, color);
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.ALL_MISSIONS_COMPLETED, () => {
        if (this.isLastBugLocked) return;
        this.isLastBugLocked = true;
        this.isPaused = true;
        if (this.inputManager) {
          this.inputManager.setEnabled(false);
        }
        if (this.playerController && this.playerController.sprite?.body) {
          this.playerController.sprite.body.setVelocity(0, 0);
        }
        this.physics.world.pause();
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.GAME_PAUSE_TOGGLED, ({ paused }) => {
        syncPauseState(paused);
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.MISSION_MODAL_TOGGLED, ({ isOpen }) => {
        syncPauseState(isOpen);
      })
    );

    this.unsubscribers.push(
      eventBus.on(EVENTS.GAME_RESTART_REQUESTED, () => {
        this.isLastBugLocked = false;
        syncPauseState(false);
        investigationSystem.reset();
        if (this.playerController) {
          this.playerController.resetPosition();
          const pos = this.playerController.getPosition();
          investigationSystem.updatePlayerPosition(pos.x, pos.y);
        }
        this.syncSectorVisuals();
      })
    );
  }

  cleanupBusListeners() {
    this.unsubscribers.forEach((unsub) => unsub());
    this.unsubscribers = [];
  }

  cleanup() {
    this.cleanupBusListeners();
    if (this.inputManager) {
      this.inputManager.destroy();
    }
    if (this.interactionSystem) {
      this.interactionSystem.destroy();
    }
    if (this.scene.isActive(SCENE_KEYS.UI)) {
      this.scene.stop(SCENE_KEYS.UI);
    }
  }

  update(_time, delta) {
    if (
      this.isPaused ||
      !this.playerController ||
      !this.inputManager ||
      !this.interactionSystem
    ) {
      return;
    }

    const moveVec = this.inputManager.getMovementVector();
    this.playerController.update(moveVec, delta);

    const pos = this.playerController.getPosition();
    this.interactionSystem.update(pos);
    investigationSystem.updatePlayerPosition(pos.x, pos.y);

    if (this.inputManager.consumeInteractJustPressed()) {
      this.interactionSystem.tryInteract();
    }
  }
}

export default GameScene;
