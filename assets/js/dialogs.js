/*!
 * dialogs.js — opens and closes the native <dialog> elements.
 *
 * Reads these hooks:
 *   [data-dialog-open="dialog-id"]    button that opens the dialog (showModal: focus is trapped, Escape closes it)
 *   [data-dialog-close]               button inside a dialog that closes it
 *   data-fill-id / data-fill-name / data-fill-note / data-fill-kind   on the opener: copied into the dialog before it opens, so ONE confirm
 *                                     dialog can serve many rows: [data-fill-input="id|name|note"] inputs get the value,
 *                                     [data-fill="name"] text gets the name, select[name="kind"] gets the kind
 * A dialog that opens fires a 'dialog:open' event on itself (menu-images.js uses it to start from the dish's own picture).
 * A click on the dark backdrop closes the dialog too. Used by: every page (the log-out dialog is in the shared top bar).
 */
(function () {
  'use strict';
  var A = window.Ace, $$ = A.$$;

  /** Copies the data-fill-* values of the opener into the dialog's inputs and text. */
  function fillDialog(dialog, opener) {
    if (opener.hasAttribute('data-fill-name')) {
      $$('[data-fill="name"]', dialog).forEach(function (el) { el.textContent = opener.getAttribute('data-fill-name'); });
    }
    ['id', 'name', 'note'].forEach(function (k) {
      if (opener.hasAttribute('data-fill-' + k)) {
        $$('[data-fill-input="' + k + '"]', dialog).forEach(function (el) { el.value = opener.getAttribute('data-fill-' + k) || ''; });
      }
    });
    if (opener.hasAttribute('data-fill-kind')) {
      $$('select[name="kind"]', dialog).forEach(function (el) { el.value = opener.getAttribute('data-fill-kind'); });
    }
  }

  /** Opens a dialog by id. Other scripts (templates filled from a row) call this after they have filled the dialog. */
  A.openDialog = function (id, opener) {
    var d = document.getElementById(id);
    if (!d || !d.showModal) return;
    if (opener) fillDialog(d, opener);
    d.dispatchEvent(new CustomEvent('dialog:open', { bubbles: true }));
    d.showModal();
  };

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-dialog-open]');
    if (o) { A.openDialog(o.getAttribute('data-dialog-open'), o); return; }
    var c = e.target.closest('[data-dialog-close]');
    if (c) { var dlg = c.closest('dialog'); if (dlg) dlg.close(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close();
  });
})();
