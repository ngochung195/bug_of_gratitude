import Phaser from 'phaser';
import gsap from 'gsap';
import { APP_CONFIG, EVENTS } from '../config/constants.js';
import { createPhaserConfig } from '../config/phaserConfig.js';
import { eventBus } from './EventBus.js';
import { sceneManager } from './SceneManager.js';

export class GameManager {
  constructor({ eventBusInstance = eventBus, sceneManagerInstance = sceneManager } = {}) {
    this.eventBus = eventBusInstance;
    this.sceneManager = sceneManagerInstance;
    this.game = null;
    this.isInitialized = false;
  }

  init(scenes = []) {
    if (this.isInitialized) {
      return this.game;
    }

    const config = createPhaserConfig(scenes);
    this.game = new Phaser.Game(config);
    this.sceneManager.bindGame(this.game);
    this.isInitialized = true;

    this.eventBus.emit(EVENTS.APP_READY, {
      title: APP_CONFIG.TITLE,
      version: APP_CONFIG.VERSION,
      phaserVersion: Phaser.VERSION,
      gsapVersion: gsap.version,
    });

    return this.game;
  }

  destroy() {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.isInitialized = false;
    }
  }
}

export const gameManager = new GameManager();
export default GameManager;

