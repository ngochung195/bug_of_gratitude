import { EVENTS } from '../../config/constants.js';
import { eventBus } from '../../core/EventBus.js';
import { ICONS } from '../../utils/icons.js';
import { createButton } from '../Button.js';
import { createModal } from '../Modal.js';

export function createIntroScreen() {
  const screen = document.createElement('section');
  screen.className = 'bog-screen intro-screen';
  screen.setAttribute('aria-label', 'Intro Screen');

  const ambient = document.createElement('div');
  ambient.className = 'intro-screen__ambient';
  ambient.innerHTML = `
    <div class="intro-orb intro-orb--purple"></div>
    <div class="intro-orb intro-orb--blue"></div>
    <div class="intro-orb intro-orb--warm"></div>
  `;

  const panel = document.createElement('div');
  panel.className = 'bog-card intro-panel';

  const badge = document.createElement('div');
  badge.className = 'intro-badge';
  badge.innerHTML = `<span class="intro-badge__dot"></span><span>SYSTEM ALERT // CODEGYM 20.11</span>`;

  const title = document.createElement('h1');
  title.className = 'intro-title';
  title.innerHTML = `BUG OF <span class="intro-title__highlight">GRATITUDE</span>`;

  const quoteEn = document.createElement('p');
  quoteEn.className = 'intro-quote-en';
  quoteEn.textContent = '"The biggest bug is forgetting to say THANK YOU."';

  const quoteVi = document.createElement('p');
  quoteVi.className = 'intro-quote-vi';
  quoteVi.innerHTML = `<span class="bog-btn__icon">${ICONS.HEART_SPARK}</span><span>"Có những lỗi không thể sửa bằng code."</span>`;

  const actions = document.createElement('div');
  actions.className = 'intro-actions';

  const startBtn = createButton({
    label: 'START GAME',
    variant: 'primary',
    iconSvg: ICONS.PLAY,
    onClick: () => {
      eventBus.emit(EVENTS.GAME_START_REQUESTED);
    },
  });

  const aboutModalContent = document.createElement('div');
  aboutModalContent.className = 'about-list';
  aboutModalContent.innerHTML = `
    <p><strong>BUG OF GRATITUDE</strong> là mini-game tương tác kết hợp giữa thử thách lập trình và thông điệp tri ân thầy cô, mentor nhân dịp 20/11.</p>
    <p>Trong vai một lập trình viên trực ca đêm, bạn sẽ kiểm tra và xử lý 4 lỗi kinh điển của hệ thống trước khi đối mặt với một mã lỗi đặc biệt: <code>BUG #005: MISSING GRATITUDE</code>.</p>
    <div class="about-highlight">
      "Lỗi lớn nhất không phải là lỗi trong code, mà là đôi khi chúng ta quên nói lời cảm ơn."
    </div>
  `;

  const closeAboutBtn = createButton({
    label: 'ĐÓNG',
    variant: 'secondary',
  });

  const aboutModal = createModal({
    title: 'ABOUT // BUG OF GRATITUDE',
    content: aboutModalContent,
    footerButtons: [closeAboutBtn],
  });

  closeAboutBtn.element.addEventListener('click', () => aboutModal.close());

  const aboutBtn = createButton({
    label: 'ABOUT',
    variant: 'secondary',
    iconSvg: ICONS.INFO,
    onClick: () => {
      aboutModal.open();
    },
  });

  actions.appendChild(startBtn.element);
  actions.appendChild(aboutBtn.element);

  const meta = document.createElement('div');
  meta.className = 'intro-meta';
  meta.innerHTML = `
    <span>BUILD v0.1.0 // RETRO-CYBER HUD</span>
    <span>4 CODE MISSIONS + 1 HEART PATCH</span>
  `;

  panel.appendChild(badge);
  panel.appendChild(title);
  panel.appendChild(quoteEn);
  panel.appendChild(quoteVi);
  panel.appendChild(actions);
  panel.appendChild(meta);

  screen.appendChild(ambient);
  screen.appendChild(panel);
  screen.appendChild(aboutModal.element);

  return {
    element: screen,
    destroy() {
      screen.remove();
    },
  };
}
