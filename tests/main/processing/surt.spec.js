import {surtToUrl} from '../../../src/js/processing/surt';


describe('surtToUrl', () => {
  it('should translate regular surt to URL', () => {
    expect(surtToUrl('org,iskme)')).toBe('iskme.org');
  });

  it('should return null for null SURT', () => {
    expect(surtToUrl(null)).toBe(null);
  });

  it('should return "" for "" SURT', () => {
    expect(surtToUrl(null)).toBe(null);
  });
});
