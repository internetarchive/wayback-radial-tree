export function buildYearButton(year) {
  let btn = document.createElement('button');
  btn.setAttribute('class', 'year-btn');
  btn.setAttribute('id', year);
  btn.innerHTML = year;
  return btn
}
