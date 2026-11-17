import { APP_CONFIG, EVENTS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { SECTOR_STATUS } from '../../data/labEnvironment.js';
import { investigationSystem } from '../../systems/InvestigationSystem.js';
import { missionManager } from '../../systems/MissionManager.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { createDialog } from '../Dialog.js';
import { createMissionUI } from '../MissionUI.js';
import { createModal } from '../Modal.js';
import { notification } from '../Notification.js';

function formatInGameClock(elapsedSec = 0) {
  const baseMinutes = 23 * 60 + 47;
  const totalSec = baseMinutes * 60 + elapsedSec;
  const hours = Math.floor(totalSec / 3600) % 24;
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createGameShell({ soundEnabled = true } = {}) {
  let isSoundOn = soundEnabled;
  let elapsedGameSeconds = 0;
  const unsubscribers = [];

  const shell = document.createElement('section');
  shell.className = 'game-shell';
  shell.setAttribute('aria-label', 'CodeGym Headquarters Game Shell');

  // =========================================================================
  // 1. COMPACT TOP HUD BAR
  // =========================================================================
  const topHud = document.createElement('header');
  topHud.className = 'game-hud-top';

  const brand = document.createElement('div');
  brand.className = 'hud-brand';
  brand.innerHTML = `
    <span class="hud-brand__title">CODEGYM HEADQUARTERS</span>
    <span class="hud-player-status" title="System Status">
      <span class="hud-player-status__dot"></span>
      <span class="hud-sys-status-text">SYSTEM STATUS: ${investigationSystem.getSystemStatusText()}</span>
    </span>
  `;
  const sysStatusTextEl = brand.querySelector('.hud-sys-status-text');

  // Telemetry Counters: Explored Sectors, Resolved Incidents, Remaining Attempts, In-Game Clock
  const telemetryRow = document.createElement('div');
  telemetryRow.style.cssText =
    'display: flex; align-items: center; flex-wrap: wrap; gap: 8px; font-family: var(--font-mono); font-size: 0.75rem;';

  const exploredBadge = document.createElement('span');
  exploredBadge.className = 'hud-attempts-badge';
  exploredBadge.style.borderColor = 'rgba(56, 189, 248, 0.45)';
  exploredBadge.style.color = '#38bdf8';

  const incidentsBadge = document.createElement('span');
  incidentsBadge.className = 'hud-attempts-badge';
  incidentsBadge.style.borderColor = 'rgba(16, 185, 129, 0.45)';
  incidentsBadge.style.color = '#34d399';

  const attemptsBadge = document.createElement('span');
  attemptsBadge.className = 'hud-attempts-badge';

  const clockBadge = document.createElement('span');
  clockBadge.className = 'hud-attempts-badge';
  clockBadge.style.borderColor = 'rgba(251, 191, 36, 0.45)';
  clockBadge.style.color = '#fde047';
  clockBadge.textContent = `TIME: ${formatInGameClock(0)}`;

  telemetryRow.appendChild(exploredBadge);
  telemetryRow.appendChild(incidentsBadge);
  telemetryRow.appendChild(attemptsBadge);
  telemetryRow.appendChild(clockBadge);

  const syncHudTelemetry = () => {
    const explored = investigationSystem.getExploredCount();
    const totalSectors = investigationSystem.getTotalSectorsCount();
    const resolved = investigationSystem.getResolvedIncidentsCount();
    const totalIncidents = investigationSystem.getTotalIncidentsCount();
    const remAttempts = missionManager.getRemainingAttempts();

    exploredBadge.textContent = `KHU VỰC: ${explored}/${totalSectors}`;
    incidentsBadge.textContent = `SỰ CỐ: ${resolved}/${totalIncidents}`;
    attemptsBadge.textContent = `CƠ HỘI: ${remAttempts}/${APP_CONFIG.MAX_WRONG_ATTEMPTS}`;
    attemptsBadge.classList.toggle('hud-attempts-badge--danger', remAttempts <= 1);

    if (sysStatusTextEl) {
      sysStatusTextEl.textContent = `SYSTEM: ${investigationSystem.getSystemStatusText()}`;
    }
  };
  syncHudTelemetry();

  // In-game night-shift clock timer
  const clockInterval = window.setInterval(() => {
    elapsedGameSeconds += 1;
    clockBadge.textContent = `TIME: ${formatInGameClock(elapsedGameSeconds)}`;
  }, 1000);

  // Controls: Mission Log, Sound, Pause
  const controls = document.createElement('div');
  controls.className = 'hud-controls';

  const missionLogBtn = createButton({
    label: 'MISSION LOG',
    variant: 'warm',
    size: 'sm',
    iconSvg: ICONS.TERMINAL,
    ariaLabel: 'Open Mission & Sector Log',
  });

  const hudSoundBtn = createButton({
    label: isSoundOn ? 'SOUND: ON' : 'SOUND: OFF',
    variant: 'ghost',
    size: 'sm',
    iconSvg: isSoundOn ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF,
    ariaLabel: 'Toggle Sound',
    active: isSoundOn,
  });

  const pauseBtn = createButton({
    label: 'PAUSE',
    variant: 'secondary',
    size: 'sm',
    iconSvg: ICONS.PAUSE,
    ariaLabel: 'Open Pause Menu',
  });

  controls.appendChild(missionLogBtn.element);
  controls.appendChild(hudSoundBtn.element);
  controls.appendChild(pauseBtn.element);

  topHud.appendChild(brand);
  topHud.appendChild(telemetryRow);
  topHud.appendChild(controls);

  // =========================================================================
  // 2. CENTER GAME VIEWPORT FRAME & MOBILE D-PAD
  // =========================================================================
  const viewportFrame = document.createElement('div');
  viewportFrame.className = 'game-viewport-frame';

  const topCorners = document.createElement('div');
  topCorners.className = 'viewport-corners';
  topCorners.innerHTML = `
    <span class="hud-current-sector-tag">SECTOR // RECEPTION (KHU VỰC LỄ TÂN)</span>
    <span>WASD / ARROWS: MOVE • [E]: INTERACT • [ESC]: PAUSE</span>
  `;
  const currentSectorTagEl = topCorners.querySelector('.hud-current-sector-tag');

  // Mobile Touch Controls
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

  viewportFrame.appendChild(topCorners);
  viewportFrame.appendChild(mobileControls);

  // =========================================================================
  // 3. BOTTOM INTERACTION HINT BAR
  // =========================================================================
  const bottomHud = document.createElement('footer');
  bottomHud.className = 'game-hud-bottom';

  const DEFAULT_HINT_MESSAGE =
    'Khám phá 6 phòng chức năng của CODEGYM HEADQUARTERS • Tiến lại gần vật thể hoặc Terminal để kiểm tra.';
  const DEFAULT_KEY_HINT = 'Nhấn [E] để Kiểm tra • [ESC] Tạm dừng';

  const interactionDialog = createDialog({
    badge: 'INVESTIGATION SCANNER',
    message: DEFAULT_HINT_MESSAGE,
    keyHint: DEFAULT_KEY_HINT,
  });
  bottomHud.appendChild(interactionDialog.element);

  // =========================================================================
  // 4. MISSION TERMINAL MODAL UI
  // =========================================================================
  const missionUI = createMissionUI();

  // =========================================================================
  // 5. OBJECT INSPECTION MODAL (FOR COMPUTERS, SERVERS, CAMERAS, DESKS, CABINETS, NETWORK, DOORS)
  // =========================================================================
  const inspectionBody = document.createElement('div');
  inspectionBody.className = 'about-list';

  const closeInspectionBtn = createButton({
    label: 'ĐÃ HIỂU [SPACE / ENTER]',
    variant: 'primary',
  });

  const inspectionModal = createModal({
    title: 'SCAN RESULT // KẾT QUẢ KIỂM TRA',
    content: inspectionBody,
    footerButtons: [closeInspectionBtn],
    closeOnBackdrop: true,
    onClose: () => {
      eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: false });
    },
  });

  closeInspectionBtn.element.addEventListener('click', () => {
    inspectionModal.close();
  });

  const openInspectionModal = (target) => {
    const titleEl = inspectionModal.element.querySelector('.bog-modal__title');
    if (titleEl) {
      titleEl.textContent = target.inspectionTitle || `KIỂM TRA // ${target.name}`;
    }
    inspectionBody.innerHTML = `
      <div style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--color-electric-blue); margin-bottom: 8px;">
        PHÂN LOẠI VẬT THỂ: ${target.objectCategory || 'Thiết bị văn phòng'} • MÃ: ${target.code}
      </div>
      <div class="about-highlight" style="line-height: 1.65;">
        ${target.inspectionText || target.hintMessage}
      </div>
    `;
    inspectionModal.open();
    eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: true });
  };

  // =========================================================================
  // 6. MISSION LOG & SECTOR STATUS MODAL
  // =========================================================================
  const missionLogBody = document.createElement('div');
  missionLogBody.className = 'about-list';

  const closeMissionLogBtn = createButton({
    label: 'ĐÓNG NHẬT KÝ',
    variant: 'secondary',
  });

  const missionLogModal = createModal({
    title: 'MISSION LOG // CODEGYM HEADQUARTERS',
    content: missionLogBody,
    footerButtons: [closeMissionLogBtn],
    closeOnBackdrop: true,
    onClose: () => {
      eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: false });
    },
  });

  closeMissionLogBtn.element.addEventListener('click', () => {
    missionLogModal.close();
  });

  const renderMissionLogContent = () => {
    const sectors = investigationSystem.getAllSectorsWithStatus();
    const missions = missionManager.getAllMissions();

    const sectorRowsHtml = sectors
      .map((s) => {
        const badgeColor =
          s.status === SECTOR_STATUS.RESTORED
            ? '#10b981'
            : s.status === SECTOR_STATUS.ANOMALY_DETECTED
              ? '#f43f5e'
              : s.status === SECTOR_STATUS.EXPLORED
                ? '#38bdf8'
                : '#94a3b8';
        return `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 10px; background: rgba(15,23,42,0.75); border: 1px solid rgba(148,163,184,0.2); border-radius: 4px;">
            <div>
              <strong style="color: #fef3c7;">${s.name}</strong>
              <span style="font-size: 0.8rem; color: var(--color-text-secondary);"> — ${s.viName}</span>
            </div>
            <span style="font-family: var(--font-mono); font-size: 0.74rem; font-weight: 700; color: ${badgeColor};">
              [${s.statusLabel.toUpperCase()}]
            </span>
          </div>
        `;
      })
      .join('');

    const missionRowsHtml = missions
      .map(
        (m) => `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 10px; background: rgba(7,11,20,0.65); border-left: 3px solid ${
            m.status === 'COMPLETED' ? '#10b981' : '#fbbf24'
          }; border-radius: 4px;">
            <span><strong>${m.code}:</strong> ${m.title}</span>
            <span style="font-family: var(--font-mono); font-size: 0.74rem; color: ${
              m.status === 'COMPLETED' ? '#10b981' : '#38bdf8'
            };">${m.status}</span>
          </div>
        `
      )
      .join('');

    missionLogBody.innerHTML = `
      <p style="font-size: 0.86rem; color: var(--color-text-secondary); margin-bottom: 8px;">
        <strong>Trạng thái 6 Khu vực trong CODEGYM HEADQUARTERS:</strong>
      </p>
      <div style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px;">
        ${sectorRowsHtml}
      </div>
      <p style="font-size: 0.86rem; color: var(--color-text-secondary); margin-bottom: 8px;">
        <strong>Danh sách Sự cố Hệ thống cần xử lý:</strong>
      </p>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        ${missionRowsHtml}
      </div>
    `;
  };

  missionLogBtn.element.addEventListener('click', () => {
    renderMissionLogContent();
    missionLogModal.open();
    eventBus.emit(EVENTS.GAME_PAUSE_TOGGLED, { paused: true });
  });

  // =========================================================================
  // 7. PAUSE MENU MODAL
  // =========================================================================
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
    label: 'EXIT TO OPENING SCREEN',
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
    if (inspectionModal.isOpen()) {
      inspectionModal.close();
      return;
    }
    if (missionLogModal.isOpen()) {
      missionLogModal.close();
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
      message: isSoundOn
        ? 'Đã bật âm thanh hệ thống (Sound ON).'
        : 'Đã tắt âm thanh hệ thống (Sound OFF).',
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
    investigationSystem.reset();
    syncHudTelemetry();
    interactionDialog.update({
      newBadge: 'INVESTIGATION SCANNER',
      newMessage: DEFAULT_HINT_MESSAGE,
      newKeyHint: DEFAULT_KEY_HINT,
    });
    notification.show({
      message: 'Đã đặt lại tiến trình điều tra và vị trí nhân vật.',
      type: 'success',
    });
    eventBus.emit(EVENTS.GAME_RESTART_REQUESTED);
  });

  exitBtn.element.addEventListener('click', () => {
    pauseModal.close();
    eventBus.emit(EVENTS.GAME_EXIT_REQUESTED);
  });

  // Space / Enter closes the Inspection Modal when open
  const handleShellKeyDown = (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && inspectionModal.isOpen()) {
      e.preventDefault();
      inspectionModal.close();
    }
  };
  window.addEventListener('keydown', handleShellKeyDown);

  // =========================================================================
  // 8. EVENT BUS SUBSCRIPTIONS
  // =========================================================================
  unsubscribers.push(
    eventBus.on(EVENTS.MISSION_UPDATED, () => {
      syncHudTelemetry();
    })
  );

  unsubscribers.push(
    eventBus.on(EVENTS.SECTOR_STATUS_UPDATED, () => {
      syncHudTelemetry();
    })
  );

  unsubscribers.push(
    eventBus.on(EVENTS.SECTOR_CHANGED, ({ sector }) => {
      if (sector && currentSectorTagEl) {
        currentSectorTagEl.textContent = `SECTOR // ${sector.name} (${sector.viName.toUpperCase()})`;
      }
      syncHudTelemetry();
    })
  );

  unsubscribers.push(
    eventBus.on(EVENTS.INTERACTION_TARGET_CHANGED, ({ target }) => {
      if (target) {
        mobileInteractBtn.setDisabled(false);
        const statusSuffix = target.missionId
          ? ` [${missionManager.getMissionStatus(target.missionId)}]`
          : target.objectCategory
            ? ` [${target.objectCategory.toUpperCase()}]`
            : '';
        interactionDialog.update({
          newBadge: `${target.code}${statusSuffix}`,
          newMessage: `${target.name} — ${target.hintMessage}`,
          newKeyHint: 'Nhấn [E] để Kiểm tra',
        });
      } else {
        mobileInteractBtn.setDisabled(true);
        interactionDialog.update({
          newBadge: 'INVESTIGATION SCANNER',
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

      if (target.type === 'prop') {
        openInspectionModal(target);
        return;
      }

      if (target.type === 'npc') {
        const guidance = missionManager.getMentorGuidance();
        interactionDialog.update({
          newBadge: `${target.code} // GUIDANCE`,
          newMessage: guidance,
          newKeyHint: 'Nhấn [E] lần nữa',
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
  shell.appendChild(inspectionModal.element);
  shell.appendChild(missionLogModal.element);
  shell.appendChild(pauseModal.element);

  return {
    element: shell,
    togglePauseMenu() {
      if (missionUI.isOpen()) {
        missionUI.close();
        return;
      }
      if (inspectionModal.isOpen()) {
        inspectionModal.close();
        return;
      }
      if (missionLogModal.isOpen()) {
        missionLogModal.close();
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
      window.clearInterval(clockInterval);
      window.removeEventListener('keydown', handleShellKeyDown);
      unsubscribers.forEach((unsub) => unsub());
      unsubscribers.length = 0;
      shell.remove();
    },
  };
}

export default createGameShell;
