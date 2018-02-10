import _ from 'lodash';

/**
 * extract fields from time map data
 *
 */
export class Fields {
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
export function extractYearsFromGroupedTimeMap(data) {
  if (!data) {
    return data;
  }

  return Object.keys(data)
    .map(y => Number.parseInt(y))
    .sort();
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
export function processTimeMap(data, {groupBy, dedupBy, orderBy} = {}) {
  if (!data) {
    return data;
  }

  const fields = new Fields(data);

  const res = data
    .slice(1)
    .reduce((result, row) => {
      const oneGroup = result[fields.getValueByName(row, groupBy)] || {};

      // don't add if we already have it
      if (!oneGroup[fields.getValueByName(row, dedupBy)]) {
        oneGroup[fields.getValueByName(row, dedupBy)] = row;
      }

      result[fields.getValueByName(row, groupBy)] = oneGroup;
      return result;
    }, {});

  // if someday we would get bad performance here
  // we could make insertion with sorthing above
  return _(res)
    .mapValues(value => Object.values(value))
    .mapValues(value => _.sortBy(value, fields.getIndexByName(orderBy)))
    .value();
}
