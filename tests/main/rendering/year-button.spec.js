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

  it('should use singular URL in title for one URL', () => {
    expect(renderYearButton('2018', 1, 'iskme.org').title)
      .toBe('View 1 unique URL of iskme.org from 2018');
  });

  it('should render button without title when count or host is missing', () => {
    expect(renderYearButton('2005').title).toBe('');
    expect(renderYearButton('2005', 3).title).toBe('');
    expect(renderYearButton('2005', undefined, 'iskme.org').title).toBe('');
  });

  it('should render disabled empty button for zero count', () => {
    const btn = renderYearButton('2005', 0, 'iskme.org', 10);
    expect(btn.disabled).toBe(true);
    expect(btn.classList.contains('year-btn-empty')).toBe(true);
    expect(btn.title).toBe('No captures of iskme.org from 2005');
    expect(btn.querySelector('.year-btn-bar')).toBeNull();
  });

  it('should render volume bar scaled to max count', () => {
    const bar = count => renderYearButton('2005', count, 'iskme.org', 600).querySelector('.year-btn-bar');
    expect(bar(600).style.height).toBe('6px');
    expect(bar(300).style.height).toBe('3px');
    // tiny years still get a visible bar
    expect(bar(1).style.height).toBe('1px');
  });

  it('should not render volume bar without counts', () => {
    expect(renderYearButton('2005').querySelector('.year-btn-bar')).toBeNull();
    expect(renderYearButton('2005', 3, 'iskme.org').querySelector('.year-btn-bar')).toBeNull();
  });

  it('should keep year as text content with volume bar', () => {
    expect(renderYearButton('2005', 3, 'iskme.org', 3).textContent).toBe('2005');
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

  it('should scale volume bars to the busiest year', () => {
    const urlsByYear = {2003: [['2003', 'a']], 2004: [['2004', 'a'], ['2004', 'b']]};
    renderYearButtons(element, ['2003', '2004'], () => {}, urlsByYear, 'iskme.org');

    const heights = Array.from(element.querySelectorAll('.year-btn-bar')).map(b => b.style.height);
    expect(heights).toEqual(['3px', '6px']);
  });

  it('should render disabled buttons for years without captures', () => {
    const urlsByYear = {2003: [['2003', 'a']], 2006: [['2006', 'a']]};
    renderYearButtons(element, ['2003', '2006'], () => {}, urlsByYear, 'iskme.org');

    const buttons = Array.from(element.querySelectorAll('.year-btn'));
    expect(buttons.map(b => b.id)).toEqual(['2003', '2004', '2005', '2006']);
    expect(buttons.map(b => b.disabled)).toEqual([false, true, true, false]);
    expect(buttons[1].title).toBe('No captures of iskme.org from 2004');
  });

  it('should fill year gaps even without urlsByYear', () => {
    renderYearButtons(element, ['2003', '2005'], () => {});
    const buttons = Array.from(element.querySelectorAll('.year-btn'));
    expect(buttons.map(b => b.id)).toEqual(['2003', '2004', '2005']);
    expect(buttons[1].disabled).toBe(true);
  });

  it('should not fill gaps between non-numeric years', () => {
    renderYearButtons(element, ['2003', 'abcd'], () => {});
    expect(Array.from(element.querySelectorAll('.year-btn')).map(b => b.id)).toEqual(['2003', 'abcd']);
  });

  it('should select year when clicking the volume bar', () => {
    const onYearSelect = jest.fn();
    renderYearButtons(element, ['2003'], onYearSelect, {2003: [['2003', 'a']]}, 'iskme.org');

    element.querySelector('.year-btn-bar').click();
    expect(onYearSelect).toHaveBeenCalledWith('2003');
  });

  it('should ignore clicks on empty years and outside buttons', () => {
    const onYearSelect = jest.fn();
    renderYearButtons(element, ['2003', '2005'], onYearSelect);

    // disabled buttons don't fire click, so dispatch it on the container directly
    const empty = element.querySelector('[id="2004"]');
    element.querySelector('.div-btn').onclick({target: empty});
    element.querySelector('.div-btn').click();
    expect(onYearSelect).not.toHaveBeenCalled();
  });
});
