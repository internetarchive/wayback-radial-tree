export function renderYearButton (year, count, host) {
  const btn = document.createElement('button');
  btn.className = 'year-btn';
  btn.id = year;
  btn.textContent = year;
  if (count !== undefined && host) {
    btn.title = `View ${count} unique URLs of ${host} from ${year}`;
  }
  return btn;
}

export function getYearByBtn (btn) {
  return btn.id;
}

export function getButtonByYear (container, year) {
  return container.ownerDocument.getElementById(year);
}
