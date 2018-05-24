import {expect} from 'chai';
import {buildHierarchy} from '../../../src/js/processing/hierarchy';
import {Fields, processTimeMap, processTimeMapData} from '../../../src/js/processing/timemap';


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
    )).to.be.deep.equal({
      name: 'iskme.org',
      children: [{
        name: 'about-us',
        children: [{
          name: 'about-iskme-1',
        }, {
          name: 'about-iskme-2',
        },]
      }]
    });
  });
});
