import * as d3 from 'd3';
import {buildHierarchy, processTimeMapData} from './processing';
import {createVisualization, getButtonByYear, renderContainer, renderYearButtons} from './rendering';

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

  // render

  const container = renderContainer();
  element.appendChild(container);

  let {allYears, yearData} = processTimeMapData(option.url, cdx_data);
  renderYearButtons(element, option, allYears, selectYear);

  // highlight the 2nd last year if available, else hightlight the last.
  // necessary because the last year may not have much data.
  const lastButOneYear = allYears[allYears.length - 2] || allYears[0];
  selectYear(lastButOneYear);

  function selectYear(year) {
    // hide active button
    if (element.querySelector('.active-btn')) {
      element.querySelector('.active-btn').classList.remove('active-btn');
    }

    // show active button
    const btn = getButtonByYear(element, year);
    btn.classList.add('active-btn');

    renderChart(element, option, year);
  }

  function renderChart(element, option, currentYear) {
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

    vis.append('svg:circle')
      .attr('r', radius)
      .style('opacity', 0);

    let yearIdx = allYears.indexOf(currentYear);
    let json = buildHierarchy(yearData[yearIdx], option.url);

    createVisualization(element, vis, radius, baseURL, currentYear, json);
  }
}
