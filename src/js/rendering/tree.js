import { arc as d3Arc } from 'd3-shape';
import { hierarchy, partition as d3Partition } from 'd3-hierarchy';
import { scaleOrdinal } from 'd3-scale';
import { schemePaired } from 'd3-scale-chromatic';
import { select } from 'd3-selection';
import 'd3-transition';

// share of the radius taken by the host circle in the center
const CENTER_RATIO = 0.3;
const CENTER_COLOR = '#f3f3f3';

const colors = scaleOrdinal(schemePaired);

/**
 * Render d3.hierarchy from passed hierarchical data
 *
 * The host is drawn as a neutral circle in the center and its sub-pages as
 * rings of equal width around it.
 *
 * @param element
 * @param vis
 * @param radius
 * @param baseURL
 * @param currentYear
 * @param data
 */
export function createVisualization (element, vis, radius, baseURL, currentYear, data, height) {
  // count every captured URL, including pages that also have sub-pages
  const root = hierarchy(data)
    .sum(d => d.urlCount || 0)
    .sort((a, b) => b.value - a.value);

  const nodes = d3Partition().size([2 * Math.PI, 1])(root).descendants();
  const sequenceEl = element.querySelector('.sequence');

  const centerRadius = radius * CENTER_RATIO;
  const ringWidth = (radius - centerRadius) / Math.max(1, root.height);
  const arc = d3Arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.depth ? centerRadius + (d.depth - 1) * ringWidth : 0)
    .outerRadius(d => d.depth ? centerRadius + d.depth * ringWidth : centerRadius);

  // Cache per-node data used during hover to keep interaction snappy.
  // (Ancestors()/reverse()/join() inside mousemove-style handlers gets expensive quickly.)
  for (const d of nodes) {
    const anc = d.ancestors();
    const parts = [];
    for (let i = anc.length - 1; i >= 0; i--) parts.push(anc[i].data.name);
    const path = parts.join('/');

    d._wb = {
      breadcrumbText: path,
      url: `${baseURL}/web/${currentYear}0630/${path}`,
      ancestors: anc
    };
  }

  const pathSel = vis.selectAll('path')
    .data(nodes)
    .enter()
    .append('a')
    .attr('class', d => d.depth ? null : 'rt-center')
    .attr('xlink:href', d => d._wb.url)
    .on('touchstart', touchStart)
    .append('svg:path')
    .attr('d', arc)
    .attr('fill-rule', 'evenodd')
    .style('fill', d => d.depth ? colors((d.children ? d : d.parent).data.name) : CENTER_COLOR)
    .style('opacity', 1)
    .style('cursor', 'pointer')
    .on('mouseover', mouseover);

  vis.append('text')
    .attr('class', 'rt-center-label')
    .attr('text-anchor', 'middle')
    .attr('dy', '-0.2em')
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .text(truncate(safeDecodeURIComponent(root.data.name || ''), 18));
  vis.append('text')
    .attr('class', 'rt-center-value')
    .attr('text-anchor', 'middle')
    .attr('dy', '1.1em')
    .style('font-size', '12px')
    .style('fill', '#666')
    .style('pointer-events', 'none')
    .text(`${root.value} unique ${root.value === 1 ? 'URL' : 'URLs'} from ${currentYear}`);

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
    const { ancestors, url } = d._wb;
    updateBreadcrumbs(d, url);

    pathSel.style('opacity', 0.3);

    const highlight = new Set(ancestors);
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
    // Build the link via DOM APIs: urlkeys come from crawled URLs, so the
    // decoded text must never be parsed as HTML.
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.textContent = safeDecodeURIComponent(d._wb.breadcrumbText);
    sequenceEl.innerHTML = '';
    sequenceEl.appendChild(link);
  }

  const legendNodes = nodes
    .filter(d => d.depth === 1)
    .sort((a, b) => b.value - a.value);
  renderLegend(vis, radius, height, legendNodes);
}

function safeDecodeURIComponent (str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    // malformed escape sequence, e.g. a literal '%'
    return str;
  }
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
