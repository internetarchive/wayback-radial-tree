/**
 * @jest-environment jsdom
 */
import {RadialTree} from '../../src/js';
import fixture from './processing/iskme-timemap-fixture.json';

const XLINK = 'http://www.w3.org/1999/xlink';


describe('RadialTree', () => {
  let element;

  beforeAll(() => {
    Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', {
      configurable: true,
      get () { return 400; },
    });
  });

  afterAll(() => {
    delete window.HTMLElement.prototype.offsetWidth;
  });

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  function chartUrls () {
    return Array.from(element.querySelectorAll('#d3_container > a'))
      .map(a => a.getAttributeNS(XLINK, 'href'));
  }

  it('should render container and a button per year', () => {
    RadialTree(element, fixture);
    expect(element.querySelector('.rt-content')).not.toBeNull();
    expect(Array.from(element.querySelectorAll('.year-btn')).map(b => b.id))
      .toEqual(['2003', '2004', '2005']);
    expect(element.querySelector('[id="2005"]').title)
      .toBe('View 3 unique URLs of iskme.org from 2005');
  });

  it('should select the last but one year by default', () => {
    RadialTree(element, fixture);
    expect(element.querySelector('.active-btn').id).toBe('2004');
    expect(chartUrls()).toContain('https://web.archive.org/web/20040630/iskme.org');
  });

  it('should select the only year when there is a single one', () => {
    RadialTree(element, [
      ['timestamp:4', 'urlkey'],
      ['2010', 'org,iskme)/'],
      ['2010', 'org,iskme)/about-us'],
    ]);
    expect(element.querySelector('.active-btn').id).toBe('2010');
  });

  it('should derive host for button titles from host-only urlkey', () => {
    RadialTree(element, [
      ['timestamp:4', 'urlkey'],
      ['2010', 'org,iskme)'],
      ['2010', 'org,iskme)/about-us'],
    ]);
    expect(element.querySelector('[id="2010"]').title)
      .toBe('View 2 unique URLs of iskme.org from 2010');
  });

  it('should render empty container when there are no captures', () => {
    expect(() => RadialTree(element, [['timestamp:4', 'urlkey']])).not.toThrow();
    expect(element.querySelector('.rt-content')).not.toBeNull();
    expect(element.querySelectorAll('.year-btn')).toHaveLength(0);
    expect(element.querySelector('#chart').innerHTML).toBe('');
  });

  it('should size svg from chart width plus legend', () => {
    RadialTree(element, fixture);
    const svg = element.querySelector('#chart svg');
    expect(svg.getAttribute('width')).toBe(String(400 + 230));
    expect(svg.getAttribute('height')).toBe('400');
    expect(element.querySelector('#d3_container').getAttribute('transform')).toBe('translate(200,200)');
  });

  it('should switch active year and re-render chart on button click', () => {
    RadialTree(element, fixture);
    element.querySelector('[id="2005"]').click();

    expect(element.querySelectorAll('.active-btn')).toHaveLength(1);
    expect(element.querySelector('.active-btn').id).toBe('2005');
    expect(element.querySelectorAll('#chart svg')).toHaveLength(1);
    expect(chartUrls()).toEqual(expect.arrayContaining([
      'https://web.archive.org/web/20050630/iskme.org/about-us',
      'https://web.archive.org/web/20050630/iskme.org/about-us/about-iskme',
    ]));
  });

  it('should clear breadcrumbs when switching year', () => {
    RadialTree(element, fixture);
    element.querySelector('.sequence').innerHTML = '<a>stale</a>';
    element.querySelector('[id="2003"]').click();
    expect(element.querySelector('.sequence').innerHTML).toBe('');
  });

  it('should use baseURL option', () => {
    RadialTree(element, fixture, {baseURL: 'http://localhost:8080'});
    expect(chartUrls()).toContain('http://localhost:8080/web/20040630/iskme.org');
  });
});
