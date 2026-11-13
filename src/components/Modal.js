import { ICONS } from '../utils/icons.js';

export function createModal({
  title = 'SYSTEM MODAL',
  content = null,
  footerButtons = [],
  closeOnBackdrop = true,
  onClose = null,
} = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'bog-modal-backdrop';
  backdrop.setAttribute('role', 'dialog');
  backdrop.setAttribute('aria-modal', 'true');
  backdrop.setAttribute('aria-label', title);

  const modal = document.createElement('div');
  modal.className = 'bog-modal';

  const header = document.createElement('div');
  header.className = 'bog-modal__header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'bog-modal__title';
  titleEl.textContent = title;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'bog-modal__close';
  closeBtn.setAttribute('aria-label', 'Close modal');
  closeBtn.innerHTML = ICONS.CLOSE;

  header.appendChild(titleEl);
  header.appendChild(closeBtn);

  const body = document.createElement('div');
  body.className = 'bog-modal__body';

  if (typeof content === 'string') {
    body.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    body.appendChild(content);
  }

  const footer = document.createElement('div');
  footer.className = 'bog-modal__footer';

  if (footerButtons.length > 0) {
    footerButtons.forEach((btn) => {
      footer.appendChild(btn.element || btn);
    });
  } else {
    footer.style.display = 'none';
  }

  modal.appendChild(header);
  modal.appendChild(body);
  modal.appendChild(footer);
  backdrop.appendChild(modal);

  let isOpen = false;

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    backdrop.classList.remove('is-open');
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const open = () => {
    isOpen = true;
    backdrop.classList.add('is-open');
    closeBtn.focus();
  };

  closeBtn.addEventListener('click', close);

  if (closeOnBackdrop) {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        close();
      }
    });
  }

  return {
    element: backdrop,
    bodyElement: body,
    open,
    close,
    isOpen: () => isOpen,
  };
}

