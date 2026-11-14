/*!
 * pager.js — page buttons, "Showing 1–20 of 69" and the Rows per page select for a list. It works on the rows that match the current filters
 * (filters.js marks them data-match="1"), and hides the others with the `hidden` attribute. The pager state is not written to the URL.
 *
 * Reads these hooks (g = the name of a list, the same as in filters.js):
 *   <nav data-pager="g" aria-label="Pagination">
 *     <p data-pager-text data-noun="orders"></p>            "Showing 1–20 of 69 orders" (a "No …" message when nothing matches)
 *     <ul data-pager-pages class="pager-pages"></ul>         Previous, page numbers (with …) and Next are built here; with one page it stays empty
 *     <select data-pager-size>                               Rows per page (20 / 50 / 100); a change applies at once
 *   </nav>
 * Previous is disabled on the first page and Next on the last (disabled and aria-disabled); the current page has aria-current="page".
 * Used by: orders, inventory, stock-movements, purchase-orders, demand.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;
  var state = {};                                           // g → { page, size }

  /** The page numbers to show: all of them when few, otherwise first, last and the neighbours of the current page, with gaps as 0. */
  function pageList(current, last) {
    if (last <= 7) { var all = []; for (var i = 1; i <= last; i++) all.push(i); return all; }
    var set = {}; [1, 2, current - 1, current, current + 1, last - 1, last].forEach(function (n) { if (n >= 1 && n <= last) set[n] = true; });
    var out = [], prev = 0;
    Object.keys(set).map(Number).sort(function (a, b) { return a - b; }).forEach(function (n) { if (n - prev > 1) out.push(0); out.push(n); prev = n; });
    return out;
  }

  /** One page button (or Previous / Next). */
  function button(label, page, opts) {
    opts = opts || {};
    var li = document.createElement('li'), b = document.createElement('button');
    b.type = 'button'; b.className = 'pager-btn'; b.textContent = label; b.setAttribute('data-page-btn', page);
    if (opts.aria) b.setAttribute('aria-label', opts.aria);
    if (opts.current) b.setAttribute('aria-current', 'page');
    if (opts.disabled) { b.disabled = true; b.setAttribute('aria-disabled', 'true'); }
    li.appendChild(b); return li;
  }

  /** Shows the rows of the current page, rebuilds the buttons and the text. */
  function render(g, focusPage) {
    var nav = $('[data-pager="' + g + '"]'); if (!nav) return;
    var s = state[g], rows = $$('[data-filter-in="' + g + '"]'), matches = rows.filter(function (r) { return r.getAttribute('data-match') === '1'; });
    var last = Math.max(1, Math.ceil(matches.length / s.size)); s.page = Math.min(s.page, last);
    var start = (s.page - 1) * s.size, end = Math.min(start + s.size, matches.length);
    rows.forEach(function (r) { r.hidden = true; });
    matches.slice(start, end).forEach(function (r) { r.hidden = false; });

    var noun = $('[data-pager-text]', nav).getAttribute('data-noun') || 'rows';
    $('[data-pager-text]', nav).innerHTML = matches.length ? 'Showing <strong>' + (start + 1) + '–' + end + '</strong> of <strong>' + matches.length + '</strong> ' + noun : 'No ' + noun + ' to show';
    nav.hidden = matches.length === 0;
    var ul = $('[data-pager-pages]', nav); ul.innerHTML = '';
    if (last > 1) {
      ul.appendChild(button('Previous', s.page - 1, { aria: 'Previous page', disabled: s.page === 1 }));
      pageList(s.page, last).forEach(function (n) {
        if (n === 0) { var gap = document.createElement('li'); gap.setAttribute('aria-hidden', 'true'); gap.className = 'pager-gap'; gap.textContent = '…'; ul.appendChild(gap); }
        else ul.appendChild(button(String(n), n, { aria: 'Page ' + n, current: n === s.page }));
      });
      ul.appendChild(button('Next', s.page + 1, { aria: 'Next page', disabled: s.page === last }));
    }
    if (focusPage) {
      var target = $('[data-page-btn="' + focusPage + '"]:not([disabled])', ul) || $('[aria-current="page"]', ul); if (target) target.focus();
    }
  }

  // A filter, a search or a status change returns to page 1.
  document.addEventListener('ace:filtered', function (e) {
    var g = e.detail.group; if (!state[g]) return;
    state[g].page = 1; render(g);
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-page-btn]'); if (!b || b.disabled) return;
    var g = b.closest('[data-pager]').getAttribute('data-pager'), n = Number(b.getAttribute('data-page-btn'));
    state[g].page = n; render(g, n);
    var first = $('[data-filter-in="' + g + '"]:not([hidden])'); if (first && first.scrollIntoView) first.scrollIntoView({ block: 'nearest' });
  });
  document.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-pager-size]'); if (!sel) return;
    var g = sel.closest('[data-pager]').getAttribute('data-pager');
    state[g].size = Number(sel.value); state[g].page = 1; render(g);
  });

  $$('[data-pager]').forEach(function (nav) {
    var g = nav.getAttribute('data-pager'), sel = $('[data-pager-size]', nav);
    state[g] = { page: 1, size: sel ? Number(sel.value) : 20 };
    A.refreshRows(g);                                       // marks the matches and renders page 1
  });
})();
