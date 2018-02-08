import {expect} from 'chai';
import {packTimeMapToKeyValue, processTimeMapData} from '../../../src/js/processing/timemap';
import fixture from './iskme-timemap-fixture.json';


describe('time map processing', () => {
  it('should pack null or timemap to null', () => {
    expect(packTimeMapToKeyValue(null)).to.be.equal(null);
  });

  it('should pack timemap to key-value storage', () => {
    expect(packTimeMapToKeyValue(fixture)).to.be.deep.equal({
      2003: [
        'iskme.org:80',
        'www.iskme.org/?',
        'www.iskme.org:80',
      ],
      2004: [
        'iskme.org:80',
        'www.iskme.org:80',
      ],
      2005: [
        'iskme.org/about-us',
        'iskme.org/about-us/about-iskme',
        'iskme.org:80',
        'www.iskme.org/about-us',
        'www.iskme.org:80',
      ],
    });
  });

  it('should return empty array for empty input', () => {
    expect(processTimeMapData('iskme.org', [])).to.be.deep.equal({
      allYears: [],
      yearData: [],
    });
  });

  it('should process correctly common data', () => {
    expect(processTimeMapData('iskme.org', fixture)).to.be.deep.equal({
      allYears: ['2003', '2004', '2005'],
      yearData: [
        [
          '2003',
          'iskme.org/',
          'www.iskme.org/',
          'www.iskme.org/?',
        ],
        [
          '2004',
          'iskme.org/',
          'www.iskme.org/',
        ],
        [
          '2005',
          'iskme.org/',
          'iskme.org/about-us',
          'iskme.org/about-us/about-iskme',
          'www.iskme.org/',
          'www.iskme.org/about-us',
        ],
      ]
    });
  });
});
