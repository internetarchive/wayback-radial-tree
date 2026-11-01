/**
 * @jest-environment jsdom
 */
import {select} from 'd3-selection';
import {createVisualization} from '../../../src/js/rendering/tree';
import {renderContainer} from '../../../src/js/rendering/container';

const XLINK = 'http://www.w3.org/1999/xlink';
const radius = 100;
const height = 200;

const data = {
  name: 'iskme.org',
  children: [{
    name: 'about-us',
    children: [{name: 'about-iskme-1'}, {name: 'about-iskme-2'}],
  }, {
    name: 'contact',
  }],
};


function render (hierarchy = data) {
  const element = document.createElement('div');
  element.appendChild(renderContainer());
  document.body.appendChild(element);

  const vis = select('#chart')
    .append('svg:svg')
    .append('svg:g')
    .attr('id', 'd3_container');

  createVisualization(element, vis, radius, 'https://web.archive.org', '2005', hierarchy, height);
  return element;
}

function pathByUrl (element, url) {
  const link = Array.from(element.querySelectorAll('a'))
    .find(a => a.getAttributeNS(XLINK, 'href') === url);
  return link && link.querySelector('path');
}

function dispatch (el, type) {
  el.dispatchEvent(new window.Event(type, {bubbles: true, cancelable: true}));
}


describe('createVisualization', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render a path per node including hidden artificial root', () => {
    const element = render();
    const paths = element.querySelectorAll('#d3_container > a > path');
    expect(paths).toHaveLength(6);
    expect(Array.from(paths).filter(p => p.getAttribute('display') === 'none')).toHaveLength(1);
  });

  it('should link each node to its wayback url in the middle of the year', () => {
    const element = render();
    const urls = Array.from(element.querySelectorAll('#d3_container > a'))
      .map(a => a.getAttributeNS(XLINK, 'href'));
    expect(urls).toEqual(expect.arrayContaining([
      'https://web.archive.org/web/20050630/iskme.org',
      'https://web.archive.org/web/20050630/iskme.org/about-us',
      'https://web.archive.org/web/20050630/iskme.org/about-us/about-iskme-1',
      'https://web.archive.org/web/20050630/iskme.org/contact',
    ]));
  });

  it('should show breadcrumbs and highlight ancestors on mouseover', () => {
    const element = render();
    const url = 'https://web.archive.org/web/20050630/iskme.org/about-us/about-iskme-1';
    dispatch(pathByUrl(element, url), 'mouseover');

    const link = element.querySelector('.sequence a');
    expect(link.getAttribute('href')).toBe(url);
    expect(link.textContent).toBe('iskme.org/about-us/about-iskme-1');

    const opacity = u => pathByUrl(element, 'https://web.archive.org/web/20050630/' + u).style.opacity;
    expect(opacity('iskme.org')).toBe('1');
    expect(opacity('iskme.org/about-us')).toBe('1');
    expect(opacity('iskme.org/about-us/about-iskme-1')).toBe('1');
    expect(opacity('iskme.org/about-us/about-iskme-2')).toBe('0.3');
    expect(opacity('iskme.org/contact')).toBe('0.3');
  });

  it('should decode url-encoded names in breadcrumbs', () => {
    const element = render({name: 'iskme.org', children: [{name: 'caf%C3%A9'}]});
    dispatch(pathByUrl(element, 'https://web.archive.org/web/20050630/iskme.org/caf%C3%A9'), 'mouseover');
    expect(element.querySelector('.sequence a').textContent).toBe('iskme.org/café');
  });

  it('should show breadcrumbs on touchstart and prevent default navigation', () => {
    const element = render();
    const url = 'https://web.archive.org/web/20050630/iskme.org/contact';
    const link = pathByUrl(element, url).parentNode;
    const evt = new window.Event('touchstart', {bubbles: true, cancelable: true});
    link.dispatchEvent(evt);

    expect(evt.defaultPrevented).toBe(true);
    expect(element.querySelector('.sequence a').getAttribute('href')).toBe(url);
  });

  it('should clear breadcrumbs and restore opacity on mouseleave', async () => {
    const element = render();
    const path = pathByUrl(element, 'https://web.archive.org/web/20050630/iskme.org/contact');
    dispatch(path, 'mouseover');
    dispatch(element.querySelector('#d3_container'), 'mouseleave');

    expect(element.querySelector('.sequence').innerHTML).toBe('');

    await new Promise(resolve => setTimeout(resolve, 500));
    const paths = Array.from(element.querySelectorAll('#d3_container > a > path'));
    paths.forEach(p => expect(p.style.opacity).toBe('1'));

    // mouseover is re-enabled once the transition ends
    dispatch(path, 'mouseover');
    expect(element.querySelector('.sequence a')).not.toBeNull();
  });

  describe('legend', () => {
    it('should list top-level sub-pages ordered by number of leaves', () => {
      const element = render();
      const legend = element.querySelector('.rt-legend');
      const texts = Array.from(legend.querySelectorAll('text')).map(t => t.textContent);
      expect(texts).toEqual(['Top unique sub-pages', '/about-us (2)', '/contact (1)']);
      expect(legend.getAttribute('transform')).toBe(`translate(${radius + 20}, ${-height / 2 + 8})`);
    });

    it('should limit legend to 20 items and truncate long names', () => {
      const children = Array.from({length: 25}, (_, i) => ({
        name: `a-very-long-page-name-${String(i).padStart(2, '0')}`,
        children: Array.from({length: 25 - i}, (_, j) => ({name: `leaf-${j}`})),
      }));
      const element = render({name: 'iskme.org', children});
      const rows = Array.from(element.querySelectorAll('.rt-legend > g text')).map(t => t.textContent);

      expect(rows).toHaveLength(20);
      expect(rows[0]).toBe('/a-very-long-page… (25)');
      expect(rows[19]).toBe('/a-very-long-page… (6)');
    });

    it('should not truncate names of 16 characters or fewer', () => {
      const element = render({name: 'iskme.org', children: [{name: 'exactly-16-chars'}]});
      expect(element.querySelector('.rt-legend > g text').textContent).toBe('/exactly-16-chars (1)');
    });
  });
});
