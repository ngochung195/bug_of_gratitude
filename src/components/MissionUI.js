import { EVENTS, MISSION_STATUS } from '../config/constants.js';
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

  const bodyContainer = document.createElement('div');

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
    footerButtons: [closeBtn, submitBtn],
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
        <span></span>
      `;
      optBtn.querySelector('span:last-child').textContent = opt.label;

      if (mission.status === MISSION_STATUS.COMPLETED && opt.isCorrect) {
        optBtn.classList.add('is-selected');
      }

      optBtn.addEventListener('click', () => {
        if (activeMission?.status === MISSION_STATUS.COMPLETED) return;
        selectedOptionId = opt.id;
        optionButtons.forEach((b) => b.classList.remove('is-selected'));
        optBtn.classList.add('is-selected');
        feedbackBanner.classList.remove('is-visible');
      });

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
    textInput.disabled = mission.status === MISSION_STATUS.COMPLETED;

    textInput.addEventListener('input', () => {
      feedbackBanner.classList.remove('is-visible');
    });

    inputGroup.appendChild(inputLabel);
    inputGroup.appendChild(textInput);
    bodyContainer.appendChild(inputGroup);

    return {
      getPayload: () => ({
        selectedOptionId,
        textInput: textInput.value,
      }),
    };
  };

  const renderMentorQuizMission = (mission, feedbackBanner) => {
    quizAnswers = {};

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
          <span></span>
        `;
        optBtn.querySelector('span:last-child').textContent = opt.label;

        if (mission.status === MISSION_STATUS.COMPLETED && opt.isCorrect) {
          optBtn.classList.add('is-selected');
        }

        optBtn.addEventListener('click', () => {
          if (activeMission?.status === MISSION_STATUS.COMPLETED) return;
          quizAnswers[q.id] = opt.id;
          qOptionButtons.forEach((b) => b.classList.remove('is-selected'));
          optBtn.classList.add('is-selected');
          feedbackBanner.classList.remove('is-visible');
        });

        qOptionButtons.push(optBtn);
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
    };
  };

  let currentPayloadGetter = () => ({});

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

    if (titleEl) {
      titleEl.textContent = `${mission.code} // ${mission.title}`;
    }

    bodyContainer.innerHTML = '';

    // Meta bar
    const isCompleted = mission.status === MISSION_STATUS.COMPLETED;
    const metaBar = document.createElement('div');
    metaBar.className = 'mission-meta-bar';
    metaBar.innerHTML = `
      <span class="mission-meta-bar__topic">TOPIC: ${mission.topic}</span>
      <span class="mission-meta-bar__status ${
        isCompleted ? 'mission-meta-bar__status--completed' : ''
      }">STATUS: ${mission.status}</span>
    `;
    bodyContainer.appendChild(metaBar);

    // Story description
    const storyEl = document.createElement('p');
    storyEl.className = 'mission-story';
    storyEl.textContent = mission.story;
    bodyContainer.appendChild(storyEl);

    // Feedback Banner
    const feedbackBanner = document.createElement('div');
    feedbackBanner.className = 'mission-feedback';
    feedbackBanner.setAttribute('role', 'alert');

    if (mission.type === 'code-fix') {
      const handler = renderCodeFixMission(mission, feedbackBanner);
      currentPayloadGetter = handler.getPayload;
    } else {
      const handler = renderMentorQuizMission(mission, feedbackBanner);
      currentPayloadGetter = handler.getPayload;
    }

    if (isCompleted) {
      feedbackBanner.className = 'mission-feedback mission-feedback--success is-visible';
      feedbackBanner.textContent =
        'Nhiệm vụ này đã được hoàn thành. Bạn có thể xem lại nội dung hoặc đóng cửa sổ để tiếp tục.';
      submitBtn.setDisabled(true);
      submitBtn.setContent('PATCH APPLIED', ICONS.TERMINAL);
    } else {
      submitBtn.setDisabled(false);
      submitBtn.setContent('VERIFY & PATCH', ICONS.TERMINAL);
    }

    bodyContainer.appendChild(feedbackBanner);

    submitBtn.element.onclick = () => {
      if (!activeMission || activeMission.status === MISSION_STATUS.COMPLETED) {
        return;
      }

      const payload = currentPayloadGetter();
      const result = missionManager.submitMissionAnswer(activeMission.id, payload);

      if (!result.isValid) {
        audioManager.playError();
        feedbackBanner.className = 'mission-feedback mission-feedback--error is-visible';
        feedbackBanner.textContent = result.feedback;
        return;
      }

      audioManager.playSuccess();
      activeMission = missionManager.getMissionById(activeMission.id);

      const statusBadge = metaBar.querySelector('.mission-meta-bar__status');
      if (statusBadge) {
        statusBadge.textContent = `STATUS: ${MISSION_STATUS.COMPLETED}`;
        statusBadge.classList.add('mission-meta-bar__status--completed');
      }

      feedbackBanner.className = 'mission-feedback mission-feedback--success is-visible';
      feedbackBanner.textContent = result.feedback;
      submitBtn.setDisabled(true);
      submitBtn.setContent('PATCH APPLIED', ICONS.TERMINAL);

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
