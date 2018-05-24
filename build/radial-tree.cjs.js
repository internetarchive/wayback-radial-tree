'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));
var d3 = require('d3');

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
  //drop last ')'
  surt = surt.slice(0, surt.length - 1);
  return surt.split(',').reverse().join('.');
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

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

  var _path = toArray(path),
      name = _path[0],
      rest = _path.slice(1);

  if (!name) {
    return;
  }

  var nextParent = void 0;

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
        _value$split2 = toArray(_value$split),
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
var Fields = function () {
  function Fields(data) {
    classCallCheck(this, Fields);

    this.fields = data[0];
    this.getIndexByName = _.memoize(this.getIndexByName);
  }

  /**
   * get index of field by name
   *
   * @param name
   */


  createClass(Fields, [{
    key: 'getIndexByName',
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
    key: 'getValueByName',
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

  return Object.keys(data).map(function (y) {
    return Number.parseInt(y);
  }).sort();
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
  return _(res).mapValues(function (value) {
    return Object.values(value);
  }).mapValues(function (value) {
    return _.sortBy(value, fields.getIndexByName(orderBy));
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

var arc = d3.arc().startAngle(function (d) {
  return d.x0;
}).endAngle(function (d) {
  return d.x1;
}).innerRadius(function (d) {
  return Math.sqrt(d.y0);
}).outerRadius(function (d) {
  return Math.sqrt(d.y1);
});

var colors = d3.scaleOrdinal(d3.schemePaired);

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
  var partition = d3.partition().size([2 * Math.PI, radius * radius]);

  //append 'root' we will exclude it on rendering
  var root = d3.hierarchy({ children: [data] }).sum(function (d) {
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

  d3.select('#d3_container').on('mouseleave', mouseleave);

  /** on mobile devices, touching the RadialTree prevents the ``click``
   *  event and shows the URL like on ``mouseover`` event. Users can click
   *  on the URL to visit the target page */
  function touchStart(d) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    mouseover(d);
    return false;
  }

  function currentUrl(d) {
    var anc = d.ancestors().reverse();
    var url = '';
    for (var i = 1; i < anc.length; i++) {
      if (anc[i].data.name === 'end') {
        break;
      }
      url = url + '/' + anc[i].data.name;
    }
    return baseURL + '/web/' + currentYear + '0630' + url;
  }

  function mouseover(d) {
    var sequenceArray = d.ancestors().reverse();
    sequenceArray.shift();
    var url = currentUrl(d);
    updateBreadcrumbs(sequenceArray, url);
    d3.selectAll('path').style('opacity', 0.3);

    vis.selectAll('path').filter(function (node) {
      return sequenceArray.indexOf(node) >= 0;
    }).style('opacity', 1);
  }

  function mouseleave() {
    element.querySelector('.sequence').innerHTML = '';

    d3.selectAll('path').on('mouseover', null);

    d3.selectAll('path').transition().style('opacity', 1).on('end', function () {
      d3.select(this).on('mouseover', mouseover);
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
    element.querySelector('.sequence').innerHTML = '<a href="' + url + '">' + text + '</a>';
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
function RadialTree(element, cdx_data) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  var baseURL = options.baseURL || 'https://web.archive.org';

  // render

  var container = renderContainer();
  element.appendChild(container);

  var fields = new Fields(cdx_data);
  var urlsByYear = processTimeMap(cdx_data, {
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
    btn.classList.add('active-btn');

    renderChart(element, year);
  }

  function renderChart(element, currentYear) {
    element.querySelector('.sequence').innerHTML = '';
    element.querySelector('#chart').innerHTML = '';

    var width = element.querySelector('#chart').offsetWidth;
    var height = width;
    var radius = Math.min(width, height) / 2;

    var vis = d3.select('#chart').append('svg:svg').attr('width', width).attr('height', height).append('svg:g').attr('id', 'd3_container').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

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
