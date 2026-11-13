class NotificationManager {
  constructor() {
    this.container = null;
  }

  mount(parent = document.body) {
    if (this.container) return;
    this.container = document.createElement('div');
    this.container.className = 'bog-toast-container';
    this.container.setAttribute('aria-live', 'polite');
    parent.appendChild(this.container);
  }

  show({ message = '', type = 'info', duration = 2600 } = {}) {
    if (!this.container) {
      this.mount(document.body);
    }

    const toast = document.createElement('div');
    toast.className = `bog-toast bog-toast--${type}`;
    toast.textContent = message;

    this.container.appendChild(toast);

    window.setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 180ms ease';
      window.setTimeout(() => {
        toast.remove();
      }, 190);
    }, duration);
  }
}

export const notification = new NotificationManager();
export default NotificationManager;
