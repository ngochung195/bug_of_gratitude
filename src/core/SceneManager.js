import { EVENTS } from '../config/constants.js';
import { eventBus } from './EventBus.js';

export class SceneManager {
  constructor(eventBusInstance = eventBus) {
    this.eventBus = eventBusInstance;
    this.game = null;
    this.currentSceneKey = null;
  }

  bindGame(gameInstance) {
    this.game = gameInstance;
  }

  startScene(sceneKey, data = {}) {
    if (!this.game || !this.game.scene) {
      console.warn('[SceneManager] Game instance is not bound yet.');
      return;
    }

    if (this.currentSceneKey && this.currentSceneKey !== sceneKey) {
      this.game.scene.stop(this.currentSceneKey);
    }

    this.game.scene.start(sceneKey, data);
    this.currentSceneKey = sceneKey;
    this.eventBus.emit(EVENTS.SCENE_CHANGED, { sceneKey, data });
  }

  getCurrentSceneKey() {
    return this.currentSceneKey;
  }
}

export const sceneManager = new SceneManager();
export default SceneManager;

