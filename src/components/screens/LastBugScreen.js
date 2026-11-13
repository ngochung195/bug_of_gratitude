import gsap from 'gsap';
import { EVENTS, UI_SCREENS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { audioManager } from '../../systems/AudioManager.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';

export function createLastBugScreen() {
  let timeline = null;
  let isSequenceFinished = false;
  let isFixing = false;

  const screen = document.createElement('section');
  screen.className = 'last-bug-screen';
  screen.setAttribute('aria-label', 'Critical Error BUG #005 Missing Gratitude');

  // Skip button for long transition
  const skipBar = document.createElement('div');
  skipBar.className = 'last-bug-skip-bar';

  const skipBtn = createButton({
    label: 'SKIP EFFECT',
    variant: 'ghost',
    iconSvg: ICONS.FAST_FORWARD,
    ariaLabel: 'Skip cutscene animation',
  });
  skipBar.appendChild(skipBtn.element);

  const container = document.createElement('div');
  container.className = 'last-bug-container';

  const terminal = document.createElement('div');
  terminal.className = 'last-bug-terminal';

  const header = document.createElement('div');
  header.className = 'last-bug-terminal__header';
  header.innerHTML = `
    <span class="last-bug-terminal__alert-title">
      ${ICONS.ALERT_TRIANGLE}
      <span>SYSTEM EXCEPTION // CORE_HEART_MODULE</span>
    </span>
    <span>ERR_CODE: 0x005_GRATITUDE</span>
  `;

  const body = document.createElement('div');
  body.className = 'last-bug-terminal__body';

  // Stage A: Error Diagnostics & Emotional Message
  const diagnosticsStage = document.createElement('div');
  diagnosticsStage.style.display = 'flex';
  diagnosticsStage.style.flexDirection = 'column';
  diagnosticsStage.style.gap = 'var(--space-4)';

  const codeBlock = document.createElement('div');
  codeBlock.className = 'last-bug-code-block';
  codeBlock.innerHTML = `
    <div class="last-bug-line last-bug-line--critical">CRITICAL ERROR DETECTED</div>
    <div class="last-bug-line last-bug-line--code">BUG #005: MISSING GRATITUDE</div>
    <div class="last-bug-line last-bug-line--meta">Severity: CRITICAL</div>
    <div class="last-bug-line last-bug-line--meta">Status: UNRESOLVED</div>
    <div class="last-bug-line last-bug-line--narrative">You have fixed every bug in the code.</div>
    <div class="last-bug-line last-bug-line--narrative">But there is one thing you haven't done...</div>
    <div class="last-bug-line last-bug-line--thankyou">You forgot to say THANK YOU.</div>
  `;

  const messageVi = document.createElement('div');
  messageVi.className = 'last-bug-message-vi';
  messageVi.innerHTML = `
    <p>"Bạn đã sửa được mọi lỗi trong chương trình.</p>
    <p>Bạn đã vượt qua mọi thử thách.</p>
    <p>Nhưng có một điều bạn vẫn chưa làm...</p>
    <p><strong>Bạn đã bao giờ thực sự nói lời cảm ơn đến người đã kiên nhẫn đồng hành cùng mình chưa?</strong>"</p>
  `;

  const actions = document.createElement('div');
  actions.className = 'last-bug-actions';

  const fixBugBtn = createButton({
    label: 'FIX THIS BUG',
    variant: 'warm',
    iconSvg: ICONS.HEART_SPARK,
  });
  actions.appendChild(fixBugBtn.element);

  diagnosticsStage.appendChild(codeBlock);
  diagnosticsStage.appendChild(messageVi);
  diagnosticsStage.appendChild(actions);

  // Stage B: Warm Light & Letter Reveal (Shown when clicking FIX THIS BUG)
  const envelopeStage = document.createElement('div');
  envelopeStage.className = 'last-bug-envelope-stage';
  envelopeStage.innerHTML = `
    <div class="last-bug-envelope-icon">${ICONS.MAIL_LETTER}</div>
    <h2 class="last-bug-envelope-title">GRATITUDE PROTOCOL INITIALIZED</h2>
    <p class="last-bug-envelope-subtitle">
      Có những lỗi không thể sửa bằng những dòng lệnh khô khan, mà chỉ có thể được chữa lành bằng một lá thư chân thành gửi đến người thầy, người hướng dẫn của bạn.
    </p>
  `;

  const openLetterBtn = createButton({
    label: 'VIẾT LỜI CẢM ƠN (PHASE 5)',
    variant: 'warm',
    iconSvg: ICONS.MAIL_LETTER,
    onClick: () => {
      eventBus.emit(EVENTS.FIX_LAST_BUG_REQUESTED, {
        nextScreen: UI_SCREENS.GRATITUDE_LETTER,
      });
    },
  });
  envelopeStage.appendChild(openLetterBtn.element);

  body.appendChild(diagnosticsStage);
  body.appendChild(envelopeStage);

  terminal.appendChild(header);
  terminal.appendChild(body);
  container.appendChild(terminal);

  screen.appendChild(skipBar);
  screen.appendChild(container);

  const lines = Array.from(codeBlock.querySelectorAll('.last-bug-line'));

  const completeDiagnosticsReveal = () => {
    if (isSequenceFinished) return;
    isSequenceFinished = true;

    if (timeline) {
      timeline.kill();
    }

    screen.classList.remove('is-glitching');
    skipBar.style.display = 'none';

    gsap.set(terminal, { opacity: 1, scale: 1 });
    gsap.set(lines, { opacity: 1, y: 0 });
    gsap.set(messageVi, { opacity: 1, y: 0 });
    gsap.set(actions, { opacity: 1, y: 0 });
  };

  skipBtn.element.addEventListener('click', completeDiagnosticsReveal);

  const startSequence = () => {
    audioManager.playCriticalAlert();
    screen.classList.add('is-glitching');

    timeline = gsap.timeline({
      onComplete: () => {
        isSequenceFinished = true;
        screen.classList.remove('is-glitching');
        skipBar.style.display = 'none';
      },
    });

    timeline.fromTo(
      terminal,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
    );

    timeline.call(() => {
      screen.classList.remove('is-glitching');
    }, null, '+=0.35');

    lines.forEach((lineEl, index) => {
      timeline.to(
        lineEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          ease: 'power2.out',
        },
        index === 0 ? '+=0.15' : '+=0.28'
      );
    });

    timeline.to(
      messageVi,
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        ease: 'power2.out',
      },
      '+=0.35'
    );

    timeline.to(
      actions,
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
      },
      '+=0.2'
    );
  };

  fixBugBtn.element.addEventListener('click', () => {
    if (isFixing) return;
    isFixing = true;

    completeDiagnosticsReveal();
    audioManager.playWarmChime();

    screen.classList.remove('is-glitching');
    screen.classList.add('is-warm-mode');

    const headerTitle = header.querySelector('.last-bug-terminal__alert-title span');
    if (headerTitle) {
      headerTitle.textContent = 'HEART_PATCH // GRATITUDE LETTER READY';
    }

    gsap.to(diagnosticsStage, {
      opacity: 0,
      y: -8,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        diagnosticsStage.style.display = 'none';
        envelopeStage.classList.add('is-active');
        gsap.fromTo(
          envelopeStage,
          { opacity: 0, scale: 0.94, y: 12 },
          { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'back.out(1.4)' }
        );
      },
    });
  });

  return {
    element: screen,
    startSequence,
    skipSequence: completeDiagnosticsReveal,
    destroy() {
      if (timeline) {
        timeline.kill();
      }
      screen.remove();
    },
  };
}
