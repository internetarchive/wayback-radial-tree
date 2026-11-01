import {buildHierarchy} from '../../../src/js/processing/hierarchy';
import {Fields} from '../../../src/js/processing/timemap';


const fields = new Fields([['timestamp:4', 'urlkey', 'original']]);
const data = [
  ['2005', 'org,iskme)/', 'www.iskme.org:80'],
  ['2005', 'org,iskme)/about-us', 'iskme.org/about-us'],
  ['2005', 'org,iskme)/about-us/about-iskme-1', 'iskme.org/about-us/about-iskme-1'],
  ['2005', 'org,iskme)/about-us/about-iskme-2', 'iskme.org/about-us/about-iskme-2'],
];


describe('hierarchy', () => {
  it('should create hierarchy from regular year structure', () => {
    expect(buildHierarchy(
      fields,
      data,
      {
        targetField: 'urlkey',
      }
    )).toEqual({
      name: 'iskme.org',
      urlCount: 1,
      children: [{
        name: 'about-us',
        urlCount: 1,
        children: [{
          name: 'about-iskme-1',
          urlCount: 1,
        }, {
          name: 'about-iskme-2',
          urlCount: 1,
        },]
      }]
    });
  });

  it('should create hierarchy with only a name for host-only urlkeys', () => {
    expect(buildHierarchy(fields, [
      ['2005', 'org,iskme)', 'iskme.org'],
      ['2005', 'org,iskme)/', 'iskme.org/'],
    ], {targetField: 'urlkey'})).toEqual({name: 'iskme.org', urlCount: 2});
  });

  it('should skip rows with empty urlkey', () => {
    expect(buildHierarchy(fields, [
      ['2005', '', ''],
      ['2005', null, ''],
      ['2005', 'org,iskme)/about-us', 'iskme.org/about-us'],
    ], {targetField: 'urlkey'})).toEqual({
      name: 'iskme.org',
      children: [{name: 'about-us', urlCount: 1}],
    });
  });

  it('should ignore empty path segments', () => {
    expect(buildHierarchy(fields, [
      ['2005', 'org,iskme)/about-us//team/', 'iskme.org/about-us//team/'],
    ], {targetField: 'urlkey'})).toEqual({
      name: 'iskme.org',
      children: [{name: 'about-us', children: [{name: 'team', urlCount: 1}]}],
    });
  });

  it('should merge rows sharing a path prefix regardless of order', () => {
    expect(buildHierarchy(fields, [
      ['2005', 'org,iskme)/a/b', ''],
      ['2005', 'org,iskme)/c', ''],
      ['2005', 'org,iskme)/a', ''],
      ['2005', 'org,iskme)/a/d', ''],
    ], {targetField: 'urlkey'})).toEqual({
      name: 'iskme.org',
      children: [
        {name: 'a', urlCount: 1, children: [{name: 'b', urlCount: 1}, {name: 'd', urlCount: 1}]},
        {name: 'c', urlCount: 1},
      ],
    });
  });

  it('should take name from first row host', () => {
    expect(buildHierarchy(fields, [
      ['2005', 'org,iskme)/a', ''],
      ['2005', 'com,example)/b', ''],
    ], {targetField: 'urlkey'}).name).toBe('iskme.org');
  });

  it('should return empty object for no data', () => {
    expect(buildHierarchy(fields, [], {targetField: 'urlkey'})).toEqual({});
  });

  it('should count urlkeys ending at the same node', () => {
    expect(buildHierarchy(fields, [
      ['2005', 'org,iskme)/about-us', ''],
      ['2005', 'org,iskme)/about-us/', ''],
      ['2005', 'org,iskme)//', ''],
    ], {targetField: 'urlkey'})).toEqual({
      name: 'iskme.org',
      urlCount: 1,
      children: [{name: 'about-us', urlCount: 2}],
    });
  });
});
