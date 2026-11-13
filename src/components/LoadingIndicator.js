export function createLoadingIndicator({ text = 'INITIALIZING SYSTEM...' } = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bog-loading-indicator';
  wrapper.setAttribute('role', 'status');

  const blocks = document.createElement('span');
  blocks.className = 'bog-loading-indicator__blocks';
  blocks.innerHTML = `
    <span class="bog-loading-indicator__block"></span>
    <span class="bog-loading-indicator__block"></span>
    <span class="bog-loading-indicator__block"></span>
  `;

  const textEl = document.createElement('span');
  textEl.className = 'bog-loading-indicator__text';
  textEl.textContent = text;

  const cursor = document.createElement('span');
  cursor.className = 'bog-loading-indicator__cursor';

  wrapper.appendChild(blocks);
  wrapper.appendChild(textEl);
  wrapper.appendChild(cursor);

  return {
    element: wrapper,
    setText(newText) {
      textEl.textContent = newText;
    },
  };
}

