/*!
 * line-chart.js — draws a line chart from the table that sits next to it, at the width the chart really has (so the text is always 12 px,
 * on a phone and on a wide screen, and one drawing replaces a "narrow" and a "wide" copy). The numbers stay in the page: the sr-only table is the
 * data, and this file only turns it into SVG. Hover, tap and arrow-key reading come from charts.js (it reads the .pt / .hit / data-tip markup written here).
 *
 * Reads these hooks:
 *   <div class="chart" data-line-chart …>   the chart; the sr-only table must be the next element after it
 *     data-y-max, data-y-step        top and step of the value axis (a grid line at every step from 0)
 *     data-y-format="peso" | "qty"   peso: ₱0, ₱5K, ₱12.5K …  qty: plain numbers, with as many decimals as the step needs
 *     data-summary                   one sentence for screen readers (the svg's aria-label)
 *     data-ref, data-ref-label       optional dashed reference line (for example the 7-day average) and its label
 *   the table: each body row is <th scope="row">label</th><td>value text</td> [<td>more text</td>] — the number is read from the first <td>;
 *   the tooltip is the row label and every cell, joined with " · " (for example "Nov 3 · ₱20,840 · 140 orders").
 * Used by: demand.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;
  var NS = 'http://www.w3.org/2000/svg', H = 260, L = 52, R = 16, T = 14, B = 34;

  /** Escapes text for use inside an attribute. */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /** The rows of the chart's table: label, value and tooltip text. */
  function readTable(chart) {
    var table = chart.nextElementSibling && chart.nextElementSibling.querySelector('table'); if (!table) return [];
    return $$('tbody tr', table).map(function (tr) {
      var cells = $$('td', tr).map(function (td) { return td.textContent.trim(); }), label = $('th', tr).textContent.trim();
      return { label: label, value: parseFloat(cells[0].replace(/[^0-9.\-]/g, '')), tip: [label].concat(cells).join(' · ') };
    });
  }

  /** Axis label for a value: ₱5K style for pesos, plain numbers for quantities. */
  function axisText(v, format, step) {
    if (format === 'peso') return v === 0 ? '₱0' : v >= 1000 ? '₱' + +(v / 1000).toFixed(1) + 'K' : '₱' + v;
    var d = Number.isInteger(step) ? 0 : (Math.round(step * 10) === step * 10 ? 1 : 2);
    return v.toFixed(d);
  }

  /** Draws (or redraws) one chart at its current width. */
  function draw(chart) {
    var w = Math.round(chart.clientWidth); if (w < 120) return;           // hidden (a closed tab) or not laid out yet: ResizeObserver calls again
    if (chart._w === w) return; chart._w = w;
    var pts = readTable(chart); if (pts.length < 2) return;
    var yMax = Number(chart.getAttribute('data-y-max')), step = Number(chart.getAttribute('data-y-step')), fmt = chart.getAttribute('data-y-format');
    var iw = w - L - R, ih = H - T - B, n = pts.length, dotR = n > 14 ? 3 : n > 7 ? 4 : 5;
    function x(i) { return (L + i * iw / (n - 1)).toFixed(1); }
    function y(v) { return (T + ih - v / yMax * ih).toFixed(1); }
    var every = Math.ceil(n / (w < 450 ? 4 : 6)), s = '';
    for (var v = 0; v <= yMax + 1e-9; v += step) {
      s += '<line class="' + (v === 0 ? 'axis' : 'grid') + '" x1="' + L + '" x2="' + (w - R) + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text x="' + (L - 8) + '" y="' + (+y(v) + 4).toFixed(1) + '" text-anchor="end">' + axisText(v, fmt, step) + '</text>';
    }
    pts.forEach(function (p, i) {
      if ((n - 1 - i) % every === 0) s += '<text x="' + x(i) + '" y="' + (H - 10) + '" text-anchor="' + (i === n - 1 ? 'end' : i === 0 ? 'start' : 'middle') + '">' + esc(p.label) + '</text>';
    });
    var ref = chart.getAttribute('data-ref');
    if (ref) {
      s += '<line class="ref" x1="' + L + '" x2="' + (w - R) + '" y1="' + y(+ref) + '" y2="' + y(+ref) + '"/><text class="ref-label" x="' + (w - R) + '" y="' + (y(+ref) - 5).toFixed(1) + '" text-anchor="end">' + esc(chart.getAttribute('data-ref-label') || '') + '</text>';
    }
    s += '<path class="line" d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + x(i) + ' ' + y(p.value); }).join(' ') + '"/>';
    var hitW = iw / (n - 1);
    pts.forEach(function (p, i) {
      s += '<g class="pt"><line class="guide" x1="' + x(i) + '" x2="' + x(i) + '" y1="' + T + '" y2="' + (T + ih) + '"/><circle class="dot" cx="' + x(i) + '" cy="' + y(p.value) + '" r="' + dotR + '"/>' +
        '<rect class="hit" x="' + (L + i * hitW - hitW / 2).toFixed(1) + '" y="' + T + '" width="' + hitW.toFixed(1) + '" height="' + ih + '" data-tip="' + esc(p.tip) + '"/></g>';
    });
    var svg = $('svg', chart) || document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + H); svg.setAttribute('role', 'img'); svg.setAttribute('class', 'fill-w');
    svg.setAttribute('aria-label', chart.getAttribute('data-summary') || '');
    svg.innerHTML = s;
    if (!svg.parentNode) chart.insertBefore(svg, chart.firstChild);
    if (A.hideChartTip) A.hideChartTip();
  }

  var charts = $$('.chart[data-line-chart]');
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function (entries) { entries.forEach(function (e) { draw(e.target); }); });
    charts.forEach(function (c) { ro.observe(c); });
  } else {
    charts.forEach(draw); window.addEventListener('resize', function () { charts.forEach(draw); });
  }
})();
