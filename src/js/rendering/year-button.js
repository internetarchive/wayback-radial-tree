export function renderYearButton(year) {
  let btn = document.createElement('button');
  btn.setAttribute('class', 'year-btn');
  btn.setAttribute('id', year);
  btn.innerHTML = year;
  return btn;
}

export function getYearByBtn(btn) {
  return btn.id;
}

export function getButtonByYear(container, year) {
  return container.ownerDocument.getElementById(year);
}
