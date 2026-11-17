import gsap from 'gsap';
import { APP_CONFIG, EVENTS, UI_SCREENS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { gratitudeService } from '../../services/GratitudeService.js';
import { gratitudeStorage } from '../../services/GratitudeStorage.js';
import { audioManager } from '../../systems/AudioManager.js';
import { GratitudeValidator } from '../../systems/GratitudeValidator.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { notification } from '../Notification.js';

function formatDisplayDate(date = new Date()) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function createGratitudeLetterScreen() {
  let isSubmitting = false;
  const maxLen = APP_CONFIG.GRATITUDE_MAX_LENGTH || 300;
  const savedDraft = gratitudeStorage.loadDraft();

  const screen = document.createElement('section');
  screen.className = 'gratitude-screen';
  screen.setAttribute('aria-label', 'A Letter of Gratitude');

  const shell = document.createElement('div');
  shell.className = 'gratitude-shell';

  // 1. Header
  const header = document.createElement('header');
  header.className = 'gratitude-header';
  header.innerHTML = `
    <span class="gratitude-header__badge">BUG #005 // THE LAST VULNERABILITY</span>
    <h1 class="gratitude-header__title">WRITE YOUR GRATITUDE</h1>
    <p class="gratitude-header__quote">
      "Bạn không thể sửa lỗi này bằng code. Nhưng bạn có thể bắt đầu bằng một lời cảm ơn."
    </p>
  `;

  // 2. Main Workspace (Form + Preview)
  const workspace = document.createElement('div');
  workspace.className = 'gratitude-workspace';

  // Left: Form Card
  const formCard = document.createElement('form');
  formCard.className = 'gratitude-form-card';
  formCard.noValidate = true;

  // Field 1: Mentor Name (Required)
  const mentorField = document.createElement('div');
  mentorField.className = 'gratitude-field';
  mentorField.innerHTML = `
    <div class="gratitude-field__label-row">
      <label class="gratitude-field__label" for="gratitude-mentor-input">
        MENTOR / TEACHER NAME <span class="gratitude-field__required">*</span>
      </label>
      <span class="gratitude-field__optional">Bắt buộc</span>
    </div>
  `;
  const mentorInput = document.createElement('input');
  mentorInput.type = 'text';
  mentorInput.id = 'gratitude-mentor-input';
  mentorInput.className = 'gratitude-input';
  mentorInput.placeholder =
    'Chọn bên dưới hoặc nhập: Đội ngũ giảng viên, CodeGym, Anh Nhật, Anh Luân, Anh Tuấn Anh, Thầy Cấn, Anh Tùng...';
  mentorInput.maxLength = 80;
  mentorInput.value = savedDraft.mentorName;
  mentorField.appendChild(mentorInput);

  // Quick-select recipient chips
  const recipientChipsWrap = document.createElement('div');
  recipientChipsWrap.style.cssText =
    'display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px;';
  const suggestedRecipients = [
    'Đội ngũ giảng viên',
    'CodeGym',
    'Anh Nhật',
    'Anh Luân',
    'Anh Tuấn Anh',
    'Thầy Cấn',
    'Anh Tùng',
  ];
  suggestedRecipients.forEach((recipientName) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'rain-icon-btn';
    chip.style.cssText = 'padding: 4px 10px; font-size: 0.76rem;';
    chip.textContent = recipientName;
    chip.addEventListener('click', () => {
      mentorInput.value = recipientName;
      mentorInput.dispatchEvent(new Event('input'));
    });
    recipientChipsWrap.appendChild(chip);
  });
  mentorField.appendChild(recipientChipsWrap);

  // Field 2: Sender Name (Optional)
  const senderField = document.createElement('div');
  senderField.className = 'gratitude-field';
  senderField.innerHTML = `
    <div class="gratitude-field__label-row">
      <label class="gratitude-field__label" for="gratitude-sender-input">
        SENDER NAME
      </label>
      <span class="gratitude-field__optional">Không bắt buộc</span>
    </div>
  `;
  const senderInput = document.createElement('input');
  senderInput.type = 'text';
  senderInput.id = 'gratitude-sender-input';
  senderInput.className = 'gratitude-input';
  senderInput.placeholder = 'Tên của bạn (để trống nếu muốn ẩn danh)...';
  senderInput.maxLength = 80;
  senderInput.value = savedDraft.senderName;
  senderField.appendChild(senderInput);

  // Field 3: Anonymous Toggle
  const anonRow = document.createElement('label');
  anonRow.className = 'gratitude-checkbox-row';
  anonRow.setAttribute('for', 'gratitude-anonymous-checkbox');

  const anonCheckbox = document.createElement('input');
  anonCheckbox.type = 'checkbox';
  anonCheckbox.id = 'gratitude-anonymous-checkbox';
  anonCheckbox.checked = Boolean(savedDraft.isAnonymous);

  const anonText = document.createElement('span');
  anonText.className = 'gratitude-checkbox-row__text';
  anonText.textContent =
    'Gửi ẩn danh (Anonymous) — Không hiển thị tên người gửi trên bầu trời tri ân công khai.';

  anonRow.appendChild(anonCheckbox);
  anonRow.appendChild(anonText);

  // Field 4: Gratitude Message (Required, max 300 chars)
  const messageField = document.createElement('div');
  messageField.className = 'gratitude-field';

  const msgLabelRow = document.createElement('div');
  msgLabelRow.className = 'gratitude-field__label-row';
  msgLabelRow.innerHTML = `
    <label class="gratitude-field__label" for="gratitude-message-input">
      GRATITUDE MESSAGE <span class="gratitude-field__required">*</span>
    </label>
  `;

  const charCounter = document.createElement('span');
  charCounter.className = 'gratitude-char-counter';
  charCounter.textContent = `0/${maxLen}`;
  msgLabelRow.appendChild(charCounter);

  const messageInput = document.createElement('textarea');
  messageInput.id = 'gratitude-message-input';
  messageInput.className = 'gratitude-textarea';
  messageInput.placeholder =
    'Hãy viết đôi lời cảm ơn chân thành gửi đến người đã kiên nhẫn hướng dẫn, sửa từng dòng code và đồng hành cùng bạn...';
  messageInput.value = savedDraft.message;

  messageField.appendChild(msgLabelRow);
  messageField.appendChild(messageInput);

  // Error Box
  const errorBox = document.createElement('div');
  errorBox.className = 'gratitude-error-box';
  errorBox.setAttribute('role', 'alert');

  // Submit Button
  const sendBtn = createButton({
    label: 'SEND MY GRATITUDE',
    variant: 'warm',
    iconSvg: ICONS.SEND,
  });
  sendBtn.element.type = 'submit';
  sendBtn.element.style.width = '100%';

  formCard.appendChild(mentorField);
  formCard.appendChild(senderField);
  formCard.appendChild(anonRow);
  formCard.appendChild(messageField);
  formCard.appendChild(errorBox);
  formCard.appendChild(sendBtn.element);

  // Right: Live Preview Card
  const previewWrap = document.createElement('div');
  previewWrap.className = 'gratitude-preview-wrap';

  const previewTag = document.createElement('span');
  previewTag.className = 'gratitude-preview-tag';
  previewTag.textContent = 'LIVE LETTER PREVIEW // BẢN XEM TRƯỚC LÁ THƯ';

  const paper = document.createElement('article');
  paper.className = 'gratitude-paper';
  paper.setAttribute('aria-label', 'Letter Preview');

  const paperTop = document.createElement('div');
  paperTop.className = 'gratitude-paper__top';

  const recipientEl = document.createElement('div');
  recipientEl.className = 'gratitude-paper__recipient';

  const stampEl = document.createElement('span');
  stampEl.className = 'gratitude-paper__stamp';
  stampEl.textContent = 'CODEGYM 20/11';

  paperTop.appendChild(recipientEl);
  paperTop.appendChild(stampEl);

  const paperBody = document.createElement('div');
  paperBody.className = 'gratitude-paper__body';

  const paperFooter = document.createElement('div');
  paperFooter.className = 'gratitude-paper__footer';

  const senderPreviewEl = document.createElement('div');
  senderPreviewEl.className = 'gratitude-paper__sender';

  const datePreviewEl = document.createElement('div');
  datePreviewEl.className = 'gratitude-paper__date';
  datePreviewEl.textContent = `Ngày gửi: ${formatDisplayDate(new Date())}`;

  paperFooter.appendChild(senderPreviewEl);
  paperFooter.appendChild(datePreviewEl);

  paper.appendChild(paperTop);
  paper.appendChild(paperBody);
  paper.appendChild(paperFooter);

  previewWrap.appendChild(previewTag);
  previewWrap.appendChild(paper);

  workspace.appendChild(formCard);
  workspace.appendChild(previewWrap);

  // 3. Flying Envelope Stage (Shown during submission transition)
  const flyStage = document.createElement('div');
  flyStage.className = 'gratitude-fly-stage';
  flyStage.innerHTML = `
    <div class="gratitude-sealed-envelope">${ICONS.MAIL_LETTER}</div>
    <h2 class="gratitude-fly-stage__title">SEALING & SENDING YOUR GRATITUDE...</h2>
    <p class="gratitude-fly-stage__desc">
      Lá thư của bạn đã được đóng dấu ánh sáng và đang bay lên không gian chung RAIN OF GRATITUDE...
    </p>
  `;

  shell.appendChild(header);
  shell.appendChild(workspace);
  shell.appendChild(flyStage);
  screen.appendChild(shell);

  // Sync Live Preview & Character Counter
  const updatePreviewAndDraft = () => {
    const rawMentor = mentorInput.value.trim();
    const rawSender = senderInput.value.trim();
    const rawMessage = messageInput.value;
    const trimmedMessage = rawMessage.trim();
    const isAnon = anonCheckbox.checked;

    senderInput.disabled = isAnon;

    recipientEl.textContent = `Gửi tới: ${rawMentor || '[Tên Giảng viên / Mentor]'}`;

    if (trimmedMessage.length > 0) {
      paperBody.textContent = trimmedMessage;
      paperBody.classList.remove('is-placeholder');
    } else {
      paperBody.textContent =
        'Nội dung lời cảm ơn của bạn sẽ hiển thị trực tiếp tại đây khi bạn gõ...';
      paperBody.classList.add('is-placeholder');
    }

    const publicSender = GratitudeValidator.formatPublicSender({
      senderName: rawSender,
      isAnonymous: isAnon,
    });
    senderPreviewEl.textContent = `Người gửi: ${publicSender}`;

    // Character Counter based on trimmed length (or raw length if exceeding)
    const countLen = trimmedMessage.length;
    charCounter.textContent = `${countLen}/${maxLen} ký tự`;
    charCounter.classList.toggle(
      'gratitude-char-counter--limit',
      countLen >= maxLen - 30 && countLen <= maxLen
    );
    charCounter.classList.toggle('gratitude-char-counter--over', countLen > maxLen);

    gratitudeStorage.saveDraft({
      mentorName: mentorInput.value,
      senderName: senderInput.value,
      message: messageInput.value,
      isAnonymous: isAnon,
    });
  };

  const clearErrors = () => {
    errorBox.classList.remove('is-visible');
    errorBox.textContent = '';
    mentorInput.classList.remove('has-error');
    messageInput.classList.remove('has-error');
  };

  mentorInput.addEventListener('input', () => {
    clearErrors();
    updatePreviewAndDraft();
  });

  senderInput.addEventListener('input', () => {
    updatePreviewAndDraft();
  });

  anonCheckbox.addEventListener('change', () => {
    updatePreviewAndDraft();
  });

  messageInput.addEventListener('input', () => {
    clearErrors();
    updatePreviewAndDraft();
  });

  updatePreviewAndDraft();

  formCard.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    clearErrors();

    const creation = GratitudeValidator.createLetterObject({
      mentorName: mentorInput.value,
      senderName: senderInput.value,
      message: messageInput.value,
      isAnonymous: anonCheckbox.checked,
    });

    if (!creation.isValid) {
      audioManager.playError();
      errorBox.textContent = creation.firstErrorMessage;
      errorBox.classList.add('is-visible');

      if (creation.errors.mentorName) {
        mentorInput.classList.add('has-error');
        mentorInput.focus();
      } else if (creation.errors.message) {
        messageInput.classList.add('has-error');
        messageInput.focus();
      }
      return;
    }

    isSubmitting = true;
    sendBtn.setDisabled(true);

    // Submit via GratitudeService (validates, saves, and publishes directly to the shared sky)
    const submitResult = await gratitudeService.submitGratitude({
      mentorName: mentorInput.value,
      senderName: senderInput.value,
      message: messageInput.value,
      isAnonymous: anonCheckbox.checked,
    });

    const savedLetter = submitResult.letter || creation.letter;
    audioManager.playWarmChime();

    // Animate closing letter, flying up, slowing down, and dimming into A LETTER TO THOSE WHO GUIDED US
    const envelopeEl = flyStage.querySelector('.gratitude-sealed-envelope');

    const tl = gsap.timeline({
      onComplete: () => {
        notification.show({
          message: `✨ Đã gửi lời chúc tới ${savedLetter.mentorName}! Một bức tâm thư 20/11 đang mở ra...`,
          type: 'warm',
          duration: 3800,
        });
        eventBus.emit(EVENTS.GRATITUDE_SUBMITTED, {
          letter: savedLetter,
          syncedToCloud: submitResult.syncedToCloud,
          pendingModeration: false,
          cloudError: submitResult.error,
          nextScreen: UI_SCREENS.GUIDING_LIGHT_LETTER,
        });
      },
    });

    tl.to(workspace, {
      opacity: 0,
      scale: 0.94,
      y: -15,
      duration: 0.4,
      ease: 'power2.in',
      onComplete: () => {
        workspace.style.display = 'none';
        flyStage.classList.add('is-active');
      },
    });

    tl.fromTo(
      flyStage,
      { opacity: 0, scale: 0.9 },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.5)' }
    );

    // Step 5: Personal envelope starts flying upward
    tl.to(
      envelopeEl,
      {
        y: -85,
        scale: 1.08,
        duration: 0.7,
        ease: 'power2.out',
      },
      '+=0.35'
    );

    // Step 6: Motion slows down and screen gradually dims before Guiding Letter scene
    tl.to(envelopeEl, {
      y: -115,
      scale: 1.02,
      opacity: 0.35,
      duration: 0.65,
      ease: 'power1.out',
    });

    tl.to(
      screen,
      {
        backgroundColor: '#04060e',
        opacity: 0.15,
        duration: 0.65,
        ease: 'power1.inOut',
      },
      '<'
    );
  });

  return {
    element: screen,
    destroy() {
      screen.remove();
    },
  };
}

