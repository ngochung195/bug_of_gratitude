import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants.js';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.UI });
  }

  create() {
    // HUD telemetry is rendered cleanly in the HTML GameShell top/bottom bars
    // so no overlapping canvas text blocks the top of the map.
  }
}

export default UIScene;
