/*!
 * calendar.js — ONE calendar component for the Sales calendar and the nine report calendars. It draws three views from one block of JSON:
 * Year (a heat-map of 365 days), Month (a week grid with a total or peak for each week) and, when the JSON has day details, Day (a card).
 * Every number on screen is added up here from the daily values; nothing else holds a figure.
 *
 * Page markup (one per calendar):
 *   <section class="cal card" id="cal-x" data-cal data-scale="good|warn" aria-labelledby="cal-x-title">
 *     <header> … title and lead … <div data-cal-controls></div> </header>
 *     <div class="card-body" data-cal-views></div>
 *     <script type="application/json" data-cal-data> { … } </script>
 *   </section>
 *
 * JSON contract (data-cal-data):
 *   name      "Portions sold"        used in the screen-reader texts ("Portions sold per day, …")
 *   start     "2025-11-07"           date of values[0]; the last value is `today`
 *   today     "2026-11-06"           last day with data (the frozen "now" of the sample)
 *   asOf      "11:30 AM"             optional: today is a partial day for this metric (shown as "to 11:30 AM")
 *   kind      "total" | "peak"       how days are combined for a week or a month: sum (a flow, e.g. sales) or highest (a day-end level)
 *   unit      "peso" | "count"       peso values are shown as ₱1,234 (₱18.5k in a month cell), counts as 1,234
 *   noun      "portions"             legend sentence: "darker means more portions"
 *   steps     [0, 40, 80, 120, 160]  lower bounds of colour steps c1 … c5 (c1 = under steps[1]); a value of 0 or less is c0 ("None")
 *   label     { one, many, zero? }   the tooltip text after the day: "155 portions sold"; `zero` replaces the whole text for 0 ("no wastage")
 *   values    [365 numbers]          one value per day, oldest first
 *   orders    [365 numbers]          optional (Sales): orders per day; the tooltip becomes "₱10,085 · 68 orders · avg ₱148"
 *   days      { "2026-11-06": { cancelled, cash, cashOrders, ewalletOrders, compare: { avg, n, basis: "day"|"by1130" },
 *                               hours: [[sales, orders] × 8 AM …], top: [[dish, quantity, sales] × 5] } }   optional: adds the Day view
 *   scale     "warn"                 optional: amber/red colour scale instead of green (same as data-scale on the section)
 *
 * Colour rule: c0 when value ≤ 0, else c = 1 + the number of steps[1..4] that the value reaches (so c5 from steps[4]).
 * Views are drawn when first opened. Hover and arrow-key reading of the heat-map come from charts.js (.hit[data-tip]).
 * Used by: the ten report pages with a calendar.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], WDL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var MOL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var CELL = 20, PITCH = 24, LEFT = 40, TOP = 44;     // heat-map: 20 px cells, 4 px gap; the month-name row is 44 px tall so each month link is a 44 px target
  var HOURS = ['8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM'];

  /* ---------- dates and text ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function parse(k) { return new Date(k + 'T00:00:00Z'); }
  function iso(d) { return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()); }
  function addDays(k, n) { return iso(new Date(parse(k).getTime() + n * 86400000)); }
  function dow(k) { return parse(k).getUTCDay(); }
  function n0(n) { return Math.round(n).toLocaleString('en-US'); }
  function peso(n) { return '₱' + n0(n); }
  function short(v) { return v >= 1000 ? (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(Math.round(v)); }
  function dm(k) { return MO[+k.slice(5, 7) - 1] + ' ' + +k.slice(8); }
  function wdm(k) { return WD[dow(k)] + ', ' + dm(k); }
  function full(k) { return WDL[dow(k)] + ', ' + MOL[+k.slice(5, 7) - 1] + ' ' + +k.slice(8) + ', ' + k.slice(0, 4); }
  function plural(n, one, many) { return n0(n) + ' ' + (n === 1 ? one : many); }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  /* ---------- one calendar ---------- */
  function Calendar(root) {
    var d = JSON.parse($('script[data-cal-data]', root).textContent);
    var self = { root: root, d: d, id: root.id, views: $('[data-cal-views]', root), panels: {} };
    var keys = [], i; for (i = 0; i < d.values.length; i++) keys.push(addDays(d.start, i));
    var byDay = {}; keys.forEach(function (k, j) { byDay[k] = j; });
    var peso_ = d.unit === 'peso', total = d.kind === 'total', hasDays = !!d.days;
    var monthKeys = []; keys.forEach(function (k) { var m = k.slice(0, 7); if (monthKeys.indexOf(m) < 0) monthKeys.push(m); });
    var dayKeys = hasDays ? Object.keys(d.days).sort().reverse() : [];

    function val(k) { return d.values[byDay[k]]; }
    function fmt(v) { return peso_ ? peso(v) : n0(v); }
    function fmtShort(v) { return peso_ ? short(v) : n0(v); }
    function step(v) { if (v <= 0) return 0; var c = 1; for (var s = 1; s < 5; s++) if (v >= d.steps[s]) c++; return c; }
    function combine(ks) { var a = ks.map(val); return total ? a.reduce(function (x, y) { return x + y; }, 0) : Math.max.apply(null, a); }
    function inData(k) { return byDay[k] !== undefined; }
    function monthDays(m) { return keys.filter(function (k) { return k.slice(0, 7) === m; }); }
    function best(ks) { return ks.reduce(function (a, k) { return val(k) > val(a) ? k : a; }, ks[0]); }
    function complete(m) { var ks = monthDays(m), y = +m.slice(0, 4), mo = +m.slice(5, 7); return ks.length === new Date(Date.UTC(y, mo, 0)).getUTCDate(); }

    /** Tooltip text of a day (the data-tip of a heat-map cell). */
    function tip(k) {
      var v = val(k), o = d.orders && d.orders[byDay[k]];
      if (o !== undefined) return wdm(k) + ' · ' + peso(v) + ' · ' + plural(o, 'order', 'orders') + ' · avg ' + peso(o ? v / o : 0);
      if (v === 0 && d.label.zero) return wdm(k) + ' · ' + d.label.zero;
      return wdm(k) + ' · ' + fmt(v) + ' ' + (v === 1 ? d.label.one : d.label.many);
    }

    /* ----- Year ----- */
    function legend() {
      var items = [], b = function (v) { return peso_ ? short(v) : n0(v); };
      if (d.values.some(function (v) { return v <= 0; })) items.push('<li><i class="sw c0"></i>None</li>');
      for (var c = 1; c <= 5; c++) items.push('<li><i class="sw c' + c + '"></i>' + (c === 1 ? 'Under ' + b(d.steps[1]) : b(d.steps[c - 1]) + '+') + '</li>');
      items.push('<li><i class="sw x"></i>No data yet</li>');
      return '<ul class="cal-legend" aria-label="Colour scale: darker means more ' + esc(d.noun) + (peso_ ? ' (₱)' : '') + '">' + items.join('') + '</ul>';
    }
    function yearSummary() {
      var tot = keys.reduce(function (a, k) { return a + val(k); }, 0), b = best(keys), full_ = monthKeys.filter(complete);
      var mAgg = function (m) { return combine(monthDays(m)); }, bm = full_.reduce(function (a, m) { return mAgg(m) > mAgg(a) ? m : a; }, full_[0]);
      var items;
      if (d.orders) {
        var ord = d.orders.reduce(function (x, y) { return x + y; }, 0), wa = WD.map(function (_, w) { var ks = keys.filter(function (k) { return dow(k) === w; }); return ks.reduce(function (a, k) { return a + val(k); }, 0) / ks.length; }), bw = wa.indexOf(Math.max.apply(null, wa));
        items = [['Sales, ' + keys.length + ' days', peso(tot)], ['Orders', n0(ord)], ['Average order', peso(tot / ord)], ['Best day', dm(b) + ' · ' + peso(val(b))], ['Best month', MOL[+bm.slice(5) - 1] + ' · ' + peso(mAgg(bm))], ['Busiest weekday', WDL[bw] + 's · avg ' + peso(wa[bw])]];
      } else {
        items = [[total ? 'Total, ' + keys.length + ' days' : 'Average, ' + keys.length + ' days', fmt(total ? tot : tot / keys.length)], [total ? 'Highest day' : 'Peak day', dm(b) + ' · ' + fmt(val(b))],
          ['Highest month', MOL[+bm.slice(5) - 1] + ' · ' + fmt(mAgg(bm))], [d.asOf ? 'Today, to ' + d.asOf : 'Today', fmt(val(d.today))]];
      }
      return '<ul class="cal-sum">' + items.map(function (x) { return '<li><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></li>'; }).join('') + '</ul>';
    }
    function yearSvg() {
      var origin = addDays(d.start, -dow(d.start)), col = function (k) { return Math.floor((parse(k) - parse(origin)) / 86400000 / 7); };
      var W = LEFT + (col(d.today) + 1) * PITCH + 12, H = TOP + 7 * PITCH - (PITCH - CELL), s = '<g class="cal-lab">', lastX = -99;
      monthKeys.forEach(function (m) {
        var first = keys.filter(function (k) { return k.slice(0, 7) === m; })[0], x = LEFT + col(first) * PITCH; if (x - lastX < 56) return; lastX = x;
        s += '<a href="#' + self.id + '" data-cal-go="month:' + m + '" aria-label="' + MO[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + ', open in the month view"><rect class="lab-hit" x="' + Math.max(0, x - 8) + '" y="0"/><text x="' + x + '" y="30">' + MO[+m.slice(5) - 1] + '</text></a>';
      });
      [1, 3, 5].forEach(function (w) { s += '<text x="0" y="' + (TOP + w * PITCH + 15) + '">' + WD[w] + '</text>'; });
      s += '</g><g class="cal-cells">';
      keys.forEach(function (k) { s += '<rect class="hit c' + step(val(k)) + (k === d.today ? ' now' : '') + '" x="' + (LEFT + col(k) * PITCH) + '" y="' + (TOP + dow(k) * PITCH) + '" width="' + CELL + '" height="' + CELL + '" data-tip="' + esc(tip(k)) + '"/>'; });
      return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="group" aria-label="' + esc(d.name) + ' per day, ' + dm(d.start) + ', ' + d.start.slice(0, 4) + ' to ' + dm(d.today) + ', ' + d.today.slice(0, 4) + '. The table below has the monthly figures.">' + s + '</g></svg>';
    }
    function yearPanel() {
      var rows = monthKeys.map(function (m) {
        var ks = monthDays(m); return '<tr><th scope="row">' + MO[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + '<td>' + fmt(combine(ks)) + (d.orders ? '<td>' + n0(ks.reduce(function (a, k) { return a + d.orders[byDay[k]]; }, 0)) : '');
      }).join('');
      return '<div data-cal-panel="year" id="' + self.id + '-y" tabindex="-1">' + yearSummary() +
        '<div class="chart cal-year" tabindex="0" role="region" data-step-x="7" data-start-last aria-label="' + esc(d.name) + ' per day, last 12 months. Scrolls sideways. Arrow keys move between days; Left and Right jump a week.">' +
        '<div class="cal-scroll" data-scroll-end>' + yearSvg() + '</div><div class="chart-tip" hidden></div>' +
        '<table class="sr-only"><caption>' + esc(d.name) + ' per month (' + (total ? 'total' : 'peak') + ')</caption><thead><tr><th>Month<th>' + (total ? 'Total' : 'Peak') + (d.orders ? '<th>Orders' : '') + '</thead><tbody>' + rows + '</tbody></table></div>' + legend() + '</div>';
    }

    /* ----- Month ----- */
    function monthPanel(m) {
      var ks = monthDays(m), y = +m.slice(0, 4), mo = +m.slice(5) - 1, last = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate(), cells = [], r, i2;
      for (i2 = 0; i2 < dow(m + '-01'); i2++) cells.push(null);
      for (i2 = 1; i2 <= last; i2++) cells.push(m + '-' + pad(i2));
      while (cells.length % 7) cells.push(null);
      var rows = '';
      for (r = 0; r < cells.length; r += 7) {
        var wk = cells.slice(r, r + 7), have = wk.filter(function (k) { return k && inData(k); }), tds = wk.map(function (k) {
          if (!k) return '<td class="p"></td>';
          if (!inData(k)) return '<td class="d x"><b>' + +k.slice(8) + '</b></td>';
          var v = val(k), cls = 'd c' + step(v) + (k === d.today ? ' now' : ''), label = dm(k) + ': ' + tip(k).split(' · ').slice(1).join(' · ') + (k === d.today && d.asOf ? ' (to ' + d.asOf + ')' : '');
          return hasDays ? '<td class="' + cls + '"><button type="button" data-cal-go="day:' + k + '" aria-label="' + esc(label) + '"><b>' + +k.slice(8) + '</b><i>' + fmtShort(v) + '</i></button></td>'
            : '<td class="' + cls + '"><b>' + +k.slice(8) + '</b><i>' + fmtShort(v) + '</i><span class="sr-only">' + esc(label) + '</span></td>';
        });
        rows += '<tr>' + tds.join('') + '<td class="w">' + (have.length ? '<span class="sr-only">Week ' + (total ? 'total' : 'peak') + ' </span>' + fmtShort(combine(have)) : '') + '</td></tr>\n';
      }
      var tot = combine(ks), b = best(ks), sum;
      if (d.orders) { var o = ks.reduce(function (a, k) { return a + d.orders[byDay[k]]; }, 0); sum = [['Sales', peso(tot)], ['Orders', n0(o)], ['Average order', peso(tot / o)], ['Best day', dm(b) + ' · ' + peso(val(b))]]; }
      else sum = [[total ? 'Month total' : 'Month peak', fmt(tot)], [total ? 'Average per day' : 'Average', fmt(ks.reduce(function (a, k) { return a + val(k); }, 0) / ks.length)], ['Highest day', dm(b) + ' · ' + fmt(val(b))]];
      var partial = ks[ks.length - 1] === d.today && !complete(m) && m === d.today.slice(0, 7);
      return '<div data-cal-panel="month" data-cal-key="' + m + '" tabindex="-1"><h3 class="cal-h">' + MOL[mo] + ' ' + y + (partial ? ' <span class="badge badge-slate">to ' + dm(d.today) + '</span>' : '') + '</h3>' +
        '<ul class="cal-sum">' + sum.map(function (x) { return '<li><span>' + x[0] + '</span><b>' + esc(x[1]) + '</b></li>'; }).join('') + '</ul>' +
        '<div class="cal-scroll"><table class="cal-month" data-cal-grid><caption class="sr-only">' + esc(d.name) + ' per day, ' + MOL[mo] + ' ' + y + '. Arrow keys move between days' + (hasDays ? '; Enter opens the day' : '') + '. The last column is the ' + (total ? 'total' : 'peak') + ' of each week.</caption>' +
        '<thead><tr>' + WD.map(function (w) { return '<th scope="col">' + w + '</th>'; }).join('') + '<th scope="col" class="w">Week</th></tr></thead><tbody>\n' + rows + '</tbody></table></div></div>';
    }

    /* ----- Day (Sales) ----- */
    function hoursSvg(k, e) {
      var n = e.hours.length, max = Math.max.apply(null, [1].concat(e.hours.map(function (h) { return h[0]; }))), bars = '', top = 0;
      e.hours.forEach(function (h, j) {
        var ht = Math.round(h[0] / max * 90); if (h[0] > e.hours[top][0]) top = j;
        bars += '<rect class="bar hit" x="' + (6 + j * 29) + '" y="' + (100 - ht) + '" height="' + Math.max(ht, 1) + '" data-tip="' + HOURS[j] + ' · ' + peso(h[0]) + ' · ' + plural(h[1], 'order', 'orders') + (k === d.today && j === n - 1 ? ' (to ' + d.asOf + ')' : '') + '"/>';
      });
      var lab = [0, 3, 6, 9].map(function (j) { return '<text x="' + (6 + j * 29 + 11) + '" y="116">' + HOURS[j].replace(' ', '') + '</text>'; }).join('');
      return '<svg class="cal-hours" viewBox="0 0 350 122" width="350" height="122" role="img" aria-label="Column chart, sales by hour from 8 AM to 8 PM"><line class="axis" x1="0" x2="350" y1="100.5" y2="100.5"/>' + bars +
        '<g class="cal-lab"><text x="' + (6 + top * 29 + 11) + '" y="' + (100 - Math.round(e.hours[top][0] / max * 90) - 4) + '" text-anchor="middle">' + short(e.hours[top][0]) + '</text>' + lab + '</g></svg>';
    }
    function dayPanel(k) {
      var e = d.days[k], v = val(k), o = d.orders[byDay[k]], now = k === d.today, c = e.compare, diff = c.avg ? Math.round((v - c.avg) / c.avg * 100) : 0;
      var dir = diff === 0 ? 'in line with' : Math.abs(diff) + '% ' + (diff > 0 ? 'above' : 'below'), wd = WDL[dow(k)];
      var cmp = c.basis === 'by1130' ? dir + ' the average ' + wd + ' by ' + d.asOf + ' (' + peso(c.avg) + ', last ' + c.n + ' ' + wd + 's)' : dir + ' the average ' + wd + ' (' + peso(c.avg) + ', the ' + c.n + ' ' + wd + 's before)';
      var ew = v - e.cash, pct = function (a) { return v ? Math.round(a / v * 100) : 0; };
      return '<div data-cal-panel="day" data-cal-key="' + k + '" tabindex="-1"><h3 class="cal-h">' + esc(full(k)) + (now ? ' <span class="badge badge-slate">to ' + d.asOf + '</span>' : '') + '</h3>' +
        '<dl class="cal-kpi"><div><dt>Sales</dt><dd>' + peso(v) + '</dd></div><div><dt>Orders</dt><dd>' + n0(o) + '</dd></div><div><dt>Average order</dt><dd>' + peso(o ? v / o : 0) + '</dd></div></dl>' +
        '<p class="cal-cmp"><span class="cal-arrow ' + (diff > 0 ? 'up' : diff < 0 ? 'down' : '') + '" aria-hidden="true">' + (diff > 0 ? '▲' : diff < 0 ? '▼' : '=') + '</span> ' + cmp + (e.cancelled ? ' · ' + plural(e.cancelled, 'cancelled order', 'cancelled orders') + ' not counted' : '') + '</p>' +
        '<div class="cal-2"><div class="min-w-0"><h4 class="cal-h4">Sales by hour</h4><div class="chart" tabindex="0" role="group" aria-label="Sales by hour on ' + esc(wdm(k)) + '. Arrow keys move between hours.">' + hoursSvg(k, e) + '<div class="chart-tip" hidden></div></div></div>' +
        '<div class="min-w-0"><h4 class="cal-h4">Best sellers</h4><ol class="cal-dishes">' + e.top.map(function (t) { return '<li><span>' + esc(t[0]) + '</span><b>' + t[1] + '</b><span>' + peso(t[2]) + '</span></li>'; }).join('') + '</ol>' +
        '<h4 class="cal-h4">Payment</h4><ul class="cal-pay"><li><span>Cash</span><b>' + peso(e.cash) + '</b><span>' + pct(e.cash) + '% · ' + plural(e.cashOrders, 'order', 'orders') + '</span></li><li><span>E-wallet</span><b>' + peso(ew) + '</b><span>' + pct(ew) + '% · ' + plural(e.ewalletOrders, 'order', 'orders') + '</span></li></ul></div></div></div>';
    }

    /* ----- views and controls ----- */
    function pick(kind, label, options) {
      return '<div class="cal-pick" data-cal-for="' + kind + '" hidden><button type="button" class="btn btn-secondary btn-sm" data-cal-step="older" aria-label="Previous ' + kind + '">‹</button><label class="sr-only" for="' + self.id + '-' + kind + '-sel">' + label +
        '</label><select id="' + self.id + '-' + kind + '-sel" class="input" data-cal-select="' + kind + '">' + options + '</select><button type="button" class="btn btn-secondary btn-sm" data-cal-step="newer" aria-label="Next ' + kind + '">›</button></div>';
    }
    var monthsNewest = monthKeys.slice().reverse();
    $('[data-cal-controls]', root).innerHTML = '<div class="seg" role="group" aria-label="Calendar view"><button type="button" data-cal-tab="year" aria-pressed="true">Year</button><button type="button" data-cal-tab="month" aria-pressed="false">Month</button>' +
      (hasDays ? '<button type="button" data-cal-tab="day" aria-pressed="false">Day</button>' : '') + '</div>' +
      pick('month', 'Month', monthsNewest.map(function (m, j) { return '<option value="' + m + '"' + (j ? '' : ' selected') + '>' + MOL[+m.slice(5) - 1] + ' ' + m.slice(0, 4) + '</option>'; }).join('')) +
      (hasDays ? pick('day', 'Day', dayKeys.map(function (k, j) { return '<option value="' + k + '"' + (j ? '' : ' selected') + '>' + wdm(k) + (k === d.today ? ' (today)' : '') + '</option>'; }).join('')) : '');

    /** The panel of a view, drawn the first time it is needed. A day without details gets the "older" note. */
    function panel(view, key, label) {
      var id = view + ':' + (key || ''), html;
      if (view === 'day' && !d.days[key]) { id = 'day:older'; key = 'older'; }
      if (self.panels[id]) { if (key === 'older' && label) $('[data-cal-label]', self.panels[id]).textContent = label; return self.panels[id]; }
      if (view === 'year') html = yearPanel();
      else if (view === 'month') html = monthPanel(key);
      else if (key === 'older') html = '<div data-cal-panel="day" data-cal-key="older" tabindex="-1"><h3 class="cal-h"><span data-cal-label>' + esc(label || 'Older day') + '</span></h3><p class="cal-note">Day details are shown for the last ' + dayKeys.length + ' days. Use the month view for the figures of this day.</p></div>';
      else html = dayPanel(key);
      var t = document.createElement('template'); t.innerHTML = html.trim(); var el = t.content.firstElementChild; el.hidden = true;
      self.views.appendChild(el); self.panels[id] = el;
      var grid = $('[data-cal-grid]', el); if (grid) rove(grid, $('td.now button', grid) || $('button', grid));
      return el;
    }
    /** Shows one view; `key` is a month (2026-10) or a day (2026-10-07); a missing key means the picker's current value. */
    self.show = function (view, key, label) {
      var sel = $('[data-cal-select="' + view + '"]', root);
      if (view !== 'year' && !key) key = sel.value;
      var el = panel(view, key, label); A.hideChartTip && A.hideChartTip();
      $$('[data-cal-panel]', root).forEach(function (p) { p.hidden = p !== el; });
      $$('[data-cal-tab]', root).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-cal-tab') === view ? 'true' : 'false'); });
      $$('[data-cal-for]', root).forEach(function (x) { x.hidden = x.getAttribute('data-cal-for') !== view; });
      if (sel && key && $('option[value="' + key + '"]', sel)) sel.value = key;
      if (view === 'year') { var sc = $('[data-scroll-end]', el); sc.scrollLeft = sc.scrollWidth; }   // the heat-map opens on the latest days
      return el;
    };
    self.show('year');
    return self;
  }

  /* ---------- keyboard and clicks (shared by every calendar on the page) ---------- */
  function rove(table, active) { $$('button', table).forEach(function (b) { b.tabIndex = b === active ? 0 : -1; }); }   // one tab stop per month grid, arrows do the rest
  var cals = {}; $$('[data-cal]').forEach(function (r) { cals[r.id] = Calendar(r); });

  document.addEventListener('click', function (e) {
    var root = e.target.closest && e.target.closest('[data-cal]'); if (!root) return;
    var cal = cals[root.id], t = e.target.closest('[data-cal-tab]'); if (t) { cal.show(t.getAttribute('data-cal-tab')); return; }
    var g = e.target.closest('[data-cal-go]');
    if (g) {
      e.preventDefault(); var p = g.getAttribute('data-cal-go').split(':');
      var el = cal.show(p[0], p[1], (g.getAttribute('aria-label') || '').split(':')[0]);
      el.focus({ preventScroll: true }); el.scrollIntoView({ block: 'nearest' }); return;
    }
    var st = e.target.closest('[data-cal-step]');
    if (st) {
      var s = $('select', st.closest('[data-cal-for]')), n = s.selectedIndex + (st.getAttribute('data-cal-step') === 'older' ? 1 : -1);
      if (n >= 0 && n < s.options.length) { s.selectedIndex = n; cal.show(s.getAttribute('data-cal-select'), s.value); }
    }
  });
  document.addEventListener('change', function (e) {
    var s = e.target.closest && e.target.closest('[data-cal-select]'); if (s) cals[s.closest('[data-cal]').id].show(s.getAttribute('data-cal-select'), s.value);
  });
  document.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest('[data-cal-grid] button'); if (b) rove(b.closest('table'), b); });
  document.addEventListener('keydown', function (e) {
    var b = e.target.closest && e.target.closest('[data-cal-grid] button'); if (!b) return;
    var dir = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] }[e.key]; if (!dir) return;
    var td = b.parentElement, tr = td.parentElement, table = tr.closest('table'), rows = Array.prototype.slice.call(table.tBodies[0].rows), next = null;
    if (dir[0]) { for (var i = rows.indexOf(tr) + dir[0]; i >= 0 && i < rows.length; i += dir[0]) { var x = rows[i].cells[td.cellIndex].querySelector('button'); if (x) { next = x; break; } } }
    else { var all = $$('button', table.tBodies[0]); next = all[all.indexOf(b) + dir[1]]; }
    if (next) { e.preventDefault(); next.focus(); }
  });
})();
