import './styles/reset.css';
import './styles/variables.css';
import './styles/global.css';
import './styles/animations.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/introCinematic.css';
import './styles/mission.css';
import './styles/lastBug.css';
import './styles/gratitudeLetter.css';
import './styles/guidingLetter.css';
import './styles/rainOfGratitude.css';
import './styles/gratitudeSky.css';

import { EVENTS } from './config/constants.js';
import { eventBus } from './core/EventBus.js';
import { gameManager } from './core/GameManager.js';
import { uiManager } from './core/UIManager.js';

eventBus.on(EVENTS.APP_READY, (info) => {
  console.info(
    `[${info.title}] v${info.version} initialized (Phaser v${info.phaserVersion}, GSAP v${info.gsapVersion})`
  );
});

window.addEventListener('DOMContentLoaded', () => {
  gameManager.init();
  uiManager.init('#ui-layer');
});
