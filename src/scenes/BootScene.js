import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  create() {
    this.cameras.main.setBackgroundColor('#0B1021');
    this.scene.start(SCENE_KEYS.PRELOAD);
  }
}

export default BootScene;
