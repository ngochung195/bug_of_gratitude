import Phaser from 'phaser';
import { EVENTS, SCENE_KEYS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import {
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
import { PixelOfficeRenderer } from '../systems/PixelOfficeRenderer.js';
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

    this.cameras.main.setBackgroundColor('#27272a');

    this.physics.world.setBounds(
      LAB_BOUNDS.x,
      LAB_BOUNDS.y,
      LAB_BOUNDS.width,
      LAB_BOUNDS.height
    );

    // 1. Render Detailed 2.5D Pixel Art Office Floors, Walls, Lamps, Plants & Cables
    const officeRenderer = new PixelOfficeRenderer(this);
    officeRenderer.renderFullOffice(SECTORS, ROOM_DOORS);

    this.drawRoomSigns();
    this.placeOfficialBrandElements();
    this.createPixelArtFurnitureObstacles();

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

  drawRoomSigns() {
    SECTORS.forEach((sec) => {
      const cx = sec.x + sec.width / 2;

      // Room Name Signboard mounted on the North Wall Face
      this.add
        .text(cx, sec.y + 15, `${sec.name} — ${sec.viName}`, {
          fontFamily: 'Be Vietnam Pro, sans-serif',
          fontSize: '11px',
          fontStyle: 'bold',
          color: '#fef3c7',
          backgroundColor: 'rgba(24, 24, 27, 0.85)',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(3.2);

      const statusBadge = this.add
        .text(cx, sec.y + 34, '', {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          fontStyle: 'bold',
          color: '#38bdf8',
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          padding: { x: 6, y: 2 },
        })
        .setOrigin(0.5)
        .setDepth(3.2);

      this.sectorStatusTexts.set(sec.id, statusBadge);
    });
  }

  placeOfficialBrandElements() {
    if (this.textures.exists('codegym-full-slogan')) {
      const receptionBanner = this.add.image(816, 742, 'codegym-full-slogan');
      receptionBanner.setDisplaySize(104, 104);
      receptionBanner.setAlpha(0.96);
      receptionBanner.setDepth(2.5);
    }

    if (this.textures.exists('codegym-icon')) {
      const controlEmblem = this.add.image(690, 145, 'codegym-icon');
      controlEmblem.setDisplaySize(40, 40);
      controlEmblem.setAlpha(0.95);
      controlEmblem.setDepth(3.5);
    }
  }

  /**
   * Renders all walls, desks, bookshelves, and server racks as 2.5D Pixel Art furniture.
   */
  createPixelArtFurnitureObstacles() {
    this.obstaclesGroup = this.physics.add.staticGroup();
    const gFurn = this.add.graphics();
    gFurn.setDepth(3);

    LAB_OBSTACLES.forEach((obs) => {
      // Invisible physics body for collision
      const physRect = this.add.rectangle(
        obs.x,
        obs.y,
        obs.width,
        obs.height,
        0x000000,
        0
      );
      this.physics.add.existing(physRect, true);
      this.obstaclesGroup.add(physRect);

      const left = obs.x - obs.width / 2;
      const top = obs.y - obs.height / 2;
      const w = obs.width;
      const h = obs.height;

      if (obs.kind === 'wall') {
        // 3/4 Interior Wall with White Top Cap & Dark Outline
        gFurn.fillStyle(0x64748b, 1);
        gFurn.fillRect(left, top, w, h);
        gFurn.fillStyle(0xf8fafc, 1);
        gFurn.fillRect(left, top, w, Math.min(8, h));
        gFurn.lineStyle(2, 0x18181b, 1);
        gFurn.strokeRect(left, top, w, h);
      } else if (obs.kind === 'desk') {
        // 2.5D Wooden Office Cubicle Desk + Rolling Chairs + Monitors
        // Cubicle back partition
        gFurn.fillStyle(0xcbd5e1, 1);
        gFurn.fillRect(left, top - 6, w, 6);
        gFurn.lineStyle(1.5, 0x18181b, 1);
        gFurn.strokeRect(left, top - 6, w, 6);

        // Wooden Desk Top (#d4a373) & Front Apron (#9c6644)
        gFurn.fillStyle(0xd4a373, 1);
        gFurn.fillRect(left, top, w, h * 0.65);
        gFurn.fillStyle(0x9c6644, 1);
        gFurn.fillRect(left, top + h * 0.65, w, h * 0.35);
        gFurn.lineStyle(2, 0x18181b, 1);
        gFurn.strokeRect(left, top, w, h);

        // Two Workstations on the Desk (Monitors, Keyboards, Chairs)
        const stations = [left + w * 0.28, left + w * 0.72];
        stations.forEach((sx) => {
          // Swivel Chair below desk
          gFurn.fillStyle(0x334155, 1);
          gFurn.fillRoundedRect(sx - 10, top + h + 2, 20, 12, 4);
          gFurn.lineStyle(1.5, 0x18181b, 1);
          gFurn.strokeRoundedRect(sx - 10, top + h + 2, 20, 12, 4);

          // Blue Monitor
          gFurn.fillStyle(0x1e293b, 1);
          gFurn.fillRect(sx - 11, top + 3, 22, 12);
          gFurn.fillStyle(0x38bdf8, 1);
          gFurn.fillRect(sx - 9, top + 5, 18, 8);
          // Keyboard
          gFurn.fillStyle(0xf8fafc, 1);
          gFurn.fillRect(sx - 7, top + 18, 14, 4);
        });
      } else if (obs.kind === 'cabinet') {
        // 2.5D Tall Wooden Bookshelf / Filing Cabinet with Colorful Books (like bottom-left of reference)
        gFurn.fillStyle(0x7f4f24, 1);
        gFurn.fillRect(left, top, w, h);
        gFurn.lineStyle(2, 0x18181b, 1);
        gFurn.strokeRect(left, top, w, h);

        // 2 Horizontal Shelf Recesses with Colorful Books
        const shelfColors = [0xef4444, 0x3b82f6, 0x22c55e, 0xfacc15, 0xa855f7, 0xf97316];
        [top + 6, top + 22].forEach((sy, sIdx) => {
          gFurn.fillStyle(0x432818, 1);
          gFurn.fillRect(left + 5, sy, w - 10, 11);
          for (let bx = left + 7; bx < left + w - 11; bx += 7) {
            const bookColor = shelfColors[(Math.floor(bx) + sIdx) % shelfColors.length];
            gFurn.fillStyle(bookColor, 1);
            gFurn.fillRect(bx, sy + 2, 5, 9);
          }
        });
      } else if (obs.kind === 'server') {
        // 2.5D Tall Black Server Rack Tower with Blinking Red/Green LEDs (like bottom-right of reference)
        gFurn.fillStyle(0x272a34, 1);
        gFurn.fillRect(left, top, w, h);
        gFurn.lineStyle(2, 0x111318, 1);
        gFurn.strokeRect(left, top, w, h);

        // Server Rack Units
        const bayWidth = (w - 16) / 2;
        [left + 6, left + 10 + bayWidth].forEach((bx) => {
          gFurn.fillStyle(0x16181f, 1);
          gFurn.fillRect(bx, top + 5, bayWidth, h - 10);
          for (let ry = top + 9; ry < top + h - 8; ry += 8) {
            // Red & Green Status LEDs
            gFurn.fillStyle(0xef4444, 1);
            gFurn.fillCircle(bx + 5, ry + 2, 1.8);
            gFurn.fillStyle(0x10b981, 1);
            gFurn.fillCircle(bx + 11, ry + 2, 1.8);
            // Ventilation slot
            gFurn.fillStyle(0x3f3f46, 1);
            gFurn.fillRect(bx + 17, ry + 1, Math.max(8, bayWidth - 22), 3);
          }
        });
      } else if (obs.kind === 'pillar') {
        // 2.5D Architectural Pillar
        gFurn.fillStyle(0x94a3b8, 1);
        gFurn.fillRect(left, top, w, h);
        gFurn.fillStyle(0xf8fafc, 1);
        gFurn.fillRect(left, top, w, 10);
        gFurn.lineStyle(2, 0x18181b, 1);
        gFurn.strokeRect(left, top, w, h);
      }
    });
  }

  syncSectorVisuals() {
    const sectorsWithStatus = investigationSystem.getAllSectorsWithStatus();
    sectorsWithStatus.forEach((sec) => {
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
