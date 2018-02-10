import * as d3 from 'd3';
import {buildHierarchy, extractYearsFromGroupedTimeMap, Fields, processTimeMap} from './processing';
import {createVisualization, getButtonByYear, renderContainer, renderYearButtons} from './rendering';

/**
 *
 * Radial Tree Library
 *
 * @param {DOMElement} element
 * @param {Array} cdx_data: decoded CDX Query data retrieved by:
 ``/web/timemap/json?url=example.com/&fl=timestamp:4,urlkey&matchType=prefix
 &filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey
 &collapse=timestamp:4&limit=100000``.
 * @param {Object} [options]
 * Option baseURL defines the target Wayback Machine server.
 *
 */
export function RadialTree(element, cdx_data, options = {}) {
  let baseURL = options.baseURL || 'https://web.archive.org';

  // render

  const container = renderContainer();
  element.appendChild(container);

  const fields = new Fields(cdx_data);
  const urlsByYear = processTimeMap(cdx_data, {
    groupBy: 'timestamp:4',
    dedupBy: 'urlkey',
    orderBy: 'urlkey',
  });
  const years = extractYearsFromGroupedTimeMap(urlsByYear);

  renderYearButtons(element, years, selectYear);

  // highlight the 2nd last year if available, else hightlight the last.
  // necessary because the last year may not have much data.
  // const lastButOneYear = allYears[allYears.length - 2] || allYears[0];
  const selectedBtn = years[years.length - 2] || years[0];
  selectYear(selectedBtn);

  function selectYear(year) {
    // hide active button
    if (element.querySelector('.active-btn')) {
      element.querySelector('.active-btn').classList.remove('active-btn');
    }

    // show active button
    const btn = getButtonByYear(element, year);
    btn.classList.add('active-btn');

    renderChart(element, year);
  }

  function renderChart(element, currentYear) {
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

    const urls = urlsByYear[currentYear];
    const hierarchy = buildHierarchy(fields, urls, {
      targetField: 'urlkey',
    });

    createVisualization(element, vis, radius, baseURL, currentYear, hierarchy);
  }
}
