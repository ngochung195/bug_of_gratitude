import { APP_CONFIG, EVENTS, UI_SCREENS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { audioManager } from '../../systems/AudioManager.js';
import { missionManager } from '../../systems/MissionManager.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { createModal } from '../Modal.js';
import { notification } from '../Notification.js';

export function createIntroScreen({ onNavigate } = {}) {
  const hasSaved = missionManager.hasSavedProgress();
  const completedCount = missionManager.getCompletedCount();

  const screen = document.createElement('section');
  screen.className = 'opening-screen';
  screen.setAttribute('aria-label', 'Opening Screen');

  // 1. CodeGym Office at Night Backdrop (Window Rain + Monitor Glow + Server Racks)
  const backdrop = document.createElement('div');
  backdrop.className = 'office-night-backdrop';
  backdrop.innerHTML = `
    <div class="office-window-wall">
      <div class="office-window-pane"></div>
      <div class="office-window-pane"></div>
      <div class="office-window-pane"></div>
      <div class="office-window-pane"></div>
      <div class="office-rain-layer"></div>
    </div>
    <div class="office-interior-silhouette">
      <div class="office-server-rack">
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
      </div>
      <div class="office-desk-cluster">
        <div class="office-monitor-glow"></div>
        <div class="office-monitor-glow"></div>
        <div class="office-monitor-glow"></div>
      </div>
      <div class="office-server-rack">
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
      </div>
    </div>
  `;

  // 2. Main Opening Card Panel
  const panel = document.createElement('div');
  panel.className = 'opening-panel';

  // Official CodeGym Logo Header (Unaltered aspect ratio & colors)
  const brandHeader = document.createElement('div');
  brandHeader.className = 'opening-brand-header';
  brandHeader.innerHTML = `
    <div class="opening-logo-frame">
      <img
        src="${APP_CONFIG.BRAND_LOGOS.WORDMARK}"
        alt="CodeGym Official Logo"
        class="opening-logo-img"
      />
    </div>
    <span class="opening-shift-badge">NIGHT SHIFT // 23:47 IT SECURITY</span>
  `;

  // Title & Subtitle
  const titleGroup = document.createElement('div');
  titleGroup.className = 'opening-title-group';
  titleGroup.innerHTML = `
    <h1 class="opening-title">
      BUG OF <span class="opening-title__highlight">GRATITUDE</span>
    </h1>
    <p class="opening-subtitle">${APP_CONFIG.SUBTITLE}</p>
  `;

  const synopsis = document.createElement('p');
  synopsis.className = 'opening-synopsis';
  synopsis.textContent =
    'Đêm trực tại trụ sở CodeGym, một hacker bí ẩn bất ngờ xâm nhập mạng nội bộ và để lại lời thách đấu: "Không phải lỗi nào cũng có thể sửa bằng code."';

  // 3. Main Menu Buttons: NEW GAME, CONTINUE (if saved progress), SETTINGS, CREDITS
  const menuActions = document.createElement('div');
  menuActions.className = 'opening-menu-actions';

  const newGameBtn = createButton({
    label: 'NEW GAME',
    variant: 'primary',
    iconSvg: ICONS.PLAY,
    onClick: () => {
      audioManager.playInteract();
      missionManager.resetProgress();
      eventBus.emit(EVENTS.NEW_GAME_REQUESTED);
    },
  });

  if (!hasSaved) {
    newGameBtn.element.classList.add('opening-menu-actions__full');
  }

  menuActions.appendChild(newGameBtn.element);

  if (hasSaved) {
    const continueBtn = createButton({
      label: `CONTINUE (${completedCount}/${APP_CONFIG.TOTAL_MISSIONS})`,
      variant: 'warm',
      iconSvg: ICONS.FAST_FORWARD,
      onClick: () => {
        audioManager.playInteract();
        eventBus.emit(EVENTS.CONTINUE_GAME_REQUESTED);
      },
    });
    menuActions.appendChild(continueBtn.element);
  }

  // Settings Modal
  const settingsContent = document.createElement('div');
  settingsContent.className = 'about-list';

  const renderSettingsBody = () => {
    settingsContent.innerHTML = '';

    const soundRow = document.createElement('div');
    soundRow.style.cssText =
      'display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(148,163,184,0.2);';

    const soundLabel = document.createElement('span');
    soundLabel.innerHTML =
      '<strong>Âm thanh & Nhạc nền công nghệ bí ẩn:</strong><br/><small style="color: var(--color-text-muted);">Hiệu ứng âm thanh Web Audio & nhạc nền ca trực đêm</small>';

    const toggleAudioBtn = createButton({
      label: audioManager.enabled ? 'ĐANG BẬT (ON)' : 'ĐANG TẮT (OFF)',
      variant: audioManager.enabled ? 'warm' : 'secondary',
      size: 'sm',
      iconSvg: audioManager.enabled ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF,
      onClick: () => {
        const next = audioManager.toggleEnabled();
        if (next) {
          audioManager.startMysteryAmbient();
          audioManager.playWarmChime();
        } else {
          audioManager.stopMysteryAmbient();
        }
        renderSettingsBody();
      },
    });

    soundRow.appendChild(soundLabel);
    soundRow.appendChild(toggleAudioBtn.element);
    settingsContent.appendChild(soundRow);

    const resetRow = document.createElement('div');
    resetRow.style.cssText =
      'display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0;';
    resetRow.innerHTML = `
      <span>
        <strong>Dữ liệu tiến trình điều tra:</strong><br/>
        <small style="color: var(--color-text-muted);">Đã khôi phục: ${missionManager.getCompletedCount()}/${APP_CONFIG.TOTAL_MISSIONS} hệ thống</small>
      </span>
    `;
    const clearSaveBtn = createButton({
      label: 'XÓA TIẾN TRÌNH LƯU',
      variant: 'danger',
      size: 'sm',
      iconSvg: ICONS.ROTATE_CCW,
      onClick: () => {
        missionManager.resetProgress();
        notification.show({
          message: 'Đã xóa dữ liệu tiến trình đã lưu.',
          type: 'info',
        });
        settingsModal.close();
        if (typeof onNavigate === 'function') {
          onNavigate(UI_SCREENS.INTRO);
        }
      },
    });
    resetRow.appendChild(clearSaveBtn.element);
    settingsContent.appendChild(resetRow);
  };

  const closeSettingsBtn = createButton({
    label: 'ĐÓNG',
    variant: 'secondary',
  });

  const settingsModal = createModal({
    title: 'SETTINGS // CÀI ĐẶT HỆ THỐNG',
    content: settingsContent,
    footerButtons: [closeSettingsBtn],
  });
  closeSettingsBtn.element.addEventListener('click', () => settingsModal.close());

  const settingsBtn = createButton({
    label: 'SETTINGS',
    variant: 'secondary',
    iconSvg: ICONS.TERMINAL,
    onClick: () => {
      renderSettingsBody();
      settingsModal.open();
    },
  });

  // Credits Modal
  const creditsContent = document.createElement('div');
  creditsContent.className = 'about-list';
  creditsContent.innerHTML = `
    <div style="display: flex; align-items: center; gap: 14px; margin-bottom: 12px;">
      <img
        src="${APP_CONFIG.BRAND_LOGOS.FULL_SLOGAN}"
        alt="CodeGym - Hệ thống đào tạo lập trình hiện đại"
        style="height: 68px; width: auto; object-fit: contain; border-radius: 6px; border: 1px solid rgba(56,189,248,0.4);"
      />
      <div>
        <strong style="color: var(--color-warm-gold-bright); font-size: 1.02rem;">BUG OF GRATITUDE: THE LAST VULNERABILITY</strong>
        <p style="font-size: 0.84rem; color: var(--color-text-secondary); margin-top: 4px;">
          Dự án trò chơi phiêu lưu điều tra 2D & Bầu trời tri ân nhân dịp Ngày Nhà giáo Việt Nam 20/11 tại CodeGym.
        </p>
      </div>
    </div>
    <p><strong>Bối cảnh & Cốt truyện:</strong> Nhập vai chuyên viên IT trực đêm tại trụ sở CodeGym, giải cứu hệ thống khỏi cuộc xâm nhập bí ẩn và khám phá lỗ hổng cuối cùng: <code>BUG #005: MISSING GRATITUDE</code>.</p>
    <div class="about-highlight">
      "Không phải lỗi nào cũng có thể sửa bằng code. Lỗi lớn nhất là đôi khi chúng ta quên nói lời cảm ơn."
    </div>
  `;

  const closeCreditsBtn = createButton({
    label: 'ĐÓNG',
    variant: 'secondary',
  });

  const creditsModal = createModal({
    title: 'CREDITS // CODEGYM 20/11 TRIBUTE',
    content: creditsContent,
    footerButtons: [closeCreditsBtn],
  });
  closeCreditsBtn.element.addEventListener('click', () => creditsModal.close());

  const creditsBtn = createButton({
    label: 'CREDITS',
    variant: 'secondary',
    iconSvg: ICONS.INFO,
    onClick: () => {
      creditsModal.open();
    },
  });

  menuActions.appendChild(settingsBtn.element);
  menuActions.appendChild(creditsBtn.element);

  // Quick Sky Access Row (Preserves direct access to Rain of Gratitude & Gratitude Sky)
  const skyQuickRow = document.createElement('div');
  skyQuickRow.className = 'opening-quick-sky-row';

  const rainQuickBtn = document.createElement('button');
  rainQuickBtn.type = 'button';
  rainQuickBtn.className = 'rain-icon-btn is-active';
  rainQuickBtn.innerHTML = `${ICONS.SPARKLES}<span>Mưa Lời Chúc (Rain of Gratitude)</span>`;
  rainQuickBtn.addEventListener('click', () => {
    if (typeof onNavigate === 'function') {
      onNavigate(UI_SCREENS.RAIN_OF_GRATITUDE);
    }
  });

  const skyQuickBtn = document.createElement('button');
  skyQuickBtn.type = 'button';
  skyQuickBtn.className = 'rain-icon-btn';
  skyQuickBtn.innerHTML = `${ICONS.STAR}<span>Chòm Sao Tri Ân (Gratitude Sky)</span>`;
  skyQuickBtn.addEventListener('click', () => {
    if (typeof onNavigate === 'function') {
      onNavigate(UI_SCREENS.GRATITUDE_SKY);
    }
  });

  skyQuickRow.appendChild(rainQuickBtn);
  skyQuickRow.appendChild(skyQuickBtn);

  panel.appendChild(brandHeader);
  panel.appendChild(titleGroup);
  panel.appendChild(synopsis);
  panel.appendChild(menuActions);
  panel.appendChild(skyQuickRow);

  screen.appendChild(backdrop);
  screen.appendChild(panel);
  screen.appendChild(settingsModal.element);
  screen.appendChild(creditsModal.element);

  return {
    element: screen,
    destroy() {
      screen.remove();
    },
  };
}

export default createIntroScreen;
