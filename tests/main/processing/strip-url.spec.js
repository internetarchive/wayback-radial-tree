import stripUrl from '../../../src/js/processing/strip-url';
import {expect} from 'chai';


describe('strip-url', () => {
  [{
    protocol: 'http protocol',
    input: 'http://archive.org',
    output: 'archive.org',
  }, {
    protocol: 'https protocol',
    input: 'https://archive.org',
    output: 'archive.org',
  }, {
    protocol: 'tail /',
    input: 'archive.org/',
    output: 'archive.org',
  },
  ].forEach(({protocol, input, output}) => {
    it(`should remove ${protocol}`, () => {
      expect(stripUrl(input)).to.equal(output);
    });
  });
});
