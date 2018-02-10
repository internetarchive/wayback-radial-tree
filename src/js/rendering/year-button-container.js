import {renderYearButton, getYearByBtn} from './year-button';

export function renderYearButtons(element, allYears, onYearSelect) {
  let divBtn = element.querySelector('.div-btn');
  divBtn.onclick = (evt) => onYearSelect(getYearByBtn(evt.target));

  if (!element.querySelector('.year-btn')) {
    allYears.forEach(year =>
      divBtn.appendChild(renderYearButton(year))
    );
  }
}
