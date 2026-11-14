/*!
 * filters.js — filters, search and counts for lists that are already in the page. Rows are hidden with the `hidden` attribute, so the table stays real HTML.
 * Without a pager the rows are shown or hidden here; with a pager (pager.js) this file only marks which rows match and the pager shows the current page.
 *
 * Reads these hooks (g = the name of a list):
 *   rows        [data-filter-in="g"]  with data-filter-key="a|b" (status keys), data-search="lower-case text", and one data-FIELD per filter field
 *   buttons     [data-filter-group="g"][data-filter-value="x"][aria-pressed]   status buttons (or clickable cards); value "all" shows every row
 *   status menu select[data-filter-status="g"]   the same job as the buttons: its value is the status key ("" = all)
 *   search      input[data-search-in="g"]                                      matches data-search
 *   fields      [data-filter-for="g"][data-filter-field="date"][data-filter-op="gte|lte|eq"]   compares the input value with the row's data-date
 *   form        form[data-filter-form="g"]                                     Apply (or Enter) applies the fields; [data-filter-clear="g"] resets everything
 *   counts      [data-count="g:value"]   number of rows that match every filter except the status, for that status ("all" = every status;
 *                                        "matches" = rows matching all filters, status included)
 *               [data-sum="g:value:FIELD"]   the same rows, FIELD added up (the row's data-FIELD) and shown as pesos
 *   empty       [data-empty-for="g"]   shown when nothing matches
 *   address     ?status=value in the URL selects the matching status button on load (the Alerts links use it)
 * Used by: orders, inventory, stock-movements, purchase-orders, demand, menu, suppliers and other lists.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;

  /** Formats pesos with thousands separators. */
  function money(n) { return '₱' + Math.round(n).toLocaleString('en-US'); }

  /** The names of all lists on this page. */
  function groups() {
    var names = {};
    $$('[data-filter-in]').forEach(function (r) { names[r.getAttribute('data-filter-in')] = true; });
    return Object.keys(names);
  }

  /** The selected status of a list ("all" when there are no buttons). */
  function status(g) {
    var menu = $('select[data-filter-status="' + g + '"]');
    if (menu) return menu.value || 'all';
    var on = $('[data-filter-group="' + g + '"][aria-pressed="true"]');
    return on ? on.getAttribute('data-filter-value') : 'all';
  }

  /** True when the row passes the search box and the field filters (everything except the status). */
  function passesOthers(row, g, query, fields) {
    if (query && (row.getAttribute('data-search') || row.textContent).toLowerCase().indexOf(query) === -1) return false;
    return fields.every(function (f) {
      var v = f.value; if (!v) return true;
      var rv = row.getAttribute('data-' + f.getAttribute('data-filter-field')) || '', op = f.getAttribute('data-filter-op') || 'eq';
      return op === 'gte' ? rv >= v : op === 'lte' ? rv <= v : rv === v;
    });
  }

  /** True when the row's status keys contain the value ("all" matches every row). */
  function hasKey(row, value) { return value === 'all' || (row.getAttribute('data-filter-key') || '').split('|').indexOf(value) !== -1; }

  /** Applies all filters of one list: marks each row (data-match), updates counts and sums, the empty message, and shows or hides the rows. */
  function refresh(g) {
    var box = $('[data-search-in="' + g + '"]'), query = box ? box.value.trim().toLowerCase() : '';
    var fields = $$('[data-filter-for="' + g + '"]'), sel = status(g), rows = $$('[data-filter-in="' + g + '"]'), paged = !!$('[data-pager="' + g + '"]');
    var from = fields.filter(function (f) { return f.getAttribute('data-filter-op') === 'gte'; })[0], to = fields.filter(function (f) { return f.getAttribute('data-filter-op') === 'lte'; })[0];
    var badRange = !!(from && to && from.value && to.value && from.value > to.value);
    var pool = rows.filter(function (r) { return !badRange && passesOthers(r, g, query, fields); });
    var shown = 0;
    rows.forEach(function (r) {
      var match = pool.indexOf(r) !== -1 && hasKey(r, sel);
      r.setAttribute('data-match', match ? '1' : '0');
      if (match) shown++;
      if (!paged) r.hidden = !match;
    });
    $$('[data-count^="' + g + ':"]').forEach(function (el) {
      var v = el.getAttribute('data-count').slice(g.length + 1);
      el.textContent = v === 'matches' ? shown : pool.filter(function (r) { return hasKey(r, v); }).length;
    });
    $$('[data-sum^="' + g + ':"]').forEach(function (el) {
      var p = el.getAttribute('data-sum').split(':'), total = 0;
      pool.forEach(function (r) { if (hasKey(r, p[1])) total += Number(r.getAttribute('data-' + p[2])) || 0; });
      el.textContent = money(total);
    });
    $$('[data-empty-for="' + g + '"]').forEach(function (e) { e.hidden = shown !== 0; });
    if (to) { var slot = document.getElementById(to.id + '-error'); if (slot) slot.hidden = !badRange; }
    document.dispatchEvent(new CustomEvent('ace:filtered', { detail: { group: g } }));
  }
  A.refreshRows = refresh;

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-filter-group]');
    if (b) {
      var g = b.getAttribute('data-filter-group');
      $$('[data-filter-group="' + g + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      refresh(g); return;
    }
    var clear = e.target.closest('[data-filter-clear]');
    if (clear) {
      e.preventDefault();
      var name = clear.getAttribute('data-filter-clear');
      $$('[data-filter-for="' + name + '"]').forEach(function (f) { f.value = f.getAttribute('data-default') || ''; });
      var s = $('[data-search-in="' + name + '"]'); if (s) s.value = '';
      var menu = $('select[data-filter-status="' + name + '"]'); if (menu) menu.value = '';
      var all = $('[data-filter-group="' + name + '"][data-filter-value="all"]'); if (all) $$('[data-filter-group="' + name + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === all)); });
      refresh(name);
    }
  });
  document.addEventListener('input', function (e) {
    var s = e.target.closest('[data-search-in]'); if (s) refresh(s.getAttribute('data-search-in'));
  });
  document.addEventListener('change', function (e) {
    var f = e.target.closest('[data-filter-for],[data-filter-status]'); if (f) refresh(f.getAttribute('data-filter-for') || f.getAttribute('data-filter-status'));
  });
  document.addEventListener('submit', function (e) {
    var name = e.target.getAttribute && e.target.getAttribute('data-filter-form');
    if (name) { e.preventDefault(); refresh(name); }
  });

  // ?status=value selects the matching status button, then every list is shown in its starting state.
  var wanted = new URLSearchParams(location.search).get('status');
  if (wanted) {
    $$('[data-filter-value="' + wanted + '"]').forEach(function (b) {
      var g = b.getAttribute('data-filter-group');
      $$('[data-filter-group="' + g + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  }
  groups().forEach(refresh);
})();
