/*!
 * rows.js — rows that are added from a <template>, and totals that update while you type.
 *
 * Reads these hooks:
 *   <button data-add-row="template-id" data-add-to="rows-id">   clones the <template> into the container. In the template __i__ becomes the row number
 *       (names stay items[0], items[1] …) and data-row-NAME="x" on the button fills __NAME__. data-row-unique adds 1 to the row whose
 *       data-row-key equals data-row-id instead of adding a second row. data-row-from-select="select-id" data-row-from-input="qty-id" fill
 *       __id__ __name__ __unit__ __qty__ from an "Add ingredient" select and its quantity box.
 *   <button data-remove-row>                                      removes its [data-row] (the last row stays)
 *   [data-calc-group]  a block of rows with live totals:
 *       [data-calc-row data-unit-price] + input[data-calc-qty]  → [data-calc-line]   (quantity × price)
 *       [data-calc-total] and [data-calc-count]                 the sum and "n of m items"; input[data-calc-include] leaves a row out
 *       [data-calc-section] with [data-calc-subtotal] [data-calc-subcount]   a subtotal per supplier group
 *       input[data-diff-price data-po-price] in a [data-diff-row] → [data-diff-line], [data-diff-pct], [data-diff-total]
 * Used by: procurement, receiving, menu (recipe lines), purchase-order-detail.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;

  /** Formats a peso amount; whole pesos show without decimals like the rest of the site. */
  function money(n) {
    var d = Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2;
    return '₱' + n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: 2 });
  }
  /** Parses a number, 0 when empty. */
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  /** A signed peso amount for variances (+₱1.50, −₱2.00). */
  function signed(v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + '₱' + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  /** Escapes text that is placed into a template. */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  /** Splits "Eggs (tray)" into the name and the unit in the last brackets. */
  function splitLabel(label) {
    var depth = 0, cut = label.length;
    for (var k = label.length - 1; k >= 0; k--) {
      var ch = label.charAt(k);
      if (ch === ')') depth++;
      else if (ch === '(') { depth--; if (depth === 0) { cut = k; break; } }
    }
    return { name: label.slice(0, cut).replace(/\s+$/, ''), unit: cut < label.length ? label.slice(cut + 1, label.length - 1) : '' };
  }

  /** Recalculates every total block of the page. */
  function recalcAll() {
    $$('[data-calc-group]').forEach(function (g) {
      var total = 0, counted = 0, rows = $$('[data-calc-row]', g);
      rows.forEach(function (r) {
        var q = $('[data-calc-qty]', r), line = q ? num(q.value) * num(r.getAttribute('data-unit-price')) : 0;
        var inc = $('[data-calc-include]', r);
        if (!inc || inc.checked) { total += line; counted++; }
        var out = $('[data-calc-line]', r); if (out) out.textContent = money(line);
      });
      $$('[data-calc-section]', g).forEach(function (sec) {
        var sub = 0, n = 0, all = 0;
        $$('[data-calc-row]', sec).forEach(function (r) {
          all++;
          var inc = $('[data-calc-include]', r);
          if (!inc || inc.checked) { n++; var q = $('[data-calc-qty]', r); sub += (q ? num(q.value) : 0) * num(r.getAttribute('data-unit-price')); }
        });
        var o = $('[data-calc-subtotal]', sec); if (o) o.textContent = money(sub);
        var c = $('[data-calc-subcount]', sec); if (c) c.textContent = all + (all === 1 ? ' item' : ' items');
        sec.classList.toggle('opacity-60', n === 0);
      });
      var t = $('[data-calc-total]', g); if (t) t.textContent = money(total);
      var cnt = $('[data-calc-count]', g); if (cnt) cnt.textContent = counted + ' of ' + rows.length + (rows.length === 1 ? ' item' : ' items');
      var vt = 0, paidTot = 0, poTot = 0;
      $$('[data-diff-price]', g).forEach(function (p) {
        var row = p.closest('[data-diff-row]') || p.parentNode, qin = $('[data-calc-qty]', row);
        var qty = qin ? num(qin.value) : num(p.getAttribute('data-qty'));
        var po = num(p.getAttribute('data-po-price')), paid = num(p.value), v = (paid - po) * qty;
        vt += v; paidTot += paid * qty; poTot += po * qty;
        var o = $('[data-diff-line]', row);
        if (o) { o.textContent = Math.abs(v) < 0.005 ? 'No difference' : signed(v); o.classList.toggle('tone-amber', Math.abs(v) >= 0.005); o.classList.toggle('text-slate-700', Math.abs(v) < 0.005); }
        var pc = $('[data-diff-pct]', row);
        if (pc) { var pct = po ? (paid - po) / po * 100 : 0; pc.textContent = Math.abs(pct) < 0.05 ? '' : (pct > 0 ? '+' : '−') + Math.abs(pct).toFixed(1) + '% vs PO'; }
      });
      var vtot = $('[data-diff-total]', g);
      if (vtot) { vtot.textContent = Math.abs(vt) < 0.005 ? '₱0.00' : signed(vt); vtot.classList.toggle('tone-amber', Math.abs(vt) >= 0.005); }
      var ptot = $('[data-diff-paid-total]', g);
      if (ptot) ptot.textContent = '₱' + paidTot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      var potot = $('[data-diff-po-total]', g);
      if (potot) potot.textContent = '₱' + poTot.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' at the PO prices';
    });
  }
  document.addEventListener('input', function (e) { if (e.target.closest('[data-calc-group]')) recalcAll(); });
  document.addEventListener('change', function (e) { if (e.target.closest('[data-calc-group]')) recalcAll(); });

  /** Collects the template values from the button (data-row-*) and, for a recipe line, from the select and quantity box. Returns null when the line is not complete. */
  function rowValues(add) {
    var vars = {};
    Array.prototype.forEach.call(add.attributes, function (a) {
      var m = /^data-row-(.+)$/.exec(a.name);
      if (m && ['unique', 'from-select', 'from-input'].indexOf(m[1]) === -1) vars[m[1]] = a.value;
    });
    var sid = add.getAttribute('data-row-from-select'), qid = add.getAttribute('data-row-from-input');
    if (!sid) return vars;
    var sel = document.getElementById(sid), qty = qid && document.getElementById(qid);
    if (!sel || !sel.value) { if (sel) sel.focus(); return null; }
    if (qty && (!qty.value.trim() || num(qty.value) <= 0 || !qty.checkValidity())) { qty.focus(); return null; }
    var parts = splitLabel(sel.options[sel.selectedIndex].text);
    vars.id = sel.value; vars.name = parts.name; vars.unit = parts.unit; vars.qty = qty ? qty.value : '';
    sel.value = ''; if (qty) qty.value = '';
    return vars;
  }

  /** Add a row from a template, or remove a row. */
  document.addEventListener('click', function (e) {
    var add = e.target.closest('[data-add-row]');
    if (add) {
      var tpl = document.getElementById(add.getAttribute('data-add-row')), box = document.getElementById(add.getAttribute('data-add-to'));
      if (!tpl || !box) return;
      var vars = rowValues(add); if (!vars) return;
      if (add.hasAttribute('data-row-unique') && vars.id) {
        var same = $$('[data-row-key], [data-id]', box).filter(function (r) { return (r.getAttribute('data-row-key') || r.getAttribute('data-id')) === vars.id; })[0];
        var qin = same && $('[data-calc-qty], input[type="number"]', same);
        if (qin) { qin.value = String( +(num(qin.value) + (num(vars.qty) || 1)).toFixed(4) ); recalcAll(); qin.focus(); return; }
      }
      var html = tpl.innerHTML.replace(/__i__/g, String($$('[data-row]', box).length));
      Object.keys(vars).forEach(function (k) { html = html.split('__' + k + '__').join(esc(vars[k])); });
      var holder = document.createElement(/^\s*<tr/i.test(html) ? 'tbody' : 'div');
      holder.innerHTML = html;
      $$('.note-block', holder).forEach(function (n) { if (!n.textContent.trim()) n.remove(); });   // a line without a note shows no empty block
      var added = Array.prototype.slice.call(holder.children);
      added.forEach(function (r) { box.appendChild(r); });
      var first = added[0] && $('input, select', added[0]); if (first) first.focus();
      recalcAll();
      return;
    }
    var rm = e.target.closest('[data-remove-row]');
    if (rm) {
      var row = rm.closest('[data-row]'), parent = row && row.parentNode;
      if (row && parent && $$('[data-row]', parent).length > 1) {
        var next = row.nextElementSibling || row.previousElementSibling;
        row.remove();
        if (next) { var f = $('input, select, button', next); if (f) f.focus(); }
        recalcAll();
      }
    }
  });
})();
