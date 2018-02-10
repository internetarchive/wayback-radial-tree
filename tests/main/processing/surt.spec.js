import {expect} from 'chai';

import {surtToUrl} from '../../../src/js/processing/surt';


describe('surtToUrl', () => {
  it('should translate regular surt to URL', () => {
    expect(surtToUrl('org,iskme)')).to.be.equal('iskme.org');
  });

  it('should return null for null SURT', () => {
    expect(surtToUrl(null)).to.be.equal(null);
  });

  it('should return "" for "" SURT', () => {
    expect(surtToUrl(null)).to.be.equal(null);
  });
});
