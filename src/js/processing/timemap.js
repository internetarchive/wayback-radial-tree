import _ from 'lodash';


/**
 * Process timemap data from endpoint /web/timemap/json to the inner format
 *
 * @param url
 * @param data
 * @returns {*}
 */
export function processTimeMapData(url, data) {
  let regexHTTP = /http:\/\//;
  let regexHTTPS = /https:\/\//;
  let regexLast = /\/$/;
  url.replace(regexHTTP, '');
  url.replace(regexHTTPS, '');
  url.replace(regexLast, '');

  if (data.length === 0) {
    return {
      allYears: [],
      yearData: [],
    };
  }

  let yearUrl = [];
  for (let i = 1; i < data.length; i++) {
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
      let urls = [];

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
        urls.push(url);
      }

      urls = _.uniq(urls.sort());

      //year should be the 1st
      urls.unshift(ret[i][0]);

      ret[i] = urls;
    }
    return ret;
  }());

  let all_years = years.map(function (year) {
    if (year.length > 1) {
      return year[0];
    }
  });

  return {
    allYears: all_years,
    yearData: years,
  };
}
