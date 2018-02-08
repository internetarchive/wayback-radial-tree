import {expect} from 'chai';
import {groupByYear, processTimeMapData} from '../../../src/js/processing/timemap';
import fixture from './iskme-timemap-fixture.json';


describe('time map processing', () => {
  it('should pack null or timemap to null', () => {
    expect(groupByYear(null)).to.be.equal(null);
  });

  it('should pack timemap to key-value storage', () => {
    expect(groupByYear(fixture)).to.be.deep.equal({
      2003: [
        {key: 'org,iskme)/', url: 'www.iskme.org:80', year: '2003'},
      ],
      2004: [
        {key: 'org,iskme)/', url: 'www.iskme.org:80', year: '2004'},
      ],
      2005: [
        {key: 'org,iskme)/', url: 'iskme.org:80', year: '2005'},
        {key: 'org,iskme)/about-us', url: 'iskme.org/about-us', year: '2005'},
        {key: 'org,iskme)/about-us/about-iskme', url: 'iskme.org/about-us/about-iskme', year: '2005'},
      ],
    });
  });

  it('should return empty array for empty input', () => {
    expect(processTimeMapData('iskme.org', [])).to.be.deep.equal({
      allYears: [],
      yearData: [],
    });
  });

  xit('should process correctly common data', () => {
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
