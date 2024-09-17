export function renderYearButton (year) {
  const btn = document.createElement('button');
  btn.className = 'year-btn';
  btn.id = year;
  btn.textContent = year;
  return btn;
}

export function getYearByBtn (btn) {
  return btn.id;
}

export function getButtonByYear (container, year) {
  return container.ownerDocument.getElementById(year);
}
