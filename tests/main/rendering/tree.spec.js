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


function leaves (n, prefix = 'leaf') {
  return Array.from({length: n}, (_, i) => ({name: `${prefix}-${i}`}));
}

// one URL per page without sub-pages, unless the test data says otherwise
function withLeafCounts (node) {
  const children = node.children && node.children.map(withLeafCounts);
  const urlCount = node.urlCount !== undefined ? node.urlCount : (children ? undefined : 1);
  return {...node, urlCount, children};
}

function render (hierarchy = data) {
  const element = document.createElement('div');
  element.appendChild(renderContainer());
  document.body.appendChild(element);

  const vis = select('#chart')
    .append('svg:svg')
    .append('svg:g')
    .attr('id', 'd3_container');

  createVisualization(element, vis, radius, 'https://web.archive.org', '2005', withLeafCounts(hierarchy), height);
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

  it('should render a path per node with the host as center circle', () => {
    const element = render();
    expect(element.querySelectorAll('#d3_container > a > path')).toHaveLength(5);

    const center = element.querySelector('#d3_container > a.rt-center');
    expect(center.getAttributeNS(XLINK, 'href')).toBe('https://web.archive.org/web/20050630/iskme.org');
    expect(center.querySelector('path').style.fill).toBe('#f3f3f3');
  });

  it('should label the center circle with host and number of URLs', () => {
    const element = render();
    expect(element.querySelector('.rt-center-label').textContent).toBe('iskme.org');
    expect(element.querySelector('.rt-center-value').textContent).toBe('3 unique URLs from 2005');
  });

  it('should count pages that also have sub-pages, including the host', () => {
    const element = render({
      name: 'iskme.org',
      urlCount: 1,
      children: [{
        name: 'about-us',
        urlCount: 1,
        children: [{name: 'about-iskme-1'}, {name: 'about-iskme-2'}],
      }, {
        name: 'contact',
      }],
    });
    expect(element.querySelector('.rt-center-value').textContent).toBe('5 unique URLs from 2005');
    const rows = Array.from(element.querySelectorAll('.rt-legend > g text')).map(t => t.textContent);
    expect(rows).toEqual(['/about-us (3)', '/contact (1)']);
  });

  it('should use singular URL in center label for one URL', () => {
    const element = render({name: 'iskme.org'});
    expect(element.querySelector('.rt-center-value').textContent).toBe('1 unique URL from 2005');
  });

  it('should truncate long host names in center label', () => {
    const element = render({name: 'a-very-long-host-name.example.org'});
    expect(element.querySelector('.rt-center-label').textContent).toBe('a-very-long-host-n…');
  });

  it('should draw host as fixed-size center and rings of equal width', () => {
    const element = render();
    const outer = url => {
      const link = Array.from(element.querySelectorAll('#d3_container > a'))
        .find(a => a.getAttributeNS(XLINK, 'href') === 'https://web.archive.org/web/20050630/' + url);
      return link.querySelector('path').getAttribute('d');
    };
    // radius 100: center 30, two rings of 35
    expect(outer('iskme.org')).toMatch(/^M0,-30A30,30/);
    expect(outer('iskme.org/contact')).toMatch(/A65,65/);
    expect(outer('iskme.org/about-us/about-iskme-1')).toMatch(/A100,100/);
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

  it('should show raw name in breadcrumbs when it is not valid url-encoding', () => {
    const element = render({name: 'iskme.org', children: [{name: '100%'}]});
    dispatch(pathByUrl(element, 'https://web.archive.org/web/20050630/iskme.org/100%'), 'mouseover');
    expect(element.querySelector('.sequence a').textContent).toBe('iskme.org/100%');
  });

  it('should not interpret decoded names in breadcrumbs as HTML', () => {
    const name = '%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E';
    const element = render({name: 'iskme.org', children: [{name}]});
    dispatch(pathByUrl(element, `https://web.archive.org/web/20050630/iskme.org/${name}`), 'mouseover');

    const sequence = element.querySelector('.sequence');
    expect(sequence.querySelector('img')).toBeNull();
    expect(sequence.children).toHaveLength(1);
    expect(sequence.querySelector('a').textContent).toBe('iskme.org/<img src=x onerror=alert(1)>');
  });

  it('should not break out of breadcrumb href with quotes in names', () => {
    const name = '"><img src=x>';
    const element = render({name: 'iskme.org', children: [{name}]});
    dispatch(element.querySelectorAll('#d3_container > a > path')[1], 'mouseover');

    const sequence = element.querySelector('.sequence');
    expect(sequence.querySelector('img')).toBeNull();
    expect(sequence.querySelector('a').getAttribute('href'))
      .toBe(`https://web.archive.org/web/20050630/iskme.org/${name}`);
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

  describe('colors', () => {
    function pathOf (element, url) {
      return Array.from(element.querySelectorAll('#d3_container > a'))
        .find(a => a.getAttributeNS(XLINK, 'href') === 'https://web.archive.org/web/20050630/' + url)
        .querySelector('path');
    }

    it('should give each section its own hue, biggest first', () => {
      const element = render();
      expect(pathOf(element, 'iskme.org/about-us').style.fill).toBe('#4e79a7');
      expect(pathOf(element, 'iskme.org/contact').style.fill).toBe('#f28e2c');
    });

    it('should draw sub-pages in a lighter tint of their section', () => {
      const element = render();
      expect(pathOf(element, 'iskme.org/about-us/about-iskme-1').style.fill).toBe('#698db4');
    });

    it('should cycle neighbouring sub-pages through different tints', () => {
      const element = render({name: 'iskme.org', children: [{name: 's', children: leaves(4)}]});
      const fills = [0, 1, 2, 3].map(i => pathOf(element, `iskme.org/s/leaf-${i}`).style.fill);
      // 15%, 35% and 0% white, then again
      expect(fills).toEqual(['#698db4', '#8ca8c6', '#4e79a7', '#698db4']);
    });

    it('should not cycle tints of top-level sections', () => {
      const element = render({name: 'iskme.org', children: leaves(3, 's')});
      // s-2 is the third section, so it gets the third hue untinted
      expect(pathOf(element, 'iskme.org/s-2').style.fill).toBe('#e15759');
    });

    it('should cap how light deep rings get', () => {
      const element = render({name: 'iskme.org', children: [{name: 'a', children: [{name: 'b', children: [
        {name: 'c', children: [{name: 'd', children: [{name: 'e'}]}]},
      ]}]}]});
      // 4e79a7 mixed with 45% white
      expect(pathOf(element, 'iskme.org/a/b/c/d/e').style.fill).toBe('#9eb5cf');
    });

    it('should share a neutral color among sections after the ninth', () => {
      const children = Array.from({length: 11}, (_, i) => ({name: `s${i}`, children: leaves(20 - i)}));
      const element = render({name: 'iskme.org', children});
      expect(pathOf(element, 'iskme.org/s8').style.fill).toBe('#9c755f');
      expect(pathOf(element, 'iskme.org/s9').style.fill).toBe('#bab0ab');
      expect(pathOf(element, 'iskme.org/s10').style.fill).toBe('#bab0ab');
    });

    it('should use section colors in the legend', () => {
      const element = render();
      const swatches = Array.from(element.querySelectorAll('.rt-legend > g rect')).map(r => r.getAttribute('fill'));
      expect(swatches).toEqual(['#4e79a7', '#f28e2c']);
    });
  });

  describe('separators', () => {
    function strokeWidth (element, url) {
      return Array.from(element.querySelectorAll('#d3_container > a'))
        .find(a => a.getAttributeNS(XLINK, 'href') === 'https://web.archive.org/web/20050630/' + url)
        .querySelector('path').style.strokeWidth;
    }

    it('should separate sections with bold white lines and sub-pages with thin ones', () => {
      const element = render();
      expect(element.querySelector('.rt-center path').style.strokeWidth).toBe('0');
      expect(strokeWidth(element, 'iskme.org/about-us')).toBe('1.5');
      expect(strokeWidth(element, 'iskme.org/about-us/about-iskme-1')).toBe('0.5');
      expect(element.querySelector('#d3_container > a > path').style.stroke).toBe('#fff');
    });

    it('should not separate segments too narrow to show their color otherwise', () => {
      // 200 pages of one URL each: 1.8° or about 3px at the outer edge
      const element = render({name: 'iskme.org', children: [{name: 'big', children: leaves(200)}]});
      expect(strokeWidth(element, 'iskme.org/big')).toBe('1.5');
      expect(strokeWidth(element, 'iskme.org/big/leaf-0')).toBe('0');
    });
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

    it('should not render legend when there are no sub-pages', () => {
      const element = render({name: 'iskme.org'});
      expect(element.querySelector('.rt-legend')).toBeNull();
      expect(element.querySelector('#rt-legend-shadow')).toBeNull();
    });

    it('should not truncate names of 16 characters or fewer', () => {
      const element = render({name: 'iskme.org', children: [{name: 'exactly-16-chars'}]});
      expect(element.querySelector('.rt-legend > g text').textContent).toBe('/exactly-16-chars (1)');
    });
  });
});
