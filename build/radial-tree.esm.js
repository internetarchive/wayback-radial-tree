import { arc, csvParseRows, event, hierarchy, partition, scaleOrdinal, schemeCategory20b, select, selectAll } from 'd3';
import _ from 'lodash';

/**
 * Process timemap data from endpoint /web/timemap/json to the inner format
 *
 * @param url
 * @param data
 * @returns {*}
 */
function processTimeMapData(url, data) {
  var regexHTTP = /http:\/\//;
  var regexHTTPS = /https:\/\//;
  var regexLast = /\/$/;
  url.replace(regexHTTP, '');
  url.replace(regexHTTPS, '');
  url.replace(regexLast, '');

  if (data.length === 0) {
    return {
      allYears: [],
      yearData: []
    };
  }

  var yearUrl = [];
  for (var i = 1; i < data.length; i++) {
    if (data[i][1].match(/jpg|pdf|png|form|gif/)) {
      continue;
    }
    data[i][1] = data[i][1].trim().replace(':80/', '/');
    if (data[i][0] in yearUrl) {
      yearUrl[data[i][0]].push(data[i][1]);
    } else {
      yearUrl[data[i][0]] = [data[i][1]];
    }
  }
  var ret = [];
  for (var year in yearUrl) {
    ret.push([year].concat(yearUrl[year]));
  }
  /** ret has the following format:
   *  array(
   *    array(2005, url1, url2, .... urlN),
   *    ...
   *  ) **/
  var years = function () {
    for (var _i = 0; _i < ret.length; _i++) {
      var urls = [];

      for (var j = 1; j < ret[_i].length; j++) {
        var _url = void 0;
        if (ret[_i][j].includes('http')) {
          _url = ret[_i][j].substring(7);
        } else if (ret[_i][j].includes('https')) {
          _url = ret[_i][j].substring(8);
        }
        if (_url.includes('//')) {
          _url = _url.split('//').join('/');
        }
        _url = _url.split('/').join('/');
        urls.push(_url);
      }

      urls = _.uniq(urls.sort());

      //year should be the 1st
      urls.unshift(ret[_i][0]);

      ret[_i] = urls;
    }
    return ret;
  }();

  var all_years = years.map(function (year) {
    if (year.length > 1) {
      return year[0];
    }
  });

  return {
    allYears: all_years,
    yearData: years
  };
}

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
function RadialTree(element, cdx_data, option) {
  var GlobYear = 0;
  var baseURL = 'https://web.archive.org';
  // Use typeof check to allow empty string in baseURL value
  if (typeof option.baseURL !== 'undefined') {
    baseURL = option.baseURL;
  }
  if (!option.url) return;

  init(element);

  var _processTimeMapData = processTimeMapData(option.url, cdx_data),
      allYears = _processTimeMapData.allYears,
      yearData = _processTimeMapData.yearData;

  createYearButtons(element, option, allYears, yearData);

  function init(container) {
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

    container.appendChild(content);
  }

  function createYearButtons(element, option, allYears, yearData) {
    var divBtn = element.querySelector('.div-btn');
    if (!element.querySelector('.year-btn')) {
      allYears.forEach(function (year, i) {
        var btn = document.createElement('button');
        btn.setAttribute('class', 'year-btn');
        btn.setAttribute('id', allYears[i]);
        btn.innerHTML = allYears[i];
        btn.onclick = function (evt) {
          var target = evt.target;
          if (element.querySelector('.active-btn')) {
            element.querySelector('.active-btn').classList.remove('active-btn');
          }
          target.classList.add('active-btn');
          GlobYear = target.id;
          var num = allYears.indexOf(target.id);
          var text = makeNewText(num, yearData);
          drawChart(element, option, text);
        };
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

  function drawChart(element, option, text) {
    element.querySelector('.sequence').innerHTML = '';
    element.querySelector('#chart').innerHTML = '';
    var width = element.querySelector('#chart').offsetWidth;
    var height = width;
    var radius = Math.min(width, height) / 2;
    var colors = scaleOrdinal(schemeCategory20b);
    var vis = select('#chart').append('svg:svg').attr('width', width).attr('height', height).append('svg:g').attr('id', 'd3_container').attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    var partition$$1 = partition().size([2 * Math.PI, radius * radius]);
    var arc$$1 = arc().startAngle(function (d) {
      return d.x0;
    }).endAngle(function (d) {
      return d.x1;
    }).innerRadius(function (d) {
      return Math.sqrt(d.y0);
    }).outerRadius(function (d) {
      return Math.sqrt(d.y1);
    });

    var csv = csvParseRows(text);
    var json = buildHierarchy(csv);
    createVisualization(json);

    function createVisualization(json) {
      vis.append('svg:circle').attr('r', radius).style('opacity', 0);
      var root = hierarchy(json).sum(function (d) {
        return d.size;
      }).sort(function (a, b) {
        return b.value - a.value;
      });
      var nodes = partition$$1(root).descendants();

      vis.data([json]).selectAll('path').data(nodes).enter().append('a').attr('xlink:href', currentUrl).on('touchstart', touchStart).append('svg:path').attr('display', function (d) {
        return d.depth ? null : 'none';
      }).attr('d', arc$$1).attr('fill-rule', 'evenodd').style('fill', function (d) {
        if (d.data.name === 'end') {
          return '#000000';
        } else {
          return colors((d.children ? d : d.parent).data.name);
        }
      }).style('opacity', 1).style('cursor', 'pointer').on('mouseover', mouseover);

      select('#d3_container').on('mouseleave', mouseleave);
    }

    /** on mobile devices, touching the RadialTree prevents the ``click``
     *  event and shows the URL like on ``mouseover`` event. Users can click
     *  on the URL to visit the target page */
    function touchStart(d) {
      event.preventDefault();
      event.stopPropagation();
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
      return baseURL + '/web/' + GlobYear + '0630' + url;
    }

    function mouseover(d) {
      var sequenceArray = d.ancestors().reverse();
      sequenceArray.shift();
      var url = currentUrl(d);
      updateBreadcrumbs(sequenceArray, url);
      selectAll('path').style('opacity', 0.3);
      vis.selectAll('path').filter(function (node) {
        return sequenceArray.indexOf(node) >= 0;
      }).style('opacity', 1);
    }

    function mouseleave() {
      element.querySelector('.sequence').innerHTML = '';
      selectAll('path').on('mouseover', null);
      selectAll('path').transition().style('opacity', 1).on('end', function () {
        select(this).on('mouseover', mouseover);
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

    function buildHierarchy(csv) {
      csv.sort(function (a, b) {
        return a[0].length - b[0].length || a[0].localeCompare(b[0]);
      });
      var real_urls = {};
      real_urls[option.url] = 1;
      if (option.url.slice(-1) !== '/') {
        real_urls[option.url + '/'] = 1;
      }
      for (var i = 0; i < csv.length; i++) {
        var key = String(csv[i][0]).trim().replace(':80/', '/');
        real_urls[key] = 1;
        if (key.slice(-1) !== '/') {
          real_urls[key + '/'] = 1;
        }
      }

      var DELIMITER = '|';

      function filterRealUrl(url) {
        var parts = url.trim().split('/');
        var delimiter_index = [];
        for (var _i = 1; _i < parts.length; _i++) {
          var potentialUrl = parts.slice(0, _i).join('/');
          if (potentialUrl in real_urls === false && _i > 0) {
            var pos = parts.slice(0, _i).join('/').length;
            delimiter_index.push(pos);
          }
        }
        if (delimiter_index.length > 0) {
          var result_url = url;
          for (var j = 1; j < delimiter_index.length; j++) {
            var index = delimiter_index[j];
            result_url = result_url.substr(0, index) + DELIMITER + result_url.substr(index + 1);
          }
          return result_url;
        }
        return url;
      }

      var root = { name: 'root', children: [] };
      for (var _i2 = 0; _i2 < csv.length; _i2++) {
        var sequence = filterRealUrl(csv[_i2][0]);
        var size = +csv[_i2][1];
        if (isNaN(size)) {
          continue;
        }
        var parts = sequence.split('/');
        parts = parts.map(function (s) {
          return s.replace(/\|/g, '/');
        });
        var currentNode = root;
        for (var j = 0; j < parts.length; j++) {
          var children = currentNode.children;
          var nodeName = parts[j];
          var childNode = void 0;
          if (j + 1 < parts.length) {
            var foundChild = false;
            for (var k = 0; k < children.length; k++) {
              if (children[k].name === nodeName) {
                childNode = children[k];
                foundChild = true;
                break;
              }
            }
            if (!foundChild) {
              childNode = { name: nodeName, children: [] };
              children.push(childNode);
            }
            currentNode = childNode;
          } else {
            childNode = { name: nodeName, size: size };
            children.push(childNode);
          }
        }
      }
      return root;
    }
  }

  function makeNewText(n, yearData) {
    var text = '';
    var x = 2;
    if (yearData[n].length === 2) {
      x = 1;
    }
    for (var i = x; i < yearData[n].length; i++) {
      if (i !== yearData[n].length - 1) {
        text = text + yearData[n][i] + ' ,1' + '\n';
      } else {
        text = text + yearData[n][i] + ' ,1';
      }
    }
    return text;
  }
}

export { RadialTree };
//# sourceMappingURL=radial-tree.esm.js.map
