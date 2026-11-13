import Phaser from 'phaser';
import { EVENTS, SCENE_KEYS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { INTERACTABLE_OBJECTS, LAB_BOUNDS, LAB_OBSTACLES } from '../data/labEnvironment.js';
import { InputManager } from '../systems/InputManager.js';
import { InteractionSystem } from '../systems/InteractionSystem.js';
import { PlayerController } from '../systems/PlayerController.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.GAME });
    this.playerController = null;
    this.inputManager = null;
    this.interactionSystem = null;
    this.obstaclesGroup = null;
    this.isPaused = false;
    this.unsubscribers = [];
  }

  create() {
    this.isPaused = false;
    this.physics.world.setBounds(
      LAB_BOUNDS.x,
      LAB_BOUNDS.y,
      LAB_BOUNDS.width,
      LAB_BOUNDS.height
    );

    this.drawLabFloor();
    this.createObstacles();

    this.interactionSystem = new InteractionSystem(this, INTERACTABLE_OBJECTS);
    this.playerController = new PlayerController(this);
    this.inputManager = new InputManager(this);

    this.physics.add.collider(this.playerController.sprite, this.obstaclesGroup);

    const interactSprites = this.interactionSystem.getStaticSprites();
    interactSprites.forEach((staticSprite) => {
      this.physics.add.collider(this.playerController.sprite, staticSprite);
    });

    if (!this.scene.isActive(SCENE_KEYS.UI)) {
      this.scene.launch(SCENE_KEYS.UI);
    }

    this.registerBusListeners();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.cleanup();
    });
  }

  drawLabFloor() {
    const graphics = this.add.graphics();
    graphics.setDepth(1);

    // Outer lab floor surface
    graphics.fillStyle(0x0d152c, 0.92);
    graphics.fillRoundedRect(
      LAB_BOUNDS.x - 16,
      LAB_BOUNDS.y - 16,
      LAB_BOUNDS.width + 32,
      LAB_BOUNDS.height + 32,
      8
    );

    // Neon boundary wall
    graphics.lineStyle(2, 0x00e5ff, 0.5);
    graphics.strokeRoundedRect(
      LAB_BOUNDS.x - 16,
      LAB_BOUNDS.y - 16,
      LAB_BOUNDS.width + 32,
      LAB_BOUNDS.height + 32,
      8
    );

    // Grid lines inside playable bounds
    graphics.lineStyle(1, 0x1e293b, 0.7);
    const step = 40;
    for (let x = LAB_BOUNDS.x; x <= LAB_BOUNDS.x + LAB_BOUNDS.width; x += step) {
      graphics.moveTo(x, LAB_BOUNDS.y);
      graphics.lineTo(x, LAB_BOUNDS.y + LAB_BOUNDS.height);
    }
    for (let y = LAB_BOUNDS.y; y <= LAB_BOUNDS.y + LAB_BOUNDS.height; y += step) {
      graphics.moveTo(LAB_BOUNDS.x, y);
      graphics.lineTo(LAB_BOUNDS.x + LAB_BOUNDS.width, y);
    }
    graphics.strokePath();
  }

  createObstacles() {
    this.obstaclesGroup = this.physics.add.staticGroup();

    LAB_OBSTACLES.forEach((obs) => {
      const rect = this.add.rectangle(obs.x, obs.y, obs.width, obs.height, 0x16213e, 0.95);
      rect.setStrokeStyle(2, 0x8b5cf6, 0.7);
      rect.setDepth(3);

      this.add
        .text(obs.x, obs.y, obs.label, {
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          color: '#94a3b8',
        })
        .setOrigin(0.5)
        .setDepth(4);

      this.physics.add.existing(rect, true);
      this.obstaclesGroup.add(rect);
    });
  }

  registerBusListeners() {
    this.cleanupBusListeners();

    const syncPauseState = (shouldPause) => {
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
        syncPauseState(false);
        if (this.playerController) {
          this.playerController.resetPosition();
        }
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
    if (this.isPaused || !this.playerController || !this.inputManager || !this.interactionSystem) {
      return;
    }

    const moveVec = this.inputManager.getMovementVector();
    this.playerController.update(moveVec, delta);

    const pos = this.playerController.getPosition();
    this.interactionSystem.update(pos);

    if (this.inputManager.consumeInteractJustPressed()) {
      this.interactionSystem.tryInteract();
    }
  }
}

export default GameScene;

