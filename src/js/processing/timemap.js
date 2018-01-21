export function processTimeMapData(url, response) {
  let regexHTTP = /http:\/\//;
  let regexHTTPS = /https:\/\//;
  let regexLast = /\/$/;
  url.replace(regexHTTP, '');
  url.replace(regexHTTPS, '');
  url.replace(regexLast, '');

  if (response.length === 0) {
    return {
      allYears: [],
      yearData: [],
    };
  }

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

  return {
    allYears: all_years,
    yearData: years,
  };
}
