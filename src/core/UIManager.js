import gsap from 'gsap';
import { createCinematicIntroScreen } from '../components/screens/CinematicIntroScreen.js';
import { createGameShell } from '../components/screens/GameShell.js';
import { createGratitudeLetterScreen } from '../components/screens/GratitudeLetterScreen.js';
import { createGratitudeSkyScreen } from '../components/screens/GratitudeSkyScreen.js';
import { createIntroScreen } from '../components/screens/IntroScreen.js';
import { createLastBugScreen } from '../components/screens/LastBugScreen.js';
import { createLoadingScreen } from '../components/screens/LoadingScreen.js';
import { createRainOfGratitudeScreen } from '../components/screens/RainOfGratitudeScreen.js';
import { notification } from '../components/Notification.js';
import { EVENTS, UI_SCREENS } from '../config/constants.js';
import { gratitudeService } from '../services/GratitudeService.js';
import { gratitudeStorage } from '../services/GratitudeStorage.js';
import { lastBugController } from '../systems/LastBugController.js';
import { missionManager } from '../systems/MissionManager.js';
import { eventBus } from './EventBus.js';

export class UIManager {
  constructor(eventBusInstance = eventBus) {
    this.eventBus = eventBusInstance;
    this.root = null;
    this.currentScreen = null;
    this.currentScreenKey = null;
    this.soundEnabled = true;
    this.latestSubmittedLetter = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  init(mountSelector = '#ui-layer') {
    this.root = document.querySelector(mountSelector);
    if (!this.root) {
      console.error(`[UIManager] Mount element "${mountSelector}" not found.`);
      return;
    }

    notification.mount(document.body);
    this.registerEvents();
    window.addEventListener('keydown', this.handleKeyDown);

    // One-time background migration for any unsynced LocalStorage letters
    gratitudeService.syncUnsyncedLocalLetters().catch(() => {
      // Handled gracefully inside service
    });

    this.showScreen(UI_SCREENS.INTRO);
  }

  registerEvents() {
    lastBugController.init(() => {
      this.showScreen(UI_SCREENS.LAST_BUG);
    });

    this.eventBus.on(EVENTS.GAME_START_REQUESTED, () => {
      this.showScreen(UI_SCREENS.CINEMATIC_INTRO);
    });

    this.eventBus.on(EVENTS.NEW_GAME_REQUESTED, () => {
      this.showScreen(UI_SCREENS.CINEMATIC_INTRO);
    });

    this.eventBus.on(EVENTS.CONTINUE_GAME_REQUESTED, () => {
      this.showScreen(UI_SCREENS.LOADING);
    });

    this.eventBus.on(EVENTS.INVESTIGATION_START_REQUESTED, () => {
      this.showScreen(UI_SCREENS.LOADING);
    });

    this.eventBus.on(EVENTS.GAME_EXIT_REQUESTED, () => {
      lastBugController.clearTimer();
      this.showScreen(UI_SCREENS.INTRO);
      notification.show({
        message: 'Đã thoát về màn hình chính.',
        type: 'info',
      });
    });

    this.eventBus.on(EVENTS.SOUND_TOGGLED, ({ enabled }) => {
      this.soundEnabled = enabled;
    });

    this.eventBus.on(EVENTS.FIX_LAST_BUG_REQUESTED, () => {
      this.showScreen(UI_SCREENS.GRATITUDE_LETTER);
    });

    this.eventBus.on(EVENTS.GRATITUDE_SUBMITTED, (payload) => {
      this.latestSubmittedLetter = payload?.letter || gratitudeStorage.getLatestLetter();
      this.showScreen(UI_SCREENS.RAIN_OF_GRATITUDE);
    });
  }

  handleKeyDown(event) {
    if (event.key === 'Escape' && this.currentScreenKey === UI_SCREENS.GAME_SHELL) {
      if (this.currentScreen && typeof this.currentScreen.togglePauseMenu === 'function') {
        this.currentScreen.togglePauseMenu();
      }
    }
  }

  showScreen(screenKey) {
    if (!this.root) return;

    // Guard against skipping mandatory missions to reach LAST_BUG prematurely
    if (screenKey === UI_SCREENS.LAST_BUG && !missionManager.isAllCompleted()) {
      notification.show({
        message: 'Bạn cần hoàn thành cả 4 nhiệm vụ điều tra trước khi mở khóa chương cuối!',
        type: 'warm',
      });
      return;
    }

    const mountNextScreen = () => {
      if (this.currentScreen && typeof this.currentScreen.destroy === 'function') {
        this.currentScreen.destroy();
      }
      this.root.innerHTML = '';

      let nextInstance = null;

      if (screenKey === UI_SCREENS.INTRO) {
        nextInstance = createIntroScreen({
          onNavigate: (targetScreen) => {
            this.showScreen(targetScreen);
          },
        });
      } else if (screenKey === UI_SCREENS.CINEMATIC_INTRO) {
        nextInstance = createCinematicIntroScreen({
          onComplete: () => {
            this.showScreen(UI_SCREENS.LOADING);
          },
        });
      } else if (screenKey === UI_SCREENS.LOADING) {
        nextInstance = createLoadingScreen({
          onComplete: () => {
            this.showScreen(UI_SCREENS.GAME_SHELL);
          },
        });
      } else if (screenKey === UI_SCREENS.GAME_SHELL) {
        nextInstance = createGameShell({
          soundEnabled: this.soundEnabled,
        });
      } else if (screenKey === UI_SCREENS.LAST_BUG) {
        nextInstance = createLastBugScreen();
      } else if (screenKey === UI_SCREENS.GRATITUDE_LETTER) {
        nextInstance = createGratitudeLetterScreen();
      } else if (screenKey === UI_SCREENS.RAIN_OF_GRATITUDE) {
        nextInstance = createRainOfGratitudeScreen({
          newlySubmittedLetter: this.latestSubmittedLetter || gratitudeStorage.getLatestLetter(),
          soundEnabled: this.soundEnabled,
          onNavigate: (targetScreen) => {
            this.showScreen(targetScreen);
          },
        });
      } else if (screenKey === UI_SCREENS.GRATITUDE_SKY) {
        nextInstance = createGratitudeSkyScreen({
          onNavigate: (targetScreen) => {
            this.showScreen(targetScreen);
          },
        });
      }

      if (!nextInstance) return;

      this.currentScreen = nextInstance;
      this.currentScreenKey = screenKey;
      this.root.appendChild(nextInstance.element);

      gsap.fromTo(
        nextInstance.element,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out' }
      );

      if (screenKey === UI_SCREENS.LOADING && typeof nextInstance.startSequence === 'function') {
        nextInstance.startSequence();
      } else if (
        screenKey === UI_SCREENS.CINEMATIC_INTRO &&
        typeof nextInstance.startSequence === 'function'
      ) {
        nextInstance.startSequence();
      } else if (
        screenKey === UI_SCREENS.LAST_BUG &&
        typeof nextInstance.startSequence === 'function'
      ) {
        nextInstance.startSequence();
      } else if (
        screenKey === UI_SCREENS.GAME_SHELL &&
        missionManager.isAllCompleted() &&
        !lastBugController.hasTriggered
      ) {
        lastBugController.tryTrigger(650);
      }

      this.eventBus.emit(EVENTS.SCREEN_CHANGE, { screenKey });
    };

    if (this.currentScreen && this.currentScreen.element) {
      gsap.to(this.currentScreen.element, {
        opacity: 0,
        duration: 0.16,
        ease: 'power1.in',
        onComplete: mountNextScreen,
      });
    } else {
      mountNextScreen();
    }
  }
}

export const uiManager = new UIManager();
export default UIManager;
