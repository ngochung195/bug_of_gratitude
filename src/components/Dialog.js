export function createDialog({
  badge = 'HINT',
  message = 'Di chuyển xung quanh trạm làm việc để kiểm tra hệ thống.',
  keyHint = 'Press [E] to Inspect',
} = {}) {
  const dialog = document.createElement('div');
  dialog.className = 'bog-dialog';
  dialog.setAttribute('role', 'region');
  dialog.setAttribute('aria-label', 'Interaction Hint');

  const content = document.createElement('div');
  content.className = 'bog-dialog__content';

  const badgeEl = document.createElement('span');
  badgeEl.className = 'bog-dialog__badge';
  badgeEl.textContent = badge;

  const messageEl = document.createElement('span');
  messageEl.className = 'bog-dialog__message';
  messageEl.textContent = message;

  content.appendChild(badgeEl);
  content.appendChild(messageEl);

  const keyEl = document.createElement('span');
  keyEl.className = 'bog-dialog__key';
  keyEl.textContent = keyHint;

  dialog.appendChild(content);
  dialog.appendChild(keyEl);

  return {
    element: dialog,
    update({ newBadge, newMessage, newKeyHint } = {}) {
      if (newBadge !== undefined) badgeEl.textContent = newBadge;
      if (newMessage !== undefined) messageEl.textContent = newMessage;
      if (newKeyHint !== undefined) keyEl.textContent = newKeyHint;
    },
  };
}
