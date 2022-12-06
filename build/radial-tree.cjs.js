'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var d3 = require('d3');
var _ = require('lodash');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
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
  n["default"] = e;
  return Object.freeze(n);
}

var d3__namespace = /*#__PURE__*/_interopNamespace(d3);
var ___default = /*#__PURE__*/_interopDefaultLegacy(_);

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}
function _toArray(arr) {
  return _arrayWithHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableRest();
}
function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}
function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
}
function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}
function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
  return arr2;
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

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
  surt = surt.slice(0, surt.length - 1);
  return surt.split(',').reverse().join('.');
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
  var _path = _toArray(path),
    name = _path[0],
    rest = _path.slice(1);
  if (!name) {
    return;
  }
  var nextParent;
  if (parent.children) {
    nextParent = parent.children.filter(function (c) {
      return c.name === name;
    })[0];
  } else {
    parent.children = [];
  }
  if (!nextParent) {
    nextParent = {
      name: name
    };
    parent.children.push(nextParent);
  }
  buildHierarchInDepth(nextParent, rest);
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
  var targetField = _ref.targetField;
  return data.reduce(function (res, row) {
    var value = fields.getValueByName(row, targetField);
    var _value$split = value.split('/'),
      _value$split2 = _toArray(_value$split),
      host = _value$split2[0],
      path = _value$split2.slice(1);
    res.name = surtToUrl(host);
    buildHierarchInDepth(res, path);
    return res;
  }, {});
}

/**
 * extract fields from time map data
 *
 */
var Fields = /*#__PURE__*/function () {
  function Fields(data) {
    _classCallCheck(this, Fields);
    this.fields = data[0];
    this.getIndexByName = ___default["default"].memoize(this.getIndexByName);
  }

  /**
   * get index of field by name
   *
   * @param name
   */
  _createClass(Fields, [{
    key: "getIndexByName",
    value: function getIndexByName(name) {
      return this.fields.indexOf(name);
    }

    /**
     * get value of field in row by name
     *
     * @param row
     * @param name
     * @returns {*}
     */
  }, {
    key: "getValueByName",
    value: function getValueByName(row, name) {
      return row[this.getIndexByName(name)];
    }
  }]);
  return Fields;
}();

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
  var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
    groupBy = _ref.groupBy,
    dedupBy = _ref.dedupBy,
    orderBy = _ref.orderBy;
  if (!data) {
    return data;
  }
  var fields = new Fields(data);
  var res = data.slice(1).reduce(function (result, row) {
    var oneGroup = result[fields.getValueByName(row, groupBy)] || {};

    // don't add if we already have it
    if (!oneGroup[fields.getValueByName(row, dedupBy)]) {
      oneGroup[fields.getValueByName(row, dedupBy)] = row;
    }
    result[fields.getValueByName(row, groupBy)] = oneGroup;
    return result;
  }, {});

  // if someday we would get bad performance here
  // we could make insertion with sorthing above
  return ___default["default"](res).mapValues(function (value) {
    return Object.values(value);
  }).mapValues(function (value) {
    return ___default["default"].sortBy(value, fields.getIndexByName(orderBy));
  }).value();
}

function renderContainer() {
  var content = document.createElement('div');
  content.setAttribute('class', 'rt-content');
  var divBtn = document.createElement('div');
  divBtn.setAttribute('class', 'div-btn');
  var sequence = document.createElement('p');
  sequence.setAttribute('class', 'sequence');
  var chart = document.createElement('div');
  chart.setAttribute('id', 'chart');
  content.appendChild(divBtn);
  content.appendChild(sequence);
  content.appendChild(chart);
  content.style.display = 'block';
  return content;
}

