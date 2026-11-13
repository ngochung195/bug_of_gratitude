import { APP_CONFIG, EVENTS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { missionManager } from '../../systems/MissionManager.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { createDialog } from '../Dialog.js';
import { createMissionUI } from '../MissionUI.js';
import { createModal } from '../Modal.js';
import { notification } from '../Notification.js';
import { createProgressBar } from '../ProgressBar.js';

export function createGameShell({ soundEnabled = true } = {}) {
  let isSoundOn = soundEnabled;
  const unsubscribers = [];

  const shell = document.createElement('section');
  shell.className = 'game-shell';
  shell.setAttribute('aria-label', 'Game Shell Interface');

  // 1. Top Navigation HUD
  const topHud = document.createElement('header');
  topHud.className = 'game-hud-top';

  const brand = document.createElement('div');
  brand.className = 'hud-brand';
  brand.innerHTML = `
    <span class="hud-brand__title">BUG OF GRATITUDE</span>
    <span class="hud-player-status" title="Player Status">
      <span class="hud-player-status__dot"></span>
      <span>DEV_INTERN // ONLINE</span>
    </span>
    <span class="hud-attempts-badge" title="Số cơ hội trả lời sai còn lại cho cả 4 câu">
      CƠ HỘI: ${missionManager.getRemainingAttempts()}/${APP_CONFIG.MAX_WRONG_ATTEMPTS}
    </span>
  `;
  const hudAttemptsEl = brand.querySelector('.hud-attempts-badge');
  const syncHudAttempts = () => {
    if (!hudAttemptsEl) return;
    const rem = missionManager.getRemainingAttempts();
    hudAttemptsEl.textContent = `CƠ HỘI: ${rem}/${APP_CONFIG.MAX_WRONG_ATTEMPTS}`;
    hudAttemptsEl.classList.toggle('hud-attempts-badge--danger', rem <= 1);
  };
  syncHudAttempts();

  const missionBox = document.createElement('div');
  missionBox.className = 'hud-mission-box';

  const missionProgress = createProgressBar({
    label: 'MISSION PROGRESS',
    value: missionManager.getCompletedCount(),
    max: APP_CONFIG.TOTAL_MISSIONS,
    formatValue: (val, max) => `${val}/${max} BUGS FIXED`,
  });
  missionBox.appendChild(missionProgress.element);

  const controls = document.createElement('div');
  controls.className = 'hud-controls';

  const hudSoundBtn = createButton({
    label: isSoundOn ? 'SOUND: ON' : 'SOUND: OFF',
    variant: 'ghost',
    iconSvg: isSoundOn ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF,
    ariaLabel: 'Toggle Sound',
    active: isSoundOn,
  });

  const pauseBtn = createButton({
    label: 'PAUSE',
    variant: 'secondary',
    iconSvg: ICONS.PAUSE,
    ariaLabel: 'Open Pause Menu',
  });

  controls.appendChild(hudSoundBtn.element);
  controls.appendChild(pauseBtn.element);

  topHud.appendChild(brand);
  topHud.appendChild(missionBox);
  topHud.appendChild(controls);

  // 2. Center Game Viewport Frame
  const viewportFrame = document.createElement('div');
  viewportFrame.className = 'game-viewport-frame';

  const topCorners = document.createElement('div');
  topCorners.className = 'viewport-corners';
  topCorners.innerHTML = `
    <span>SECTOR // 01: CODEGYM LAB</span>
    <span>CAM_FEED // 1280x720</span>
  `;

  // Mobile Touch Controls (D-Pad + Interact/Pause)
  const mobileControls = document.createElement('div');
  mobileControls.className = 'mobile-controls';
  mobileControls.setAttribute('aria-label', 'Mobile Game Controls');

  const dpad = document.createElement('div');
  dpad.className = 'mobile-dpad';

  const createDpadButton = (dirLabel, modClass, dx, dy) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `mobile-dpad__btn ${modClass}`;
    btn.textContent = dirLabel;
    btn.setAttribute('aria-label', `Move ${dirLabel}`);

    const startMove = (e) => {
      e.preventDefault();
      btn.classList.add('is-pressed');
      eventBus.emit(EVENTS.MOBILE_INPUT_CHANGED, { x: dx, y: dy });
    };

    const stopMove = (e) => {
      e.preventDefault();
      btn.classList.remove('is-pressed');
      eventBus.emit(EVENTS.MOBILE_INPUT_CHANGED, { x: 0, y: 0 });
    };

    btn.addEventListener('pointerdown', startMove);
    btn.addEventListener('pointerup', stopMove);
    btn.addEventListener('pointerleave', stopMove);
    btn.addEventListener('pointercancel', stopMove);

    return btn;
  };

  dpad.appendChild(createDpadButton('▲', 'mobile-dpad__btn--up', 0, -1));
  dpad.appendChild(createDpadButton('◀', 'mobile-dpad__btn--left', -1, 0));
  dpad.appendChild(createDpadButton('▶', 'mobile-dpad__btn--right', 1, 0));
  dpad.appendChild(createDpadButton('▼', 'mobile-dpad__btn--down', 0, 1));

  const mobileActions = document.createElement('div');
  mobileActions.className = 'mobile-actions';

  const mobileInteractBtn = createButton({
    label: '[E] INTERACT',
    variant: 'primary',
    iconSvg: ICONS.TERMINAL,
    disabled: true,
    onClick: () => {
      eventBus.emit(EVENTS.MOBILE_INTERACT_PRESSED);
    },
  });

  const mobilePauseBtn = createButton({
    label: 'PAUSE',
    variant: 'ghost',
    iconSvg: ICONS.PAUSE,
  });

  mobileActions.appendChild(mobileInteractBtn.element);
  mobileActions.appendChild(mobilePauseBtn.element);

  mobileControls.appendChild(dpad);
  mobileControls.appendChild(mobileActions);

  const bottomCorners = document.createElement('div');
  bottomCorners.className = 'viewport-corners';
  bottomCorners.innerHTML = `
    <span>SYS_STATUS: ONLINE</span>
    <span>LATENCY: 4ms</span>
  `;

  viewportFrame.appendChild(topCorners);
  viewportFrame.appendChild(mobileControls);
  viewportFrame.appendChild(bottomCorners);

  // 3. Bottom Interaction Hint Bar
  const bottomHud = document.createElement('footer');
  bottomHud.className = 'game-hud-bottom';

  const DEFAULT_HINT_MESSAGE =
    'Di chuyển bằng [WASD / Arrow Keys] • Tiến lại gần trạm Terminal hoặc Mentor Bot để kiểm tra.';
  const DEFAULT_KEY_HINT = 'Press [E] to Interact • [ESC] Pause';

  const interactionDialog = createDialog({
    badge: 'INTERACTION HINT',
    message: DEFAULT_HINT_MESSAGE,
    keyHint: DEFAULT_KEY_HINT,
  });
  bottomHud.appendChild(interactionDialog.element);

  // 4. Mission Terminal Modal UI
  const missionUI = createMissionUI();

  // 5. Pause Menu Modal (RESUME, RESTART, SOUND, EXIT)
  const pauseList = document.createElement('div');
  pauseList.className = 'pause-menu-list';

  const resumeBtn = createButton({
    label: 'RESUME',
    variant: 'primary',
    iconSvg: ICONS.PLAY,
  });

  const restartBtn = createButton({
    label: 'RESTART (RESET PROGRESS)',
    variant: 'secondary',
    iconSvg: ICONS.ROTATE_CCW,
  });

  const pauseSoundBtn = createButton({
    label: isSoundOn ? 'SOUND: ON' : 'SOUND: OFF',
    variant: 'warm',
    iconSvg: isSoundOn ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF,
    active: isSoundOn,
  });

  const exitBtn = createButton({
    label: 'EXIT',
    variant: 'danger',
    iconSvg: ICONS.LOG_OUT,
  });

  pauseList.appendChild(resumeBtn.element);
  pauseList.appendChild(restartBtn.element);
  pauseList.appendChild(pauseSoundBtn.element);
  pauseList.appendChild(exitBtn.element);

  const pauseModal = createModal({
    title: 'SYSTEM PAUSED',
    content: pauseList,
    closeOnBackdrop: true,
    onClose: () => {
      pauseBtn.setActive(false);
      eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: false });
    },
  });

  const openPauseMenu = () => {
    if (missionUI.isOpen()) {
      missionUI.close();
      return;
    }
    pauseBtn.setActive(true);
    pauseModal.open();
    eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: true });
  };

  const syncSoundButtons = () => {
    const labelText = isSoundOn ? 'SOUND: ON' : 'SOUND: OFF';
    const icon = isSoundOn ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF;
    hudSoundBtn.setContent(labelText, icon);
    hudSoundBtn.setActive(isSoundOn);
    pauseSoundBtn.setContent(labelText, icon);
    pauseSoundBtn.setActive(isSoundOn);
  };

  const toggleSound = () => {
    isSoundOn = !isSoundOn;
    syncSoundButtons();
    eventBus.emit(EVENTS.SOUND_TOGGLED, { enabled: isSoundOn });
    notification.show({
      message: isSoundOn ? 'Đã bật âm thanh hệ thống (Sound ON).' : 'Đã tắt âm thanh hệ thống (Sound OFF).',
      type: 'warm',
    });
  };

  hudSoundBtn.element.addEventListener('click', toggleSound);
  pauseSoundBtn.element.addEventListener('click', toggleSound);
  pauseBtn.element.addEventListener('click', openPauseMenu);
  mobilePauseBtn.element.addEventListener('click', openPauseMenu);

  resumeBtn.element.addEventListener('click', () => {
    pauseModal.close();
  });

  restartBtn.element.addEventListener('click', () => {
    pauseModal.close();
    missionManager.resetProgress();
    interactionDialog.update({
      newBadge: 'INTERACTION HINT',
      newMessage: DEFAULT_HINT_MESSAGE,
      newKeyHint: DEFAULT_KEY_HINT,
    });
    notification.show({
      message: 'Đã đặt lại toàn bộ tiến trình nhiệm vụ và vị trí nhân vật (Progress Reset).',
      type: 'success',
    });
    eventBus.emit(EVENTS.GAME_RESTART_REQUESTED);
  });

  exitBtn.element.addEventListener('click', () => {
    pauseModal.close();
    eventBus.emit(EVENTS.GAME_EXIT_REQUESTED);
  });

  // Listen to Mission updates
  unsubscribers.push(
    eventBus.on(EVENTS.MISSION_UPDATED, ({ completedCount, totalCount }) => {
      missionProgress.update(completedCount, totalCount);
      syncHudAttempts();
    })
  );

  // Listen to proximity target changes and interactions from Phaser InteractionSystem
  unsubscribers.push(
    eventBus.on(EVENTS.INTERACTION_TARGET_CHANGED, ({ target }) => {
      if (target) {
        mobileInteractBtn.setDisabled(false);
        const statusSuffix = target.missionId
          ? ` [${missionManager.getMissionStatus(target.missionId)}]`
          : '';
        interactionDialog.update({
          newBadge: `${target.code}${statusSuffix}`,
          newMessage: target.hintMessage,
          newKeyHint: 'Press [E] to Interact',
        });
      } else {
        mobileInteractBtn.setDisabled(true);
        interactionDialog.update({
          newBadge: 'INTERACTION HINT',
          newMessage: DEFAULT_HINT_MESSAGE,
          newKeyHint: DEFAULT_KEY_HINT,
        });
      }
    })
  );

  unsubscribers.push(
    eventBus.on(EVENTS.INTERACTION_TRIGGERED, ({ target }) => {
      if (!target) return;

      if (target.missionId) {
        missionUI.openMission(target.missionId);
        return;
      }

      if (target.type === 'npc') {
        const guidance = missionManager.getMentorGuidance();
        interactionDialog.update({
          newBadge: `${target.code} // GUIDANCE`,
          newMessage: guidance,
          newKeyHint: 'Press [E] Again',
        });
        notification.show({
          message: guidance,
          type: 'warm',
          duration: 3600,
        });
      }
    })
  );

  shell.appendChild(topHud);
  shell.appendChild(viewportFrame);
  shell.appendChild(bottomHud);
  shell.appendChild(missionUI.element);
  shell.appendChild(pauseModal.element);

  return {
    element: shell,
    togglePauseMenu() {
      if (missionUI.isOpen()) {
        missionUI.close();
        return;
      }
      if (pauseModal.isOpen()) {
        pauseModal.close();
      } else {
        openPauseMenu();
      }
    },
    isSoundEnabled: () => isSoundOn,
    destroy() {
      unsubscribers.forEach((unsub) => unsub());
      unsubscribers.length = 0;
      shell.remove();
    },
  };
}
