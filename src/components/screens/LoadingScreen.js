import { createLoadingIndicator } from '../LoadingIndicator.js';
import { createProgressBar } from '../ProgressBar.js';

const BOOT_STEPS = [
  { progress: 25, text: 'MOUNTING RETRO-CYBER KERNEL...', log: 'Loaded core modules & shader grid' },
  { progress: 55, text: 'SCANNING WORKSTATION SECTORS...', log: '4 debugging terminals detected' },
  { progress: 85, text: 'CHECKING EMOTIONAL TELEMETRY...', log: 'Warning: Gratitude index anomalous' },
  { progress: 100, text: 'SYSTEM READY. ENTERING LAB...', log: 'Workstation shell initialized' },
];

export function createLoadingScreen({ onComplete = null } = {}) {
  const screen = document.createElement('section');
  screen.className = 'bog-screen loading-screen';
  screen.setAttribute('aria-label', 'Loading Screen');

  const panel = document.createElement('div');
  panel.className = 'bog-card loading-panel';

  const header = document.createElement('div');
  header.className = 'loading-header';
  header.innerHTML = `
    <span class="loading-logo">BUG OF GRATITUDE</span>
    <span class="loading-tag">BOOT_SEQ // 20.11</span>
  `;

  const indicator = createLoadingIndicator({
    text: 'BOOTING WORKSTATION ENVIRONMENT...',
  });

  const terminal = document.createElement('div');
  terminal.className = 'loading-terminal';
  terminal.setAttribute('aria-live', 'polite');

  const progressBar = createProgressBar({
    label: 'LOADING ASSETS & SHELL',
    value: 5,
    max: 100,
  });

  panel.appendChild(header);
  panel.appendChild(indicator.element);
  panel.appendChild(terminal);
  panel.appendChild(progressBar.element);
  screen.appendChild(panel);

  const timers = [];

  const appendLog = (message, status = 'OK') => {
    const line = document.createElement('div');
    line.className = 'loading-terminal__line';
    const statusClass = status === 'WARN' ? 'loading-terminal__warn' : 'loading-terminal__ok';
    line.innerHTML = `
      <span class="loading-terminal__prefix">&gt;</span>
      <span>${message}</span>
      <span class="${statusClass}">[${status}]</span>
    `;
    terminal.appendChild(line);
  };

  const startSequence = () => {
    terminal.innerHTML = '';
    appendLog('Initializing Phaser 3 viewport & HUD layer...');

    BOOT_STEPS.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        progressBar.update(step.progress, 100);
        indicator.setText(step.text);
        appendLog(step.log, step.progress === 85 ? 'WARN' : 'OK');

        if (index === BOOT_STEPS.length - 1 && typeof onComplete === 'function') {
          const finishTimer = window.setTimeout(() => {
            onComplete();
          }, 320);
          timers.push(finishTimer);
        }
      }, (index + 1) * 340);

      timers.push(timer);
    });
  };

  const clearTimers = () => {
    timers.forEach((id) => window.clearTimeout(id));
    timers.length = 0;
  };

  return {
    element: screen,
    startSequence,
    destroy() {
      clearTimers();
      screen.remove();
    },
  };
}
