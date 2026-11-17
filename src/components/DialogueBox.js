import { audioManager } from '../systems/AudioManager.js';
import { DialogueController } from '../systems/DialogueController.js';
import { ICONS } from '../utils/icons.js';
import { createButton } from './Button.js';

export function createDialogueBox({
  nodes = [],
  typeSpeedMs = 22,
  allowSkip = true,
  onSceneChange,
  onComplete,
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dialogue-box';
  wrapper.setAttribute('role', 'region');
  wrapper.setAttribute('aria-label', 'Story Dialogue');

  // Header row: Speaker Badge + Scene Step + Skip button
  const header = document.createElement('div');
  header.className = 'dialogue-box__header';

  const speakerGroup = document.createElement('div');
  speakerGroup.className = 'dialogue-box__speaker-group';

  const speakerBadge = document.createElement('span');
  speakerBadge.className = 'dialogue-box__speaker';

  const speakerRole = document.createElement('span');
  speakerRole.className = 'dialogue-box__role';

  speakerGroup.appendChild(speakerBadge);
  speakerGroup.appendChild(speakerRole);

  const rightMeta = document.createElement('div');
  rightMeta.className = 'dialogue-box__meta';

  const stepCounter = document.createElement('span');
  stepCounter.className = 'dialogue-box__step';

  const skipBtn = document.createElement('button');
  skipBtn.type = 'button';
  skipBtn.className = 'dialogue-box__skip-btn';
  skipBtn.innerHTML = `${ICONS.FAST_FORWARD}<span>SKIP</span>`;
  skipBtn.style.display = allowSkip ? 'inline-flex' : 'none';

  rightMeta.appendChild(stepCounter);
  rightMeta.appendChild(skipBtn);

  header.appendChild(speakerGroup);
  header.appendChild(rightMeta);

  // Body Text Area
  const contentArea = document.createElement('div');
  contentArea.className = 'dialogue-box__content';

  const textEl = document.createElement('p');
  textEl.className = 'dialogue-box__text';

  const cursorEl = document.createElement('span');
  cursorEl.className = 'dialogue-box__cursor';
  cursorEl.textContent = '▋';

  contentArea.appendChild(textEl);
  contentArea.appendChild(cursorEl);

  // Footer Row: Key Hint + Continue / Final Action Button
  const footer = document.createElement('div');
  footer.className = 'dialogue-box__footer';

  const keyHint = document.createElement('span');
  keyHint.className = 'dialogue-box__hint';
  keyHint.textContent = 'Nhấn [SPACE] hoặc [ENTER] để tiếp tục';

  const actionWrap = document.createElement('div');
  actionWrap.className = 'dialogue-box__actions';

  const continueBtn = createButton({
    label: 'CONTINUE',
    variant: 'primary',
    size: 'sm',
    iconSvg: ICONS.CHEVRON_RIGHT,
  });

  actionWrap.appendChild(continueBtn.element);
  footer.appendChild(keyHint);
  footer.appendChild(actionWrap);

  wrapper.appendChild(header);
  wrapper.appendChild(contentArea);
  wrapper.appendChild(footer);

  const renderState = (state) => {
    const { node, currentIndex, totalNodes, speakerProfile, displayedText, isTyping, isLastNode } =
      state;
    if (!node) return;

    wrapper.dataset.speaker = speakerProfile.id;
    speakerBadge.textContent = speakerProfile.name;
    speakerBadge.style.borderColor = speakerProfile.accentColor;
    speakerBadge.style.color = speakerProfile.accentColor;
    speakerRole.textContent = speakerProfile.role;

    stepCounter.textContent = `SCENE ${currentIndex + 1}/${totalNodes}`;
    textEl.textContent = displayedText;
    cursorEl.classList.toggle('is-typing', isTyping);

    if (allowSkip) {
      skipBtn.style.display = isLastNode && !isTyping ? 'none' : 'inline-flex';
    }

    if (isTyping) {
      continueBtn.setContent('HIỂN THỊ NHANH', ICONS.FAST_FORWARD);
      keyHint.textContent = 'Nhấn [SPACE] / [ENTER] để hiện toàn bộ câu';
    } else if (isLastNode) {
      const ctaText = node.ctaLabel || 'START INVESTIGATION';
      continueBtn.setContent(ctaText, ICONS.PLAY);
      keyHint.textContent = `Nhấn [SPACE] / [ENTER] hoặc nút "${ctaText}" để bắt đầu điều tra`;
    } else {
      continueBtn.setContent('CONTINUE', ICONS.CHEVRON_RIGHT);
      keyHint.textContent = 'Nhấn [SPACE] / [ENTER] để sang cảnh tiếp theo';
    }
  };

  const controller = new DialogueController({
    nodes,
    typeSpeedMs,
    onUpdate: renderState,
    onNodeChange: (state) => {
      if (typeof onSceneChange === 'function') {
        onSceneChange(state);
      }
    },
    onComplete: (state) => {
      if (typeof onComplete === 'function') {
        onComplete(state);
      }
    },
    onTypeChar: (speaker) => {
      audioManager.playTypeBlip(speaker);
    },
  });

  continueBtn.element.addEventListener('click', () => {
    audioManager.playInteract();
    controller.advance();
  });

  contentArea.addEventListener('click', () => {
    controller.advance();
  });

  skipBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    audioManager.playInteract();
    if (!controller.getState().isLastNode) {
      controller.skipToFinalNode();
    } else {
      controller.advance();
    }
  });

  const handleKeyDown = (event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
      event.preventDefault();
      audioManager.playInteract();
      controller.advance();
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return {
    element: wrapper,
    controller,
    start: (idx = 0) => controller.start(idx),
    advance: () => controller.advance(),
    skip: () => controller.skipToFinalNode(),
    destroy() {
      window.removeEventListener('keydown', handleKeyDown);
      controller.destroy();
      wrapper.remove();
    },
  };
}

export default createDialogueBox;

