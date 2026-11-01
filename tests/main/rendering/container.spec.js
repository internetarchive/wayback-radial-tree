/**
 * @jest-environment jsdom
 */
import {renderContainer} from '../../../src/js/rendering/container';


describe('renderContainer', () => {
  it('should create content with buttons, sequence and chart', () => {
    const content = renderContainer();
    expect(content.className).toBe('rt-content');
    expect(content.style.display).toBe('block');
    expect(Array.from(content.children).map(el => el.className || el.id))
      .toEqual(['div-btn', 'sequence', 'chart']);
    expect(content.querySelector('p.sequence')).not.toBeNull();
    expect(content.querySelector('div#chart')).not.toBeNull();
  });
});
