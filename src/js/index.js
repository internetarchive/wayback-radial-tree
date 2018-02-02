import * as d3 from 'd3';
import {buildHierarchy, processTimeMapData} from './processing';
import {buildYearButton, createVisualization} from './rendering';

/**
 *
 * Radial Tree Library
 *
 * @param {DOMElement} element
 @ @param {Array} cdx_data: decoded CDX Query data retrieved by:
 ``/web/timemap/json?url=example.com/&fl=timestamp:4,original&matchType=prefix
 &filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey
 &collapse=timestamp:4&limit=100000``.
 * @param {Object} option
 * Option baseURL defines the target Wayback Machine server.
 *
 */
export function RadialTree(element, cdx_data, option) {
  let baseURL = 'https://web.archive.org';
  // Use typeof check to allow empty string in baseURL value
  if (typeof option.baseURL !== 'undefined') {
    baseURL = option.baseURL;
  }
  if (!option.url) return;

  init(element);

  let {allYears, yearData} = processTimeMapData(option.url, cdx_data);

  createYearButtons(element, option, allYears);

  function init(container) {
    let content = document.createElement('div');
    content.setAttribute('class', 'rt-content');
    let divBtn = document.createElement('div');
    divBtn.setAttribute('class', 'div-btn');

    let sequence = document.createElement('p');
    sequence.setAttribute('class', 'sequence');
    let chart = document.createElement('div');
    chart.setAttribute('id', 'chart');
    content.appendChild(divBtn);
    content.appendChild(sequence);
    content.appendChild(chart);
    content.style.display = 'block';

    container.appendChild(content);
  }

  function onYearClick(evt) {
    let target = evt.target;
    if (element.querySelector('.active-btn')) {
      element.querySelector('.active-btn').classList.remove('active-btn');
    }
    target.classList.add('active-btn');
    drawChart(element, option, target.id);
  }

  function createYearButtons(element, option, allYears) {
    let divBtn = element.querySelector('.div-btn');
    divBtn.onclick = onYearClick;

    if (!element.querySelector('.year-btn')) {
      allYears.map((year, i) => {
        let btn = buildYearButton(year);
        divBtn.appendChild(btn);
        // highlight the 2nd last year if available, else hightlight the last.
        // necessary because the last year may not have much data.
        if (allYears.length >= 2) {
          if (i === allYears.length - 2) btn.click();
        } else {
          if (i === allYears.length - 1) btn.click();
        }
      });
    }
  }

  function drawChart(element, option, currentYear) {
    element.querySelector('.sequence').innerHTML = '';
    element.querySelector('#chart').innerHTML = '';
    let yearIdx = allYears.indexOf(currentYear);
    let text = makeNewText(yearIdx, yearData);
    const width = element.querySelector('#chart').offsetWidth;
    const height = width;
    const radius = Math.min(width, height) / 2;
    let vis = d3.select('#chart')
      .append('svg:svg')
      .attr('width', width)
      .attr('height', height)
      .append('svg:g')
      .attr('id', 'd3_container')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

    let json = buildHierarchy(text, option.url);

    createVisualization(element, vis, radius, baseURL, currentYear, json);
  }

  function makeNewText(n, yearData) {
    let text = '';
    let x = 2;
    if (yearData[n].length === 2) {
      x = 1;
    }
    for (let i = x; i < yearData[n].length; i++) {
      if (i !== (yearData[n].length - 1)) {
        text = text + yearData[n][i] + ' ,1' + '\n';
      } else {
        text = text + yearData[n][i] + ' ,1';
      }
    }
    return text;
  }
}
