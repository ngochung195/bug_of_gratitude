import { APP_CONFIG, EVENTS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { createDialog } from '../Dialog.js';
import { createModal } from '../Modal.js';
import { notification } from '../Notification.js';
import { createProgressBar } from '../ProgressBar.js';

export function createGameShell({ soundEnabled = true } = {}) {
  let isSoundOn = soundEnabled;

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
  `;

  const missionBox = document.createElement('div');
  missionBox.className = 'hud-mission-box';

  const missionProgress = createProgressBar({
    label: 'MISSION PROGRESS',
    value: 0,
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

  const centerPlaceholder = document.createElement('div');
  centerPlaceholder.className = 'viewport-center-placeholder';
  centerPlaceholder.innerHTML = `
    <h2 class="viewport-center-placeholder__title">WORKSTATION VIEWPORT READY</h2>
    <p class="viewport-center-placeholder__desc">
      Khung giao diện Game Shell đã sẵn sàng. Nhân vật, bản đồ phòng Lab và 4 trạm sửa lỗi sẽ được kích hoạt ở các Phase tiếp theo.
    </p>
  `;

  const bottomCorners = document.createElement('div');
  bottomCorners.className = 'viewport-corners';
  bottomCorners.innerHTML = `
    <span>SYS_STATUS: STANDBY</span>
    <span>LATENCY: 4ms</span>
  `;

  viewportFrame.appendChild(topCorners);
  viewportFrame.appendChild(centerPlaceholder);
  viewportFrame.appendChild(bottomCorners);

  // 3. Bottom Interaction Hint Bar
  const bottomHud = document.createElement('footer');
  bottomHud.className = 'game-hud-bottom';

  const interactionDialog = createDialog({
    badge: 'INTERACTION HINT',
    message: 'Di chuyển bằng [WASD / Arrow Keys] • Tiến lại gần trạm máy tính để kiểm tra Bug.',
    keyHint: 'Press [E] to Interact • [ESC] Pause',
  });
  bottomHud.appendChild(interactionDialog.element);

  // 4. Pause Menu Modal (RESUME, RESTART, SOUND, EXIT)
  const pauseList = document.createElement('div');
  pauseList.className = 'pause-menu-list';

  const resumeBtn = createButton({
    label: 'RESUME',
    variant: 'primary',
    iconSvg: ICONS.PLAY,
  });

  const restartBtn = createButton({
    label: 'RESTART',
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

  pauseBtn.element.addEventListener('click', () => {
    pauseBtn.setActive(true);
    pauseModal.open();
    eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: true });
  });

  resumeBtn.element.addEventListener('click', () => {
    pauseModal.close();
  });

  restartBtn.element.addEventListener('click', () => {
    pauseModal.close();
    missionProgress.update(0, APP_CONFIG.TOTAL_MISSIONS);
    notification.show({
      message: 'Đã làm mới trạng thái phiên làm việc (Session Restarted).',
      type: 'success',
    });
    eventBus.emit(EVENTS.GAME_RESTART_REQUESTED);
  });

  exitBtn.element.addEventListener('click', () => {
    pauseModal.close();
    eventBus.emit(EVENTS.GAME_EXIT_REQUESTED);
  });

  shell.appendChild(topHud);
  shell.appendChild(viewportFrame);
  shell.appendChild(bottomHud);
  shell.appendChild(pauseModal.element);

  return {
    element: shell,
    togglePauseMenu() {
      if (pauseModal.isOpen()) {
        pauseModal.close();
      } else {
        pauseBtn.setActive(true);
        pauseModal.open();
        eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: true });
      }
    },
    isSoundEnabled: () => isSoundOn,
    destroy() {
      shell.remove();
    },
  };
}
