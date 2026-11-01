// tallest volume bar, in px; the busiest year gets the full height.
const MAX_BAR_HEIGHT = 4;

export function renderYearButton (year, count, host, maxCount) {
  const btn = document.createElement('button');
  btn.className = 'year-btn';
  btn.id = year;
  btn.textContent = year;

  if (count === 0) {
    btn.className += ' year-btn-empty';
    btn.disabled = true;
    if (host) {
      btn.title = `No captures of ${host} from ${year}`;
    }
    return btn;
  }

  if (count !== undefined && host) {
    btn.title = `View ${count} unique ${count === 1 ? 'URL' : 'URLs'} of ${host} from ${year}`;
  }
  if (count !== undefined && maxCount) {
    const bar = document.createElement('span');
    bar.className = 'year-btn-bar';
    bar.style.height = `${Math.max(1, Math.round(count / maxCount * MAX_BAR_HEIGHT))}px`;
    btn.appendChild(bar);
  }
  return btn;
}

export function getYearByBtn (btn) {
  return btn.id;
}

export function getButtonByYear (container, year) {
  return container.ownerDocument.getElementById(year);
}
