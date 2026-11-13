import Phaser from 'phaser';
import { EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';

export class InputManager {
  constructor(scene, eventBusInstance = eventBus) {
    this.scene = scene;
    this.eventBus = eventBusInstance;
    this.enabled = true;

    this.keys = this.scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      interact: Phaser.Input.Keyboard.KeyCodes.E,
      pause: Phaser.Input.Keyboard.KeyCodes.ESC,
    });

    this.mobileDirection = { x: 0, y: 0 };
    this.mobileInteractQueued = false;

    this.unsubscribeMobileMove = this.eventBus.on(EVENTS.MOBILE_INPUT_CHANGED, (dir) => {
      this.mobileDirection.x = dir.x || 0;
      this.mobileDirection.y = dir.y || 0;
    });

    this.unsubscribeMobileInteract = this.eventBus.on(EVENTS.MOBILE_INTERACT_PRESSED, () => {
      if (this.enabled) {
        this.mobileInteractQueued = true;
      }
    });
  }

  setEnabled(isEnabled) {
    this.enabled = Boolean(isEnabled);
    if (!this.enabled) {
      this.mobileDirection.x = 0;
      this.mobileDirection.y = 0;
      this.mobileInteractQueued = false;
    }
  }

  getMovementVector() {
    if (!this.enabled) {
      return { x: 0, y: 0 };
    }

    let vx = 0;
    let vy = 0;

    if (this.keys.left.isDown || this.keys.arrowLeft.isDown || this.mobileDirection.x < 0) {
      vx -= 1;
    }
    if (this.keys.right.isDown || this.keys.arrowRight.isDown || this.mobileDirection.x > 0) {
      vx += 1;
    }
    if (this.keys.up.isDown || this.keys.arrowUp.isDown || this.mobileDirection.y < 0) {
      vy -= 1;
    }
    if (this.keys.down.isDown || this.keys.arrowDown.isDown || this.mobileDirection.y > 0) {
      vy += 1;
    }

    if (vx !== 0 && vy !== 0) {
      const inv = 1 / Math.SQRT2;
      vx *= inv;
      vy *= inv;
    }

    return { x: vx, y: vy };
  }

  consumeInteractJustPressed() {
    if (!this.enabled) return false;

    const keyboardPressed = Phaser.Input.Keyboard.JustDown(this.keys.interact);
    const mobilePressed = this.mobileInteractQueued;
    this.mobileInteractQueued = false;

    return keyboardPressed || mobilePressed;
  }

  destroy() {
    if (this.unsubscribeMobileMove) this.unsubscribeMobileMove();
    if (this.unsubscribeMobileInteract) this.unsubscribeMobileInteract();
  }
}

export default InputManager;
