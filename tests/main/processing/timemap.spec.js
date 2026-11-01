import {
  Fields,
  extractYearsFromGroupedTimeMap,
  processTimeMap,
} from '../../../src/js/processing/timemap';
import fixture from './iskme-timemap-fixture.json';


describe('time map processing', () => {
  describe('fields', () => {
    it('should return -1 index for unknown field', () => {
      const fields = new Fields(fixture);
      expect(fields.getIndexByName('nope')).toBe(-1);
      // cached lookup
      expect(fields.getIndexByName('nope')).toBe(-1);
    });

    it('should extract index by field name', () => {
      expect(
        new Fields(fixture).getIndexByName('urlkey')
      ).toBe(1);
    });

    it('should extract value by field name', () => {
      expect(
        new Fields(fixture).getValueByName(fixture[1], 'urlkey')
      ).toBe('org,iskme)/');
    });
  });

  describe('getYearsFromGroupedTimeMap', () => {
    it('should return null years for null data', () => {
      expect(extractYearsFromGroupedTimeMap(null)).toBeNull();
    });

    it('should return sorted years from data', () => {
      expect(extractYearsFromGroupedTimeMap({
        2003: [
          ['2003', 'org,iskme)/', 'www.iskme.org:80'],
        ],
        2004: [
          ['2004', 'org,iskme)/', 'www.iskme.org:80'],
        ],
        2005: [
          ['2005', 'org,iskme)/', 'iskme.org:80'],
          ['2005', 'org,iskme)/about-us', 'iskme.org/about-us'],
          ['2005', 'org,iskme)/about-us/about-iskme', 'iskme.org/about-us/about-iskme'],
        ],
      })).toEqual(['2003', '2004', '2005']);
    });
  });

  it('should pack null or timemap to null', () => {
    expect(processTimeMap(null)).toBeNull();
  });

  it('should group by year, dedup by urlkey and order by urlkey', () => {
    expect(processTimeMap(
      fixture,
      {
        groupBy: 'timestamp:4',
        dedupBy: 'urlkey',
        orderBy: 'urlkey',
      }
    )).toEqual({
      2003: [
        ['2003', 'org,iskme)/'],
      ],
      2004: [
        ['2004', 'org,iskme)/'],
      ],
      2005: [
        ['2005', 'org,iskme)/'],
        ['2005', 'org,iskme)/about-us'],
        ['2005', 'org,iskme)/about-us/about-iskme'],
      ],
    });
  });

  it('should throw on unknown groupBy or dedupBy field', () => {
    expect(() => processTimeMap(fixture, {groupBy: 'nope', dedupBy: 'urlkey'}))
      .toThrow('Invalid groupBy/dedupBy field');
    expect(() => processTimeMap(fixture, {groupBy: 'timestamp:4', dedupBy: 'nope'}))
      .toThrow('Invalid groupBy/dedupBy field');
  });

  it('should keep first occurrence when deduplicating', () => {
    expect(processTimeMap([
      ['year', 'key', 'n'],
      ['2005', 'a', 1],
      ['2005', 'a', 2],
    ], {groupBy: 'year', dedupBy: 'key', orderBy: 'key'})).toEqual({
      2005: [['2005', 'a', 1]],
    });
  });

  it('should keep insertion order without orderBy field', () => {
    expect(processTimeMap([
      ['year', 'key'],
      ['2005', 'c'],
      ['2005', 'a'],
      ['2005', 'b'],
    ], {groupBy: 'year', dedupBy: 'key'})).toEqual({
      2005: [['2005', 'c'], ['2005', 'a'], ['2005', 'b']],
    });
  });

  it('should order numeric fields numerically', () => {
    expect(processTimeMap([
      ['year', 'key', 'n'],
      ['2005', 'a', 10],
      ['2005', 'b', 9],
      ['2005', 'c', 100],
    ], {groupBy: 'year', dedupBy: 'key', orderBy: 'n'})['2005'].map(r => r[2]))
      .toEqual([9, 10, 100]);
  });

  it('should return empty object for header-only data', () => {
    expect(processTimeMap([['timestamp:4', 'urlkey']], {
      groupBy: 'timestamp:4', dedupBy: 'urlkey', orderBy: 'urlkey',
    })).toEqual({});
  });
});
