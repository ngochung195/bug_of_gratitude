import gsap from 'gsap';
import { createGameShell } from '../components/screens/GameShell.js';
import { createIntroScreen } from '../components/screens/IntroScreen.js';
import { createLoadingScreen } from '../components/screens/LoadingScreen.js';
import { notification } from '../components/Notification.js';
import { EVENTS, UI_SCREENS } from '../config/constants.js';
import { eventBus } from './EventBus.js';

export class UIManager {
  constructor(eventBusInstance = eventBus) {
    this.eventBus = eventBusInstance;
    this.root = null;
    this.currentScreen = null;
    this.currentScreenKey = null;
    this.soundEnabled = true;
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

    this.showScreen(UI_SCREENS.INTRO);
  }

  registerEvents() {
    this.eventBus.on(EVENTS.GAME_START_REQUESTED, () => {
      this.showScreen(UI_SCREENS.LOADING);
    });

    this.eventBus.on(EVENTS.GAME_EXIT_REQUESTED, () => {
      this.showScreen(UI_SCREENS.INTRO);
      notification.show({
        message: 'Đã thoát về màn hình chính.',
        type: 'info',
      });
    });

    this.eventBus.on(EVENTS.SOUND_TOGGLED, ({ enabled }) => {
      this.soundEnabled = enabled;
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

    const mountNextScreen = () => {
      if (this.currentScreen && typeof this.currentScreen.destroy === 'function') {
        this.currentScreen.destroy();
      }
      this.root.innerHTML = '';

      let nextInstance = null;

      if (screenKey === UI_SCREENS.INTRO) {
        nextInstance = createIntroScreen();
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
