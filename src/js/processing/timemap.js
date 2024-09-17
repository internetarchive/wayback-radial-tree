import _ from 'lodash';

/**
 * extract fields from time map data
 *
 */
export class Fields {
  constructor (data) {
    this.fields = data[0];
    this.getIndexByName = _.memoize(this.getIndexByName);
  }

  /**
   * get index of field by name
   *
   * @param name
   */
  getIndexByName (name) {
    return this.fields.indexOf(name);
  }

  /**
   * get value of field in row by name
   *
   * @param row
   * @param name
   * @returns {*}
   */
  getValueByName (row, name) {
    return row[this.getIndexByName(name)];
  }
}

/**
 * get all sorted years from grouped time map data
 *
 * @param data time map data
 * @returns {Array} years
 */
export function extractYearsFromGroupedTimeMap (data) {
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
export function processTimeMap (data, { groupBy, dedupBy, orderBy } = {}) {
  if (!data) {
    return data;
  }

  const fields = new Fields(data);
  const groupByIndex = fields.getIndexByName(groupBy);
  const dedupByIndex = fields.getIndexByName(dedupBy);
  const orderByIndex = fields.getIndexByName(orderBy);

  // Use an object to group and deduplicate rows
  const groupedData = data.slice(1).reduce((result, row) => {
    const groupKey = row[groupByIndex];
    const dedupKey = row[dedupByIndex];

    // Initialize group if not exists
    if (!result[groupKey]) {
      result[groupKey] = {};
    }

    // Add row if it hasn't been deduplicated already
    if (!result[groupKey][dedupKey]) {
      result[groupKey][dedupKey] = row;
    }

    return result;
  }, {});

  // Convert groups to arrays and sort by orderBy field
  return Object.keys(groupedData).reduce((acc, key) => {
    const values = Object.values(groupedData[key]);

    // Sort values by the 'orderBy' field
    values.sort((a, b) => {
      const valA = a[orderByIndex];
      const valB = b[orderByIndex];
      return valA < valB ? -1 : valA > valB ? 1 : 0;
    });

    acc[key] = values;
    return acc;
  }, {});
}
