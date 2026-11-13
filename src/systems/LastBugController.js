import { EVENTS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { missionManager } from './MissionManager.js';

export class LastBugController {
  constructor({
    missionManagerInstance = missionManager,
    eventBusInstance = eventBus,
  } = {}) {
    this.missionManager = missionManagerInstance;
    this.eventBus = eventBusInstance;
    this.hasTriggered = false;
    this.transitionTimer = null;
  }

  init(onReadyToShowScreen) {
    this.onReadyToShowScreen = onReadyToShowScreen;

    this.eventBus.on(EVENTS.ALL_MISSIONS_COMPLETED, () => {
      this.tryTrigger(1100);
    });

    this.eventBus.on(EVENTS.MISSION_PROGRESS_RESET, () => {
      this.reset();
    });
  }

  tryTrigger(delayMs = 1100) {
    if (this.hasTriggered) {
      return false;
    }

    if (!this.missionManager.isAllCompleted()) {
      return false;
    }

    this.hasTriggered = true;
    this.clearTimer();

    this.eventBus.emit(EVENTS.LAST_BUG_TRIGGERED, {
      code: 'BUG #005',
      title: 'MISSING GRATITUDE',
    });

    if (typeof this.onReadyToShowScreen === 'function') {
      if (delayMs <= 0) {
        this.onReadyToShowScreen();
      } else {
        this.transitionTimer = window.setTimeout(() => {
          this.onReadyToShowScreen();
        }, delayMs);
      }
    }

    return true;
  }

  clearTimer() {
    if (this.transitionTimer) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }
  }

  reset() {
    this.hasTriggered = false;
    this.clearTimer();
  }
}

export const lastBugController = new LastBugController();
export default LastBugController;
