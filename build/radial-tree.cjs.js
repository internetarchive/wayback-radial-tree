'use strict';

var d3Selection = require('d3-selection');
var d3Shape = require('d3-shape');
var d3Hierarchy = require('d3-hierarchy');
var d3Scale = require('d3-scale');
var d3ScaleChromatic = require('d3-scale-chromatic');
require('d3-transition');

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
  for (let i = 0; i < path.length; i++) {
    const name = path[i];
    if (!name) continue;
    if (!currentParent.children) currentParent.children = [];
    if (!currentParent._childByName) {
      // Make it non-enumerable so it doesn't leak into output objects / tests.
      Object.defineProperty(currentParent, '_childByName', {
        value: new Map(),
        enumerable: false
      });
    }
    let nextParent = currentParent._childByName.get(name);
    if (!nextParent) {
      nextParent = {
        name
      };
      currentParent.children.push(nextParent);
      currentParent._childByName.set(name, nextParent);
    }
    currentParent = nextParent;
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
  let targetField = _ref.targetField;
  return data.reduce((res, row) => {
    const urlkey = fields.getValueByName(row, targetField);
    if (!urlkey) return res;
    const slashIdx = urlkey.indexOf('/');
    const host = slashIdx === -1 ? urlkey : urlkey.slice(0, slashIdx);
    if (!res.name) res.name = surtToUrl(host);
    const rest = slashIdx === -1 ? '' : urlkey.slice(slashIdx + 1);
    if (!rest) return res;
    buildHierarchInDepth(res, rest.split('/'));
    return res;
  }, {});
}

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = true,
      o = false;
    try {
      if (i = (t = t.call(r)).next, 0 === l) ; else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = true, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

/**
 * extract fields from time map data
 */
class Fields {
  constructor(data) {
    this.fields = data[0];
    this._indexCache = new Map();
  }

  /**
   * get index of field by name
   *
   * @param name
   */
  getIndexByName(name) {
    if (this._indexCache.has(name)) {
      return this._indexCache.get(name);
    }
    const index = this.fields.indexOf(name);
    this._indexCache.set(name, index);
    return index;
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
  let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    groupBy = _ref.groupBy,
    dedupBy = _ref.dedupBy,
    orderBy = _ref.orderBy;
  if (!data) {
    return data;
  }
  const fields = new Fields(data);
  const groupByIndex = fields.getIndexByName(groupBy);
  const dedupByIndex = fields.getIndexByName(dedupBy);
  const orderByIndex = fields.getIndexByName(orderBy);
  if (groupByIndex < 0 || dedupByIndex < 0) {
    throw new Error('Invalid groupBy/dedupBy field');
  }

  // Map-based grouping + dedup avoids large intermediate objects and
  // keeps lookups O(1) even for big timemaps (e.g. 100k rows).
  const grouped = new Map(); // groupKey -> Map(dedupKey -> row)

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const groupKey = row[groupByIndex];
    const dedupKey = row[dedupByIndex];
    let dedupMap = grouped.get(groupKey);
    if (!dedupMap) {
      dedupMap = new Map();
      grouped.set(groupKey, dedupMap);
    }
    if (!dedupMap.has(dedupKey)) {
      dedupMap.set(dedupKey, row);
    }
  }
  const compareOrder = (a, b) => {
    if (orderByIndex < 0) return 0;
    const av = a[orderByIndex];
    const bv = b[orderByIndex];
    if (typeof av === 'number' && typeof bv === 'number') return av - bv;
    // `urlkey` and similar fields are strings; numeric subtraction is wrong (NaN).
    return av === bv ? 0 : av > bv ? 1 : -1;
  };
  const out = {};
  for (const _ref2 of grouped) {
    var _ref3 = _slicedToArray(_ref2, 2);
    const key = _ref3[0];
    const dedupMap = _ref3[1];
    const values = Array.from(dedupMap.values());
    values.sort(compareOrder);
    out[key] = values;
  }
  return out;
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

const arc = d3Shape.arc().startAngle(d => d.x0).endAngle(d => d.x1).innerRadius(d => Math.sqrt(d.y0)).outerRadius(d => Math.sqrt(d.y1));
const colors = d3Scale.scaleOrdinal(d3ScaleChromatic.schemePaired);

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
function createVisualization(element, vis, radius, baseURL, currentYear, data, height) {
  const partition = d3Hierarchy.partition().size([2 * Math.PI, radius * radius]);

  // append 'root' we will exclude it on rendering
  const root = d3Hierarchy.hierarchy({
    children: [data]
  }).sum(d => !d.children).sort((a, b) => b.value - a.value);
  const nodes = partition(root).descendants();
  const sequenceEl = element.querySelector('.sequence');

  // Cache per-node data used during hover to keep interaction snappy.
  // (Ancestors()/reverse()/join() inside mousemove-style handlers gets expensive quickly.)
  for (const d of nodes) {
    // Exclude the artificial root (depth 0) from the displayed breadcrumb/path.
    const anc = d.ancestors();
    const parts = [];
    for (let i = anc.length - 2; i >= 0; i--) parts.push(anc[i].data.name);
    const path = parts.join('/');
    d._wb = {
      breadcrumbText: parts.join('/'),
      url: "".concat(baseURL, "/web/").concat(currentYear, "0630/").concat(path),
      ancestorsExcludingRoot: anc.slice(0, -1) // without the artificial root
    };
  }
  const pathSel = vis.selectAll('path').data(nodes).enter().append('a').attr('xlink:href', d => d._wb.url).on('touchstart', touchStart).append('svg:path').attr('display', d => d.depth ? null : 'none').attr('d', arc).attr('fill-rule', 'evenodd').style('fill', d => colors((d.children ? d : d.parent).data.name)).style('opacity', 1).style('cursor', 'pointer').on('mouseover', mouseover);
  d3Selection.select('#d3_container').on('mouseleave', mouseleave);

  /** on mobile devices, touching the RadialTree prevents the ``click``
   *  event and shows the URL like on ``mouseover`` event. Users can click
   *  on the URL to visit the target page */
  function touchStart(e, d) {
    e.preventDefault();
    e.stopPropagation();
    mouseover(e, d);
    return false;
  }
  function mouseover(e, d) {
    const _d$_wb = d._wb,
      ancestorsExcludingRoot = _d$_wb.ancestorsExcludingRoot,
      url = _d$_wb.url;
    updateBreadcrumbs(d, url);
    pathSel.style('opacity', 0.3);
    const highlight = new Set(ancestorsExcludingRoot);
    pathSel.filter(node => highlight.has(node)).style('opacity', 1);
  }
  function mouseleave() {
    sequenceEl.innerHTML = '';
    pathSel.on('mouseover', null);
    pathSel.transition().style('opacity', 1).on('end', function () {
      d3Selection.select(this).on('mouseover', mouseover);
    });
  }
  function updateBreadcrumbs(d, url) {
    const text = d._wb.breadcrumbText;
    sequenceEl.innerHTML = "<a href=\"".concat(url, "\">").concat(decodeURIComponent(text), "</a>");
  }
  const legendNodes = nodes.filter(d => d.depth === 2).sort((a, b) => b.value - a.value);
  renderLegend(vis, radius, height, legendNodes);
}
function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
function renderLegend(vis, radius, height, nodes) {
  const rowHeight = 24;
  const swatchSize = 14;
  const fontSize = '15px';
  const pad = 10;
  const boxWidth = 195;
  const items = nodes.slice(0, 20);
  const boxHeight = pad + 20 + 6 + items.length * rowHeight + pad;
  vis.append('defs').append('filter').attr('id', 'rt-legend-shadow').append('feDropShadow').attr('dx', 2).attr('dy', 2).attr('stdDeviation', 3).attr('flood-opacity', 0.18);
  const g = vis.append('g').attr('class', 'rt-legend').attr('transform', "translate(".concat(radius + 20, ", ").concat(-height / 2 + 8, ")"));
  g.append('rect').attr('width', boxWidth).attr('height', boxHeight).attr('rx', 6).attr('ry', 6).attr('fill', 'white').attr('stroke', '#ccc').attr('stroke-width', 1).attr('filter', 'url(#rt-legend-shadow)');
  g.append('text').attr('dx', pad).attr('dy', pad + 13).style('font-size', '15px').style('font-weight', 'bold').text("Top unique sub-pages");
  items.forEach((d, i) => {
    const row = g.append('g').attr('transform', "translate(".concat(pad, ", ").concat(pad + 26 + i * rowHeight, ")"));
    row.append('rect').attr('width', swatchSize).attr('height', swatchSize).attr('fill', colors(d.data.name));
    row.append('text').attr('dx', swatchSize + 5).attr('dy', swatchSize / 2).attr('dominant-baseline', 'central').style('font-size', fontSize).text("/".concat(truncate(d.data.name, 16), " (").concat(d.value, ")"));
  });
}

function renderYearButton(year, count, host) {
  const btn = document.createElement('button');
  btn.className = 'year-btn';
  btn.id = year;
  btn.textContent = year;
  if (count !== undefined && host) {
    btn.title = "View ".concat(count, " unique URLs of ").concat(host, " from ").concat(year);
  }
  return btn;
}
function getYearByBtn(btn) {
  return btn.id;
}
function getButtonByYear(container, year) {
  return container.ownerDocument.getElementById(year);
}

function renderYearButtons(element, allYears, onYearSelect, urlsByYear, host) {
  const divBtn = element.querySelector('.div-btn');
  divBtn.onclick = evt => onYearSelect(getYearByBtn(evt.target));
  if (!element.querySelector('.year-btn')) {
    allYears.forEach(year => {
      const count = urlsByYear && urlsByYear[year] ? urlsByYear[year].length : undefined;
      divBtn.appendChild(renderYearButton(year, count, host));
    });
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
  const firstUrlkey = cdxData[1] ? fields.getValueByName(cdxData[1], 'urlkey') : '';
  const slashIdx = firstUrlkey.indexOf('/');
  const host = surtToUrl(slashIdx === -1 ? firstUrlkey : firstUrlkey.slice(0, slashIdx));
  renderYearButtons(element, years, selectYear, urlsByYear, host);

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
    const legendWidth = 230;
    const vis = d3Selection.select('#chart').append('svg:svg').attr('width', width + legendWidth).attr('height', height).append('svg:g').attr('id', 'd3_container').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    vis.append('svg:circle').attr('r', radius).style('opacity', 0);
    const urls = urlsByYear[currentYear];
    const hierarchy = buildHierarchy(fields, urls, {
      targetField: 'urlkey'
    });
    createVisualization(element, vis, radius, baseURL, currentYear, hierarchy, height);
  }
}

exports.RadialTree = RadialTree;
//# sourceMappingURL=radial-tree.cjs.js.map
