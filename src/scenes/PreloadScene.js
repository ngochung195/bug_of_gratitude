import Phaser from 'phaser';
import { APP_CONFIG, SCENE_KEYS } from '../config/constants.js';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.PRELOAD });
  }

  preload() {
    this.load.image('codegym-wordmark', APP_CONFIG.BRAND_LOGOS.WORDMARK);
    this.load.image('codegym-icon', APP_CONFIG.BRAND_LOGOS.ICON);
    this.generateProceduralTextures();
  }

  create() {
    this.registerPlayerAnimations();
    this.scene.start(SCENE_KEYS.MENU);
  }

  /**
   * Generates consistent Top-down Pixel Art textures for the CodeGym IT Specialist:
   * - Modern office shirt, dark navy trousers, glasses, and CodeGym lanyard/ID badge.
   * - Supports Down (Front), Up (Back), and Side (Left/Right) directions for Idle & Walk.
   */
  generateProceduralTextures() {
    const drawITSpecialistFront = (key, stepPhase = 0) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bobY = stepPhase === 0 ? 0 : -1;

      // Legs / Office Trousers
      const leftLegY = stepPhase === 1 ? 36 : stepPhase === 2 ? 39 : 38;
      const rightLegY = stepPhase === 2 ? 36 : stepPhase === 1 ? 39 : 38;
      g.fillStyle(0x0f172a, 1);
      g.fillRect(16, leftLegY, 6, 7);
      g.fillRect(26, rightLegY, 6, 7);
      // Shoes
      g.fillStyle(0x334155, 1);
      g.fillRect(15, leftLegY + 5, 7, 3);
      g.fillRect(26, rightLegY + 5, 7, 3);

      // Torso: Modern Collared Office Shirt
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(13, 20 + bobY, 22, 18, 3);
      g.lineStyle(1.5, 0x475569, 1);
      g.strokeRoundedRect(13, 20 + bobY, 22, 18, 3);

      // Arms
      const leftArmY = stepPhase === 1 ? 22 : stepPhase === 2 ? 20 : 21;
      const rightArmY = stepPhase === 2 ? 22 : stepPhase === 1 ? 20 : 21;
      g.fillStyle(0xcbd5e1, 1);
      g.fillRect(9, leftArmY + bobY, 4, 13);
      g.fillRect(35, rightArmY + bobY, 4, 13);
      // Hands
      g.fillStyle(0xfde68a, 1);
      g.fillRect(9, leftArmY + 12 + bobY, 4, 3);
      g.fillRect(35, rightArmY + 12 + bobY, 4, 3);

      // CodeGym Lanyard & ID Badge on Chest (#282973 & Orange #f97316)
      g.lineStyle(2, 0x282973, 1);
      g.beginPath();
      g.moveTo(19, 20 + bobY);
      g.lineTo(24, 28 + bobY);
      g.lineTo(29, 20 + bobY);
      g.strokePath();
      g.fillStyle(0x282973, 1);
      g.fillRect(21, 28 + bobY, 6, 7);
      g.fillStyle(0xf97316, 1);
      g.fillRect(22, 31 + bobY, 4, 2);

      // Head & Face
      g.fillStyle(0xfde68a, 1);
      g.fillRoundedRect(15, 7 + bobY, 18, 14, 3);
      // Hair (Dark Slate)
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(14, 5 + bobY, 20, 6, 2);
      g.fillRect(14, 8 + bobY, 3, 5);
      g.fillRect(31, 8 + bobY, 3, 5);

      // IT Specialist Glasses (Cyan Rim)
      g.fillStyle(0x0f172a, 1);
      g.fillRect(17, 12 + bobY, 6, 4);
      g.fillRect(25, 12 + bobY, 6, 4);
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(18, 13 + bobY, 4, 2);
      g.fillRect(26, 13 + bobY, 4, 2);

      g.generateTexture(key, 48, 48);
      g.destroy();
    };

    const drawITSpecialistBack = (key, stepPhase = 0) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bobY = stepPhase === 0 ? 0 : -1;

      const leftLegY = stepPhase === 1 ? 36 : stepPhase === 2 ? 39 : 38;
      const rightLegY = stepPhase === 2 ? 36 : stepPhase === 1 ? 39 : 38;
      g.fillStyle(0x0f172a, 1);
      g.fillRect(16, leftLegY, 6, 7);
      g.fillRect(26, rightLegY, 6, 7);
      g.fillStyle(0x334155, 1);
      g.fillRect(15, leftLegY + 5, 7, 3);
      g.fillRect(26, rightLegY + 5, 7, 3);

      // Back of Office Shirt
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(13, 20 + bobY, 22, 18, 3);
      g.lineStyle(1.5, 0x475569, 1);
      g.strokeRoundedRect(13, 20 + bobY, 22, 18, 3);

      // Lanyard Strap around Collar
      g.fillStyle(0x282973, 1);
      g.fillRect(18, 20 + bobY, 12, 2);

      // Arms
      const leftArmY = stepPhase === 1 ? 22 : stepPhase === 2 ? 20 : 21;
      const rightArmY = stepPhase === 2 ? 22 : stepPhase === 1 ? 20 : 21;
      g.fillStyle(0xcbd5e1, 1);
      g.fillRect(9, leftArmY + bobY, 4, 13);
      g.fillRect(35, rightArmY + bobY, 4, 13);

      // Back of Head & Hair
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(14, 5 + bobY, 20, 15, 3);

      g.generateTexture(key, 48, 48);
      g.destroy();
    };

    const drawITSpecialistSide = (key, stepPhase = 0) => {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const bobY = stepPhase === 0 ? 0 : -1;

      const frontLegX = stepPhase === 1 ? 23 : stepPhase === 2 ? 17 : 20;
      const backLegX = stepPhase === 1 ? 17 : stepPhase === 2 ? 23 : 20;
      g.fillStyle(0x0f172a, 1);
      g.fillRect(backLegX, 37, 6, 8);
      g.fillRect(frontLegX, 38, 6, 8);
      g.fillStyle(0x334155, 1);
      g.fillRect(frontLegX, 43, 8, 3);

      // Side Torso
      g.fillStyle(0xe2e8f0, 1);
      g.fillRoundedRect(16, 20 + bobY, 16, 18, 3);
      g.lineStyle(1.5, 0x475569, 1);
      g.strokeRoundedRect(16, 20 + bobY, 16, 18, 3);

      // Side Lanyard & Badge
      g.fillStyle(0x282973, 1);
      g.fillRect(27, 26 + bobY, 4, 6);
      g.fillStyle(0xf97316, 1);
      g.fillRect(28, 29 + bobY, 3, 2);

      // Side Arm
      const armOffset = stepPhase === 1 ? 2 : stepPhase === 2 ? -2 : 0;
      g.fillStyle(0xcbd5e1, 1);
      g.fillRect(21 + armOffset, 22 + bobY, 5, 13);
      g.fillStyle(0xfde68a, 1);
      g.fillRect(21 + armOffset, 34 + bobY, 5, 3);

      // Side Head & Glasses
      g.fillStyle(0xfde68a, 1);
      g.fillRoundedRect(16, 7 + bobY, 16, 14, 3);
      g.fillStyle(0x1e293b, 1);
      g.fillRoundedRect(15, 5 + bobY, 17, 7, 2);
      g.fillRect(15, 9 + bobY, 6, 9);
      // Glasses on right side (facing right by default)
      g.fillStyle(0x38bdf8, 1);
      g.fillRect(27, 12 + bobY, 5, 3);

      g.generateTexture(key, 48, 48);
      g.destroy();
    };

    // Generate all directional frames
    drawITSpecialistFront('player-idle', 0);
    drawITSpecialistFront('player-walk-1', 1);
    drawITSpecialistFront('player-walk-2', 2);

    drawITSpecialistBack('player-idle-up', 0);
    drawITSpecialistBack('player-walk-up-1', 1);
    drawITSpecialistBack('player-walk-up-2', 2);

    drawITSpecialistSide('player-idle-side', 0);
    drawITSpecialistSide('player-walk-side-1', 1);
    drawITSpecialistSide('player-walk-side-2', 2);

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

    // 6. Inspectable Office Prop Texture (40x40)
    const gProp = this.make.graphics({ x: 0, y: 0, add: false });
    gProp.fillStyle(0x0f172a, 1);
    gProp.fillRoundedRect(6, 6, 28, 28, 5);
    gProp.lineStyle(2, 0xffffff, 1);
    gProp.strokeRoundedRect(6, 6, 28, 28, 5);
    gProp.fillStyle(0xffffff, 0.9);
    gProp.fillCircle(20, 16, 4);
    gProp.fillRect(14, 23, 12, 4);
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
      // Backward compatibility aliases
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
