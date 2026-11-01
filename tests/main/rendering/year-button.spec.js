/**
 * @jest-environment jsdom
 */
import {getButtonByYear, getYearByBtn, renderYearButton} from '../../../src/js/rendering/year-button';
import {renderYearButtons} from '../../../src/js/rendering/year-button-container';
import {renderContainer} from '../../../src/js/rendering/container';


describe('year button', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render button with year as id and text', () => {
    const btn = renderYearButton('2005', 3, 'iskme.org');
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.className).toBe('year-btn');
    expect(btn.id).toBe('2005');
    expect(btn.textContent).toBe('2005');
    expect(btn.title).toBe('View 3 unique URLs of iskme.org from 2005');
  });

  it('should render button without title when count or host is missing', () => {
    expect(renderYearButton('2005').title).toBe('');
    expect(renderYearButton('2005', 3).title).toBe('');
    expect(renderYearButton('2005', undefined, 'iskme.org').title).toBe('');
  });

  it('should render title for zero count', () => {
    expect(renderYearButton('2005', 0, 'iskme.org').title)
      .toBe('View 0 unique URLs of iskme.org from 2005');
  });

  it('should get year from button', () => {
    expect(getYearByBtn(renderYearButton('2005'))).toBe('2005');
  });

  it('should find button by year in document', () => {
    const btn = renderYearButton('2005');
    document.body.appendChild(btn);
    expect(getButtonByYear(document.body, '2005')).toBe(btn);
    expect(getButtonByYear(document.body, '1999')).toBeNull();
  });
});

describe('renderYearButtons', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('div');
    element.appendChild(renderContainer());
    document.body.appendChild(element);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should render a button for each year with url counts', () => {
    const urlsByYear = {2003: [['2003', 'a']], 2004: [['2004', 'a'], ['2004', 'b']]};
    renderYearButtons(element, ['2003', '2004'], () => {}, urlsByYear, 'iskme.org');

    const buttons = element.querySelectorAll('.year-btn');
    expect(Array.from(buttons).map(b => b.id)).toEqual(['2003', '2004']);
    expect(buttons[1].title).toBe('View 2 unique URLs of iskme.org from 2004');
  });

  it('should render buttons without titles when urlsByYear is missing', () => {
    renderYearButtons(element, ['2003'], () => {});
    expect(element.querySelector('.year-btn').title).toBe('');
  });

  it('should not render buttons twice', () => {
    renderYearButtons(element, ['2003', '2004'], () => {});
    renderYearButtons(element, ['2003', '2004'], () => {});
    expect(element.querySelectorAll('.year-btn')).toHaveLength(2);
  });

  it('should call onYearSelect with year of clicked button', () => {
    const onYearSelect = jest.fn();
    renderYearButtons(element, ['2003', '2004'], onYearSelect);

    element.querySelector('[id="2004"]').click();
    expect(onYearSelect).toHaveBeenCalledWith('2004');
  });
});
