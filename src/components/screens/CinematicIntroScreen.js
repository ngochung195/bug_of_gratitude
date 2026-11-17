import gsap from 'gsap';
import { APP_CONFIG, EVENTS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { CINEMATIC_SCENES } from '../../data/introStoryData.js';
import { audioManager } from '../../systems/AudioManager.js';
import { missionManager } from '../../systems/MissionManager.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { createDialogueBox } from '../DialogueBox.js';

export function createCinematicIntroScreen({ onComplete } = {}) {
  let hasFinished = false;

  const finishIntroAndStartInvestigation = () => {
    if (hasFinished) return;
    hasFinished = true;
    audioManager.stopMysteryAmbient();
    missionManager.markIntroCompleted();

    if (typeof onComplete === 'function') {
      onComplete();
    } else {
      eventBus.emit(EVENTS.INVESTIGATION_START_REQUESTED);
    }
  };

  const screen = document.createElement('section');
  screen.className = 'cinematic-screen';
  screen.dataset.mood = 'normal-office';
  screen.setAttribute('aria-label', 'Cinematic Introduction');

  // Night Office Backdrop with Rain Outside Window
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
      </div>
      <div class="office-server-rack">
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
        <div class="office-server-led-row"></div>
      </div>
    </div>
  `;
  screen.appendChild(backdrop);

  // 1. Top Bar: Official CodeGym Brand Pill + Time Label + Skip Intro Button
  const topbar = document.createElement('header');
  topbar.className = 'cinematic-topbar';

  const brandPill = document.createElement('div');
  brandPill.className = 'cinematic-brand-pill';
  brandPill.innerHTML = `
    <img src="${APP_CONFIG.BRAND_LOGOS.WORDMARK}" alt="CodeGym Logo" />
    <span class="cinematic-time-badge">21:15 // CODEGYM HEADQUARTERS</span>
  `;
  const timeBadgeEl = brandPill.querySelector('.cinematic-time-badge');

  const skipAllBtn = createButton({
    label: 'BỎ QUA MỞ ĐẦU (SKIP)',
    variant: 'ghost',
    size: 'sm',
    iconSvg: ICONS.FAST_FORWARD,
    onClick: finishIntroAndStartInvestigation,
  });

  topbar.appendChild(brandPill);
  topbar.appendChild(skipAllBtn.element);
  screen.appendChild(topbar);

  // 2. Center Monitor Visual Stage
  const stage = document.createElement('div');
  stage.className = 'cinematic-stage';

  const monitorFrame = document.createElement('div');
  monitorFrame.className = 'cinematic-monitor-frame';

  const sceneCodeEl = document.createElement('span');
  sceneCodeEl.className = 'cinematic-scene-code';
  sceneCodeEl.textContent = 'SCENE 01 // A NORMAL DAY';

  const clockEl = document.createElement('div');
  clockEl.className = 'cinematic-clock-display';
  clockEl.textContent = 'CODEGYM IT // ONLINE';

  const breachAlertEl = document.createElement('div');
  breachAlertEl.className = 'cinematic-breach-alert';
  breachAlertEl.textContent = 'SYSTEM SECURITY COMPROMISED.';

  const statusGrid = document.createElement('div');
  statusGrid.className = 'cinematic-status-grid';
  statusGrid.innerHTML = `
    <div class="cinematic-status-item" data-sys="server">● MAIN SERVER: CONNECTED</div>
    <div class="cinematic-status-item" data-sys="db">● STUDENT DB: HEALTHY</div>
    <div class="cinematic-status-item" data-sys="firewall">● FIREWALL: ACTIVE</div>
    <div class="cinematic-status-item" data-sys="internal">● INTERNAL OPS: NORMAL</div>
  `;

  const startInvestigationBtn = createButton({
    label: 'START INVESTIGATION',
    variant: 'warm',
    iconSvg: ICONS.PLAY,
    onClick: finishIntroAndStartInvestigation,
  });
  startInvestigationBtn.element.style.display = 'none';
  startInvestigationBtn.element.style.marginTop = '8px';

  monitorFrame.appendChild(sceneCodeEl);
  monitorFrame.appendChild(clockEl);
  monitorFrame.appendChild(breachAlertEl);
  monitorFrame.appendChild(statusGrid);
  monitorFrame.appendChild(startInvestigationBtn.element);
  stage.appendChild(monitorFrame);
  screen.appendChild(stage);

  // Update visual stage when transitioning between Scene 1..5
  const updateStageForScene = (state) => {
    const node = state?.node;
    if (!node) return;

    screen.dataset.mood = node.visualMood || 'normal-office';
    sceneCodeEl.textContent = node.code || `SCENE 0${node.sceneNumber}`;
    if (timeBadgeEl) {
      timeBadgeEl.textContent = node.timeLabel || '';
    }

    const items = statusGrid.querySelectorAll('.cinematic-status-item');
    const setCompromised = (compromised) => {
      items.forEach((el) => el.classList.toggle('is-compromised', compromised));
      if (compromised) {
        statusGrid.querySelector('[data-sys="server"]').textContent =
          '✖ MAIN SERVER: DISCONNECTED';
        statusGrid.querySelector('[data-sys="db"]').textContent =
          '✖ DATABASE: CRITICAL ERROR';
        statusGrid.querySelector('[data-sys="firewall"]').textContent =
          '✖ SECURITY FIREWALL: DISABLED';
        statusGrid.querySelector('[data-sys="internal"]').textContent =
          '✖ INTERNAL PROCESSES: HALTED';
      } else {
        statusGrid.querySelector('[data-sys="server"]').textContent =
          '● MAIN SERVER: CONNECTED';
        statusGrid.querySelector('[data-sys="db"]').textContent =
          '● STUDENT DB: HEALTHY';
        statusGrid.querySelector('[data-sys="firewall"]').textContent =
          '● FIREWALL: ACTIVE';
        statusGrid.querySelector('[data-sys="internal"]').textContent =
          '● INTERNAL OPS: NORMAL';
      }
    };

    if (node.sceneNumber === 1) {
      clockEl.textContent = 'CODEGYM IT // ONLINE';
      breachAlertEl.classList.remove('is-visible');
      setCompromised(false);
      startInvestigationBtn.element.style.display = 'none';
    } else if (node.sceneNumber === 2) {
      clockEl.textContent = '23 : 47';
      breachAlertEl.classList.remove('is-visible');
      setCompromised(false);
      startInvestigationBtn.element.style.display = 'none';
    } else if (node.sceneNumber === 3) {
      clockEl.textContent = '⚠ BREACH // 23:48';
      breachAlertEl.classList.add('is-visible');
      setCompromised(true);
      startInvestigationBtn.element.style.display = 'none';
      audioManager.playCriticalAlert();

      gsap.fromTo(
        monitorFrame,
        { x: -10 },
        { x: 0, duration: 0.35, ease: 'rough({ strength: 3, points: 12 })' }
      );
    } else if (node.sceneNumber === 4) {
      clockEl.textContent = 'UNKNOWN HACKER // LIVE';
      breachAlertEl.classList.add('is-visible');
      setCompromised(true);
      startInvestigationBtn.element.style.display = 'none';
    } else if (node.sceneNumber === 5) {
      clockEl.textContent = 'MISSION // RESTORE CODEGYM';
      breachAlertEl.classList.remove('is-visible');
      setCompromised(true);
      startInvestigationBtn.element.style.display = 'inline-flex';
    }

    gsap.fromTo(
      monitorFrame,
      { opacity: 0.72, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.26, ease: 'power2.out' }
    );
  };

  // 3. Bottom Reusable Dialogue System
  const dialogueBox = createDialogueBox({
    nodes: CINEMATIC_SCENES,
    typeSpeedMs: 20,
    allowSkip: true,
    onSceneChange: updateStageForScene,
    onComplete: finishIntroAndStartInvestigation,
  });

  screen.appendChild(dialogueBox.element);

  return {
    element: screen,
    startSequence() {
      audioManager.startMysteryAmbient();
      dialogueBox.start(0);
    },
    destroy() {
      audioManager.stopMysteryAmbient();
      dialogueBox.destroy();
      screen.remove();
    },
  };
}

export default createCinematicIntroScreen;
