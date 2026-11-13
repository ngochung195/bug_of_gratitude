import Phaser from 'phaser';
import { APP_CONFIG } from './constants.js';

export function createPhaserConfig(scenes = []) {
  return {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: APP_CONFIG.WIDTH,
    height: APP_CONFIG.HEIGHT,
    backgroundColor: APP_CONFIG.BACKGROUND_COLOR,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: scenes,
  };
}

