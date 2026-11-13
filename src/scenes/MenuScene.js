import Phaser from 'phaser';
import { APP_CONFIG, SCENE_KEYS } from '../config/constants.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.MENU });
  }

  create() {
    this.cameras.main.setBackgroundColor(APP_CONFIG.BACKGROUND_COLOR);

    const grid = this.add.grid(
      APP_CONFIG.WIDTH / 2,
      APP_CONFIG.HEIGHT / 2,
      APP_CONFIG.WIDTH,
      APP_CONFIG.HEIGHT,
      48,
      48,
      0x0b1021,
      0,
      0x1e293b,
      0.35
    );
    grid.setDepth(1);
  }
}

export default MenuScene;

