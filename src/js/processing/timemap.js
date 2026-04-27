/**
 * extract fields from time map data
 */
export class Fields {
  constructor (data) {
    this.fields = data[0];
    this._indexCache = new Map();
  }

  /**
   * get index of field by name
   *
   * @param name
   */
  getIndexByName (name) {
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
    return av === bv ? 0 : (av > bv ? 1 : -1);
  };

  const out = {};
  for (const [key, dedupMap] of grouped) {
    const values = Array.from(dedupMap.values());
    values.sort(compareOrder);
    out[key] = values;
  }
  return out;
}
