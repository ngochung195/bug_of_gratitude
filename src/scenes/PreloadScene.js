import Phaser from 'phaser';
import { APP_CONFIG, SCENE_KEYS } from '../config/constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload() {
    this.load.image('codegym-wordmark', APP_CONFIG.BRAND_LOGOS.WORDMARK);
    this.load.image('codegym-icon', APP_CONFIG.BRAND_LOGOS.ICON);
    this.load.image('codegym-full-slogan', APP_CONFIG.BRAND_LOGOS.FULL_SLOGAN);
    this.generateProceduralTextures();
  }

  create() {
    this.registerPlayerAnimations();
    this.scene.start(SCENE_KEYS.MENU);
  }

  /**
   * Generates cute 2.5D Chibi RPG Pixel Art character & office workstation textures
   * matching the Gather.town / RPG Maker office aesthetic.
   */
  generateProceduralTextures() {
    const drawChibiITFront = (key, stepPhase = 0) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bobY = stepPhase === 0 ? 0 : -1;

      // 1. Cute Chibi Legs & Shoes
      const leftY = stepPhase === 1 ? 37 : stepPhase === 2 ? 40 : 39;
      const rightY = stepPhase === 2 ? 37 : stepPhase === 1 ? 40 : 39;
      g.fillStyle(0x1e293b, 1);
      g.fillRect(17, leftY, 6, 6);
      g.fillRect(25, rightY, 6, 6);
      g.lineStyle(1.5, 0x090d16, 1);
      g.strokeRect(17, leftY, 6, 6);
      g.strokeRect(25, rightY, 6, 6);

      // 2. Compact Chibi Torso (Collared Shirt + CodeGym Lanyard)
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(14, 24 + bobY, 20, 15, 3);
      g.lineStyle(2, 0x18181b, 1);
      g.strokeRoundedRect(14, 24 + bobY, 20, 15, 3);

      // Arms
      const lArmY = stepPhase === 1 ? 26 : stepPhase === 2 ? 24 : 25;
      const rArmY = stepPhase === 2 ? 26 : stepPhase === 1 ? 24 : 25;
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(10, lArmY + bobY, 5, 11, 2);
      g.fillRoundedRect(33, rArmY + bobY, 5, 11, 2);
      g.lineStyle(1.5, 0x18181b, 1);
      g.strokeRoundedRect(10, lArmY + bobY, 5, 11, 2);
      g.strokeRoundedRect(33, rArmY + bobY, 5, 11, 2);
      // Hands
      g.fillStyle(0xfed7aa, 1);
      g.fillCircle(12.5, lArmY + 11 + bobY, 2.5);
      g.fillCircle(35.5, rArmY + 11 + bobY, 2.5);

      // CodeGym Lanyard & Orange/Blue Badge
      g.lineStyle(1.8, 0x282973, 1);
      g.beginPath();
      g.moveTo(20, 24 + bobY);
      g.lineTo(24, 30 + bobY);
      g.lineTo(28, 24 + bobY);
      g.strokePath();
      g.fillStyle(0xf97316, 1);
      g.fillRect(22, 30 + bobY, 4, 5);

      // 3. Big Chibi Head (RPG Maker / Gather style)
      g.fillStyle(0xfed7aa, 1);
      g.fillRoundedRect(12, 6 + bobY, 24, 19, 6);
      g.lineStyle(2, 0x18181b, 1);
      g.strokeRoundedRect(12, 6 + bobY, 24, 19, 6);

      // Styled Hair (Warm Chestnut / Dark Brown with bangs)
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(11, 4 + bobY, 26, 9, 5);
      g.fillRect(11, 9 + bobY, 4, 8);
      g.fillRect(33, 9 + bobY, 4, 8);
      // Bangs detail
      g.fillRect(16, 11 + bobY, 5, 3);
      g.fillRect(25, 11 + bobY, 6, 3);
      g.lineStyle(1.8, 0x18181b, 1);
      g.strokeRoundedRect(11, 4 + bobY, 26, 9, 5);

      // Expressive Chibi Eyes & Glasses
      g.fillStyle(0x18181b, 1);
      g.fillRect(17, 15 + bobY, 3, 4);
      g.fillRect(28, 15 + bobY, 3, 4);
      // Eye shine
      g.fillStyle(0xffffff, 1);
      g.fillRect(17, 15 + bobY, 1.5, 1.5);
      g.fillRect(28, 15 + bobY, 1.5, 1.5);
      // Cheek blush
      g.fillStyle(0xfda4af, 0.7);
      g.fillRect(14, 19 + bobY, 3, 2);
      g.fillRect(31, 19 + bobY, 3, 2);

      g.generateTexture(key, 48, 48);
      g.destroy();
    };

    const drawChibiITBack = (key, stepPhase = 0) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bobY = stepPhase === 0 ? 0 : -1;

      const leftY = stepPhase === 1 ? 37 : stepPhase === 2 ? 40 : 39;
      const rightY = stepPhase === 2 ? 37 : stepPhase === 1 ? 40 : 39;
      g.fillStyle(0x1e293b, 1);
      g.fillRect(17, leftY, 6, 6);
      g.fillRect(25, rightY, 6, 6);
      g.lineStyle(1.5, 0x090d16, 1);
      g.strokeRect(17, leftY, 6, 6);
      g.strokeRect(25, rightY, 6, 6);

      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(14, 24 + bobY, 20, 15, 3);
      g.lineStyle(2, 0x18181b, 1);
      g.strokeRoundedRect(14, 24 + bobY, 20, 15, 3);

      // Back of Chibi Hair
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(11, 4 + bobY, 26, 20, 6);
      g.lineStyle(2, 0x18181b, 1);
      g.strokeRoundedRect(11, 4 + bobY, 26, 20, 6);

      g.generateTexture(key, 48, 48);
      g.destroy();
    };

    const drawChibiITSide = (key, stepPhase = 0) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bobY = stepPhase === 0 ? 0 : -1;

      const fX = stepPhase === 1 ? 24 : stepPhase === 2 ? 17 : 20;
      const bX = stepPhase === 1 ? 17 : stepPhase === 2 ? 24 : 20;
      g.fillStyle(0x1e293b, 1);
      g.fillRect(bX, 38, 6, 6);
      g.fillRect(fX, 39, 6, 6);
      g.lineStyle(1.5, 0x090d16, 1);
      g.strokeRect(fX, 39, 6, 6);

      // Side Torso
      g.fillStyle(0xf8fafc, 1);
      g.fillRoundedRect(16, 24 + bobY, 16, 15, 3);
      g.lineStyle(2, 0x18181b, 1);
      g.strokeRoundedRect(16, 24 + bobY, 16, 15, 3);

      // Side Head
      g.fillStyle(0xfed7aa, 1);
      g.fillRoundedRect(13, 6 + bobY, 22, 19, 6);
      g.lineStyle(2, 0x18181b, 1);
      g.strokeRoundedRect(13, 6 + bobY, 22, 19, 6);

      // Side Hair
      g.fillStyle(0x451a03, 1);
      g.fillRoundedRect(12, 4 + bobY, 23, 9, 5);
      g.fillRect(12, 9 + bobY, 9, 12);
      g.lineStyle(1.8, 0x18181b, 1);
      g.strokeRoundedRect(12, 4 + bobY, 23, 9, 5);

      // Side Eye
      g.fillStyle(0x18181b, 1);
      g.fillRect(29, 15 + bobY, 3, 4);

      // Swinging Arm
      const armX = stepPhase === 1 ? 23 : stepPhase === 2 ? 19 : 21;
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(armX, 26 + bobY, 5, 10, 2);
      g.lineStyle(1.5, 0x18181b, 1);
      g.strokeRoundedRect(armX, 26 + bobY, 5, 10, 2);

      g.generateTexture(key, 48, 48);
      g.destroy();
    };

    drawChibiITFront('player-idle', 0);
    drawChibiITFront('player-walk-1', 1);
    drawChibiITFront('player-walk-2', 2);

    drawChibiITBack('player-idle-up', 0);
    drawChibiITBack('player-walk-up-1', 1);
    drawChibiITBack('player-walk-up-2', 2);

    drawChibiITSide('player-idle-side', 0);
    drawChibiITSide('player-walk-side-1', 1);
    drawChibiITSide('player-walk-side-2', 2);

    // 4. Pixel Art Workstation Desk with Glowing Monitor (`station-terminal` 56x48)
    const gTerm = this.make.graphics({ x: 0, y: 0, add: false });
    // Rolling Chair behind/below desk
    gTerm.fillStyle(0x334155, 1);
    gTerm.fillRoundedRect(18, 34, 20, 12, 4);
    gTerm.lineStyle(1.5, 0x0f172a, 1);
    gTerm.strokeRoundedRect(18, 34, 20, 12, 4);
    // Warm Wooden Desk Top & 3D Front Edge
    gTerm.fillStyle(0x9c6644, 1);
    gTerm.fillRect(4, 24, 48, 12);
    gTerm.fillStyle(0xd4a373, 1);
    gTerm.fillRect(4, 10, 48, 16);
    gTerm.lineStyle(2, 0x1e1b2e, 1);
    gTerm.strokeRect(4, 10, 48, 26);
    // Computer Monitor on Desk
    gTerm.fillStyle(0x1e293b, 1);
    gTerm.fillRect(16, 3, 24, 15);
    gTerm.fillStyle(0x38bdf8, 1);
    gTerm.fillRect(18, 5, 20, 11);
    gTerm.lineStyle(1.5, 0x0f172a, 1);
    gTerm.strokeRect(16, 3, 24, 15);
    // Keyboard & Papers on Desk
    gTerm.fillStyle(0xf8fafc, 1);
    gTerm.fillRect(19, 20, 14, 4);
    gTerm.fillRect(7, 14, 7, 8);
    // Desk Lamp
    gTerm.fillStyle(0xfbbf24, 1);
    gTerm.fillCircle(45, 14, 3.5);
    gTerm.generateTexture('station-terminal', 56, 48);
    gTerm.destroy();

    // 5. Chibi Pixel Art Senior Mentor / Control AI Character (`npc-mentor` 48x48)
    const gNpc = this.make.graphics({ x: 0, y: 0, add: false });
    // Torso (Suit / Teal-Navy Jacket)
    gNpc.fillStyle(0x1e3a8a, 1);
    gNpc.fillRoundedRect(14, 24, 20, 16, 3);
    gNpc.lineStyle(2, 0x18181b, 1);
    gNpc.strokeRoundedRect(14, 24, 20, 16, 3);
    // White collar & tie
    gNpc.fillStyle(0xf8fafc, 1);
    gNpc.fillRect(21, 24, 6, 8);
    gNpc.fillStyle(0xf97316, 1);
    gNpc.fillRect(23, 26, 2, 7);
    // Head
    gNpc.fillStyle(0xfed7aa, 1);
    gNpc.fillRoundedRect(12, 6, 24, 19, 6);
    gNpc.lineStyle(2, 0x18181b, 1);
    gNpc.strokeRoundedRect(12, 6, 24, 19, 6);
    // Teal-slate Hair (matching bottom-right IT character in reference image!)
    gNpc.fillStyle(0x0f766e, 1);
    gNpc.fillRoundedRect(11, 4, 26, 9, 5);
    gNpc.fillRect(11, 9, 4, 8);
    gNpc.fillRect(33, 9, 4, 8);
    gNpc.lineStyle(1.8, 0x18181b, 1);
    gNpc.strokeRoundedRect(11, 4, 26, 9, 5);
    // Eyes
    gNpc.fillStyle(0x18181b, 1);
    gNpc.fillRect(17, 15, 3, 4);
    gNpc.fillRect(28, 15, 3, 4);
    gNpc.generateTexture('npc-mentor', 48, 48);
    gNpc.destroy();

    // 6. Inspectable Office Equipment Texture (`office-prop` 40x40)
    const gProp = this.make.graphics({ x: 0, y: 0, add: false });
    gProp.fillStyle(0xe2e8f0, 1);
    gProp.fillRoundedRect(6, 8, 28, 24, 4);
    gProp.lineStyle(2, 0x1e293b, 1);
    gProp.strokeRoundedRect(6, 8, 28, 24, 4);
    gProp.fillStyle(0x0284c7, 1);
    gProp.fillRect(10, 12, 20, 10);
    gProp.fillStyle(0x10b981, 1);
    gProp.fillCircle(28, 27, 2.5);
    gProp.generateTexture('office-prop', 40, 40);
    gProp.destroy();
  }

  registerPlayerAnimations() {
    const animDefs = [
      { key: 'player-idle-down', frames: [{ key: 'player-idle' }], frameRate: 2 },
      {
        key: 'player-walk-down',
        frames: [{ key: 'player-walk-1' }, { key: 'player-idle' }, { key: 'player-walk-2' }],
        frameRate: 8,
      },
      { key: 'player-idle-up', frames: [{ key: 'player-idle-up' }], frameRate: 2 },
      {
        key: 'player-walk-up',
        frames: [
          { key: 'player-walk-up-1' },
          { key: 'player-idle-up' },
          { key: 'player-walk-up-2' },
        ],
        frameRate: 8,
      },
      { key: 'player-idle-side', frames: [{ key: 'player-idle-side' }], frameRate: 2 },
      {
        key: 'player-walk-side',
        frames: [
          { key: 'player-walk-side-1' },
          { key: 'player-idle-side' },
          { key: 'player-walk-side-2' },
        ],
        frameRate: 8,
      },
      { key: 'player-idle-anim', frames: [{ key: 'player-idle' }], frameRate: 2 },
      {
        key: 'player-walk-anim',
        frames: [{ key: 'player-walk-1' }, { key: 'player-idle' }, { key: 'player-walk-2' }],
        frameRate: 8,
      },
    ];

    animDefs.forEach((def) => {
      if (!this.anims.exists(def.key)) {
        this.anims.create({
          key: def.key,
          frames: def.frames,
          frameRate: def.frameRate,
          repeat: -1,
        });
      }
    });
  }
}

export default PreloadScene;
