'use strict';

var d3 = require('d3');
var _ = require('lodash');

function _interopNamespaceDefault(e) {
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var d3__namespace = /*#__PURE__*/_interopNamespaceDefault(d3);

/**
 * get SURT (Sort-friendly URI Reordering Transform)
 * https://github.com/internetarchive/surt
 * and convert it back to URL
 *
 * [!] current implementation works only with host part of SURT
 *
 * @param surt
 * @returns {String}
 */
function surtToUrl(surt) {
  if (!surt) {
    return surt;
  }
  // drop last ')'
  return surt.slice(0, surt.length - 1).split(',').reverse().join('.');
}

/**
 * @private
 *
 * traverse in depth from parent by path
 *
 * @param parent is current node
 * @param path is array of names
 * @returns {*}
 */
function buildHierarchInDepth(parent, path) {
  if (!path || path.length === 0) {
    return;
  }
  let currentParent = parent;
  let currentPath = path;
  while (currentPath.length > 0) {
    const [name, ...rest] = currentPath;
    if (!name) {
      return;
    }

    // Cache the children reference to avoid repeated lookups
    if (!currentParent.children) {
      currentParent.children = [];
    }

    // Find the child node or create a new one
    let nextParent = currentParent.children.find(child => child.name === name);
    if (!nextParent) {
      nextParent = {
        name
      };
      currentParent.children.push(nextParent);
    }

    // Move down the hierarchy
    currentParent = nextParent;
    currentPath = rest;
  }
}

/**
 * build hierarchical structure:
 *
 * {name: '{name}': children: [...]}
 *
 * which is valid for d3.hierarchy
 * from timemap site data
 *
 * @param fields -
 * @param data - source
 * @param targetField - which field we use to create hierarchy
 *
 * @returns {Object}
 */
function buildHierarchy(fields, data, _ref) {
  let {
    targetField
  } = _ref;
  return data.reduce((res, row) => {
    const [host, ...path] = fields.getValueByName(row, targetField).split('/');
    res.name = surtToUrl(host);
    buildHierarchInDepth(res, path);
    return res;
  }, {});
}

/**
 * extract fields from time map data
 */
class Fields {
  constructor(data) {
    this.fields = data[0];
    this.getIndexByName = _.memoize(this.getIndexByName);
  }

  /**
   * get index of field by name
   *
   * @param name
   */
  getIndexByName(name) {
    return this.fields.indexOf(name);
  }

  /**
   * get value of field in row by name
   *
   * @param row
   * @param name
   * @returns {*}
   */
  getValueByName(row, name) {
    return row[this.getIndexByName(name)];
  }
}

/**
 * get all sorted years from grouped time map data
 *
 * @param data time map data
 * @returns {Array} years
 */
function extractYearsFromGroupedTimeMap(data) {
  if (!data) {
    return data;
  }
  return Object.keys(data).sort();
}

/**
 * data processing pipeline for time map:
 *
 * [[<keys>], [values]....[values]]
 *
 * - group by one field
 * - dedup by another field
 * - order by one field
 *
 * @param data timemap format
 * @param groupBy
 * @param dedupBy
 * @param orderBy
 *
 * @return processed data
 */
function processTimeMap(data) {
  let {
    groupBy,
    dedupBy,
    orderBy
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  if (!data) {
    return data;
  }
  const fields = new Fields(data);
  const groupByIndex = fields.getIndexByName(groupBy);
  const dedupByIndex = fields.getIndexByName(dedupBy);
  const orderByIndex = fields.getIndexByName(orderBy);

  // Use an object to group and deduplicate rows
  const groupedData = data.slice(1).reduce((result, row) => {
    const groupKey = row[groupByIndex];
    const dedupKey = row[dedupByIndex];

    // Initialize group if not exists
    if (!result[groupKey]) {
      result[groupKey] = {};
    }

    // Add row if it hasn't been deduplicated already
    if (!result[groupKey][dedupKey]) {
      result[groupKey][dedupKey] = row;
    }
    return result;
  }, {});

  // Convert groups to arrays and sort by orderBy field
  return Object.keys(groupedData).reduce((acc, key) => {
    const values = Object.values(groupedData[key]);
    acc[key] = values.sort((a, b) => a[orderByIndex] - b[orderByIndex]);
    return acc;
  }, {});
}

function renderContainer() {
  const content = document.createElement('div');
  content.setAttribute('class', 'rt-content');
  const divBtn = document.createElement('div');
  divBtn.setAttribute('class', 'div-btn');
  const sequence = document.createElement('p');
  sequence.setAttribute('class', 'sequence');
  const chart = document.createElement('div');
  chart.setAttribute('id', 'chart');
  content.appendChild(divBtn);
  content.appendChild(sequence);
  content.appendChild(chart);
  content.style.display = 'block';
  return content;
}

const arc = d3__namespace.arc().startAngle(d => d.x0).endAngle(d => d.x1).innerRadius(d => Math.sqrt(d.y0)).outerRadius(d => Math.sqrt(d.y1));
const colors = d3__namespace.scaleOrdinal(d3__namespace.schemePaired);

/**
 * Render d3.hierarchy from passed hierarchical data
 *
 * @param element
 * @param vis
 * @param radius
 * @param baseURL
 * @param currentYear
 * @param data
 */
function createVisualization(element, vis, radius, baseURL, currentYear, data) {
  const partition = d3__namespace.partition().size([2 * Math.PI, radius * radius]);

  // append 'root' we will exclude it on rendering
  const root = d3__namespace.hierarchy({
    children: [data]
  }).sum(d => !d.children).sort((a, b) => b.value - a.value);
  const nodes = partition(root).descendants();
  const sequenceEl = element.querySelector('.sequence');
  vis.selectAll('path').data(nodes).enter().append('a').attr('xlink:href', currentUrl).on('touchstart', touchStart).append('svg:path').attr('display', d => d.depth ? null : 'none').attr('d', arc).attr('fill-rule', 'evenodd').style('fill', d => colors((d.children ? d : d.parent).data.name)).style('opacity', 1).style('cursor', 'pointer').on('mouseover', mouseover);
  d3__namespace.select('#d3_container').on('mouseleave', mouseleave);

  /** on mobile devices, touching the RadialTree prevents the ``click``
   *  event and shows the URL like on ``mouseover`` event. Users can click
   *  on the URL to visit the target page */
  function touchStart(e, d) {
    e.preventDefault();
    e.stopPropagation();
    mouseover();
    return false;
  }
  function currentUrl(d) {
    // TODO skip the reverse to speed it up.
    const anc = d.ancestors().reverse();
    let url = anc.slice(1).map(node => node.data.name).join('/');
    return `${baseURL}/web/${currentYear}0630/${url}`;
  }
  function mouseover(e, d) {
    const sequenceArray = d.ancestors().reverse();
    sequenceArray.shift();
    const url = currentUrl(d);
    updateBreadcrumbs(sequenceArray, url);
    d3__namespace.selectAll('path').style('opacity', 0.3);
    vis.selectAll('path').filter(node => sequenceArray.indexOf(node) >= 0).style('opacity', 1);
  }
  function mouseleave() {
    sequenceEl.innerHTML = '';
    d3__namespace.selectAll('path').on('mouseover', null);
    d3__namespace.selectAll('path').transition().style('opacity', 1).on('end', function () {
      d3__namespace.select(this).on('mouseover', mouseover);
    });
  }
  function updateBreadcrumbs(nodeArray, url) {
    const text = nodeArray.map(node => node.data.name).join('/');
    sequenceEl.innerHTML = `<a href="${url}">${decodeURIComponent(text)}</a>`;
  }
}

function renderYearButton(year) {
  const btn = document.createElement('button');
  btn.className = 'year-btn';
  btn.id = year;
  btn.textContent = year;
  return btn;
}
function getYearByBtn(btn) {
  return btn.id;
}
function getButtonByYear(container, year) {
  return container.ownerDocument.getElementById(year);
}

function renderYearButtons(element, allYears, onYearSelect) {
  const divBtn = element.querySelector('.div-btn');
  divBtn.onclick = evt => onYearSelect(getYearByBtn(evt.target));
  if (!element.querySelector('.year-btn')) {
    allYears.forEach(year => divBtn.appendChild(renderYearButton(year)));
  }
}

/**
 * Radial Tree Library
 *
 * @param {DOMElement} element
 * @param {Array} cdxData: decoded CDX Query data retrieved by:
 ``/web/timemap/json?url=example.com/&fl=timestamp:4,urlkey&matchType=prefix
 &filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey
 &collapse=timestamp:4&limit=100000``.
 * @param {Object} [options]
 * Option baseURL defines the target Wayback Machine server.
 *
 */
function RadialTree(element, cdxData) {
  let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  const baseURL = options.baseURL || 'https://web.archive.org';

  // render
  const container = renderContainer();
  element.appendChild(container);
  const fields = new Fields(cdxData);
  const urlsByYear = processTimeMap(cdxData, {
    groupBy: 'timestamp:4',
    dedupBy: 'urlkey',
    orderBy: 'urlkey'
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
    if (btn) {
      btn.classList.add('active-btn');
    }
    renderChart(element, year);
  }
  function renderChart(element, currentYear) {
    element.querySelector('.sequence').innerHTML = '';
    element.querySelector('#chart').innerHTML = '';
    const width = element.querySelector('#chart').offsetWidth;
    const height = width;
    const radius = width / 2;
    const vis = d3__namespace.select('#chart').append('svg:svg').attr('width', width).attr('height', height).append('svg:g').attr('id', 'd3_container').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    vis.append('svg:circle').attr('r', radius).style('opacity', 0);
    const urls = urlsByYear[currentYear];
    const hierarchy = buildHierarchy(fields, urls, {
      targetField: 'urlkey'
    });
    createVisualization(element, vis, radius, baseURL, currentYear, hierarchy);
  }
}

exports.RadialTree = RadialTree;
//# sourceMappingURL=radial-tree.cjs.js.map
