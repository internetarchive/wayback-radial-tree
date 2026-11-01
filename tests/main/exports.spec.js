import * as processing from '../../src/js/processing';
import * as rendering from '../../src/js/rendering';


describe('module exports', () => {
  it('should export processing API', () => {
    expect(Object.keys(processing).sort()).toEqual([
      'Fields', 'buildHierarchy', 'extractYearsFromGroupedTimeMap', 'processTimeMap', 'surtToUrl',
    ]);
  });

  it('should export rendering API', () => {
    expect(Object.keys(rendering).sort()).toEqual([
      'createVisualization', 'getButtonByYear', 'getYearByBtn', 'renderContainer',
      'renderYearButton', 'renderYearButtons',
    ]);
  });
});