var arc = d3__namespace.arc().startAngle(function (d) {
  return d.x0;
}).endAngle(function (d) {
  return d.x1;
}).innerRadius(function (d) {
  return Math.sqrt(d.y0);
}).outerRadius(function (d) {
  return Math.sqrt(d.y1);
});
var colors = d3__namespace.scaleOrdinal(d3__namespace.schemePaired);

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
  var partition = d3__namespace.partition().size([2 * Math.PI, radius * radius]);

  // append 'root' we will exclude it on rendering
  var root = d3__namespace.hierarchy({
    children: [data]
  }).sum(function (d) {
    return !d.children;
  }).sort(function (a, b) {
    return b.value - a.value;
  });
  var nodes = partition(root).descendants();
  vis.selectAll('path').data(nodes).enter().append('a').attr('xlink:href', currentUrl).on('touchstart', touchStart).append('svg:path').attr('display', function (d) {
    return d.depth ? null : 'none';
  }).attr('d', arc).attr('fill-rule', 'evenodd').style('fill', function (d) {
    return colors((d.children ? d : d.parent).data.name);
  }).style('opacity', 1).style('cursor', 'pointer').on('mouseover', mouseover);
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
    var anc = d.ancestors().reverse();
    var url = '';
    for (var i = 1; i < anc.length; i++) {
      if (anc[i].data.name === 'end') {
        break;
      }
      url = url + '/' + anc[i].data.name;
    }
    return "".concat(baseURL, "/web/").concat(currentYear, "0630").concat(url);
  }
  function mouseover(e, d) {
    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift();
    var url = currentUrl(d);
    updateBreadcrumbs(sequenceArray, url);
    d3__namespace.selectAll('path').style('opacity', 0.3);
    vis.selectAll('path').filter(function (node) {
      return sequenceArray.indexOf(node) >= 0;
    }).style('opacity', 1);
  }
  function mouseleave() {
    element.querySelector('.sequence').innerHTML = '';
    d3__namespace.selectAll('path').on('mouseover', null);
    d3__namespace.selectAll('path').transition().style('opacity', 1).on('end', function () {
      d3__namespace.select(this).on('mouseover', mouseover);
    });
  }
  function updateBreadcrumbs(nodeArray, url) {
    var text = '';
    var symb = document.createElement('span');
    symb.setAttribute('class', 'symb');
    symb.innerHTML = '/';
    for (var i = 0; i < nodeArray.length; i++) {
      if (i === 0) {
        text = ' ' + nodeArray[i].data.name;
      } else {
        text = text + symb.innerHTML + nodeArray[i].data.name;
      }
    }
    text = decodeURIComponent(text);
    element.querySelector('.sequence').innerHTML = "<a href=\"".concat(url, "\">").concat(text, "</a>");
  }
}

function renderYearButton(year) {
  var btn = document.createElement('button');
  btn.setAttribute('class', 'year-btn');
  btn.setAttribute('id', year);
  btn.innerHTML = year;
  return btn;
}
function getYearByBtn(btn) {
  return btn.id;
}
function getButtonByYear(container, year) {
  return container.ownerDocument.getElementById(year);
}

function renderYearButtons(element, allYears, onYearSelect) {
  var divBtn = element.querySelector('.div-btn');
  divBtn.onclick = function (evt) {
    return onYearSelect(getYearByBtn(evt.target));
  };
  if (!element.querySelector('.year-btn')) {
    allYears.forEach(function (year) {
      return divBtn.appendChild(renderYearButton(year));
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
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var baseURL = options.baseURL || 'https://web.archive.org';

  // render
  var container = renderContainer();
  element.appendChild(container);
  var fields = new Fields(cdxData);
  var urlsByYear = processTimeMap(cdxData, {
    groupBy: 'timestamp:4',
    dedupBy: 'urlkey',
    orderBy: 'urlkey'
  });
  var years = extractYearsFromGroupedTimeMap(urlsByYear);
  renderYearButtons(element, years, selectYear);

  // highlight the 2nd last year if available, else hightlight the last.
  // necessary because the last year may not have much data.
  // const lastButOneYear = allYears[allYears.length - 2] || allYears[0];
  var selectedBtn = years[years.length - 2] || years[0];
  selectYear(selectedBtn);
  function selectYear(year) {
    // hide active button
    if (element.querySelector('.active-btn')) {
      element.querySelector('.active-btn').classList.remove('active-btn');
    }

    // show active button
    var btn = getButtonByYear(element, year);
    if (btn) {
      btn.classList.add('active-btn');
    }
    renderChart(element, year);
  }
  function renderChart(element, currentYear) {
    element.querySelector('.sequence').innerHTML = '';
    element.querySelector('#chart').innerHTML = '';
    var width = element.querySelector('#chart').offsetWidth;
    var height = width;
    var radius = Math.min(width, height) / 2;
    var vis = d3__namespace.select('#chart').append('svg:svg').attr('width', width).attr('height', height).append('svg:g').attr('id', 'd3_container').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    vis.append('svg:circle').attr('r', radius).style('opacity', 0);
    var urls = urlsByYear[currentYear];
    var hierarchy = buildHierarchy(fields, urls, {
      targetField: 'urlkey'
    });
    createVisualization(element, vis, radius, baseURL, currentYear, hierarchy);
  }
}

exports.RadialTree = RadialTree;
//# sourceMappingURL=radial-tree.cjs.js.map
