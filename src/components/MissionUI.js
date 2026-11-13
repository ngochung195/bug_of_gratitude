import { APP_CONFIG, EVENTS, MISSION_STATUS } from '../config/constants.js';
import { eventBus } from '../core/EventBus.js';
import { audioManager } from '../systems/AudioManager.js';
import { missionManager } from '../systems/MissionManager.js';
import { ICONS } from '../utils/icons.js';
import { createButton } from './Button.js';
import { createModal } from './Modal.js';
import { notification } from './Notification.js';

export function createMissionUI() {
  let activeMission = null;
  let selectedOptionId = '';
  let quizAnswers = {};
  let optionMap = new Map();
  let patchInputElement = null;

  const bodyContainer = document.createElement('div');

  const retryBtn = createButton({
    label: 'LÀM LẠI CÂU NÀY',
    variant: 'warm',
    iconSvg: ICONS.ROTATE_CCW,
  });
  retryBtn.element.style.display = 'none';

  const submitBtn = createButton({
    label: 'VERIFY & PATCH',
    variant: 'primary',
    iconSvg: ICONS.TERMINAL,
  });

  const closeBtn = createButton({
    label: 'ĐÓNG',
    variant: 'secondary',
  });

  const modal = createModal({
    title: 'TERMINAL DEBUGGER',
    content: bodyContainer,
    footerButtons: [closeBtn, retryBtn, submitBtn],
    closeOnBackdrop: false,
    onClose: () => {
      if (activeMission && activeMission.status === MISSION_STATUS.IN_PROGRESS) {
        missionManager.cancelInProgress(activeMission.id);
      }
      activeMission = null;
      eventBus.emit(EVENTS.MISSION_MODAL_TOGGLED, { isOpen: false });
    },
  });

  modal.element.classList.add('bog-modal-backdrop--mission');
  const titleEl = modal.element.querySelector('.bog-modal__title');

  closeBtn.element.addEventListener('click', () => {
    modal.close();
  });

  const clearOptionMarkers = () => {
    optionMap.forEach((btn) => {
      btn.classList.remove('is-wrong', 'is-correct');
      const oldTag = btn.querySelector('.mission-option__tag');
      if (oldTag) oldTag.remove();
    });
  };

  const markOptionBadge = (btn, type, text) => {
    if (!btn) return;
    btn.classList.remove('is-selected');
    btn.classList.add(type === 'wrong' ? 'is-wrong' : 'is-correct');
    const oldTag = btn.querySelector('.mission-option__tag');
    if (oldTag) oldTag.remove();

    const tag = document.createElement('span');
    tag.className = `mission-option__tag mission-option__tag--${type}`;
    tag.textContent = text;
    btn.appendChild(tag);
  };

  const renderCodeFixMission = (mission, feedbackBanner) => {
    // 1. Code Editor Box
    const codeBox = document.createElement('div');
    codeBox.className = 'mission-code-box';

    const codeHeader = document.createElement('div');
    codeHeader.className = 'mission-code-box__header';
    codeHeader.innerHTML = `
      <span>FILE // ${mission.code.replace(/\s+/g, '_')}.java</span>
      <span>LINE ${mission.errorLine}: ANOMALY DETECTED</span>
    `;

    const codeLines = document.createElement('div');
    codeLines.className = 'mission-code-lines';

    mission.codeSnippet.forEach((lineText, idx) => {
      const lineNum = idx + 1;
      const lineRow = document.createElement('div');
      lineRow.className = `mission-code-line ${
        lineNum === mission.errorLine ? 'mission-code-line--error' : ''
      }`.trim();

      const numSpan = document.createElement('span');
      numSpan.className = 'mission-code-line__num';
      numSpan.textContent = String(lineNum);

      const codeSpan = document.createElement('span');
      codeSpan.textContent = lineText;

      lineRow.appendChild(numSpan);
      lineRow.appendChild(codeSpan);
      codeLines.appendChild(lineRow);
    });

    codeBox.appendChild(codeHeader);
    codeBox.appendChild(codeLines);
    bodyContainer.appendChild(codeBox);

    // 2. Question prompt
    const questionEl = document.createElement('p');
    questionEl.className = 'mission-question-label';
    questionEl.textContent = mission.question;
    bodyContainer.appendChild(questionEl);

    // 3. Multiple choice options
    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'mission-options';

    const optionButtons = [];

    mission.options.forEach((opt, idx) => {
      const optBtn = document.createElement('button');
      optBtn.type = 'button';
      optBtn.className = 'mission-option';
      const letter = String.fromCharCode(65 + idx);

      optBtn.innerHTML = `
        <span class="mission-option__radio">${letter}</span>
        <span class="mission-option__text"></span>
      `;
      optBtn.querySelector('.mission-option__text').textContent = opt.label;

      if (mission.status === MISSION_STATUS.COMPLETED && opt.isCorrect) {
        markOptionBadge(optBtn, 'correct', 'ĐÁP ÁN ĐÚNG');
      }

      optBtn.addEventListener('click', () => {
        if (
          activeMission?.status === MISSION_STATUS.COMPLETED ||
          missionManager.isOutOfAttempts()
        ) {
          return;
        }
        selectedOptionId = opt.id;
        clearOptionMarkers();
        optionButtons.forEach((b) => b.classList.remove('is-selected'));
        optBtn.classList.add('is-selected');
        feedbackBanner.classList.remove('is-visible');
        retryBtn.element.style.display = 'none';
      });

      optionMap.set(opt.id, optBtn);
      optionButtons.push(optBtn);
      optionsWrap.appendChild(optBtn);
    });

    bodyContainer.appendChild(optionsWrap);

    // 4. Optional Direct Code Patch Input
    const inputGroup = document.createElement('div');
    inputGroup.className = 'mission-input-group';

    const inputLabel = document.createElement('label');
    inputLabel.className = 'mission-input-label';
    const inputId = `mission-patch-input-${mission.id}`;
    inputLabel.setAttribute('for', inputId);
    inputLabel.textContent = 'TERMINAL PATCH INPUT (Tùy chọn nhập lệnh trực tiếp):';

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.id = inputId;
    textInput.className = 'mission-text-input';
    textInput.placeholder = mission.inputPlaceholder || 'Nhập câu lệnh sửa lỗi...';
    textInput.disabled =
      mission.status === MISSION_STATUS.COMPLETED || missionManager.isOutOfAttempts();

    textInput.addEventListener('input', () => {
      clearOptionMarkers();
      feedbackBanner.classList.remove('is-visible');
      retryBtn.element.style.display = 'none';
    });

    patchInputElement = textInput;

    inputGroup.appendChild(inputLabel);
    inputGroup.appendChild(textInput);
    bodyContainer.appendChild(inputGroup);

    return {
      getPayload: () => ({
        selectedOptionId,
        textInput: textInput.value,
      }),
      resetSelection: () => {
        selectedOptionId = '';
        textInput.value = '';
        clearOptionMarkers();
        optionButtons.forEach((b) => b.classList.remove('is-selected'));
      },
    };
  };

  const renderMentorQuizMission = (mission, feedbackBanner) => {
    quizAnswers = {};
    const allGroupButtons = [];

    mission.questions.forEach((q, qIdx) => {
      const block = document.createElement('div');
      block.className = 'mission-quiz-block';

      const quote = document.createElement('blockquote');
      quote.className = 'mission-quiz-quote';
      quote.textContent = q.quote;

      const prompt = document.createElement('p');
      prompt.className = 'mission-question-label';
      prompt.textContent = `Câu ${qIdx + 1}: ${q.prompt}`;

      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'mission-options';

      const qOptionButtons = [];

      q.options.forEach((opt, oIdx) => {
        const optBtn = document.createElement('button');
        optBtn.type = 'button';
        optBtn.className = 'mission-option';
        optBtn.style.fontFamily = 'var(--font-sans)';
        const letter = String.fromCharCode(65 + oIdx);

        optBtn.innerHTML = `
          <span class="mission-option__radio">${letter}</span>
          <span class="mission-option__text"></span>
        `;
        optBtn.querySelector('.mission-option__text').textContent = opt.label;

        if (mission.status === MISSION_STATUS.COMPLETED && opt.isCorrect) {
          markOptionBadge(optBtn, 'correct', 'ĐÁP ÁN ĐÚNG');
        }

        optBtn.addEventListener('click', () => {
          if (
            activeMission?.status === MISSION_STATUS.COMPLETED ||
            missionManager.isOutOfAttempts()
          ) {
            return;
          }
          quizAnswers[q.id] = opt.id;
          qOptionButtons.forEach((b) => {
            b.classList.remove('is-selected', 'is-wrong');
            const oldTag = b.querySelector('.mission-option__tag');
            if (oldTag) oldTag.remove();
          });
          optBtn.classList.add('is-selected');
          feedbackBanner.classList.remove('is-visible');
          retryBtn.element.style.display = 'none';
        });

        optionMap.set(opt.id, optBtn);
        qOptionButtons.push(optBtn);
        allGroupButtons.push(optBtn);
        optionsWrap.appendChild(optBtn);
      });

      block.appendChild(quote);
      block.appendChild(prompt);
      block.appendChild(optionsWrap);
      bodyContainer.appendChild(block);
    });

    return {
      getPayload: () => ({
        answers: quizAnswers,
      }),
      resetSelection: () => {
        quizAnswers = {};
        clearOptionMarkers();
        allGroupButtons.forEach((b) => b.classList.remove('is-selected'));
      },
    };
  };

  let currentHandler = {
    getPayload: () => ({}),
    resetSelection: () => {},
  };

  const triggerGameResetFromExhaustedAttempts = () => {
    modal.close();
    missionManager.resetProgress();
    eventBus.emit(EVENTS.GAME_RESTART_REQUESTED);
    notification.show({
      message:
        'Đã reset trò chơi! Toàn bộ tiến trình trở về 0/4 và khôi phục 3/3 cơ hội trả lời.',
      type: 'warm',
      duration: 4000,
    });
  };

  const openMission = (missionId) => {
    const startResult = missionManager.startMission(missionId);
    if (!startResult.canOpen) {
      audioManager.playError();
      notification.show({
        message: startResult.reason,
        type: 'warm',
      });
      return;
    }

    const mission = startResult.mission;
    activeMission = mission;
    selectedOptionId = '';
    quizAnswers = {};
    optionMap = new Map();
    patchInputElement = null;
    retryBtn.element.style.display = 'none';

    if (titleEl) {
      titleEl.textContent = `${mission.code} // ${mission.title}`;
    }

    bodyContainer.innerHTML = '';

    // Meta bar with Remaining Attempts counter
    const isCompleted = mission.status === MISSION_STATUS.COMPLETED;
    const remaining = missionManager.getRemainingAttempts();
    const maxAttempts = APP_CONFIG.MAX_WRONG_ATTEMPTS;

    const metaBar = document.createElement('div');
    metaBar.className = 'mission-meta-bar';
    metaBar.innerHTML = `
      <span class="mission-meta-bar__topic">TOPIC: ${mission.topic}</span>
      <div class="mission-meta-bar__badges">
        <span class="mission-meta-bar__attempts ${
          remaining <= 1 ? 'mission-meta-bar__attempts--danger' : ''
        }">CƠ HỘI CÒN LẠI: ${remaining}/${maxAttempts}</span>
        <span class="mission-meta-bar__status ${
          isCompleted ? 'mission-meta-bar__status--completed' : ''
        }">STATUS: ${mission.status}</span>
      </div>
    `;
    bodyContainer.appendChild(metaBar);

    const updateAttemptsBadge = () => {
      const rem = missionManager.getRemainingAttempts();
      const badge = metaBar.querySelector('.mission-meta-bar__attempts');
      if (badge) {
        badge.textContent = `CƠ HỘI CÒN LẠI: ${rem}/${maxAttempts}`;
        badge.classList.toggle('mission-meta-bar__attempts--danger', rem <= 1);
      }
    };

    // Story description
    const storyEl = document.createElement('p');
    storyEl.className = 'mission-story';
    storyEl.textContent = mission.story;
    bodyContainer.appendChild(storyEl);

    // Feedback Banner placed prominently above options & scrolled into view when triggered
    const feedbackBanner = document.createElement('div');
    feedbackBanner.className = 'mission-feedback';
    feedbackBanner.setAttribute('role', 'alert');

    if (mission.type === 'code-fix') {
      currentHandler = renderCodeFixMission(mission, feedbackBanner);
    } else {
      currentHandler = renderMentorQuizMission(mission, feedbackBanner);
    }

    bodyContainer.appendChild(feedbackBanner);

    retryBtn.element.onclick = () => {
      currentHandler.resetSelection();
      feedbackBanner.classList.remove('is-visible');
      retryBtn.element.style.display = 'none';
    };

    const applyOutOfAttemptsUI = (messageText) => {
      feedbackBanner.className = 'mission-feedback mission-feedback--error is-visible';
      feedbackBanner.textContent =
        messageText ||
        'HẾT CƠ HỘI THỬ LẠI (ĐÃ SAI 3/3 LẦN)! Bạn bắt buộc phải Reset trò chơi để làm lại từ Câu 1.';
      retryBtn.element.style.display = 'none';
      if (patchInputElement) {
        patchInputElement.disabled = true;
      }
      submitBtn.setDisabled(false);
      submitBtn.setContent('RESET TRÒ CHƠI', ICONS.ROTATE_CCW);
      submitBtn.element.onclick = triggerGameResetFromExhaustedAttempts;
      feedbackBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };

    if (isCompleted) {
      feedbackBanner.className = 'mission-feedback mission-feedback--success is-visible';
      feedbackBanner.textContent =
        'Nhiệm vụ này đã được hoàn thành. Bạn có thể xem lại nội dung hoặc đóng cửa sổ để tiếp tục.';
      submitBtn.setDisabled(true);
      submitBtn.setContent('PATCH APPLIED', ICONS.TERMINAL);
    } else if (missionManager.isOutOfAttempts()) {
      applyOutOfAttemptsUI();
    } else {
      submitBtn.setDisabled(false);
      submitBtn.setContent('VERIFY & PATCH', ICONS.TERMINAL);
    }

    if (!isCompleted && !missionManager.isOutOfAttempts()) {
      submitBtn.element.onclick = () => {
        if (!activeMission || activeMission.status === MISSION_STATUS.COMPLETED) {
          return;
        }

        const payload = currentHandler.getPayload();
        const result = missionManager.submitMissionAnswer(activeMission.id, payload);
        updateAttemptsBadge();

        if (!result.isValid) {
          audioManager.playError();

          // Highlight wrong options in red with [ĐÁP ÁN SAI] tag
          clearOptionMarkers();
          if (Array.isArray(result.wrongOptionIds)) {
            result.wrongOptionIds.forEach((wrongId) => {
              const wrongBtn = optionMap.get(wrongId);
              markOptionBadge(wrongBtn, 'wrong', 'ĐÁP ÁN SAI');
            });
          }

          if (result.outOfAttempts) {
            applyOutOfAttemptsUI(result.feedback);
            notification.show({
              message: 'Bạn đã sai đủ 3/3 lần! Hãy nhấn RESET TRÒ CHƠI để bắt đầu lại.',
              type: 'warm',
              duration: 4200,
            });
            return;
          }

          feedbackBanner.className = 'mission-feedback mission-feedback--error is-visible';
          feedbackBanner.textContent = result.feedback;

          if (!result.isEmptyInput) {
            retryBtn.element.style.display = 'inline-flex';
          }

          feedbackBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          return;
        }

        audioManager.playSuccess();
        activeMission = missionManager.getMissionById(activeMission.id);
        retryBtn.element.style.display = 'none';

        clearOptionMarkers();
        if (activeMission.type === 'code-fix' && selectedOptionId) {
          markOptionBadge(optionMap.get(selectedOptionId), 'correct', 'ĐÁP ÁN ĐÚNG');
        } else if (activeMission.type === 'mentor-quiz') {
          Object.values(quizAnswers).forEach((ansId) => {
            markOptionBadge(optionMap.get(ansId), 'correct', 'ĐÁP ÁN ĐÚNG');
          });
        }

        const statusBadge = metaBar.querySelector('.mission-meta-bar__status');
        if (statusBadge) {
          statusBadge.textContent = `STATUS: ${MISSION_STATUS.COMPLETED}`;
          statusBadge.classList.add('mission-meta-bar__status--completed');
        }

        feedbackBanner.className = 'mission-feedback mission-feedback--success is-visible';
        feedbackBanner.textContent = result.feedback;
        submitBtn.setDisabled(true);
        submitBtn.setContent('PATCH APPLIED', ICONS.TERMINAL);
        feedbackBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (result.allCompleted) {
          notification.show({
            message:
              'Hoàn thành 4/4 nhiệm vụ! Toàn bộ Bug kỹ thuật đã được xử lý (ALL_MISSIONS_COMPLETED).',
            type: 'success',
            duration: 3800,
          });
        } else if (result.unlockedNextMission) {
          notification.show({
            message: `Đã hoàn thành ${activeMission.code}! Mở khóa tiếp theo: ${result.unlockedNextMission.code} (${result.unlockedNextMission.title}).`,
            type: 'success',
            duration: 3400,
          });
        }
      };
    }

    modal.open();
    eventBus.emit(EVENTS.MISSION_MODAL_TOGGLED, { isOpen: true });
  };

  return {
    element: modal.element,
    openMission,
    close: () => modal.close(),
    isOpen: () => modal.isOpen(),
  };
}
