'use strict';

var d3Selection = require('d3-selection');
var d3Shape = require('d3-shape');
var d3Hierarchy = require('d3-hierarchy');
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
 * @returns {*} the node at the end of the path
 */
function buildHierarchInDepth(parent, path) {
  if (!path || path.length === 0) {
    return parent;
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
  return currentParent;
}

/**
 * build hierarchical structure:
 *
 * {name: '{name}', urlCount: n, children: [...]}
 *
 * which is valid for d3.hierarchy
 * from timemap site data. `urlCount` is the number of urlkeys ending at the
 * node; nodes that only exist as a parent of other URLs have none.
 *
 * @param fields -
 * @param data - source
 * @param targetField - which field we use to create hierarchy
 *
 * @returns {Object}
 */
function buildHierarchy(fields, data, {
  targetField
}) {
  return data.reduce((res, row) => {
    const urlkey = fields.getValueByName(row, targetField);
    if (!urlkey) return res;
    const slashIdx = urlkey.indexOf('/');
    const host = slashIdx === -1 ? urlkey : urlkey.slice(0, slashIdx);
    if (!res.name) res.name = surtToUrl(host);
    const rest = slashIdx === -1 ? '' : urlkey.slice(slashIdx + 1);
    const node = rest ? buildHierarchInDepth(res, rest.split('/')) : res;
    node.urlCount = (node.urlCount || 0) + 1;
    return res;
  }, {});
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
function processTimeMap(data, {
  groupBy,
  dedupBy,
  orderBy
} = {}) {
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
  for (const [key, dedupMap] of grouped) {
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

// share of the radius taken by the host circle in the center
const CENTER_RATIO = 0.3;
const CENTER_COLOR = '#f3f3f3';

// one hue per top-level section, biggest first; the rest share a neutral gray
const SECTION_COLORS = d3ScaleChromatic.schemeTableau10.slice(0, 9);
const MINOR_SECTION_COLOR = d3ScaleChromatic.schemeTableau10[9];
// how much lighter each ring gets than the one inside it, and at most
const TINT_STEP = 0.15;
const MAX_TINT = 0.45;
// neighbouring sub-pages cycle through these tints relative to their ring
// (positive is lighter, negative darker) so they can be told apart; rings
// start at TINT_STEP, so the darkest is the section color itself
const SIBLING_SHADES = [0, 0.2, -TINT_STEP];
// segments narrower than this (px, at their outer edge) get no separator,
// it would hide their color
const MIN_SEPARATED_WIDTH = 4;

/**
 * Render d3.hierarchy from passed hierarchical data
 *
 * The host is drawn as a neutral circle in the center and its sub-pages as
 * rings of equal width around it.
 *
 * @param element
 * @param vis
 * @param radius
 * @param baseURL
 * @param currentYear
 * @param data
 */
function createVisualization(element, vis, radius, baseURL, currentYear, data, height) {
  // count every captured URL, including pages that also have sub-pages
  const root = d3Hierarchy.hierarchy(data).sum(d => d.urlCount || 0).sort((a, b) => b.value - a.value);
  const nodes = d3Hierarchy.partition().size([2 * Math.PI, 1])(root).descendants();
  const sequenceEl = element.querySelector('.sequence');
  const centerRadius = radius * CENTER_RATIO;
  const ringWidth = (radius - centerRadius) / Math.max(1, root.height);
  const arc = d3Shape.arc().startAngle(d => d.x0).endAngle(d => d.x1).innerRadius(d => d.depth ? centerRadius + (d.depth - 1) * ringWidth : 0).outerRadius(d => d.depth ? centerRadius + d.depth * ringWidth : centerRadius).cornerRadius(2);

  // sections are sorted by size, so the biggest ones get their own hue
  const sectionColor = new Map();
  (root.children || []).forEach((section, i) => {
    sectionColor.set(section, SECTION_COLORS[i] || MINOR_SECTION_COLOR);
  });

  // white separators: bold between sections, thin inside them
  function separatorWidth(d) {
    if (d.depth === 1) return 1.5;
    const width = (d.x1 - d.x0) * arc.outerRadius()(d);
    return d.depth && width >= MIN_SEPARATED_WIDTH ? 0.5 : 0;
  }
  function color(d) {
    if (!d.depth) return CENTER_COLOR;
    const section = d.ancestors()[d.depth - 1];
    const ringTint = Math.min(MAX_TINT, (d.depth - 1) * TINT_STEP);
    const siblingShade = d.depth > 1 ? SIBLING_SHADES[d._wb.siblingIndex % SIBLING_SHADES.length] : 0;
    return tint(sectionColor.get(section), ringTint + siblingShade);
  }

  // Cache per-node data used during hover to keep interaction snappy.
  // (Ancestors()/reverse()/join() inside mousemove-style handlers gets expensive quickly.)
  for (const d of nodes) {
    const anc = d.ancestors();
    const parts = [];
    for (let i = anc.length - 1; i >= 0; i--) parts.push(anc[i].data.name);
    const path = parts.join('/');
    d._wb = {
      breadcrumbText: path,
      url: `${baseURL}/web/${currentYear}0630/${path}`,
      ancestors: anc,
      siblingIndex: 0
    };
  }
  // children are sorted, so the index is also their order around the ring
  for (const d of nodes) {
    (d.children || []).forEach((child, i) => {
      child._wb.siblingIndex = i;
    });
  }
  const pathSel = vis.selectAll('path').data(nodes).enter().append('a').attr('class', d => d.depth ? null : 'rt-center').attr('xlink:href', d => d._wb.url).on('touchstart', touchStart).append('svg:path').attr('d', arc).attr('fill-rule', 'evenodd').style('fill', color).style('stroke', '#fff').style('stroke-width', separatorWidth).style('opacity', 1).style('cursor', 'pointer').on('mouseover', mouseover);
  vis.append('text').attr('class', 'rt-center-label').attr('text-anchor', 'middle').attr('dy', '-0.2em').style('font-size', '14px').style('pointer-events', 'none').text(truncate(safeDecodeURIComponent(root.data.name || ''), 18));
  vis.append('text').attr('class', 'rt-center-value').attr('text-anchor', 'middle').attr('dy', '1.1em').style('font-size', '12px').style('fill', '#666').style('pointer-events', 'none').text(`${root.value} unique ${root.value === 1 ? 'URL' : 'URLs'} from ${currentYear}`);
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
    const {
      ancestors,
      url
    } = d._wb;
    updateBreadcrumbs(d, url);
    pathSel.style('opacity', 0.3);
    const highlight = new Set(ancestors);
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
    // Build the link via DOM APIs: urlkeys come from crawled URLs, so the
    // decoded text must never be parsed as HTML.
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.textContent = safeDecodeURIComponent(d._wb.breadcrumbText);
    sequenceEl.innerHTML = '';
    sequenceEl.appendChild(link);
  }
  const legendNodes = nodes.filter(d => d.depth === 1).sort((a, b) => b.value - a.value);
  renderLegend(vis, radius, height, legendNodes, color);
}
function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch {
    // malformed escape sequence, e.g. a literal '%'
    return str;
  }
}

/**
 * mix a hex color with white
 *
 * @param hex '#rrggbb'
 * @param amount 0 keeps the color, 1 is white
 */
function tint(hex, amount) {
  const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
  return '#' + channels.map(c => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0')).join('');
}
function truncate(str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}
function renderLegend(vis, radius, height, nodes, color) {
  const rowHeight = 24;
  const swatchSize = 14;
  const fontSize = '15px';
  const pad = 10;
  const boxWidth = 195;
  const items = nodes.slice(0, 20);
  if (items.length === 0) {
    return;
  }
  const boxHeight = pad + 20 + 6 + items.length * rowHeight + pad;
  vis.append('defs').append('filter').attr('id', 'rt-legend-shadow').append('feDropShadow').attr('dx', 2).attr('dy', 2).attr('stdDeviation', 3).attr('flood-opacity', 0.18);
  const g = vis.append('g').attr('class', 'rt-legend').attr('transform', `translate(${radius + 20}, ${-height / 2 + 8})`);
  g.append('rect').attr('width', boxWidth).attr('height', boxHeight).attr('rx', 6).attr('ry', 6).attr('fill', 'white').attr('stroke', '#ccc').attr('stroke-width', 1).attr('filter', 'url(#rt-legend-shadow)');
  g.append('text').attr('dx', pad).attr('dy', pad + 13).style('font-size', '15px').style('font-weight', 'bold').text(`Top unique sub-pages`);
  items.forEach((d, i) => {
    const row = g.append('g').attr('transform', `translate(${pad}, ${pad + 26 + i * rowHeight})`);
    row.append('rect').attr('width', swatchSize).attr('height', swatchSize).attr('fill', color(d));
    row.append('text').attr('dx', swatchSize + 5).attr('dy', swatchSize / 2).attr('dominant-baseline', 'central').style('font-size', fontSize).text(`/${truncate(d.data.name, 16)} (${d.value})`);
  });
}

// tallest volume bar, in px; the busiest year gets the full height.
const MAX_BAR_HEIGHT = 4;
function renderYearButton(year, count, host, maxCount) {
  const btn = document.createElement('button');
  btn.className = 'year-btn';
  btn.id = year;
  btn.textContent = year;
  if (count === 0) {
    btn.className += ' year-btn-empty';
    btn.disabled = true;
    if (host) {
      btn.title = `No captures of ${host} from ${year}`;
    }
    return btn;
  }
  if (count !== undefined && host) {
    btn.title = `View ${count} unique ${count === 1 ? 'URL' : 'URLs'} of ${host} from ${year}`;
  }
  if (count !== undefined && maxCount) {
    const bar = document.createElement('span');
    bar.className = 'year-btn-bar';
    bar.style.height = `${Math.max(1, Math.round(count / maxCount * MAX_BAR_HEIGHT))}px`;
    btn.appendChild(bar);
  }
  return btn;
}
function getYearByBtn(btn) {
  return btn.id;
}
function getButtonByYear(container, year) {
  return container.ownerDocument.getElementById(year);
}

/**
 * every year from first to last, so gaps without captures are visible.
 * falls back to the given years if any of them is not numeric.
 */
function fillYearRange(years) {
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
function renderYearButtons(element, allYears, onYearSelect, urlsByYear, host) {
  const divBtn = element.querySelector('.div-btn');
  divBtn.onclick = evt => {
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
function RadialTree(element, cdxData, options = {}) {
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

  // nothing to render when there are no captures, only the header row.
  if (years.length === 0) {
    return;
  }

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
