import * as d3 from 'd3';
import {buildHierarchy, processTimeMapData} from './processing';
import {buildYearButton, createVisualization, renderContainer} from './rendering';

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

  const container = renderContainer();
  element.appendChild(container);

  let {allYears, yearData} = processTimeMapData(option.url, cdx_data);

  createYearButtons(element, option, allYears);

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

    let yearIdx = allYears.indexOf(currentYear);
    let json = buildHierarchy(yearData[yearIdx], option.url);

    createVisualization(element, vis, radius, baseURL, currentYear, json);
  }
}
