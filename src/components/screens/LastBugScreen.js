import gsap from 'gsap';
import { EVENTS, UI_SCREENS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { audioManager } from '../../systems/AudioManager.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';

export function createLastBugScreen() {
  let timeline = null;
  let isSequenceFinished = false;
  let isRevealingHacker = false;
  let isOpeningLetter = false;

  const screen = document.createElement('section');
  screen.className = 'last-bug-screen';
  screen.setAttribute('aria-label', 'Central Control Room - BUG #005 Missing Gratitude');

  // Skip button for cutscene animation
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
  terminal.className = 'last-bug-terminal is-restoring';

  const header = document.createElement('div');
  header.className = 'last-bug-terminal__header';
  header.innerHTML = `
    <span class="last-bug-terminal__alert-title">
      ${ICONS.TERMINAL}
      <span class="last-bug-header-text">CENTRAL CONTROL ROOM // MAINFRAME MONITOR</span>
    </span>
    <span class="last-bug-header-code">SEC-02 // CORE_TELEMETRY</span>
  `;
  const headerTitleText = header.querySelector('.last-bug-header-text');
  const headerCodeText = header.querySelector('.last-bug-header-code');

  const body = document.createElement('div');
  body.className = 'last-bug-terminal__body';

  // =========================================================================
  // STAGE 1: CENTRAL CONTROL MAINFRAME (ALL SYSTEMS RESTORED -> ONE VULNERABILITY REMAINS)
  // =========================================================================
  const mainframeStage = document.createElement('div');
  mainframeStage.className = 'last-bug-mainframe-stage';
  mainframeStage.innerHTML = `
    <div class="last-bug-mainframe-Header">
      <span class="last-bug-mainframe-tag">CODEGYM HEADQUARTERS // CENTRAL SERVER ARRAY</span>
      <span class="last-bug-mainframe-sub">Đang đồng bộ trạng thái 4 phân khu kỹ thuật...</span>
    </div>
    <div class="last-bug-led-grid">
      <div class="last-bug-led-card" data-sector-led="0">
        <span class="last-bug-led-dot"></span>
        <div>
          <div class="last-bug-led-name">IT OFFICE // THE FIRST LOOP</div>
          <div class="last-bug-led-state">SYNCING...</div>
        </div>
      </div>
      <div class="last-bug-led-card" data-sector-led="1">
        <span class="last-bug-led-dot"></span>
        <div>
          <div class="last-bug-led-name">DATABASE ROOM // NULL NIGHTMARE</div>
          <div class="last-bug-led-state">SYNCING...</div>
        </div>
      </div>
      <div class="last-bug-led-card" data-sector-led="2">
        <span class="last-bug-led-dot"></span>
        <div>
          <div class="last-bug-led-name">SERVER ROOM // INFINITE DEADLINE</div>
          <div class="last-bug-led-state">SYNCING...</div>
        </div>
      </div>
      <div class="last-bug-led-card" data-sector-led="3">
        <span class="last-bug-led-dot"></span>
        <div>
          <div class="last-bug-led-name">SECURITY ROOM // THE MENTOR'S VOICE</div>
          <div class="last-bug-led-state">SYNCING...</div>
        </div>
      </div>
    </div>
    <div class="last-bug-status-banners">
      <div class="last-bug-banner last-bug-banner--restored">ALL SYSTEMS RESTORED.</div>
      <div class="last-bug-banner last-bug-banner--vulnerability">ONE VULNERABILITY REMAINS.</div>
    </div>
  `;

  // =========================================================================
  // STAGE 2: BUG #005 – MISSING GRATITUDE (DIAGNOSTICS & EMOTIONAL PROMPT)
  // =========================================================================
  const diagnosticsStage = document.createElement('div');
  diagnosticsStage.className = 'last-bug-diagnostics-stage';
  diagnosticsStage.style.display = 'flex';
  diagnosticsStage.style.flexDirection = 'column';
  diagnosticsStage.style.gap = 'var(--space-4)';

  const codeBlock = document.createElement('div');
  codeBlock.className = 'last-bug-code-block';
  codeBlock.innerHTML = `
    <div class="last-bug-line last-bug-line--critical">CRITICAL ERROR DETECTED.</div>
    <div class="last-bug-line last-bug-line--code">BUG #005: MISSING GRATITUDE.</div>
    <div class="last-bug-line last-bug-line--meta">Severity: CRITICAL.</div>
    <div class="last-bug-line last-bug-line--meta">Status: UNRESOLVED.</div>
  `;

  const messageVi = document.createElement('div');
  messageVi.className = 'last-bug-message-vi';
  messageVi.innerHTML = `
    <p>"Bạn đã sửa được tất cả lỗi trong hệ thống CodeGym.</p>
    <p>Bạn đã khôi phục máy chủ, dữ liệu và bảo mật.</p>
    <p>Nhưng hệ thống vẫn phát hiện một lỗi chưa được xử lý.</p>
    <p>Một người đã dành thời gian hướng dẫn bạn.<br/>
    Một người đã kiên nhẫn khi bạn mắc lỗi.<br/>
    Một người đã giúp bạn tiến bộ từng ngày.</p>
    <p><strong>Nhưng bạn đã bao giờ thực sự nói lời cảm ơn?</strong>"</p>
  `;

  const actions = document.createElement('div');
  actions.className = 'last-bug-actions';

  const revealHackerBtn = createButton({
    label: 'GIẢI MÃ TÍN HIỆU CUỐI CÙNG',
    variant: 'warm',
    iconSvg: ICONS.TERMINAL,
  });
  actions.appendChild(revealHackerBtn.element);

  diagnosticsStage.appendChild(codeBlock);
  diagnosticsStage.appendChild(messageVi);
  diagnosticsStage.appendChild(actions);

  // =========================================================================
  // STAGE 3: REVEAL HACKER IDENTITY & WRITE A LETTER CTA
  // =========================================================================
  const envelopeStage = document.createElement('div');
  envelopeStage.className = 'last-bug-envelope-stage';
  envelopeStage.innerHTML = `
    <div class="last-bug-envelope-icon">${ICONS.MAIL_LETTER}</div>
    <span class="last-bug-hacker-badge">FINAL TRANSMISSION // UNKNOWN HACKER</span>
    <h2 class="last-bug-envelope-title">THE LAST VULNERABILITY</h2>
    <blockquote class="last-bug-hacker-reveal-quote">
      <p>"Bạn đã nghĩ tôi muốn phá hủy hệ thống này sao?</p>
      <p>Tôi chỉ muốn bạn nhận ra rằng có những thứ quan trọng hơn những dòng code.</p>
      <p>Bạn có thể sửa hàng nghìn lỗi trong phần mềm.</p>
      <p>Nhưng có một lời cảm ơn, nếu không nói ra đúng lúc, có thể sẽ không còn cơ hội."</p>
    </blockquote>
    <div class="last-bug-write-prompt">
      <p>Bạn không thể sửa lỗi này bằng code.</p>
      <p><strong>Nhưng bạn có thể bắt đầu bằng một lời cảm ơn.</strong></p>
    </div>
  `;

  const writeLetterBtn = createButton({
    label: 'WRITE A LETTER',
    variant: 'warm',
    iconSvg: ICONS.MAIL_LETTER,
    onClick: () => {
      if (isOpeningLetter) return;
      isOpeningLetter = true;
      writeLetterBtn.setDisabled(true);
      eventBus.emit(EVENTS.FIX_LAST_BUG_REQUESTED, {
        nextScreen: UI_SCREENS.GRATITUDE_LETTER,
      });
    },
  });
  envelopeStage.appendChild(writeLetterBtn.element);

  body.appendChild(mainframeStage);
  body.appendChild(diagnosticsStage);
  body.appendChild(envelopeStage);

  terminal.appendChild(header);
  terminal.appendChild(body);
  container.appendChild(terminal);

  screen.appendChild(skipBar);
  screen.appendChild(container);

  const ledCards = Array.from(mainframeStage.querySelectorAll('.last-bug-led-card'));
  const restoredBanner = mainframeStage.querySelector('.last-bug-banner--restored');
  const vulnerabilityBanner = mainframeStage.querySelector('.last-bug-banner--vulnerability');
  const lines = Array.from(codeBlock.querySelectorAll('.last-bug-line'));

  const setLedRestored = (card) => {
    if (!card) return;
    card.classList.add('is-restored');
    const stateEl = card.querySelector('.last-bug-led-state');
    if (stateEl) {
      stateEl.textContent = 'ONLINE // RESTORED';
    }
  };

  const completeDiagnosticsReveal = () => {
    if (isSequenceFinished) return;
    isSequenceFinished = true;

    if (timeline) {
      timeline.kill();
    }

    screen.classList.remove('is-glitching');
    terminal.classList.remove('is-restoring');
    skipBar.style.display = 'none';

    ledCards.forEach(setLedRestored);
    gsap.set(restoredBanner, { opacity: 1, y: 0 });
    gsap.set(vulnerabilityBanner, { opacity: 1, y: 0 });

    if (headerTitleText) {
      headerTitleText.textContent = 'CRITICAL ERROR DETECTED // BUG #005';
    }
    if (headerCodeText) {
      headerCodeText.textContent = 'ERR_CODE: 0x005_GRATITUDE';
    }

    gsap.set(terminal, { opacity: 1, scale: 1 });
    gsap.set(lines, { opacity: 1, y: 0 });
    gsap.set(messageVi, { opacity: 1, y: 0 });
    gsap.set(actions, { opacity: 1, y: 0 });
  };

  skipBtn.element.addEventListener('click', completeDiagnosticsReveal);

  const startSequence = () => {
    timeline = gsap.timeline({
      onComplete: () => {
        isSequenceFinished = true;
        screen.classList.remove('is-glitching');
        skipBar.style.display = 'none';
      },
    });

    // 1. Central Control Mainframe appears
    timeline.fromTo(
      terminal,
      { opacity: 0, scale: 0.96 },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
    );

    // 2. Warning lights sequentially turn green
    ledCards.forEach((card, idx) => {
      timeline.call(
        () => {
          setLedRestored(card);
          audioManager.playSuccess();
        },
        null,
        idx === 0 ? '+=0.25' : '+=0.28'
      );
    });

    // 3. Notification: ALL SYSTEMS RESTORED.
    timeline.fromTo(
      restoredBanner,
      { opacity: 0, y: 6, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.42, ease: 'back.out(1.4)' },
      '+=0.25'
    );

    // 4. Sudden warning: ONE VULNERABILITY REMAINS.
    timeline.call(
      () => {
        audioManager.playCriticalAlert();
        screen.classList.add('is-glitching');
        terminal.classList.remove('is-restoring');
        if (headerTitleText) {
          headerTitleText.textContent = 'CRITICAL ERROR DETECTED // BUG #005';
        }
        if (headerCodeText) {
          headerCodeText.textContent = 'ERR_CODE: 0x005_GRATITUDE';
        }
      },
      null,
      '+=0.85'
    );

    timeline.fromTo(
      vulnerabilityBanner,
      { opacity: 0, y: 6, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'power2.out' }
    );

    timeline.call(
      () => {
        screen.classList.remove('is-glitching');
      },
      null,
      '+=0.35'
    );

    // 5. BUG #005 – MISSING GRATITUDE lines
    lines.forEach((lineEl, index) => {
      timeline.to(
        lineEl,
        {
          opacity: 1,
          y: 0,
          duration: 0.32,
          ease: 'power2.out',
        },
        index === 0 ? '+=0.2' : '+=0.24'
      );
    });

    timeline.to(
      messageVi,
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power2.out',
      },
      '+=0.3'
    );

    timeline.to(
      actions,
      {
        opacity: 1,
        y: 0,
        duration: 0.38,
        ease: 'power2.out',
      },
      '+=0.2'
    );
  };

  revealHackerBtn.element.addEventListener('click', () => {
    if (isRevealingHacker) return;
    isRevealingHacker = true;

    completeDiagnosticsReveal();
    audioManager.playWarmChime();

    screen.classList.remove('is-glitching');
    screen.classList.add('is-warm-mode');

    if (headerTitleText) {
      headerTitleText.textContent = 'FINAL TRANSMISSION // THE LAST VULNERABILITY';
    }
    if (headerCodeText) {
      headerCodeText.textContent = 'PATCH #005 // HEART_PROTOCOL';
    }

    gsap.to([mainframeStage, diagnosticsStage], {
      opacity: 0,
      y: -8,
      duration: 0.35,
      ease: 'power2.in',
      onComplete: () => {
        mainframeStage.style.display = 'none';
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
