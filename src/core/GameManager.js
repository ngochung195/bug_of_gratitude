import gsap from 'gsap';
import Phaser from 'phaser';
import { APP_CONFIG, EVENTS, SCENE_KEYS, UI_SCREENS } from '../config/constants.js';
import { createPhaserConfig } from '../config/phaserConfig.js';
import { BootScene } from '../scenes/BootScene.js';
import { GameScene } from '../scenes/GameScene.js';
import { MenuScene } from '../scenes/MenuScene.js';
import { PreloadScene } from '../scenes/PreloadScene.js';
import { UIScene } from '../scenes/UIScene.js';
import { eventBus } from './EventBus.js';
import { sceneManager } from './SceneManager.js';

const DEFAULT_SCENES = [BootScene, PreloadScene, MenuScene, GameScene, UIScene];

export class GameManager {
  constructor({ eventBusInstance = eventBus, sceneManagerInstance = sceneManager } = {}) {
    this.eventBus = eventBusInstance;
    this.sceneManager = sceneManagerInstance;
    this.game = null;
    this.isInitialized = false;
  }

  init(scenes = DEFAULT_SCENES) {
    if (this.isInitialized) {
      return this.game;
    }

    const config = createPhaserConfig(scenes);
    this.game = new Phaser.Game(config);
    this.sceneManager.bindGame(this.game);
    this.isInitialized = true;

    this.registerScreenTransitions();

    this.eventBus.emit(EVENTS.APP_READY, {
      title: APP_CONFIG.TITLE,
      version: APP_CONFIG.VERSION,
      phaserVersion: Phaser.VERSION,
      gsapVersion: gsap.version,
    });

    return this.game;
  }

  registerScreenTransitions() {
    this.eventBus.on(EVENTS.SCREEN_CHANGE, ({ screenKey }) => {
      if (!this.game || !this.game.scene) return;

      if (screenKey === UI_SCREENS.GAME_SHELL) {
        this.sceneManager.startScene(SCENE_KEYS.GAME);
      } else if (screenKey === UI_SCREENS.INTRO) {
        if (this.game.scene.isActive(SCENE_KEYS.UI)) {
          this.game.scene.stop(SCENE_KEYS.UI);
        }
        this.sceneManager.startScene(SCENE_KEYS.MENU);
      }
    });
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
