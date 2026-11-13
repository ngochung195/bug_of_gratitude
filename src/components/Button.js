export function createButton({
  label = '',
  variant = 'primary',
  iconSvg = '',
  ariaLabel = '',
  disabled = false,
  active = false,
  className = '',
  onClick = null,
} = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `bog-btn bog-btn--${variant} ${className}`.trim();

  if (ariaLabel) {
    button.setAttribute('aria-label', ariaLabel);
  }

  if (disabled) {
    button.disabled = true;
    button.classList.add('is-disabled');
  }

  if (active) {
    button.classList.add('is-active');
  }

  const renderContent = (textLabel, svgMarkup) => {
    button.innerHTML = '';
    if (svgMarkup) {
      const iconSpan = document.createElement('span');
      iconSpan.className = 'bog-btn__icon';
      iconSpan.innerHTML = svgMarkup;
      button.appendChild(iconSpan);
    }
    if (textLabel) {
      const textSpan = document.createElement('span');
      textSpan.className = 'bog-btn__label';
      textSpan.textContent = textLabel;
      button.appendChild(textSpan);
    }
  };

  renderContent(label, iconSvg);

  if (typeof onClick === 'function') {
    button.addEventListener('click', (event) => {
      if (button.disabled) return;
      onClick(event);
    });
  }

  return {
    element: button,
    setDisabled(isDisabled) {
      button.disabled = Boolean(isDisabled);
      button.classList.toggle('is-disabled', Boolean(isDisabled));
    },
    setActive(isActive) {
      button.classList.toggle('is-active', Boolean(isActive));
    },
    setContent(newLabel, newIconSvg = iconSvg) {
      renderContent(newLabel, newIconSvg);
    },
  };
}

