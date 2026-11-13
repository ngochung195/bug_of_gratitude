import Phaser from 'phaser';
import { SCENE_KEYS } from '../config/constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload() {
    this.generateProceduralTextures();
  }

  create() {
    this.registerPlayerAnimations();
    this.scene.start(SCENE_KEYS.MENU);
  }

  generateProceduralTextures() {
    // 1. Player Idle Texture (48x48)
    const gIdle = this.make.graphics({ x: 0, y: 0, add: false });
    gIdle.fillStyle(0x1e293b, 1);
    gIdle.fillRoundedRect(12, 16, 24, 24, 4);
    gIdle.lineStyle(2, 0x00e5ff, 1);
    gIdle.strokeRoundedRect(12, 16, 24, 24, 4);
    // Head / Helmet
    gIdle.fillStyle(0x0f172a, 1);
    gIdle.fillRoundedRect(14, 6, 20, 14, 3);
    gIdle.lineStyle(2, 0x8b5cf6, 1);
    gIdle.strokeRoundedRect(14, 6, 20, 14, 3);
    // Visor
    gIdle.fillStyle(0x00e5ff, 1);
    gIdle.fillRect(17, 11, 14, 4);
    // Feet
    gIdle.fillStyle(0x64748b, 1);
    gIdle.fillRect(15, 40, 6, 5);
    gIdle.fillRect(27, 40, 6, 5);
    gIdle.generateTexture('player-idle', 48, 48);
    gIdle.destroy();

    // 2. Player Walk 1 Texture (48x48)
    const gWalk1 = this.make.graphics({ x: 0, y: 0, add: false });
    gWalk1.fillStyle(0x1e293b, 1);
    gWalk1.fillRoundedRect(12, 15, 24, 24, 4);
    gWalk1.lineStyle(2, 0x00e5ff, 1);
    gWalk1.strokeRoundedRect(12, 15, 24, 24, 4);
    gWalk1.fillStyle(0x0f172a, 1);
    gWalk1.fillRoundedRect(14, 5, 20, 14, 3);
    gWalk1.lineStyle(2, 0x8b5cf6, 1);
    gWalk1.strokeRoundedRect(14, 5, 20, 14, 3);
    gWalk1.fillStyle(0x00e5ff, 1);
    gWalk1.fillRect(17, 10, 14, 4);
    gWalk1.fillStyle(0x38bdf8, 1);
    gWalk1.fillRect(14, 39, 6, 6);
    gWalk1.fillRect(28, 37, 6, 4);
    gWalk1.generateTexture('player-walk-1', 48, 48);
    gWalk1.destroy();

    // 3. Player Walk 2 Texture (48x48)
    const gWalk2 = this.make.graphics({ x: 0, y: 0, add: false });
    gWalk2.fillStyle(0x1e293b, 1);
    gWalk2.fillRoundedRect(12, 15, 24, 24, 4);
    gWalk2.lineStyle(2, 0x00e5ff, 1);
    gWalk2.strokeRoundedRect(12, 15, 24, 24, 4);
    gWalk2.fillStyle(0x0f172a, 1);
    gWalk2.fillRoundedRect(14, 5, 20, 14, 3);
    gWalk2.lineStyle(2, 0x8b5cf6, 1);
    gWalk2.strokeRoundedRect(14, 5, 20, 14, 3);
    gWalk2.fillStyle(0x00e5ff, 1);
    gWalk2.fillRect(17, 10, 14, 4);
    gWalk2.fillStyle(0x38bdf8, 1);
    gWalk2.fillRect(14, 37, 6, 4);
    gWalk2.fillRect(28, 39, 6, 6);
    gWalk2.generateTexture('player-walk-2', 48, 48);
    gWalk2.destroy();

    // 4. Workstation Terminal Texture (48x48)
    const gTerm = this.make.graphics({ x: 0, y: 0, add: false });
    gTerm.fillStyle(0x0f172a, 1);
    gTerm.fillRoundedRect(6, 8, 36, 32, 4);
    gTerm.lineStyle(2, 0xffffff, 1);
    gTerm.strokeRoundedRect(6, 8, 36, 32, 4);
    gTerm.fillStyle(0xffffff, 0.85);
    gTerm.fillRect(11, 13, 26, 14);
    gTerm.fillRect(14, 32, 20, 4);
    gTerm.generateTexture('station-terminal', 48, 48);
    gTerm.destroy();

    // 5. NPC Mentor Bot Texture (48x48)
    const gNpc = this.make.graphics({ x: 0, y: 0, add: false });
    gNpc.fillStyle(0x1e1b4b, 1);
    gNpc.fillCircle(24, 24, 18);
    gNpc.lineStyle(2, 0xffffff, 1);
    gNpc.strokeCircle(24, 24, 18);
    gNpc.fillStyle(0xffffff, 1);
    gNpc.fillRect(17, 19, 4, 6);
    gNpc.fillRect(27, 19, 4, 6);
    gNpc.fillRect(18, 29, 12, 3);
    gNpc.generateTexture('npc-mentor', 48, 48);
    gNpc.destroy();
  }

  registerPlayerAnimations() {
    if (!this.anims.exists('player-idle-anim')) {
      this.anims.create({
        key: 'player-idle-anim',
        frames: [{ key: 'player-idle' }],
        frameRate: 2,
        repeat: -1,
      });
    }

    if (!this.anims.exists('player-walk-anim')) {
      this.anims.create({
        key: 'player-walk-anim',
        frames: [{ key: 'player-walk-1' }, { key: 'player-idle' }, { key: 'player-walk-2' }],
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}

export default PreloadScene;
