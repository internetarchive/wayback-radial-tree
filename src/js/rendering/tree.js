import { arc as d3Arc } from 'd3-shape';
import { hierarchy, partition as d3Partition } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import { select } from 'd3-selection';
import 'd3-transition';

const arc = d3Arc()
  .startAngle(d => d.x0)
  .endAngle(d => d.x1)
  .innerRadius(d => Math.sqrt(d.y0))
  .outerRadius(d => Math.sqrt(d.y1));

const colors = scaleOrdinal(schemePaired);

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
export function createVisualization (element, vis, radius, baseURL, currentYear, data, height) {
  const partition = d3Partition().size([2 * Math.PI, radius * radius]);

  // append 'root' we will exclude it on rendering
  const root = hierarchy({ children: [data] })
    .sum(d => !d.children)
    .sort((a, b) => b.value - a.value);

  const nodes = partition(root).descendants();
  const sequenceEl = element.querySelector('.sequence');

  // Cache per-node data used during hover to keep interaction snappy.
  // (Ancestors()/reverse()/join() inside mousemove-style handlers gets expensive quickly.)
  for (const d of nodes) {
    // Exclude the artificial root (depth 0) from the displayed breadcrumb/path.
    const anc = d.ancestors();
    const parts = [];
    for (let i = anc.length - 2; i >= 0; i--) parts.push(anc[i].data.name);
    const path = parts.join('/');

    d._wb = {
      breadcrumbText: parts.join('/'),
      url: `${baseURL}/web/${currentYear}0630/${path}`,
      ancestorsExcludingRoot: anc.slice(0, -1) // without the artificial root
    };
  }

  const pathSel = vis.selectAll('path')
    .data(nodes)
    .enter()
    .append('a')
    .attr('xlink:href', d => d._wb.url)
    .on('touchstart', touchStart)
    .append('svg:path')
    .attr('display', d => d.depth ? null : 'none')
    .attr('d', arc)
    .attr('fill-rule', 'evenodd')
    .style('fill', d => colors((d.children ? d : d.parent).data.name))
    .style('opacity', 1)
    .style('cursor', 'pointer')
    .on('mouseover', mouseover);

  select('#d3_container')
    .on('mouseleave', mouseleave);

  /** on mobile devices, touching the RadialTree prevents the ``click``
   *  event and shows the URL like on ``mouseover`` event. Users can click
   *  on the URL to visit the target page */
  function touchStart (e, d) {
    e.preventDefault();
    e.stopPropagation();
    mouseover(e, d);
    return false;
  }

  function mouseover (e, d) {
    const { ancestorsExcludingRoot, url } = d._wb;
    updateBreadcrumbs(d, url);

    pathSel.style('opacity', 0.3);

    const highlight = new Set(ancestorsExcludingRoot);
    pathSel
      .filter(node => highlight.has(node))
      .style('opacity', 1);
  }

  function mouseleave () {
    sequenceEl.innerHTML = '';

    pathSel
      .on('mouseover', null);

    pathSel
      .transition()
      .style('opacity', 1)
      .on('end', function () {
        select(this).on('mouseover', mouseover);
      });
  }

  function updateBreadcrumbs(d, url) {
    const text = d._wb.breadcrumbText;
    sequenceEl.innerHTML = `<a href="${url}">${decodeURIComponent(text)}</a>`;
  }

  const legendNodes = nodes
    .filter(d => d.depth === 2)
    .sort((a, b) => b.value - a.value);
  renderLegend(vis, radius, height, legendNodes);
}

function truncate (str, max) {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

function renderLegend (vis, radius, height, nodes) {
  const rowHeight = 24;
  const swatchSize = 14;
  const fontSize = '15px';
  const pad = 10;
  const boxWidth = 195;
  const items = nodes.slice(0, 20);
  const boxHeight = pad + 20 + 6 + items.length * rowHeight + pad;

  vis.append('defs').append('filter')
    .attr('id', 'rt-legend-shadow')
    .append('feDropShadow')
    .attr('dx', 2).attr('dy', 2)
    .attr('stdDeviation', 3)
    .attr('flood-opacity', 0.18);

  const g = vis.append('g')
    .attr('class', 'rt-legend')
    .attr('transform', `translate(${radius + 20}, ${-height / 2 + 8})`);

  g.append('rect')
    .attr('width', boxWidth)
    .attr('height', boxHeight)
    .attr('rx', 6).attr('ry', 6)
    .attr('fill', 'white')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 1)
    .attr('filter', 'url(#rt-legend-shadow)');

  g.append('text')
    .attr('dx', pad)
    .attr('dy', pad + 13)
    .style('font-size', '15px')
    .style('font-weight', 'bold')
    .text(`Top unique sub-pages`);

  items.forEach((d, i) => {
    const row = g.append('g').attr('transform', `translate(${pad}, ${pad + 26 + i * rowHeight})`);
    row.append('rect')
      .attr('width', swatchSize)
      .attr('height', swatchSize)
      .attr('fill', colors(d.data.name));
    row.append('text')
      .attr('dx', swatchSize + 5)
      .attr('dy', swatchSize / 2)
      .attr('dominant-baseline', 'central')
      .style('font-size', fontSize)
      .text(`/${truncate(d.data.name, 16)} (${d.value})`);
  });
}
