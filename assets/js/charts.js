/*!
 * charts.js — chart hover and keyboard reading. It copies the text that is already in the markup; it never draws a chart or holds a number.
 *
 * Every point or bar is <g class="pt"> … <rect class="hit" data-tip="Nov 3 · ₱20,840 · 140 orders"> … </g> and the chart holds ONE
 * <div class="chart-tip" hidden></div>. The look (growing point, guide line, brighter bar, fade) is CSS; this code adds "is-active" to the
 * hovered .pt and "is-on" to the tip.
 *
 * Reads these hooks:
 *   .chart                     the focusable chart wrapper (one tab stop; Left/Right/Home/End step through the points, Escape hides the tip)
 *   .hit[data-tip]             a transparent hit area; its data-tip is the tooltip text
 *   .chart-tip                 the tip element of that chart
 *   data-start-last            on .chart: keyboard reading starts at the last point
 * Mouse: hover. Touch: tap (stays until you tap elsewhere). Used by: dashboard, demand, inventory, supplier-detail, reports.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;
  var current = null;                                  // { chart, hit } of the point that is showing

  /** The hit areas that are visible in the current layout. */
  function visibleHits(chart) { return $$('.hit[data-tip]', chart).filter(function (h) { return h.getBoundingClientRect().width > 0; }); }

  /** Hides the tooltip that is showing. */
  function hide() {
    if (!current) return;
    (current.hit.closest('.pt') || current.hit).classList.remove('is-active');
    var tip = $('.chart-tip', current.chart); if (tip) { tip.classList.remove('is-on'); tip.hidden = true; }
    current = null;
  }
  A.hideChartTip = hide;

  /** Shows the tooltip of a hit area, anchored on its bar or dot, kept inside the chart. */
  function show(chart, hit) {
    var tip = $('.chart-tip', chart); if (!tip) return;
    if (current && current.hit === hit) return;
    var wasOn = !!current && current.chart === chart;
    hide();
    current = { chart: chart, hit: hit };
    var pt = hit.closest('.pt') || hit; pt.classList.add('is-active');
    tip.textContent = hit.getAttribute('data-tip'); tip.hidden = false;
    var mark = (pt && pt.querySelector('.bar, .bar-partial, .dot-hover, .dot')) || hit;
    var c = chart.getBoundingClientRect(), m = mark.getBoundingClientRect();
    var ax = m.left + m.width / 2 - c.left, top = m.top - c.top, bottom = m.bottom - c.top, w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(w / 2 + 2, Math.min(ax, c.width - w / 2 - 2));
    var below = top - h - 10 < 0, inBar = /\bbar/.test(mark.getAttribute('class') || '');
    tip.classList.toggle('is-below', below);
    tip.style.left = left + 'px';
    tip.style.top = (below ? (inBar ? top + 8 : bottom + 10) : top - 10) + 'px';
    if (wasOn) tip.classList.add('is-on'); else { void tip.offsetWidth; tip.classList.add('is-on'); }
  }
  A.showChartTip = show;

  document.addEventListener('pointerover', function (e) {
    var hit = e.target.closest && e.target.closest('.chart .hit[data-tip]'); if (hit) show(hit.closest('.chart'), hit);
  });
  document.addEventListener('pointerout', function (e) {
    if (e.pointerType !== 'mouse' || !current) return;
    var to = e.relatedTarget; if (!to || !to.closest || to.closest('.chart') !== current.chart) hide();
  });
  document.addEventListener('pointerdown', function (e) {
    if (current && !(e.target.closest && e.target.closest('.chart') === current.chart)) hide();
  });
  document.addEventListener('focusin', function (e) {
    var chart = e.target.matches && e.target.matches('.chart') ? e.target : null;
    if (chart && chart.matches(':focus-visible')) {
      var hs = visibleHits(chart); if (hs.length) show(chart, chart.hasAttribute('data-start-last') ? hs[hs.length - 1] : hs[0]);
    }
  });
  document.addEventListener('focusout', function (e) { if (e.target.matches && e.target.matches('.chart')) hide(); });

  /** Keyboard: arrows step through the points; a heat-map (data-step-x) jumps a week column with Left/Right. */
  document.addEventListener('keydown', function (e) {
    var chart = e.target.matches && e.target.matches('.chart') ? e.target : null; if (!chart) return;
    if (e.key === 'Escape') { hide(); return; }
    var hs = visibleHits(chart), i = current ? hs.indexOf(current.hit) : -1, n = hs.length; if (!n) return;
    var sx = Number(chart.getAttribute('data-step-x')) || 1;
    if (i < 0 && chart.hasAttribute('data-start-last')) i = n - 1;
    var next = { ArrowRight: i + sx, ArrowDown: i + 1, ArrowLeft: i - sx, ArrowUp: i - 1, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    var to = hs[Math.max(0, Math.min(n - 1, next))];
    e.preventDefault();
    if (to.scrollIntoView) to.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    show(chart, to);
  });
  window.addEventListener('resize', hide);
})();
