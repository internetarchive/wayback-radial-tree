import * as d3 from 'd3';

import {surtToUrl} from './surt';


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

  const [name, ...rest] = path;

  if (!name) {
    return;
  }

  let nextParent;

  if (parent.children) {
    nextParent = parent.children.filter(c => c.name === name)[0];
  } else {
    parent.children = [];
  }

  if (!nextParent) {
    nextParent = {
      name,
    };

    parent.children.push(nextParent);
  }

  buildHierarchInDepth(nextParent, rest);
}


export function _buildHierarchy(fields, data, {targetField}) {
  return data.reduce((res, row) => {
    const value = fields.getValueByName(row, targetField);
    const [host, ...path] = value.split('/');
    res.name = surtToUrl(host);
    buildHierarchInDepth(res, path);
    return res;
  }, {});
}


export function buildHierarchy(oneYearData, targetURL) {
  let csv = d3.csvParseRows(makeNewText(oneYearData));

  csv.sort(function (a, b) {
    return a[0].length - b[0].length || a[0].localeCompare(b[0]);
  });
  let real_urls = {};
  real_urls[targetURL] = 1;
  if (targetURL.slice(-1) !== '/') {
    real_urls[targetURL + '/'] = 1;
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
        childNode = {name: nodeName};
        children.push(childNode);
      }
    }
  }
  return root;
}

function makeNewText(oneYearData) {
  let text = '';
  let x = 2;
  if (oneYearData.length === 2) {
    x = 1;
  }
  for (let i = x; i < oneYearData.length; i++) {
    if (i !== (oneYearData.length - 1)) {
      text = text + oneYearData[i] + ' ,1' + '\n';
    } else {
      text = text + oneYearData[i] + ' ,1';
    }
  }
  return text;
}
