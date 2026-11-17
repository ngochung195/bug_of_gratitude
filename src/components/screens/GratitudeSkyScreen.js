import gsap from 'gsap';
import { APP_CONFIG, UI_SCREENS } from '../../config/constants.js';
import { gratitudeService } from '../../services/GratitudeService.js';
import { gratitudeStorage } from '../../services/GratitudeStorage.js';
import { reactionService } from '../../services/ReactionService.js';
import { audioManager } from '../../systems/AudioManager.js';
import {
  CONSTELLATION_MODES,
  ConstellationEngine,
} from '../../systems/ConstellationEngine.js';
import { GratitudeValidator } from '../../systems/GratitudeValidator.js';
import { ShareCardGenerator } from '../../systems/ShareCardGenerator.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { notification } from '../Notification.js';

function formatDisplayDate(isoStr) {
  if (!isoStr) return '20/11/2026';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '20/11/2026';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function createGratitudeSkyScreen({ onNavigate } = {}) {
  const pageSize = APP_CONFIG.DEFAULT_PAGE_SIZE || 12;
  let currentPage = 1;
  let hasMorePages = false;
  let isLoadingWall = false;
  let wallError = null;
  let mentorQuery = '';
  let wallMessages = [];
  let constellationMessages = [];
  let reactionCounts = {};
  let activeDetailMessage = null;
  let activeShareMessage = null;
  let searchDebounceTimer = null;

  const statsState = {
    totalApprovedMessages: 0,
    totalHeartReactions: 0,
    uniqueMentorsCount: 0,
  };

  const navigateTo = (screenKey) => {
    if (typeof onNavigate === 'function') {
      onNavigate(screenKey);
    }
  };

  const screen = document.createElement('section');
  screen.className = 'gsky-screen';
  screen.setAttribute('aria-label', 'Gratitude Sky');

  const container = document.createElement('div');
  container.className = 'gsky-container';

  // =========================================================================
  // 1. TOP NAVIGATION BAR & HEADER
  // =========================================================================
  const topbar = document.createElement('header');
  topbar.className = 'gsky-topbar';

  const brand = document.createElement('div');
  brand.className = 'gsky-topbar__brand';
  brand.innerHTML = `
    <span class="gsky-topbar__badge">COMMUNITY CONSTELLATION // CODEGYM 20/11/2026</span>
    <h1 class="gsky-topbar__title">GRATITUDE SKY</h1>
    <p class="gsky-topbar__subtitle">
      "Mỗi lời cảm ơn là một vì sao. Khi kết nối lại, chúng ta tạo thành một bầu trời tri ân."
    </p>
  `;

  const topActions = document.createElement('div');
  topActions.className = 'gsky-topbar__actions';

  const rainViewBtn = document.createElement('button');
  rainViewBtn.type = 'button';
  rainViewBtn.className = 'rain-icon-btn';
  rainViewBtn.innerHTML = `${ICONS.SPARKLES}<span>Mưa Tri Ân (Rain)</span>`;
  rainViewBtn.addEventListener('click', () => navigateTo(UI_SCREENS.RAIN_OF_GRATITUDE));

  const openOwnShareBtn = document.createElement('button');
  openOwnShareBtn.type = 'button';
  openOwnShareBtn.className = 'rain-icon-btn is-active';
  openOwnShareBtn.innerHTML = `${ICONS.SHARE}<span>Tạo Thiệp Chia Sẻ</span>`;
  openOwnShareBtn.addEventListener('click', () => {
    const ownLatest = gratitudeStorage.getLatestLetter();
    const targetLetter =
      ownLatest ||
      wallMessages[0] || {
        mentorName: 'Thầy/Cô & Mentor CodeGym',
        senderName: 'Anonymous',
        isAnonymous: true,
        message: 'Cảm ơn Thầy/Cô và các Mentor đã luôn kiên nhẫn đồng hành trên hành trình lập trình!',
      };
    openShareModal(targetLetter);
  });

  const writeNewBtn = createButton({
    label: 'VIẾT LỜI CẢM ƠN',
    variant: 'warm',
    size: 'sm',
    iconSvg: ICONS.MAIL_LETTER,
    onClick: () => navigateTo(UI_SCREENS.GRATITUDE_LETTER),
  });

  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'rain-icon-btn';
  homeBtn.innerHTML = `${ICONS.LOG_OUT}<span>Trang chủ</span>`;
  homeBtn.addEventListener('click', () => navigateTo(UI_SCREENS.INTRO));

  topActions.appendChild(rainViewBtn);
  topActions.appendChild(openOwnShareBtn);
  topActions.appendChild(writeNewBtn.element);
  topActions.appendChild(homeBtn);

  topbar.appendChild(brand);
  topbar.appendChild(topActions);
  container.appendChild(topbar);

  // =========================================================================
  // 2. REAL COMMUNITY STATISTICS SECTION
  // =========================================================================
  const statsGrid = document.createElement('section');
  statsGrid.className = 'gsky-stats-grid';
  statsGrid.setAttribute('aria-label', 'Thống kê cộng đồng thực tế');

  const statApprovedCard = document.createElement('div');
  statApprovedCard.className = 'gsky-stat-card';
  statApprovedCard.innerHTML = `
    <div class="gsky-stat-card__icon">${ICONS.STAR}</div>
    <div>
      <div class="gsky-stat-card__value" data-stat="approved">0</div>
      <div class="gsky-stat-card__label">Tổng lời cảm ơn đã duyệt</div>
    </div>
  `;

  const statHeartsCard = document.createElement('div');
  statHeartsCard.className = 'gsky-stat-card gsky-stat-card--pink';
  statHeartsCard.innerHTML = `
    <div class="gsky-stat-card__icon">${ICONS.HEART_SPARK}</div>
    <div>
      <div class="gsky-stat-card__value" data-stat="hearts">0</div>
      <div class="gsky-stat-card__label">Tổng số lượt thả tim</div>
    </div>
  `;

  const statMentorsCard = document.createElement('div');
  statMentorsCard.className = 'gsky-stat-card gsky-stat-card--blue';
  statMentorsCard.innerHTML = `
    <div class="gsky-stat-card__icon">${ICONS.USERS}</div>
    <div>
      <div class="gsky-stat-card__value" data-stat="mentors">0</div>
      <div class="gsky-stat-card__label">Người nhận được tri ân</div>
    </div>
  `;

  statsGrid.appendChild(statApprovedCard);
  statsGrid.appendChild(statHeartsCard);
  statsGrid.appendChild(statMentorsCard);
  container.appendChild(statsGrid);

  const renderStatsUI = () => {
    statApprovedCard.querySelector('[data-stat="approved"]').textContent = String(
      statsState.totalApprovedMessages
    );
    statHeartsCard.querySelector('[data-stat="hearts"]').textContent = String(
      statsState.totalHeartReactions
    );
    statMentorsCard.querySelector('[data-stat="mentors"]').textContent = String(
      statsState.uniqueMentorsCount
    );
  };

  // =========================================================================
  // 3. CONSTELLATION SECTION (HEART / THANK YOU / MENTORS)
  // =========================================================================
  const constellationSection = document.createElement('section');
  constellationSection.className = 'gsky-constellation-section';
  constellationSection.setAttribute('aria-label', 'Chòm sao tri ân');

  const constellationHeader = document.createElement('div');
  constellationHeader.className = 'gsky-section-header';

  const constellationTitleWrap = document.createElement('div');
  constellationTitleWrap.innerHTML = `
    <h2 class="gsky-section-title">CONSTELLATION OF GRATITUDE</h2>
    <p class="gsky-section-desc">
      Mỗi ngôi sao vàng rực rỡ là một lời cảm ơn đã duyệt. Nhấn vào ngôi sao để đọc hoặc đổi hình chòm sao:
    </p>
  `;

  const modeTabs = document.createElement('div');
  modeTabs.className = 'gsky-mode-tabs';

  const modeConfigs = [
    { key: CONSTELLATION_MODES.HEART, label: '♥ TRÁI TIM' },
    { key: CONSTELLATION_MODES.THANK_YOU, label: '★ THANK YOU' },
    { key: CONSTELLATION_MODES.MENTORS, label: '✦ MENTORS' },
  ];

  const modeButtons = new Map();

  const constellationStage = document.createElement('div');
  constellationStage.className = 'gsky-constellation-stage';

  const constellationCanvas = document.createElement('canvas');
  constellationCanvas.className = 'gsky-constellation-canvas';
  constellationCanvas.setAttribute('aria-label', 'Bản đồ chòm sao tri ân tương tác');
  constellationStage.appendChild(constellationCanvas);

  const constellationLegend = document.createElement('div');
  constellationLegend.className = 'gsky-constellation-legend';
  constellationLegend.innerHTML = `
    <div class="gsky-legend-items">
      <span><i class="gsky-legend-dot gsky-legend-dot--real"></i>Ngôi sao lời cảm ơn đã duyệt (Nhấn để đọc)</span>
      <span><i class="gsky-legend-dot gsky-legend-dot--guide"></i>Điểm mốc dẫn đường chòm sao</span>
    </div>
    <span class="gsky-constellation-status">Đang kết nối các vì sao...</span>
  `;

  const constellationStatusEl = constellationLegend.querySelector(
    '.gsky-constellation-status'
  );

  const constellationEngine = new ConstellationEngine(constellationCanvas, {
    onSelectStar: (msg) => {
      if (msg) {
        openDetailModal(msg);
      }
    },
    onHoverStar: (msg) => {
      if (msg) {
        constellationStatusEl.textContent = `★ Gửi tới: ${msg.mentorName} —Từ: ${msg.publicSenderName || 'Anonymous'} (Nhấn để mở)`;
      } else {
        constellationStatusEl.textContent =
          constellationMessages.length > 0
            ? `Đang thắp sáng ${constellationMessages.length} ngôi sao tri ân trong chòm sao.`
            : 'The sky is waiting for the first THANK YOU.';
      }
    },
  });

  modeConfigs.forEach(({ key, label }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `gsky-mode-btn${key === CONSTELLATION_MODES.HEART ? ' is-active' : ''}`;
    btn.textContent = label;
    btn.addEventListener('click', () => {
      modeButtons.forEach((b, k) => b.classList.toggle('is-active', k === key));
      constellationEngine.setMode(key);
    });
    modeButtons.set(key, btn);
    modeTabs.appendChild(btn);
  });

  constellationHeader.appendChild(constellationTitleWrap);
  constellationHeader.appendChild(modeTabs);

  constellationSection.appendChild(constellationHeader);
  constellationSection.appendChild(constellationStage);
  constellationSection.appendChild(constellationLegend);
  container.appendChild(constellationSection);

  // =========================================================================
  // 4. GRATITUDE WALL SECTION (SEARCH, NEWEST SORT, CARDS & LOAD MORE)
  // =========================================================================
  const wallSection = document.createElement('section');
  wallSection.className = 'gsky-wall-section';
  wallSection.setAttribute('aria-label', 'Gratitude Wall');

  const wallToolbar = document.createElement('div');
  wallToolbar.className = 'gsky-wall-toolbar';

  const wallTitleWrap = document.createElement('div');
  wallTitleWrap.innerHTML = `
    <h2 class="gsky-section-title">GRATITUDE WALL // THƯ VIỆN LỜI TRI ÂN</h2>
    <p class="gsky-section-desc">Danh sách những lời cảm ơn đã được kiểm duyệt công khai từ cộng đồng</p>
  `;

  const wallControls = document.createElement('div');
  wallControls.className = 'gsky-wall-controls';

  const searchBox = document.createElement('div');
  searchBox.className = 'rain-search-box';
  searchBox.innerHTML = `<span class="rain-search-box__icon">${ICONS.SEARCH}</span>`;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'rain-search-input';
  searchInput.placeholder = 'Tìm theo tên người nhận...';
  searchInput.setAttribute('aria-label', 'Tìm kiếm lời cảm ơn theo tên người nhận');
  searchBox.appendChild(searchInput);

  const sortBadge = document.createElement('span');
  sortBadge.className = 'gsky-sort-badge';
  sortBadge.textContent = 'Sắp xếp: Mới nhất ↓';

  wallControls.appendChild(searchBox);
  wallControls.appendChild(sortBadge);

  wallToolbar.appendChild(wallTitleWrap);
  wallToolbar.appendChild(wallControls);

  const wallGrid = document.createElement('div');
  wallGrid.className = 'gsky-wall-grid';

  const wallStatusBox = document.createElement('div');
  wallStatusBox.className = 'gsky-wall-status';
  wallStatusBox.style.display = 'none';

  const loadMoreWrap = document.createElement('div');
  loadMoreWrap.className = 'gsky-load-more-wrap';
  loadMoreWrap.style.display = 'none';

  const loadMoreBtn = createButton({
    label: 'TẢI THÊM LỜI CẢM ƠN (LOAD MORE)',
    variant: 'secondary',
    onClick: () => {
      if (!isLoadingWall && hasMorePages) {
        loadWallPage(currentPage + 1, true);
      }
    },
  });
  loadMoreWrap.appendChild(loadMoreBtn.element);

  wallSection.appendChild(wallToolbar);
  wallSection.appendChild(wallStatusBox);
  wallSection.appendChild(wallGrid);
  wallSection.appendChild(loadMoreWrap);
  container.appendChild(wallSection);

  // =========================================================================
  // 5. CLOSING MESSAGE SECTION
  // =========================================================================
  const closingBanner = document.createElement('footer');
  closingBanner.className = 'gsky-closing-banner';
  closingBanner.setAttribute('aria-label', 'Thông điệp kết thúc');
  closingBanner.innerHTML = `
    <div class="gsky-closing-banner__stars">
      ${ICONS.SPARKLES}
      ${ICONS.STAR}
      ${ICONS.SPARKLES}
    </div>
    <blockquote class="gsky-closing-banner__quote">
      "Chúng ta có thể viết hàng triệu dòng code.<br /><br />
      Nhưng điều đẹp nhất không nằm trong chương trình.<br /><br />
      Đó là những điều tốt đẹp mà Thầy/Cô đã để lại trong hành trình trưởng thành của chúng em."
    </blockquote>
    <div class="gsky-closing-banner__sub">
      BUG OF GRATITUDE // CODEGYM 20/11/2026 — PATCH #005: RESOLVED WITH LOVE
    </div>
  `;
  container.appendChild(closingBanner);
  screen.appendChild(container);

  // =========================================================================
  // 6. EXPANDED LETTER DETAIL MODAL
  // =========================================================================
  const detailBackdrop = document.createElement('div');
  detailBackdrop.className = 'rain-letter-modal-backdrop';
  detailBackdrop.setAttribute('role', 'dialog');
  detailBackdrop.setAttribute('aria-modal', 'true');
  detailBackdrop.setAttribute('aria-label', 'Chi tiết lời cảm ơn');

  const detailCard = document.createElement('article');
  detailCard.className = 'rain-letter-modal';

  const detailCloseBtn = document.createElement('button');
  detailCloseBtn.type = 'button';
  detailCloseBtn.className = 'rain-letter-modal__close';
  detailCloseBtn.innerHTML = ICONS.CLOSE;

  const detailBadge = document.createElement('span');
  detailBadge.className = 'rain-letter-modal__badge';
  detailBadge.textContent = 'GRATITUDE SKY // LỜI CẢM ƠN ĐÃ DUYỆT';

  const detailRecipient = document.createElement('h3');
  detailRecipient.className = 'rain-letter-modal__recipient';

  const detailBody = document.createElement('div');
  detailBody.className = 'rain-letter-modal__body';

  const detailMeta = document.createElement('div');
  detailMeta.className = 'rain-letter-modal__meta';

  const detailSender = document.createElement('span');
  detailSender.className = 'rain-letter-modal__sender';

  const detailDate = document.createElement('span');
  detailDate.className = 'rain-letter-modal__date';

  detailMeta.appendChild(detailSender);
  detailMeta.appendChild(detailDate);

  const detailActions = document.createElement('div');
  detailActions.className = 'rain-letter-modal__actions';

  const detailHeartBtn = document.createElement('button');
  detailHeartBtn.type = 'button';
  detailHeartBtn.className = 'rain-heart-btn';

  const detailShareBtn = document.createElement('button');
  detailShareBtn.type = 'button';
  detailShareBtn.className = 'rain-icon-btn is-active';
  detailShareBtn.innerHTML = `${ICONS.SHARE}<span>Tạo ảnh chia sẻ</span>`;

  detailActions.appendChild(detailHeartBtn);
  detailActions.appendChild(detailShareBtn);

  detailCard.appendChild(detailCloseBtn);
  detailCard.appendChild(detailBadge);
  detailCard.appendChild(detailRecipient);
  detailCard.appendChild(detailBody);
  detailCard.appendChild(detailMeta);
  detailCard.appendChild(detailActions);
  detailBackdrop.appendChild(detailCard);
  screen.appendChild(detailBackdrop);

  // =========================================================================
  // 7. SHARE CARD GENERATOR MODAL (CANVAS 1200x630 + DOWNLOAD + WEB SHARE API)
  // =========================================================================
  const shareBackdrop = document.createElement('div');
  shareBackdrop.className = 'rain-letter-modal-backdrop';
  shareBackdrop.setAttribute('role', 'dialog');
  shareBackdrop.setAttribute('aria-modal', 'true');
  shareBackdrop.setAttribute('aria-label', 'Tạo ảnh chia sẻ lời cảm ơn');

  const shareModal = document.createElement('div');
  shareModal.className = 'gsky-share-modal';

  const shareCloseBtn = document.createElement('button');
  shareCloseBtn.type = 'button';
  shareCloseBtn.className = 'rain-letter-modal__close';
  shareCloseBtn.innerHTML = ICONS.CLOSE;

  const shareHeader = document.createElement('div');
  shareHeader.innerHTML = `
    <span class="rain-letter-modal__badge">SHARE YOUR GRATITUDE // CODEGYM 20/11/2026</span>
    <h3 class="rain-letter-modal__recipient" style="margin-bottom: 4px;">THIỆP CHIA SẺ LỜI TRI ÂN</h3>
    <p class="gsky-section-desc">Tải ảnh chất lượng cao (1200×630 PNG) hoặc chia sẻ trực tiếp lên mạng xã hội.</p>
  `;

  const shareCanvasWrap = document.createElement('div');
  shareCanvasWrap.className = 'gsky-share-canvas-wrap';

  const shareCanvas = document.createElement('canvas');
  shareCanvas.className = 'gsky-share-canvas';
  shareCanvasWrap.appendChild(shareCanvas);

  const shareActions = document.createElement('div');
  shareActions.className = 'gsky-share-actions';

  const downloadImgBtn = createButton({
    label: 'DOWNLOAD IMAGE (PNG)',
    variant: 'secondary',
    iconSvg: ICONS.DOWNLOAD,
    onClick: async () => {
      if (!activeShareMessage) return;
      const res = await ShareCardGenerator.downloadCard(shareCanvas, activeShareMessage);
      if (res.success) {
        audioManager.playSuccess();
        notification.show({
          message: `Đã tải xuống ảnh ${res.fileName}!`,
          type: 'success',
        });
      } else {
        notification.show({
          message: res.error || 'Không thể tải ảnh.',
          type: 'error',
        });
      }
    },
  });

  const webShareBtn = createButton({
    label: 'SHARE CARD',
    variant: 'warm',
    iconSvg: ICONS.SHARE,
    onClick: async () => {
      if (!activeShareMessage) return;
      const res = await ShareCardGenerator.shareCard(shareCanvas, activeShareMessage);
      if (res.method === 'web_share_file' || res.method === 'web_share_text') {
        audioManager.playWarmChime();
        notification.show({
          message: 'Đã mở bảng chia sẻ thành công!',
          type: 'warm',
        });
      } else if (res.method === 'download_fallback') {
        audioManager.playSuccess();
        notification.show({
          message:
            'Trình duyệt không hỗ trợ Web Share API trực tiếp — Đã tự động tải ảnh PNG về máy để bạn chia sẻ!',
          type: 'info',
          duration: 4200,
        });
      }
    },
  });

  shareActions.appendChild(downloadImgBtn.element);
  shareActions.appendChild(webShareBtn.element);

  shareModal.appendChild(shareCloseBtn);
  shareModal.appendChild(shareHeader);
  shareModal.appendChild(shareCanvasWrap);
  shareModal.appendChild(shareActions);
  shareBackdrop.appendChild(shareModal);
  screen.appendChild(shareBackdrop);

  // =========================================================================
  // MODAL & INTERACTION HANDLERS
  // =========================================================================
  const updateDetailHeartBtn = (msg) => {
    if (!msg) return;
    const count = Number(reactionCounts[msg.id] ?? 0);
    const reacted = reactionService.hasUserReacted(msg.id);
    detailHeartBtn.classList.toggle('is-reacted', reacted);
    detailHeartBtn.innerHTML = `${ICONS.HEART_SPARK}<span>${reacted ? 'Đã thả tim' : 'Thả tim'} (${count})</span>`;
  };

  const openDetailModal = (msg) => {
    if (!msg) return;
    activeDetailMessage = msg;

    detailRecipient.textContent = `Kính gửi: ${msg.mentorName}`;
    detailBody.textContent = msg.message;

    const senderDisplay =
      msg.publicSenderName ||
      GratitudeValidator.formatPublicSender({
        senderName: msg.senderName,
        isAnonymous: msg.isAnonymous,
      });

    detailSender.innerHTML = 'Người gửi: <strong></strong>';
    detailSender.querySelector('strong').textContent = senderDisplay;
    detailDate.textContent = `Ngày gửi: ${formatDisplayDate(msg.createdAt)}`;

    updateDetailHeartBtn(msg);
    detailBackdrop.classList.add('is-open');

    gsap.fromTo(
      detailCard,
      { opacity: 0, scale: 0.94, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: 'power2.out' }
    );
  };

  const closeDetailModal = () => {
    detailBackdrop.classList.remove('is-open');
    activeDetailMessage = null;
  };

  detailCloseBtn.addEventListener('click', closeDetailModal);
  detailBackdrop.addEventListener('click', (e) => {
    if (e.target === detailBackdrop) closeDetailModal();
  });

  detailShareBtn.addEventListener('click', () => {
    if (!activeDetailMessage) return;
    const msgToShare = activeDetailMessage;
    closeDetailModal();
    openShareModal(msgToShare);
  });

  const openShareModal = (msg) => {
    if (!msg) return;
    activeShareMessage = msg;
    ShareCardGenerator.renderToCanvas(shareCanvas, msg);
    shareBackdrop.classList.add('is-open');

    gsap.fromTo(
      shareModal,
      { opacity: 0, scale: 0.94, y: 10 },
      { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: 'power2.out' }
    );
  };

  const closeShareModal = () => {
    shareBackdrop.classList.remove('is-open');
    activeShareMessage = null;
  };

  shareCloseBtn.addEventListener('click', closeShareModal);
  shareBackdrop.addEventListener('click', (e) => {
    if (e.target === shareBackdrop) closeShareModal();
  });

  const handleHeartReaction = async (msg, buttonEl = null) => {
    if (!msg || !msg.id) return;
    const res = await reactionService.addHeartReaction(msg.id);
    if (!res.success) {
      notification.show({
        message: res.error || 'Không thể thả tim lúc này.',
        type: 'info',
        duration: 2400,
      });
      return;
    }

    const nextCount = Number(reactionCounts[msg.id] ?? 0) + 1;
    reactionCounts[msg.id] = nextCount;
    statsState.totalHeartReactions += 1;

    audioManager.playHeartReaction();
    renderStatsUI();
    renderWallCards();
    if (activeDetailMessage && activeDetailMessage.id === msg.id) {
      updateDetailHeartBtn(activeDetailMessage);
    }

    if (buttonEl) {
      gsap.fromTo(
        buttonEl,
        { scale: 1.18 },
        { scale: 1, duration: 0.28, ease: 'elastic.out(1.2, 0.4)' }
      );
    }
  };

  detailHeartBtn.addEventListener('click', () => {
    if (activeDetailMessage) {
      handleHeartReaction(activeDetailMessage, detailHeartBtn);
    }
  });

  // =========================================================================
  // RENDER GRATITUDE WALL CARDS
  // =========================================================================
  const renderWallCards = () => {
    wallGrid.innerHTML = '';

    if (isLoadingWall && wallMessages.length === 0) {
      wallStatusBox.style.display = 'block';
      wallStatusBox.innerHTML = `<p>Đang tải danh sách lời cảm ơn từ cơ sở dữ liệu...</p>`;
      loadMoreWrap.style.display = 'none';
      return;
    }

    if (wallError && wallMessages.length === 0) {
      wallStatusBox.style.display = 'block';
      wallStatusBox.innerHTML = `
        <p style="margin-bottom: 12px; color: var(--color-warning);">${wallError}</p>
        <button type="button" class="bog-btn bog-btn--secondary gsky-retry-btn">THỬ TẢI LẠI</button>
      `;
      const retryBtn = wallStatusBox.querySelector('.gsky-retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          loadStatistics();
          loadWallPage(1, false);
        });
      }
      loadMoreWrap.style.display = 'none';
      return;
    }

    if (wallMessages.length === 0) {
      wallStatusBox.style.display = 'block';
      wallStatusBox.innerHTML = `
        <p style="font-family: var(--font-pixel); font-size: 0.85rem; color: #fef3c7; margin-bottom: 8px;">
          "The sky is waiting for the first THANK YOU."
        </p>
        <p style="font-size: 0.88rem;">
          ${
            mentorQuery
              ? `Không tìm thấy lời cảm ơn đã duyệt nào khớp với từ khóa "${mentorQuery}".`
              : 'Chưa có lời cảm ơn nào được duyệt trong cơ sở dữ liệu. Hãy gửi lời cảm ơn đầu tiên!'
          }
        </p>
      `;
      loadMoreWrap.style.display = 'none';
      return;
    }

    wallStatusBox.style.display = 'none';

    wallMessages.forEach((msg) => {
      const card = document.createElement('article');
      card.className = 'gsky-wall-card';

      const topRow = document.createElement('div');
      topRow.className = 'gsky-wall-card__top';

      const mentorEl = document.createElement('h3');
      mentorEl.className = 'gsky-wall-card__mentor';
      mentorEl.textContent = `Gửi tới: ${msg.mentorName}`;

      const dateEl = document.createElement('span');
      dateEl.className = 'gsky-wall-card__date';
      dateEl.textContent = formatDisplayDate(msg.createdAt);

      topRow.appendChild(mentorEl);
      topRow.appendChild(dateEl);

      const messageEl = document.createElement('p');
      messageEl.className = 'gsky-wall-card__message';
      messageEl.textContent = msg.message;

      const senderEl = document.createElement('div');
      senderEl.className = 'gsky-wall-card__sender';
      const senderDisplay =
        msg.publicSenderName ||
        GratitudeValidator.formatPublicSender({
          senderName: msg.senderName,
          isAnonymous: msg.isAnonymous,
        });
      senderEl.innerHTML = 'Người gửi: <strong></strong>';
      senderEl.querySelector('strong').textContent = senderDisplay;

      const footerRow = document.createElement('div');
      footerRow.className = 'gsky-wall-card__footer';

      const cardHeartBtn = document.createElement('button');
      cardHeartBtn.type = 'button';
      const isReacted = reactionService.hasUserReacted(msg.id);
      const count = Number(reactionCounts[msg.id] ?? 0);
      cardHeartBtn.className = `rain-icon-btn${isReacted ? ' is-active' : ''}`;
      cardHeartBtn.innerHTML = `${ICONS.HEART_SPARK}<span>${count}</span>`;
      cardHeartBtn.setAttribute('aria-label', `Thả tim (${count})`);
      cardHeartBtn.addEventListener('click', () => {
        handleHeartReaction(msg, cardHeartBtn);
      });

      const cardActions = document.createElement('div');
      cardActions.className = 'gsky-wall-card__actions';

      const readMoreBtn = document.createElement('button');
      readMoreBtn.type = 'button';
      readMoreBtn.className = 'rain-icon-btn';
      readMoreBtn.textContent = 'Chi tiết';
      readMoreBtn.addEventListener('click', () => openDetailModal(msg));

      const shareCardBtn = document.createElement('button');
      shareCardBtn.type = 'button';
      shareCardBtn.className = 'rain-icon-btn';
      shareCardBtn.innerHTML = `${ICONS.SHARE}<span>Share Card</span>`;
      shareCardBtn.addEventListener('click', () => openShareModal(msg));

      cardActions.appendChild(readMoreBtn);
      cardActions.appendChild(shareCardBtn);

      footerRow.appendChild(cardHeartBtn);
      footerRow.appendChild(cardActions);

      card.appendChild(topRow);
      card.appendChild(messageEl);
      card.appendChild(senderEl);
      card.appendChild(footerRow);

      wallGrid.appendChild(card);
    });

    loadMoreWrap.style.display = hasMorePages ? 'flex' : 'none';
    loadMoreBtn.setDisabled(isLoadingWall);
  };

  // =========================================================================
  // DATA LOADING (STATISTICS, CONSTELLATION & WALL)
  // =========================================================================
  const loadStatistics = async () => {
    const res = await gratitudeService.getCommunityStatistics();
    statsState.totalApprovedMessages = res.totalApprovedMessages || 0;
    statsState.totalHeartReactions = res.totalHeartReactions || 0;
    statsState.uniqueMentorsCount = res.uniqueMentorsCount || 0;
    renderStatsUI();
  };

  const loadWallPage = async (pageToLoad = 1, append = false) => {
    isLoadingWall = true;
    wallError = null;
    renderWallCards();

    const res = await gratitudeService.getApprovedMessages({
      page: pageToLoad,
      pageSize,
      mentorQuery,
    });

    isLoadingWall = false;

    if (res.error && !res.fromCloud && gratitudeService.isCloudAvailable()) {
      wallError = res.error;
    }

    // Strictly enforce isApproved === true
    const fetchedItems = (res.items || []).filter((item) => item && item.isApproved === true);
    currentPage = res.page || pageToLoad;
    hasMorePages = Boolean(res.hasMore);

    if (append) {
      const existingIds = new Set(wallMessages.map((m) => m.id));
      const newUnique = fetchedItems.filter((m) => !existingIds.has(m.id));
      wallMessages = [...wallMessages, ...newUnique];
    } else {
      wallMessages = fetchedItems;
    }

    if (!mentorQuery && pageToLoad === 1) {
      constellationMessages = [...wallMessages];
      constellationEngine.setMessages(constellationMessages);
      constellationStatusEl.textContent =
        constellationMessages.length > 0
          ? `Đang thắp sáng ${constellationMessages.length} ngôi sao tri ân trong chòm sao.`
          : 'The sky is waiting for the first THANK YOU.';
    }

    if (fetchedItems.length > 0) {
      const ids = fetchedItems.map((m) => m.id);
      const countsRes = await reactionService.getReactionCountsForMessages(ids);
      reactionCounts = { ...reactionCounts, ...(countsRes.counts || {}) };
    }

    renderWallCards();
  };

  // Search Input Handler
  searchInput.addEventListener('input', () => {
    if (searchDebounceTimer) {
      window.clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = window.setTimeout(() => {
      mentorQuery = searchInput.value.trim();
      loadWallPage(1, false);
    }, 260);
  });

  // Realtime Subscription
  const unsubscribeRealtime = gratitudeService.subscribeToApprovedMessages({
    onApprovedMessage: async (newApproved) => {
      if (!newApproved || newApproved.isApproved !== true) return;
      loadStatistics();
      if (!mentorQuery || newApproved.mentorName.toLowerCase().includes(mentorQuery.toLowerCase())) {
        if (!wallMessages.some((m) => m.id === newApproved.id)) {
          wallMessages = [newApproved, ...wallMessages];
          constellationMessages = [newApproved, ...constellationMessages];
          constellationEngine.setMessages(constellationMessages);
          renderWallCards();
        }
      }
    },
    onReconnectFallback: () => {
      loadStatistics();
      loadWallPage(1, false);
    },
  });

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (shareBackdrop.classList.contains('is-open')) {
        closeShareModal();
      } else if (detailBackdrop.classList.contains('is-open')) {
        closeDetailModal();
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  window.requestAnimationFrame(() => {
    constellationEngine.mount();
    loadStatistics();
    loadWallPage(1, false);
  });

  return {
    element: screen,
    destroy() {
      if (searchDebounceTimer) {
        window.clearTimeout(searchDebounceTimer);
      }
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof unsubscribeRealtime === 'function') {
        unsubscribeRealtime();
      }
      constellationEngine.destroy();
      screen.remove();
    },
  };
}

export default createGratitudeSkyScreen;
