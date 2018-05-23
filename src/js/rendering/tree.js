import * as d3 from 'd3';

const arc = d3.arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1));

const colors = d3.scaleOrdinal(d3.schemePaired);

/**
 * Render d3.hierarchy from passed hierarchical data
 *
 * @param element
 * @param vis
 * @param radius
 * @param baseURL
 * @param currentYear
 * @param data
 */
export function createVisualization(element, vis, radius, baseURL, currentYear, data) {
  let partition = d3.partition()
    .size([2 * Math.PI, radius * radius]);

  //append 'root' we will exclude it on rendering
  let root = d3.hierarchy({children: [data]})
    .sum(d => !d.children)
    .sort((a, b) => b.value - a.value);

  let nodes = partition(root)
    .descendants();

  vis.selectAll('path')
    .data(nodes)
    .enter()
    .append('a')
    .attr('xlink:href', currentUrl)
    .on('touchstart', touchStart)
    .append('svg:path')
    .attr('display', d => d.depth ? null : 'none')
    .attr('d', arc)
    .attr('fill-rule', 'evenodd')
    .style('fill', d => colors((d.children ? d : d.parent).data.name))
    .style('opacity', 1)
    .style('cursor', 'pointer')
    .on('mouseover', mouseover);

  d3.select('#d3_container')
    .on('mouseleave', mouseleave);

  /** on mobile devices, touching the RadialTree prevents the ``click``
   *  event and shows the URL like on ``mouseover`` event. Users can click
   *  on the URL to visit the target page */
  function touchStart(d) {
    d3.event.preventDefault();
    d3.event.stopPropagation();
    mouseover(d);
    return false;
  }

  function currentUrl(d) {
    const anc = d.ancestors().reverse();
    let url = '';
    for (let i = 1; i < anc.length; i++) {
      if (anc[i].data.name === 'end') {
        break;
      }
      url = url + '/' + anc[i].data.name;
    }
    return `${baseURL}/web/${currentYear}0630${url}`;
  }

  function mouseover(d) {
    let sequenceArray = d.ancestors().reverse();
    sequenceArray.shift();
    let url = currentUrl(d);
    updateBreadcrumbs(sequenceArray, url);
    d3.selectAll('path').style('opacity', 0.3);

    vis
      .selectAll('path')
      .filter(node => sequenceArray.indexOf(node) >= 0)
      .style('opacity', 1);
  }

  function mouseleave() {
    element.querySelector('.sequence').innerHTML = '';

    d3.selectAll('path')
      .on('mouseover', null);

    d3.selectAll('path')
      .transition()
      .style('opacity', 1)
      .on('end', function () {
        d3.select(this).on('mouseover', mouseover);
      });
  }

  function updateBreadcrumbs(nodeArray, url) {
    let text = '';
    let symb = document.createElement('span');
    symb.setAttribute('class', 'symb');
    symb.innerHTML = '/';
    for (let i = 0; i < nodeArray.length; i++) {
      if (i === 0) {
        text = ' ' + nodeArray[i].data.name;
      } else {
        text = text + symb.innerHTML + nodeArray[i].data.name;
      }
    }
    text = decodeURIComponent(text);
    element.querySelector('.sequence').innerHTML = `<a href="${url}">${text}</a>`;
  }
}
