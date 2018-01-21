import {expect} from 'chai';
import {processTimeMapData} from '../../../src/js/processing/timemap';


describe('time map processing', () => {
  it('should return empty array for empty input', () => {
    expect(processTimeMapData('iskme.org', [])).to.be.deep.equal({
      allYears: [],
      yearData: [],
    })
  });
});
