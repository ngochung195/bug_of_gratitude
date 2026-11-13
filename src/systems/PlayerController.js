import { EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { PLAYER_START } from '../data/labEnvironment.js';
import { audioManager } from './AudioManager.js';

export class PlayerController {
  constructor(scene, { x = PLAYER_START.x, y = PLAYER_START.y, speed = PLAYER_START.speed } = {}) {
    this.scene = scene;
    this.speed = speed;
    this.state = 'idle';
    this.facing = 'down';
    this.stepTimer = 0;

    this.shadow = this.scene.add.ellipse(x, y + 18, 28, 12, 0x050811, 0.55);
    this.shadow.setDepth(4);

    this.sprite = this.scene.physics.add.sprite(x, y, 'player-idle');
    this.sprite.setDepth(5);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.body.setSize(24, 24);
    this.sprite.body.setOffset(12, 20);

    this.nameTag = this.scene.add
      .text(x, y - 30, 'DEV_INTERN', {
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '10px',
        color: '#00e5ff',
        backgroundColor: 'rgba(7, 11, 20, 0.75)',
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5)
      .setDepth(6);
  }

  update(movementVector, delta = 16) {
    if (!this.sprite || !this.sprite.body) return;

    const vx = movementVector.x * this.speed;
    const vy = movementVector.y * this.speed;

    this.sprite.body.setVelocity(vx, vy);

    const isMoving = Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01;

    if (isMoving) {
      this.state = 'walk';
      if (Math.abs(vx) > Math.abs(vy)) {
        this.facing = vx < 0 ? 'left' : 'right';
      } else {
        this.facing = vy < 0 ? 'up' : 'down';
      }

      this.sprite.setFlipX(this.facing === 'left');
      this.sprite.anims.play('player-walk-anim', true);

      this.stepTimer += delta;
      if (this.stepTimer >= 260) {
        this.stepTimer = 0;
        audioManager.playStep();
      }
    } else {
      if (this.state !== 'idle') {
        this.state = 'idle';
        this.sprite.anims.play('player-idle-anim', true);
      }
      this.stepTimer = 0;
    }

    this.shadow.setPosition(this.sprite.x, this.sprite.y + 18);
    this.nameTag.setPosition(this.sprite.x, this.sprite.y - 30);

    eventBus.emit(EVENTS.PLAYER_MOVED, {
      x: Math.round(this.sprite.x),
      y: Math.round(this.sprite.y),
      state: this.state,
      facing: this.facing,
    });
  }

  resetPosition(x = PLAYER_START.x, y = PLAYER_START.y) {
    if (!this.sprite) return;
    this.sprite.setPosition(x, y);
    this.sprite.body.setVelocity(0, 0);
    this.shadow.setPosition(x, y + 18);
    this.nameTag.setPosition(x, y - 30);
    this.state = 'idle';
  }

  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y,
    };
  }
}

export default PlayerController;

