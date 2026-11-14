/*!
 * row-dialog.js — ONE shared detail dialog for a whole list. The dialog is written once in a <template>; a click on a row's button
 * copies the row's data- attributes into a copy of it and opens it. Used by Order Records (order details) and Menu & Recipes (recipe).
 *
 * Reads these hooks:
 *   [data-row-dialog="template-id"]   button in a row (or the row itself holds the data): the <template id> to open. The data comes from the
 *                                     closest [data-row] (a <tr>); with no [data-row] the button's own data- attributes are used.
 *   inside the template (the <template> holds one <dialog>):
 *     [data-bind="name"]              text = the row's data-name attribute; add data-format="money" to show it as pesos (₱1,234)
 *     [data-bind-src="name"]          an <img>: its src is the row's data-name attribute (alt = data-bind-alt, or the row's data-title)
 *     [data-bind-value="name"]        a form field: its value is the row's data-name (a checkbox is checked when that value is "1")
 *     [data-bind-fill]                a button that opens another dialog (a delete confirm): it gets data-fill-id = the row's data-code and
 *                                     data-fill-name = the row's data-title, which dialogs.js copies into that dialog
 *     [data-show="name:value"]        shown only when the row's data-name equals value (a status badge, for example); hidden otherwise
 *     [data-lines-body="name"]        a <tbody>: one table row for each entry of the row's data-name attribute, entries separated by ";",
 *                                     fields separated by "|", in the order given by the body's data-fields="qty|name|price".
 *                                     Its <template data-line-row> holds one <tr> whose cells carry data-cell="field"; data-cell="total"
 *                                     is quantity × price when the fields include qty and price; data-format="money" formats a cell as pesos.
 *                                     Instead of the inner <template data-line-row>, the body can name a page-level <template id> in
 *                                     data-line-template: its markup is used with __field__ placeholders (__id__, __name__ …) replaced by the
 *                                     entry's values, so the same line markup also serves an "Add" button (rows.js). Empty .note-block elements are dropped.
 *     [data-lines-empty="name"]       shown only when that list has no entries
 * The dialog is built on first use and re-filled every time; it closes like every other dialog (dialogs.js). Used by: orders, menu.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;

  /** Formats a number as pesos with thousands separators. */
  function money(n) { return '₱' + Math.round(Number(n) || 0).toLocaleString('en-US'); }

  /** Text for a value, as pesos when the element asks for it. */
  function format(el, value) { return el.getAttribute('data-format') === 'money' ? money(value) : value; }

  /** Fills the dialog's [data-bind], [data-bind-src] and [data-show] elements from the row. */
  function fillFields(dialog, row) {
    $$('[data-bind]', dialog).forEach(function (el) { el.textContent = format(el, row.getAttribute('data-' + el.getAttribute('data-bind')) || ''); });
    $$('[data-bind-src]', dialog).forEach(function (img) {
      img.src = row.getAttribute('data-' + img.getAttribute('data-bind-src')) || '';
      img.alt = img.getAttribute('data-bind-alt') !== null ? img.getAttribute('data-bind-alt') : (row.getAttribute('data-title') || '');
    });
    $$('[data-show]', dialog).forEach(function (el) {
      var p = el.getAttribute('data-show').split(':');
      el.hidden = row.getAttribute('data-' + p[0]) !== p[1];
    });
  }

  /** Fills the form fields, the delete button and the picture from the row. */
  function fillControls(dialog, row) {
    $$('[data-bind-value]', dialog).forEach(function (el) {
      var v = row.getAttribute('data-' + el.getAttribute('data-bind-value')) || '';
      if (el.type === 'checkbox') el.checked = v === '1'; else el.value = v;
    });
    $$('[data-bind-fill]', dialog).forEach(function (el) {
      el.setAttribute('data-fill-id', row.getAttribute('data-code') || ''); el.setAttribute('data-fill-name', row.getAttribute('data-title') || '');
    });
  }

  /** One list line from an external template: __field__ placeholders become the entry's (escaped) values. */
  function lineFromTemplate(templateId, line) {
    var html = document.getElementById(templateId).innerHTML.replace(/__(\w+)__/g, function (m, k) { return k in line ? String(line[k]).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;') : ''; });
    var t = document.createElement('template'); t.innerHTML = html.trim();
    $$('.note-block', t.content).forEach(function (n) { if (!n.textContent.trim()) n.remove(); });
    return t.content.firstElementChild;
  }

  /** Fills one list body (order lines, recipe ingredients) from a "a|b|c;a|b|c" attribute. */
  function fillLines(dialog, row) {
    $$('[data-lines-body]', dialog).forEach(function (body) {
      var name = body.getAttribute('data-lines-body'), fields = body.getAttribute('data-fields').split('|');
      var tplId = body.getAttribute('data-line-template'), proto = tplId ? null : $('template[data-line-row]', body).content.firstElementChild;
      var entries = (row.getAttribute('data-' + name) || '').split(';').filter(Boolean);
      $$('tr', body).forEach(function (tr) { tr.remove(); });
      entries.forEach(function (entry) {
        var parts = entry.split('|'), line = {}, tr;
        fields.forEach(function (f, i) { line[f] = parts[i]; });
        line.total = (Number(line.qty) || 0) * (Number(line.price) || 0);
        if (tplId) tr = lineFromTemplate(tplId, line);
        else { tr = proto.cloneNode(true); $$('[data-cell]', tr).forEach(function (cell) { cell.textContent = format(cell, line[cell.getAttribute('data-cell')]); }); }
        body.appendChild(tr);
      });
      $$('[data-lines-empty="' + name + '"]', dialog).forEach(function (el) { el.hidden = entries.length !== 0; });
    });
  }

  /** The dialog for a template: built from the template on first use, then reused. */
  function dialogFor(templateId) {
    var id = templateId + '-dialog', dialog = document.getElementById(id);
    if (dialog) return dialog;
    dialog = document.getElementById(templateId).content.firstElementChild.cloneNode(true);
    dialog.id = id;
    document.body.appendChild(dialog);
    return dialog;
  }

  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-row-dialog]'); if (!opener) return;
    var row = opener.closest('[data-row]') || opener, dialog = dialogFor(opener.getAttribute('data-row-dialog'));
    fillFields(dialog, row);
    fillControls(dialog, row);
    fillLines(dialog, row);
    var sub = $('[type="submit"][data-roles]', dialog), role = document.documentElement.getAttribute('data-role') || '';
    var readOnly = !!(sub && sub.getAttribute('data-roles').split(/\s+/).indexOf(role) === -1);
    $$('input, select, textarea', dialog).forEach(function (el) {
      if (el.type !== 'hidden') el.disabled = readOnly;
    });
    A.openDialog(dialog.id, opener);
  });
})();
