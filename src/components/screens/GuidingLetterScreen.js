import gsap from 'gsap';
import { EVENTS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import {
  GUIDING_LETTER_PARAGRAPHS,
  GUIDING_LETTER_SCENE_META,
} from '../../data/guidingLetterData.js';
import { audioManager } from '../../systems/AudioManager.js';
import { GuidingLetterTypewriter } from '../../systems/GuidingLetterTypewriter.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';

export function createGuidingLetterScreen({
  personalLetter = null,
  soundEnabled = true,
  onComplete,
} = {}) {
  let isTransitioning = false;
  let rafId = null;
  let dissolveActive = false;

  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    Boolean(window.matchMedia('(prefers-reduced-motion: reduce)')?.matches);

  const screen = document.createElement('section');
  screen.className = 'guiding-screen';
  screen.setAttribute('aria-label', GUIDING_LETTER_SCENE_META.sceneTitle);

  // 1. Background & Dissolve Stardust Canvas
  const canvas = document.createElement('canvas');
  canvas.className = 'guiding-dust-canvas';
  screen.appendChild(canvas);

  // 2. Top Bar: Title, Subtitle, Sound Toggle & Skip Button
  const topbar = document.createElement('header');
  topbar.className = 'guiding-topbar';

  const brand = document.createElement('div');
  brand.className = 'guiding-scene-brand';
  brand.innerHTML = `
    <span class="guiding-scene-subtitle">${GUIDING_LETTER_SCENE_META.sceneSubtitle}</span>
    <h1 class="guiding-scene-title">${GUIDING_LETTER_SCENE_META.sceneTitle}</h1>
  `;

  const topActions = document.createElement('div');
  topActions.className = 'guiding-top-actions';

  const soundBtn = document.createElement('button');
  soundBtn.type = 'button';
  soundBtn.className = 'rain-icon-btn';
  audioManager.enabled = Boolean(soundEnabled);

  const syncSoundBtnUI = () => {
    const isOn = audioManager.enabled;
    soundBtn.classList.toggle('is-active', isOn);
    soundBtn.innerHTML = `${isOn ? ICONS.VOLUME_ON : ICONS.VOLUME_OFF}<span>${
      isOn ? 'Piano: Bật' : 'Piano: Tắt'
    }</span>`;
  };
  syncSoundBtnUI();

  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const next = audioManager.toggleEnabled();
    if (next) {
      audioManager.startGentlePianoMelody();
    } else {
      audioManager.stopGentlePianoMelody();
    }
    syncSoundBtnUI();
  });

  const skipBtn = createButton({
    label: 'SKIP',
    variant: 'ghost',
    size: 'sm',
    iconSvg: ICONS.FAST_FORWARD,
  });

  topActions.appendChild(soundBtn);
  topActions.appendChild(skipBtn.element);
  topbar.appendChild(brand);
  topbar.appendChild(topActions);
  screen.appendChild(topbar);

  // 3. Center Stage: Cream Paper Letter + Personal Envelope for Final Merge
  const centerStage = document.createElement('div');
  centerStage.className = 'guiding-center-stage';

  const paper = document.createElement('article');
  paper.className = 'guiding-paper';
  paper.setAttribute('aria-live', 'polite');

  const paperInner = document.createElement('div');
  paperInner.className = 'guiding-paper__inner';

  const paperHeader = document.createElement('header');
  paperHeader.className = 'guiding-paper__header';
  paperHeader.innerHTML = `
    <h2 class="guiding-paper__title">${GUIDING_LETTER_SCENE_META.letterTitle}</h2>
    <p class="guiding-paper__date-tag">${GUIDING_LETTER_SCENE_META.letterSubtitle}</p>
  `;

  const paperBody = document.createElement('div');
  paperBody.className = 'guiding-paper__body';

  // Pre-create DOM nodes for each paragraph so updates are fast and flicker-free
  const paraElements = GUIDING_LETTER_PARAGRAPHS.map((para) => {
    const el = document.createElement(para.isClosing ? 'div' : 'p');
    el.className = para.isClosing ? 'guiding-closing-box' : 'guiding-paragraph';
    el.style.display = 'none';
    paperBody.appendChild(el);
    return { id: para.id, isClosing: para.isClosing, element: el };
  });

  paperInner.appendChild(paperHeader);
  paperInner.appendChild(paperBody);
  paper.appendChild(paperInner);

  // Personal Envelope Element (Shown during the Dissolve & Merge transition)
  const mergeEnvelope = document.createElement('div');
  mergeEnvelope.className = 'guiding-merge-envelope';
  const recipientLabel = personalLetter?.mentorName
    ? `Lá thư gửi tới ${personalLetter.mentorName}`
    : 'Lá thư tri ân của bạn';
  mergeEnvelope.innerHTML = `
    <div class="guiding-merge-envelope__icon">${ICONS.MAIL_LETTER}</div>
    <span class="guiding-merge-envelope__label">${recipientLabel}</span>
  `;

  centerStage.appendChild(paper);
  centerStage.appendChild(mergeEnvelope);
  screen.appendChild(centerStage);

  // 4. Footer Bar: Hint + CONTINUE Button (Hidden until all content is displayed)
  const footer = document.createElement('footer');
  footer.className = 'guiding-footer';

  const hintEl = document.createElement('span');
  hintEl.className = 'guiding-footer__hint';
  hintEl.textContent =
    'Nhấn [SPACE] hoặc chạm vào thư để hiện nhanh đoạn đang gõ • Nhấn [SKIP] để hiện toàn bộ';

  const continueBtn = createButton({
    label: 'CONTINUE',
    variant: 'warm',
    iconSvg: ICONS.SPARKLES,
  });
  continueBtn.element.style.display = 'none';

  footer.appendChild(hintEl);
  footer.appendChild(continueBtn.element);
  screen.appendChild(footer);

  // =========================================================================
  // TYPEWRITER CONTROLLER WIRING
  // =========================================================================
  const renderTypewriterState = (state) => {
    state.renderedParagraphs.forEach((pState, idx) => {
      const domEntry = paraElements[idx];
      if (!domEntry) return;

      if (!pState.visible) {
        domEntry.element.style.display = 'none';
        return;
      }

      domEntry.element.style.display = 'block';
      domEntry.element.textContent = pState.displayedText;

      if (pState.hasCursor) {
        const cursorSpan = document.createElement('span');
        cursorSpan.className = 'guiding-type-cursor';
        cursorSpan.textContent = '▋';
        domEntry.element.appendChild(cursorSpan);
      }
    });

    // Auto-scroll smoothly to keep active typing line visible on compact viewports
    if (state.isTypingParagraph) {
      paper.scrollTop = paper.scrollHeight;
    }

    if (state.isAllCompleted) {
      skipBtn.element.style.display = 'none';
      continueBtn.element.style.display = 'inline-flex';
      hintEl.textContent =
        'Bức tâm thư 20/11 đã hoàn tất. Nhấn CONTINUE để hòa ánh sáng vào bầu trời tri ân.';
    } else {
      continueBtn.element.style.display = 'none';
    }
  };

  const typewriter = new GuidingLetterTypewriter({
    paragraphs: GUIDING_LETTER_PARAGRAPHS,
    charDelayMs: 34,
    paragraphPauseMs: 1200,
    reducedMotion,
    onUpdate: renderTypewriterState,
    onClosingReached: () => {
      audioManager.playPianoClosingChord();
    },
    onTypeTick: () => {
      audioManager.playSoftKeyTick();
    },
    onAllComplete: () => {
      gsap.fromTo(
        continueBtn.element,
        { opacity: 0, y: 8, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' }
      );
    },
  });

  // Player Interactions: Click / Space / Skip / Continue
  paper.addEventListener('click', () => {
    if (isTransitioning) return;
    if (!typewriter.getState().isAllCompleted) {
      typewriter.completeCurrentParagraph();
    }
  });

  skipBtn.element.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isTransitioning) return;
    audioManager.playInteract();
    typewriter.skipAll();
  });

  const handleKeyDown = (event) => {
    if (isTransitioning) return;
    if (event.key === ' ') {
      event.preventDefault();
      if (!typewriter.getState().isAllCompleted) {
        typewriter.completeCurrentParagraph();
      } else {
        triggerDissolveAndMergeToRain();
      }
    } else if (event.key === 'Enter' && typewriter.getState().isAllCompleted) {
      event.preventDefault();
      triggerDissolveAndMergeToRain();
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // =========================================================================
  // AMBIENT GOLDEN DUST & DISSOLVE-INTO-PARTICLES CANVAS ENGINE
  // =========================================================================
  const ctx = canvas.getContext('2d');
  let width = 1280;
  let height = 720;

  const ambientDust = Array.from({ length: reducedMotion ? 16 : 36 }, (_, i) => ({
    x: ((i * 79) % 1000) / 1000,
    y: ((i * 43) % 1000) / 1000,
    vy: -0.012 - (i % 4) * 0.005,
    vx: ((i % 3) - 1) * 0.004,
    radius: 1.2 + (i % 3) * 0.8,
    alpha: 0.25 + (i % 4) * 0.14,
    color: i % 2 === 0 ? '#fde047' : '#fbcfe8',
  }));

  const dissolveParticles = [];

  const handleResize = () => {
    width = window.innerWidth || 1280;
    height = window.innerHeight || 720;
    canvas.width = width;
    canvas.height = height;
  };
  handleResize();
  window.addEventListener('resize', handleResize);

  const spawnDissolveParticles = () => {
    const rect = paper.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;
    const count = reducedMotion ? 36 : 110;

    for (let i = 0; i < count; i += 1) {
      const sx = rect.left + Math.random() * Math.max(200, rect.width);
      const sy = rect.top + Math.random() * Math.max(200, rect.height);
      dissolveParticles.push({
        x: sx,
        y: sy,
        targetX: centerX + (Math.random() - 0.5) * 28,
        targetY: centerY + (Math.random() - 0.5) * 28,
        vx: (Math.random() - 0.5) * 60,
        vy: -30 - Math.random() * 55,
        radius: 1.8 + (i % 3) * 1.1,
        alpha: 0.95,
        phase: Math.random() * Math.PI * 2,
        color:
          i % 3 === 0 ? '#fef08a' : i % 3 === 1 ? '#fbbf24' : '#38bdf8',
      });
    }
    dissolveActive = true;
  };

  let dissolveElapsed = 0;
  let lastTick = performance.now();

  const renderDustLoop = (now) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTick) / 1000 || 0.016));
    lastTick = now;

    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      // 1. Slow ambient dust motes
      for (let i = 0; i < ambientDust.length; i += 1) {
        const d = ambientDust[i];
        if (!reducedMotion) {
          d.y += d.vy * dt;
          d.x += d.vx * dt;
          if (d.y < -0.04) d.y = 1.04;
          if (d.x < -0.04) d.x = 1.04;
          if (d.x > 1.04) d.x = -0.04;
        }
        ctx.globalAlpha = d.alpha;
        ctx.fillStyle = d.color;
        ctx.beginPath();
        ctx.arc(d.x * width, d.y * height, d.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Dissolving letter particles converging into the Personal Envelope & ascending
      if (dissolveActive) {
        dissolveElapsed += dt;
        for (let i = 0; i < dissolveParticles.length; i += 1) {
          const p = dissolveParticles[i];
          if (dissolveElapsed < 1.15) {
            // Phase A: Swirl and converge toward the Personal Envelope at center
            p.x += (p.targetX - p.x) * dt * 3.2 + Math.sin(dissolveElapsed * 6 + p.phase) * 1.4;
            p.y += (p.targetY - p.y) * dt * 3.2 - 18 * dt;
          } else {
            // Phase B: Ascend together into the Rain of Gratitude sky
            p.y -= (140 + (i % 5) * 35) * dt;
            p.x += Math.sin(dissolveElapsed * 4 + p.phase) * 1.8;
            p.alpha = Math.max(0, p.alpha - dt * 0.85);
          }

          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;
    }

    rafId = window.requestAnimationFrame(renderDustLoop);
  };

  // =========================================================================
  // SEAMLESS DISSOLVE & MERGE TRANSITION INTO RAIN OF GRATITUDE (SECTION 7)
  // =========================================================================
  const triggerDissolveAndMergeToRain = () => {
    if (isTransitioning || !typewriter.getState().isAllCompleted) return;
    isTransitioning = true;
    continueBtn.setDisabled(true);

    audioManager.playWarmChime();
    paper.classList.add('is-dissolving');
    spawnDissolveParticles();

    const tl = gsap.timeline({
      onComplete: () => {
        audioManager.stopGentlePianoMelody();
        eventBus.emit(EVENTS.GUIDING_LETTER_COMPLETED, {
          letter: personalLetter,
        });
        if (typeof onComplete === 'function') {
          onComplete();
        }
      },
    });

    // 1. Cream paper glows & dissolves into golden light particles
    tl.to(paper, {
      opacity: 0,
      scale: 0.92,
      y: -24,
      duration: 0.75,
      ease: 'power2.inOut',
    });

    // 2. Player's personal envelope appears at center as particles merge into it
    tl.to(
      mergeEnvelope,
      {
        opacity: 1,
        scale: 1.08,
        duration: 0.55,
        ease: 'back.out(1.6)',
      },
      '-=0.35'
    );

    // 3. Merged light & personal envelope ascend into the sky + camera expands
    tl.to(
      mergeEnvelope,
      {
        y: -180,
        scale: 1.28,
        opacity: 0,
        duration: 0.95,
        ease: 'power2.in',
      },
      '+=0.35'
    );

    tl.to(
      screen,
      {
        scale: 1.08,
        opacity: 0,
        duration: 0.55,
        ease: 'power1.in',
      },
      '-=0.5'
    );
  };

  continueBtn.element.addEventListener('click', (e) => {
    e.stopPropagation();
    triggerDissolveAndMergeToRain();
  });

  return {
    element: screen,
    typewriter,
    startSequence() {
      audioManager.playPaperOpen();
      audioManager.startGentlePianoMelody();

      gsap.fromTo(
        paper,
        { opacity: 0, y: 28, scaleY: 0.88 },
        { opacity: 1, y: 0, scaleY: 1, duration: 0.65, ease: 'power3.out' }
      );

      rafId = window.requestAnimationFrame(renderDustLoop);
      typewriter.start(450);
    },
    destroy() {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = null;
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
      audioManager.stopGentlePianoMelody();
      typewriter.destroy();
      screen.remove();
    },
  };
}

export default createGuidingLetterScreen;
