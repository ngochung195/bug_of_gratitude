export function createProgressBar({
  label = 'PROGRESS',
  value = 0,
  max = 100,
  formatValue = null,
} = {}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'bog-progress';

  const header = document.createElement('div');
  header.className = 'bog-progress__header';

  const labelEl = document.createElement('span');
  labelEl.textContent = label;

  const valueEl = document.createElement('span');
  valueEl.className = 'bog-progress__value';

  header.appendChild(labelEl);
  header.appendChild(valueEl);

  const track = document.createElement('div');
  track.className = 'bog-progress__track';
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', String(max));

  const fill = document.createElement('div');
  fill.className = 'bog-progress__fill';
  track.appendChild(fill);

  wrapper.appendChild(header);
  wrapper.appendChild(track);

  const update = (newValue, newMax = max, newLabel = null) => {
    const safeMax = Math.max(1, newMax);
    const clamped = Math.max(0, Math.min(safeMax, newValue));
    const percent = Math.round((clamped / safeMax) * 100);

    if (newLabel !== null) {
      labelEl.textContent = newLabel;
    }

    fill.style.width = `${percent}%`;
    track.setAttribute('aria-valuenow', String(clamped));
    track.setAttribute('aria-valuemax', String(safeMax));

    if (typeof formatValue === 'function') {
      valueEl.textContent = formatValue(clamped, safeMax, percent);
    } else {
      valueEl.textContent = `${percent}%`;
    }
  };

  update(value, max);

  return {
    element: wrapper,
    update,
  };
}

