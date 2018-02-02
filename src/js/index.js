import * as d3 from 'd3';
import {processTimeMapData} from './processing/timemap';
import {createVisualization} from './rendering/tree';

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

  createYearButtons(element, option, allYears, yearData);

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

  function createYearButtons(element, option, allYears, yearData) {
    let divBtn = element.querySelector('.div-btn');
    if (!element.querySelector('.year-btn')) {
      allYears.forEach(function (year, i) {
        let btn = document.createElement('button');
        btn.setAttribute('class', 'year-btn');
        btn.setAttribute('id', allYears[i]);
        btn.innerHTML = allYears[i];
        btn.onclick = function (evt) {
          let target = evt.target;
          if (element.querySelector('.active-btn')) {
            element.querySelector('.active-btn').classList.remove('active-btn');
          }
          target.classList.add('active-btn');
          let num = allYears.indexOf(target.id);
          let text = makeNewText(num, yearData);
          drawChart(element, option, text, target.id);
        };
        divBtn.appendChild(btn);
        // highlight the 2nd last year if available, else hightlight the last.
        // necessary because the last year may not have much data.
        if(allYears.length >= 2) {
          if (i === allYears.length - 2) btn.click();
        } else {
          if (i === allYears.length - 1) btn.click();
        }
      });
    }
  }

  function drawChart(element, option, text, currentYear) {
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


    let csv = d3.csvParseRows(text);
    let json = buildHierarchy(csv);

    createVisualization(element, vis, radius, baseURL, currentYear, json);

    function buildHierarchy(csv) {
      csv.sort(function (a, b) {
        return a[0].length - b[0].length || a[0].localeCompare(b[0]);
      });
      let real_urls = {};
      real_urls[option.url] = 1;
      if (option.url.slice(-1) !== '/') {
        real_urls[option.url + '/'] = 1;
      }
      for (let i = 0; i < csv.length; i++) {
        let key = String(csv[i][0]).trim().replace(':80/', '/');
        real_urls[key] = 1;
        if (key.slice(-1) !== '/') {
          real_urls[key + '/'] = 1;
        }
      }

      let DELIMITER = '|';

      function filterRealUrl(url) {
        let parts = url.trim().split('/');
        let delimiter_index = [];
        for (let i = 1; i < parts.length; i++) {
          let potentialUrl = parts.slice(0, i).join('/');
          if (potentialUrl in real_urls === false && i > 0) {
            let pos = parts.slice(0, i).join('/').length;
            delimiter_index.push(pos);
          }
        }
        if (delimiter_index.length > 0) {
          let result_url = url;
          for (let j = 1; j < delimiter_index.length; j++) {
            let index = delimiter_index[j];
            result_url = result_url.substr(0, index) + DELIMITER + result_url.substr(index + 1);
          }
          return result_url;
        }
        return url;
      }

      let root = {name: 'root', children: []};
      for (let i = 0; i < csv.length; i++) {
        let sequence = filterRealUrl(csv[i][0]);
        let size = +csv[i][1];
        if (isNaN(size)) {
          continue;
        }
        let parts = sequence.split('/');
        parts = parts.map(function (s) {
          return s.replace(/\|/g, '/');
        });
        let currentNode = root;
        for (let j = 0; j < parts.length; j++) {
          let children = currentNode.children;
          let nodeName = parts[j];
          let childNode;
          if (j + 1 < parts.length) {
            let foundChild = false;
            for (let k = 0; k < children.length; k++) {
              if (children[k].name === nodeName) {
                childNode = children[k];
                foundChild = true;
                break;
              }
            }
            if (!foundChild) {
              childNode = {name: nodeName, children: []};
              children.push(childNode);
            }
            currentNode = childNode;
          } else {
            childNode = {name: nodeName, size: size};
            children.push(childNode);
          }
        }
      }
      return root;
    }
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
