import gsap from 'gsap';
import { createGameShell } from '../components/screens/GameShell.js';
import { createGratitudeLetterScreen } from '../components/screens/GratitudeLetterScreen.js';
import { createIntroScreen } from '../components/screens/IntroScreen.js';
import { createLastBugScreen } from '../components/screens/LastBugScreen.js';
import { createLoadingScreen } from '../components/screens/LoadingScreen.js';
import { notification } from '../components/Notification.js';
import { EVENTS, UI_SCREENS } from '../config/constants.js';
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
    lastBugController.init(() => {
      this.showScreen(UI_SCREENS.LAST_BUG);
    });

    this.eventBus.on(EVENTS.GAME_START_REQUESTED, () => {
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

    this.eventBus.on(EVENTS.GRATITUDE_SUBMITTED, () => {
      this.showScreen(UI_SCREENS.RAIN_OF_GRATITUDE);
    });
  }

  createRainStandbyScreen() {
    const latest = gratitudeStorage.getLatestLetter();
    const totalSaved = gratitudeStorage.getAllLetters().length;

    const section = document.createElement('section');
    section.className = 'bog-screen gratitude-screen';
    section.setAttribute('aria-label', 'Rain of Gratitude Standby');

    const card = document.createElement('div');
    card.className = 'bog-card intro-panel';
    card.style.borderColor = 'var(--color-warm-gold-bright)';

    card.innerHTML = `
      <span class="gratitude-header__badge">RAIN OF GRATITUDE // STANDBY</span>
      <h1 class="gratitude-header__title">THANK YOU FOR YOUR GRATITUDE</h1>
      <p class="gratitude-header__quote">"BUG #005: MISSING GRATITUDE — STATUS: RESOLVED"</p>
      <div class="about-highlight" style="width: 100%; text-align: left;">
        <p><strong>Gửi tới:</strong> <span class="rain-standby-mentor"></span></p>
        <p style="margin-top: 6px;"><strong>Lời nhắn:</strong> <span class="rain-standby-msg"></span></p>
        <p style="margin-top: 6px;"><strong>Người gửi:</strong> <span class="rain-standby-sender"></span></p>
        <p style="margin-top: 8px; font-size: 0.8rem; opacity: 0.85;">Đã lưu vào LocalStorage (${totalSaved} lá thư). Không gian mưa thư & Supabase sẽ mở ở Phase tiếp theo.</p>
      </div>
    `;

    if (latest) {
      card.querySelector('.rain-standby-mentor').textContent = latest.mentorName;
      card.querySelector('.rain-standby-msg').textContent = latest.message;
      card.querySelector('.rain-standby-sender').textContent = latest.isAnonymous
        ? 'Anonymous (Ẩn danh)'
        : latest.senderName;
    }

    const writeAnotherBtn = document.createElement('button');
    writeAnotherBtn.type = 'button';
    writeAnotherBtn.className = 'bog-btn bog-btn--warm';
    writeAnotherBtn.textContent = 'VIẾT THÊM LÁ THƯ KHÁC';
    writeAnotherBtn.addEventListener('click', () => {
      this.showScreen(UI_SCREENS.GRATITUDE_LETTER);
    });

    card.appendChild(writeAnotherBtn);
    section.appendChild(card);

    return {
      element: section,
      destroy() {
        section.remove();
      },
    };
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
      } else if (screenKey === UI_SCREENS.LAST_BUG) {
        nextInstance = createLastBugScreen();
      } else if (screenKey === UI_SCREENS.GRATITUDE_LETTER) {
        nextInstance = createGratitudeLetterScreen();
      } else if (screenKey === UI_SCREENS.RAIN_OF_GRATITUDE) {
        nextInstance = this.createRainStandbyScreen();
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
