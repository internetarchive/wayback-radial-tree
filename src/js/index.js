/**
 * Radial Tree Library
 *
 * @param {DOMElement} element
 @ @param {Array} cdx_data: decoded CDX Query data retrieved by:
 ``/web/timemap/json?url=example.com/&fl=timestamp:4,original&matchType=prefix
 &filter=statuscode:200&filter=mimetype:text/html&collapse=urlkey
 &collapse=timestamp:4&limit=100000``.
 * @param {Object} option
 * Option baseURL defines the target Wayback Machine server.
 * Option indicatorImg defines the graphic to display while loading data from
 * the Wayback Machine. If undefined, no loading graphic is displayed.
 */
import * as d3 from 'd3';


export function RadialTree(element, cdx_data, option) {
  let GlobYear = 0;
  let baseURL = 'https://web.archive.org';
  let indicatorImg;
  // Use typeof check to allow empty string in baseURL value
  if (typeof option.baseURL !== 'undefined') {
    baseURL = option.baseURL;
  }
  if (option.indicatorImg) {
    indicatorImg = option.indicatorImg;
  }
  if (!option.url) return;

  init(element);

  getData(option.url, cdx_data, function (success, err, allYears, yearData) {
    if (indicatorImg) {
      element.querySelector('.rt-indicator').style.display = 'none';
    }
    if (!success) return;

    createYearButtons(element, option, allYears, yearData);
  });

  function init(container) {
    let content = document.createElement('div');
    content.setAttribute('class', 'rt-content');
    let divBtn = document.createElement('div');
    divBtn.setAttribute('class', 'div-btn');

    let sequence = document.createElement('p');
    sequence.setAttribute('class', 'sequence');
    let chart = document.createElement('div');
    chart.setAttribute('id', 'chart');
    if (indicatorImg) {
      let indicator = document.createElement('img');
      indicator.setAttribute('src', indicatorImg);
      indicator.setAttribute('class', 'rt-indicator');
      chart.appendChild(indicator);
    }
    content.appendChild(divBtn);
    content.appendChild(sequence);
    content.appendChild(chart);
    content.style.display = 'block';

    container.appendChild(content);
  }

  function getData(url, response, cb) {
    let regexHTTP = /http:\/\//;
    let regexHTTPS = /https:\/\//;
    let regexLast = /\/$/;
    url.replace(regexHTTP, '');
    url.replace(regexHTTPS, '');
    url.replace(regexLast, '');

    if (response.length === 0) cb(true, []);

    let yearUrl = [];
    for (let i = 1; i < response.length; i++) {
      if (response[i][1].match(/jpg|pdf|png|form|gif/)) {
        continue;
      }
      response[i][1] = response[i][1].trim().replace(':80/', '/');
      if (response[i][0] in yearUrl) {
        yearUrl[response[i][0]].push(response[i][1]);
      } else {
        yearUrl[response[i][0]] = [response[i][1]];
      }
    }
    let ret = [];
    for (let year in yearUrl) {
      ret.push([year].concat(yearUrl[year]));
    }
    /** ret has the following format:
     *  array(
     *    array(2005, url1, url2, .... urlN),
     *    ...
     *  ) **/
    let years = (function () {
      for (let i = 0; i < ret.length; i++) {
        for (let j = 1; j < ret[i].length; j++) {
          let url;
          if (ret[i][j].includes('http')) {
            url = ret[i][j].substring(7);
          } else if (ret[i][j].includes('https')) {
            url = ret[i][j].substring(8);
          }
          if (url.includes('//')) {
            url = url.split('//').join('/');
          }
          url = url.split('/').join('/');
          ret[i][j] = url;
        }
      }
      return ret;
    }());
    let all_years = years.map(function (year) {
      if (year.length > 1) {
        return year[0];
      }
    });
    cb(true, null, all_years, years);
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
          GlobYear = target.id;
          let num = allYears.indexOf(target.id);
          let text = makeNewText(num, yearData);
          drawChart(element, option, text);
        };
        divBtn.appendChild(btn);
        if (i === allYears.length - 1) btn.click();
      });
    }
  }

  function drawChart(element, option, text) {
    element.querySelector('.sequence').innerHTML = '';
    element.querySelector('#chart').innerHTML = '';
    const width = element.querySelector('#chart').offsetWidth;
    const height = width;
    const radius = Math.min(width, height) / 2;
    let colors = d3.scaleOrdinal(d3.schemeCategory20b);
    let vis = d3.select('#chart')
      .append('svg:svg')
      .attr('width', width)
      .attr('height', height)
      .append('svg:g')
      .attr('id', 'd3_container')
      .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
    let partition = d3.partition()
      .size([2 * Math.PI, radius * radius]);
    let arc = d3.arc()
      .startAngle(function (d) {
        return d.x0;
      })
      .endAngle(function (d) {
        return d.x1;
      })
      .innerRadius(function (d) {
        return Math.sqrt(d.y0);
      })
      .outerRadius(function (d) {
        return Math.sqrt(d.y1);
      });

    let csv = d3.csvParseRows(text);
    let json = buildHierarchy(csv);
    createVisualization(json);

    function createVisualization(json) {
      vis.append('svg:circle')
        .attr('r', radius)
        .style('opacity', 0);
      let root = d3.hierarchy(json)
        .sum(function (d) {
          return d.size;
        })
        .sort(function (a, b) {
          return b.value - a.value;
        });
      let nodes = partition(root)
        .descendants();

      vis.data([json])
        .selectAll('path')
        .data(nodes)
        .enter()
        .append('svg:path')
        .attr('display', function (d) {
          return d.depth ? null : 'none';
        })
        .attr('d', arc)
        .attr('fill-rule', 'evenodd')
        .style('fill', function (d) {
          if (d.data.name === 'end') {
            return '#000000';
          } else {
            return colors((d.children ? d : d.parent).data.name);
          }
        })
        .style('opacity', 1)
        .style('cursor', 'pointer')
        .on('mouseover', mouseover)
        .on('touchstart', touchStart)
        .on('click', openTheUrl);

      d3.select('#d3_container')
        .on('mouseleave', mouseleave);
    }

    /** on mobile devices, touching the RadialTree prevents the ``click``
     *  event and shows the URL like on ``mouseover`` event. Users can click
     *  on the URL to visit the target page */
    function touchStart(d) {
      d3.event.preventDefault();
      d3.event.stopPropagation();
      mouseover(d);
    }

    function currentUrl(d) {
      const anc = d.ancestors().reverse();
      let url = '';
      for (let i = 1; i < anc.length; i++) {
        if (anc[i].data.name === 'end') {
          break;
        }
        url = url + '/' + anc[i].data.name;
      }
      return `${baseURL}/web/${GlobYear}0630${url}`;
    }

    function openTheUrl(d) {
      window.location = currentUrl(d);
    }

    function mouseover(d) {
      let sequenceArray = d.ancestors().reverse();
      sequenceArray.shift();
      let url = currentUrl(d);
      updateBreadcrumbs(sequenceArray, url);
      d3.selectAll('path').style('opacity', 0.3);
      vis.selectAll('path').filter(function (node) {
        return (sequenceArray.indexOf(node) >= 0);
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
      let text = '';
      let symb = document.createElement('span');
      symb.setAttribute('class', 'symb');
      symb.innerHTML = '/';
      for (let i = 0; i < nodeArray.length; i++) {
        if (i === 0) {
          text = ' ' + nodeArray[i].data.name;
        } else {
          text = text + symb.innerHTML + nodeArray[i].data.name;
        }
      }
      text = decodeURIComponent(text);
      element.querySelector('.sequence').innerHTML = `<a href="${url}">${text}</a>`;
    }

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
