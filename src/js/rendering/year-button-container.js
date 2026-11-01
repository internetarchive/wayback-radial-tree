import { renderYearButton, getYearByBtn } from './year-button';

/**
 * every year from first to last, so gaps without captures are visible.
 * falls back to the given years if any of them is not numeric.
 */
function fillYearRange (years) {
  const nums = years.map(Number);
  if (years.length === 0 || nums.some(n => !Number.isInteger(n))) {
    return years;
  }

  const range = [];
  for (let y = Math.min(...nums); y <= Math.max(...nums); y++) {
    range.push(String(y));
  }
  return range;
}

export function renderYearButtons (element, allYears, onYearSelect, urlsByYear, host) {
  const divBtn = element.querySelector('.div-btn');
  divBtn.onclick = (evt) => {
    // the click may land on the volume bar inside the button
    const btn = evt.target.closest('.year-btn');
    if (btn && !btn.disabled) {
      onYearSelect(getYearByBtn(btn));
    }
  };

  if (!element.querySelector('.year-btn')) {
    const counts = urlsByYear ? allYears.map(year => (urlsByYear[year] || []).length) : [];
    const maxCount = Math.max(0, ...counts);

    fillYearRange(allYears).forEach(year => {
      let count;
      if (!allYears.includes(year)) {
        count = 0;
      } else if (urlsByYear && urlsByYear[year]) {
        count = urlsByYear[year].length;
      }
      divBtn.appendChild(renderYearButton(year, count, host, maxCount));
    });
  }
}
