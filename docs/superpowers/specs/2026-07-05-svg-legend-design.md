# SVG Legend for First-Level Pages

**Date:** 2026-07-05
**Status:** Approved

## Summary

Add a static SVG legend to the right of the radial arc showing the first level of pages (depth=2 nodes in the partitioned tree) and their capture frequency.

## Behaviour

- The legend is purely informational — no hover interaction.
- Items are the depth=2 nodes (top-level path segments under the domain root), sorted descending by `.value` (number of leaf URL captures beneath each segment).
- Items are capped at `floor(height / 20)` rows so they never overflow the SVG bounds.
- Each row shows: a colored swatch, the path segment name (truncated to 16 chars with "…" if longer), and the numeric count.
- Colors match the arc fills: `colors(d.data.name)` from the same `scaleOrdinal(schemePaired)` scale already used in `tree.js`.
- The legend re-renders on every year change (same lifecycle as the arcs — `#chart` is cleared and rebuilt each time).

## Layout

- SVG width becomes `width + 180`; height stays `width`.
- The `d3_container` group remains translated to `(width/2, height/2)` — arc positioning is unchanged.
- The legend `<g class="rt-legend">` is appended inside `vis` (the `d3_container` group) at:
  - x = `radius + 20` (just right of the circle's outer edge)
  - y = `-height/2 + 8` (top-aligned within the SVG)
- Row height: 20 px. Swatch: 12×12 `<rect>`. Name `<text>`: `dx=16`, `dy=11` relative to row origin. Count `<text>`: right-aligned at x = 160 relative to row origin.

## Code Changes

### `src/js/rendering/tree.js`

1. After `partition(root).descendants()`, collect depth=2 nodes:
   ```js
   const legendNodes = nodes
     .filter(d => d.depth === 2)
     .sort((a, b) => b.value - a.value);
   ```
2. Add a `renderLegend(vis, radius, height, legendNodes)` function in the same file.
3. Call `renderLegend` at the end of `createVisualization`.
4. `createVisualization` signature gains a `height` parameter.

### `renderLegend` function

```
renderLegend(vis, radius, height, nodes)
  const maxItems = Math.floor(height / 20)
  const items = nodes.slice(0, maxItems)
  const g = vis.append('g').attr('class', 'rt-legend')
               .attr('transform', `translate(${radius + 20}, ${-height/2 + 8})`)
  for each item at index i:
    const row = g.append('g').attr('transform', `translate(0, ${i * 20})`)
    row.append('rect') width=12 height=12 fill=colors(d.data.name)
    row.append('text') dx=16 dy=11  text=truncate(d.data.name, 16)
    row.append('text') x=160 dy=11 text-anchor=end  text=d.value
```

### `src/js/index.js`

1. Pass `height` into `createVisualization(element, vis, radius, baseURL, currentYear, hierarchy, height)`.
2. Set SVG width to `width + 180` while keeping height at `width`.

## Out of Scope

- Legend interactivity (hover highlight, click-to-filter).
- Scrolling for overflowed legend items (capped by row count instead).
- CSS file changes.
