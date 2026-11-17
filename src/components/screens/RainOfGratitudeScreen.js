import gsap from 'gsap';
import { APP_CONFIG, UI_SCREENS } from '../../config/constants.js';
import { gratitudeService } from '../../services/GratitudeService.js';
import { reactionService } from '../../services/ReactionService.js';
import { audioManager } from '../../systems/AudioManager.js';
import { GratitudeValidator } from '../../systems/GratitudeValidator.js';
import { RainCanvasEngine } from '../../systems/RainCanvasEngine.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { notification } from '../Notification.js';

function formatShortDate(isoStr) {
  if (!isoStr) return '20/11/2026';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '20/11/2026';
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function createRainOfGratitudeScreen({
  newlySubmittedLetter = null,
  soundEnabled = true,
  onNavigate,
} = {}) {
  let currentPage = 1;
  const pageSize = APP_CONFIG.DEFAULT_PAGE_SIZE || 12;
  let totalApprovedCount = 0;
  let totalPages = 0;
  let currentMentorQuery = '';
  let approvedMessages = [];
  let reactionCounts = {};
  let activeMessage = null;
  let highlightedMessageId = newlySubmittedLetter?.id || null;
  let ambientStartedByUser = false;
  let searchDebounceTimer = null;

  const navigateTo = (screenKey) => {
    if (typeof onNavigate === 'function') {
      onNavigate(screenKey);
    }
  };

  // Root Screen Container
  const screen = document.createElement('section');
  screen.className = 'rain-screen';
  screen.setAttribute('aria-label', 'Rain of Gratitude');

  // 1. Background Interactive Sky Canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'rain-sky-canvas';
  canvas.setAttribute('aria-label', 'Bầu trời lời cảm ơn tương tác');
  screen.appendChild(canvas);

  // 2. Top HUD Bar
  const hudTop = document.createElement('header');
  hudTop.className = 'rain-hud-top';

  const brand = document.createElement('div');
  brand.className = 'rain-brand';

  const badgeRow = document.createElement('div');
  badgeRow.className = 'rain-brand__badge-row';

  const phaseBadge = document.createElement('span');
  phaseBadge.className = 'rain-brand__badge';
  phaseBadge.textContent = 'CODEGYM 20/11 // SKY OF GRATITUDE';

  const countBadge = document.createElement('span');
  countBadge.className = 'rain-brand__counter';
  countBadge.textContent = 'Đang tải bầu trời...';

  badgeRow.appendChild(phaseBadge);
  badgeRow.appendChild(countBadge);

  const titleEl = document.createElement('h1');
  titleEl.className = 'rain-brand__title';
  titleEl.textContent = 'RAIN OF GRATITUDE';

  brand.appendChild(badgeRow);
  brand.appendChild(titleEl);

  // Controls Row (Search + Audio Toggle + Write Another + Home)
  const controls = document.createElement('div');
  controls.className = 'rain-controls';

  const searchBox = document.createElement('div');
  searchBox.className = 'rain-search-box';
  searchBox.innerHTML = `<span class="rain-search-box__icon">${ICONS.SEARCH}</span>`;

  const searchInput = document.createElement('input');
  searchInput.type = 'search';
  searchInput.className = 'rain-search-input';
  searchInput.placeholder = 'Tìm theo tên Mentor...';
  searchInput.setAttribute('aria-label', 'Tìm kiếm lời cảm ơn theo tên Mentor');
  searchBox.appendChild(searchInput);

  // Play Rain of Gratitude BGM (continues seamlessly if already crossfaded from 20/11 letter)
  audioManager.playBGM('rain-of-gratitude', { loop: true, fadeMs: 800 });

  const audioBtn = document.createElement('button');
  audioBtn.type = 'button';
  audioBtn.className = 'rain-icon-btn';
  const updateAudioBtnUI = () => {
    const isOn = audioManager.enabled && !audioManager.muted;
    audioBtn.classList.toggle('is-active', isOn);
    audioBtn.innerHTML = `${isOn ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF}<span>${isOn ? 'Nhạc nền: Bật' : 'Nhạc nền: Tắt'}</span>`;
    audioBtn.setAttribute('aria-pressed', String(isOn));
  };
  updateAudioBtnUI();

  audioBtn.addEventListener('click', () => {
    const isMuted = audioManager.toggleMute();
    if (!isMuted) {
      audioManager.playBGM('rain-of-gratitude', { loop: true, fadeMs: 500 });
      audioManager.playWarmChime();
    }
    updateAudioBtnUI();
  });

  const writeBtn = createButton({
    label: 'VIẾT LỜI CẢM ƠN',
    variant: 'warm',
    size: 'sm',
    iconSvg: ICONS.MAIL_LETTER,
    onClick: () => navigateTo(UI_SCREENS.GRATITUDE_LETTER),
  });

  const skyWallBtn = document.createElement('button');
  skyWallBtn.type = 'button';
  skyWallBtn.className = 'rain-icon-btn is-active';
  skyWallBtn.innerHTML = `${ICONS.STAR}<span>Gratitude Sky</span>`;
  skyWallBtn.addEventListener('click', () => navigateTo(UI_SCREENS.GRATITUDE_SKY));

  const homeBtn = document.createElement('button');
  homeBtn.type = 'button';
  homeBtn.className = 'rain-icon-btn';
  homeBtn.innerHTML = `${ICONS.LOG_OUT}<span>Trang chủ</span>`;
  homeBtn.addEventListener('click', () => navigateTo(UI_SCREENS.INTRO));

  controls.appendChild(searchBox);
  controls.appendChild(audioBtn);
  controls.appendChild(skyWallBtn);
  controls.appendChild(writeBtn.element);
  controls.appendChild(homeBtn);

  hudTop.appendChild(brand);
  hudTop.appendChild(controls);
  screen.appendChild(hudTop);

  // 3. Center Stage (Newly Submitted Banner + Empty State)
  const centerStage = document.createElement('div');
  centerStage.className = 'rain-center-stage';

  let ownBannerEl = null;
  if (newlySubmittedLetter && newlySubmittedLetter.mentorName) {
    ownBannerEl = document.createElement('button');
    ownBannerEl.type = 'button';
    ownBannerEl.className = 'rain-own-letter-banner';
    ownBannerEl.innerHTML = `
      <span class="rain-own-letter-banner__dot"></span>
      <span>✨ Lời chúc bạn gửi tới <strong></strong> đã tỏa sáng trên bầu trời chung (Nhấn để xem)</span>
    `;
    ownBannerEl.querySelector('strong').textContent = newlySubmittedLetter.mentorName;
    ownBannerEl.addEventListener('click', () => {
      openLetterModal({
        ...newlySubmittedLetter,
        publicSenderName: GratitudeValidator.formatPublicSender(newlySubmittedLetter),
        isOwnPending: false,
      });
    });
    centerStage.appendChild(ownBannerEl);
  }

  // Empty State Component (Strictly no fake data!)
  const emptyStateEl = document.createElement('div');
  emptyStateEl.className = 'rain-empty-state';
  emptyStateEl.style.display = 'none';
  emptyStateEl.innerHTML = `
    <div class="rain-empty-state__icon">${ICONS.SPARKLES}</div>
    <h2 class="rain-empty-state__title">"The sky is waiting for the first THANK YOU."</h2>
    <p class="rain-empty-state__desc">
      Chưa có lời cảm ơn công khai nào được duyệt hiển thị ở bộ lọc hiện tại. Hãy là người thắp sáng vì sao tri ân tiếp theo trên bầu trời!
    </p>
  `;
  const emptyWriteBtn = createButton({
    label: 'GỬI LỜI CẢM ƠN NGAY',
    variant: 'warm',
    iconSvg: ICONS.SEND,
    onClick: () => navigateTo(UI_SCREENS.GRATITUDE_LETTER),
  });
  emptyStateEl.appendChild(emptyWriteBtn.element);
  centerStage.appendChild(emptyStateEl);

  screen.appendChild(centerStage);

  // 4. Desktop Hover Tooltip
  const hoverTooltip = document.createElement('div');
  hoverTooltip.className = 'rain-hover-tooltip';
  hoverTooltip.setAttribute('aria-hidden', 'true');
  hoverTooltip.innerHTML = `
    <div class="rain-hover-tooltip__mentor"></div>
    <div class="rain-hover-tooltip__snippet"></div>
    <div class="rain-hover-tooltip__meta"></div>
  `;
  screen.appendChild(hoverTooltip);

  // 5. Bottom Constellation Strip & Pagination
  const hudBottom = document.createElement('footer');
  hudBottom.className = 'rain-hud-bottom';

  const dockHeader = document.createElement('div');
  dockHeader.className = 'rain-dock-header';

  const dockHint = document.createElement('span');
  dockHint.className = 'rain-dock-hint';
  dockHint.textContent =
    'Chạm vào các lá thư đang trôi trên bầu trời hoặc chọn bên dưới để đọc nội dung & thả tim:';

  const paginationWrap = document.createElement('div');
  paginationWrap.className = 'rain-pagination';
  paginationWrap.style.display = 'none';

  const prevPageBtn = document.createElement('button');
  prevPageBtn.type = 'button';
  prevPageBtn.className = 'rain-icon-btn';
  prevPageBtn.innerHTML = `${ICONS.CHEVRON_LEFT}<span>Trước</span>`;

  const pageInfoEl = document.createElement('span');
  pageInfoEl.textContent = '1 / 1';

  const nextPageBtn = document.createElement('button');
  nextPageBtn.type = 'button';
  nextPageBtn.className = 'rain-icon-btn';
  nextPageBtn.innerHTML = `<span>Sau</span>${ICONS.CHEVRON_RIGHT}`;

  paginationWrap.appendChild(prevPageBtn);
  paginationWrap.appendChild(pageInfoEl);
  paginationWrap.appendChild(nextPageBtn);

  dockHeader.appendChild(dockHint);
  dockHeader.appendChild(paginationWrap);

  const constellationStrip = document.createElement('div');
  constellationStrip.className = 'rain-constellation-strip';
  constellationStrip.setAttribute('role', 'list');

  hudBottom.appendChild(dockHeader);
  hudBottom.appendChild(constellationStrip);
  screen.appendChild(hudBottom);

  // 6. Expanded Letter Reader Modal
  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'rain-letter-modal-backdrop';
  modalBackdrop.setAttribute('role', 'dialog');
  modalBackdrop.setAttribute('aria-modal', 'true');
  modalBackdrop.setAttribute('aria-label', 'Chi tiết lá thư tri ân');

  const modalCard = document.createElement('article');
  modalCard.className = 'rain-letter-modal';

  const modalCloseBtn = document.createElement('button');
  modalCloseBtn.type = 'button';
  modalCloseBtn.className = 'rain-letter-modal__close';
  modalCloseBtn.setAttribute('aria-label', 'Đóng thư');
  modalCloseBtn.innerHTML = ICONS.CLOSE;

  const modalBadge = document.createElement('span');
  modalBadge.className = 'rain-letter-modal__badge';

  const modalRecipient = document.createElement('h3');
  modalRecipient.className = 'rain-letter-modal__recipient';

  const modalBody = document.createElement('div');
  modalBody.className = 'rain-letter-modal__body';

  const modalMeta = document.createElement('div');
  modalMeta.className = 'rain-letter-modal__meta';

  const modalSender = document.createElement('span');
  modalSender.className = 'rain-letter-modal__sender';

  const modalDate = document.createElement('span');
  modalDate.className = 'rain-letter-modal__date';

  modalMeta.appendChild(modalSender);
  modalMeta.appendChild(modalDate);

  const modalActions = document.createElement('div');
  modalActions.className = 'rain-letter-modal__actions';

  const heartBtn = document.createElement('button');
  heartBtn.type = 'button';
  heartBtn.className = 'rain-heart-btn';

  const closeActionBtn = document.createElement('button');
  closeActionBtn.type = 'button';
  closeActionBtn.className = 'rain-icon-btn';
  closeActionBtn.textContent = 'Đóng cửa sổ';

  modalActions.appendChild(heartBtn);
  modalActions.appendChild(closeActionBtn);

  modalCard.appendChild(modalCloseBtn);
  modalCard.appendChild(modalBadge);
  modalCard.appendChild(modalRecipient);
  modalCard.appendChild(modalBody);
  modalCard.appendChild(modalMeta);
  modalCard.appendChild(modalActions);
  modalBackdrop.appendChild(modalCard);
  screen.appendChild(modalBackdrop);

  // Initialize Canvas Engine
  const canvasEngine = new RainCanvasEngine(canvas, {
    onSelectNode: (msg) => {
      if (msg) {
        openLetterModal(msg);
      }
    },
    onHoverNode: (msg, node) => {
      if (!msg || !node) {
        hoverTooltip.classList.remove('is-visible');
        return;
      }
      hoverTooltip.querySelector('.rain-hover-tooltip__mentor').textContent =
        `Gửi tới: ${msg.mentorName}`;
      hoverTooltip.querySelector('.rain-hover-tooltip__snippet').textContent = msg.message;
      const hearts = Number(reactionCounts[msg.id] ?? 0);
      hoverTooltip.querySelector('.rain-hover-tooltip__meta').textContent =
        `Từ: ${msg.publicSenderName || 'Anonymous'} • ❤️ ${hearts}`;

      const rect = canvas.getBoundingClientRect();
      hoverTooltip.style.left = `${rect.left + node.x}px`;
      hoverTooltip.style.top = `${rect.top + node.y}px`;
      hoverTooltip.classList.add('is-visible');
    },
  });

  // Update Modal Heart Button UI
  const updateHeartButtonUI = (msg) => {
    if (!msg) return;
    const count = Number(reactionCounts[msg.id] ?? msg.reactionCount ?? 0);
    const alreadyReacted = reactionService.hasUserReacted(msg.id);

    heartBtn.classList.toggle('is-reacted', alreadyReacted);
    heartBtn.disabled = false;
    heartBtn.innerHTML = `
      ${ICONS.HEART_SPARK}
      <span>${alreadyReacted ? 'Đã thả tim' : 'Thả tim tri ân'} (${count})</span>
    `;
  };

  // Open Expanded Letter Modal
  const openLetterModal = (msg) => {
    if (!msg) return;
    activeMessage = msg;
    canvasEngine.setSelectedNodeId(msg.id);
    renderConstellationStrip();

    modalBadge.textContent =
      newlySubmittedLetter && msg.id === newlySubmittedLetter.id
        ? 'NGÔI SAO CỦA BẠN // ĐÃ TỎA SÁNG TRÊN BẦU TRỜI CHUNG'
        : 'GRATITUDE STAR // LỜI TRI ÂN TRÊN BẦU TRỜI CHUNG';
    modalRecipient.textContent = `Kính gửi: ${msg.mentorName}`;
    modalBody.textContent = msg.message;

    const senderDisplay =
      msg.publicSenderName ||
      GratitudeValidator.formatPublicSender({
        senderName: msg.senderName,
        isAnonymous: msg.isAnonymous,
      });

    modalSender.innerHTML = 'Người gửi: <strong></strong>';
    modalSender.querySelector('strong').textContent = senderDisplay;
    modalDate.textContent = `Ngày gửi: ${formatShortDate(msg.createdAt)}`;

    updateHeartButtonUI(msg);

    modalBackdrop.classList.add('is-open');
    gsap.fromTo(
      modalCard,
      { opacity: 0, scale: 0.92, y: 12 },
      { opacity: 1, scale: 1, y: 0, duration: 0.24, ease: 'back.out(1.4)' }
    );
  };

  const closeLetterModal = () => {
    modalBackdrop.classList.remove('is-open');
    activeMessage = null;
    canvasEngine.setSelectedNodeId(null);
    renderConstellationStrip();
  };

  modalCloseBtn.addEventListener('click', closeLetterModal);
  closeActionBtn.addEventListener('click', closeLetterModal);
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) {
      closeLetterModal();
    }
  });

  // Heart Reaction Click Handler
  heartBtn.addEventListener('click', async () => {
    if (!activeMessage) return;
    const msgId = activeMessage.id;

    const res = await reactionService.addHeartReaction(msgId);
    if (!res.success) {
      notification.show({
        message: res.error || 'Không thể thả tim lúc này.',
        type: 'info',
        duration: 2400,
      });
      return;
    }

    const nextCount = Number(reactionCounts[msgId] ?? activeMessage.reactionCount ?? 0) + 1;
    reactionCounts[msgId] = nextCount;

    audioManager.playHeartReaction();
    canvasEngine.updateReactionCount(msgId, nextCount);
    canvasEngine.triggerHeartBurst(msgId);
    updateHeartButtonUI(activeMessage);
    renderConstellationStrip();

    gsap.fromTo(
      heartBtn,
      { scale: 1.18 },
      { scale: 1, duration: 0.3, ease: 'elastic.out(1.2, 0.4)' }
    );
  });

  // Render Bottom Constellation Strip & Sky Nodes
  const syncSkyAndDock = () => {
    const skyList = [...approvedMessages];

    if (
      newlySubmittedLetter &&
      newlySubmittedLetter.id &&
      !skyList.some((m) => m.id === newlySubmittedLetter.id)
    ) {
      skyList.unshift({
        ...newlySubmittedLetter,
        publicSenderName: GratitudeValidator.formatPublicSender(newlySubmittedLetter),
        isApproved: true,
      });
    }

    const hasApprovedMessages = skyList.length > 0;
    emptyStateEl.style.display = hasApprovedMessages ? 'none' : 'block';

    countBadge.textContent = `${Math.max(totalApprovedCount, skyList.length)} LỜI CHÚC TRÊN BẦU TRỜI CHUNG`;

    if (totalPages > 1) {
      paginationWrap.style.display = 'inline-flex';
      pageInfoEl.textContent = `Trang ${currentPage} / ${totalPages}`;
      prevPageBtn.disabled = currentPage <= 1;
      nextPageBtn.disabled = currentPage >= totalPages;
    } else {
      paginationWrap.style.display = 'none';
    }

    canvasEngine.setMessages(skyList, {
      highlightMessageId: highlightedMessageId,
      reactionCounts,
    });

    renderConstellationStrip(skyList);
  };

  const renderConstellationStrip = (listOverride = null) => {
    const list = listOverride || approvedMessages;
    constellationStrip.innerHTML = '';

    if (list.length === 0) {
      const emptyHint = document.createElement('span');
      emptyHint.className = 'rain-dock-hint';
      emptyHint.style.opacity = '0.7';
      emptyHint.textContent = 'Hãy gửi lời chúc đầu tiên lên bầu trời chung...';
      constellationStrip.appendChild(emptyHint);
      return;
    }

    list.forEach((msg) => {
      const isOwn = Boolean(newlySubmittedLetter && msg.id === newlySubmittedLetter.id);
      const pill = document.createElement('button');
      pill.type = 'button';
      pill.className = 'rain-star-pill';
      pill.setAttribute('role', 'listitem');
      if (isOwn) {
        pill.classList.add('rain-star-pill--own');
      }
      if (activeMessage && activeMessage.id === msg.id) {
        pill.classList.add('is-selected');
      }

      const mentorSpan = document.createElement('span');
      mentorSpan.className = 'rain-star-pill__mentor';
      mentorSpan.textContent = isOwn
        ? `★ [Thư của bạn] → ${msg.mentorName}`
        : `★ Gửi: ${msg.mentorName}`;

      const heartsSpan = document.createElement('span');
      heartsSpan.className = 'rain-star-pill__hearts';
      heartsSpan.textContent = `❤️ ${Number(reactionCounts[msg.id] ?? msg.reactionCount ?? 0)}`;

      pill.appendChild(mentorSpan);
      pill.appendChild(heartsSpan);

      pill.addEventListener('click', () => {
        openLetterModal(msg);
      });

      constellationStrip.appendChild(pill);
    });
  };

  // Load Approved Messages & Reaction Counts from Supabase
  const loadSkyData = async () => {
    const pageResult = await gratitudeService.getApprovedMessages({
      page: currentPage,
      pageSize,
      mentorQuery: currentMentorQuery,
    });

    // Strictly filter isApproved === true as defense-in-depth
    approvedMessages = (pageResult.items || []).filter((item) => item && item.isApproved === true);
    totalApprovedCount = pageResult.totalCount || approvedMessages.length;
    totalPages = pageResult.totalPages || 0;

    if (approvedMessages.length > 0) {
      const ids = approvedMessages.map((m) => m.id);
      const countRes = await reactionService.getReactionCountsForMessages(ids);
      reactionCounts = { ...reactionCounts, ...(countRes.counts || {}) };
    }

    syncSkyAndDock();
  };

  // Search Input Handler (Debounced)
  searchInput.addEventListener('input', () => {
    if (searchDebounceTimer) {
      window.clearTimeout(searchDebounceTimer);
    }
    searchDebounceTimer = window.setTimeout(() => {
      currentMentorQuery = searchInput.value.trim();
      currentPage = 1;
      loadSkyData();
    }, 260);
  });

  // Pagination Handlers
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage -= 1;
      loadSkyData();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage += 1;
      loadSkyData();
    }
  });

  // Realtime Subscription for Newly Approved Messages
  const unsubscribeRealtime = gratitudeService.subscribeToApprovedMessages({
    onApprovedMessage: async (newApprovedMsg) => {
      if (!newApprovedMsg || newApprovedMsg.isApproved !== true) return;

      const exists = approvedMessages.some((m) => m.id === newApprovedMsg.id);
      if (!exists) {
        approvedMessages = [newApprovedMsg, ...approvedMessages].slice(0, pageSize);
        totalApprovedCount += 1;
      }

      highlightedMessageId = newApprovedMsg.id;
      const singleReaction = await reactionService.getReactionCount(newApprovedMsg.id);
      reactionCounts[newApprovedMsg.id] = singleReaction.count || 0;

      syncSkyAndDock();
      notification.show({
        message: `Một lời cảm ơn gửi tới ${newApprovedMsg.mentorName} vừa xuất hiện trên bầu trời!`,
        type: 'warm',
        duration: 3800,
      });
    },
    onReconnectFallback: () => {
      loadSkyData();
    },
  });

  // Keyboard Escape to close modal
  const handleKeyDown = (event) => {
    if (event.key === 'Escape' && modalBackdrop.classList.contains('is-open')) {
      closeLetterModal();
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // Mount Canvas & Fetch Initial Approved Messages
  window.requestAnimationFrame(() => {
    canvasEngine.mount();
    loadSkyData();
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
      canvasEngine.destroy();
      screen.remove();
    },
  };
}

export default createRainOfGratitudeScreen;

