/*!
 * forms.js — form behaviour: double-submit guard, validation messages, unsaved-changes warning, password helpers.
 *
 * Reads these hooks:
 *   button[type=submit][data-loading-text]   every POST form: when it is sent, the submit button is disabled and shows this text (default "Saving…")
 *                                     until the next page loads, so the form cannot be sent twice
 *   form with a .form-error banner    checked in the browser on submit: each invalid field shows its <p class="field-error" id="FIELDID-error">
 *                                     slot and the banner (the same attributes the server validates: required, maxlength, pattern, min, max)
 *   select[data-autosubmit]           a change submits the select's form (the Rows per page menu of a list; its form is the select's own or the one named by form=)
 *   form[data-unsaved-warning]        the browser asks before leaving the page after a change
 *   input[data-pw-source]             updates the [data-pw-req="length|number|letter"] checklist items (data-met true/false)
 *   input[data-pw-confirm="id"]       shows the mismatch slot when it differs from the input with that id
 *   [data-toggle-password][aria-controls="input-id"]   Show / Hide button of a password field
 * Used by: every page that has a form.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;

  /** The error slot of a field: <p id="FIELDID-error"> (or another suffix). */
  function slotFor(el, suffix) { return el.id ? document.getElementById(el.id + (suffix || '-error')) : null; }

  /** Validates every field of a form, shows or hides the messages, focuses the first invalid field and returns true when all are valid. */
  function validateForm(form) {
    var bad = [];
    $$('input, select, textarea', form).forEach(function (el) {
      if (el.type === 'hidden' || el.disabled || el.type === 'submit' || el.type === 'button') return;
      if (el.hidden || el.closest('[hidden]') || (!el.classList.contains('sr-only') && el.offsetParent === null)) return;
      var ok = el.checkValidity(), slot = slotFor(el);
      if (el.hasAttribute('data-pw-confirm')) {
        var src = document.getElementById(el.getAttribute('data-pw-confirm')), mismatch = slotFor(el, '-mismatch');
        var same = !src || el.value === src.value;
        if (mismatch) mismatch.hidden = same;
        if (!same) ok = false;
      }
      if (ok) el.removeAttribute('aria-invalid'); else el.setAttribute('aria-invalid', 'true');
      if (slot) slot.hidden = ok;
      if (!ok) bad.push(el);
    });
    var banner = $('.form-error', form); if (banner) banner.hidden = bad.length === 0;
    if (bad.length) bad[0].focus();
    return bad.length === 0;
  }

  // JavaScript shows the messages itself, so the browser's own bubbles are switched off on these forms.
  $$('form').forEach(function (f) { if ($('.form-error', f)) f.noValidate = true; });

  /** One submit handler: validate; a valid POST form then disables its submit button (shown as loading) so that it cannot be sent twice. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if ($('.form-error', f) && !validateForm(f)) { e.preventDefault(); return; }
    f.removeAttribute('data-dirty');
    if ((f.method || '').toLowerCase() !== 'post') return;
    var button = e.submitter || $('[type="submit"]', f);
    // After the browser has collected the form data (the next frame), so that the disabled button does not drop its own value.
    requestAnimationFrame(function () { A.setLoading(button, true); });
  });

  /** A page restored from the back/forward cache after a post must not keep its buttons disabled. */
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) $$('button[aria-busy="true"]').forEach(function (b) { A.setLoading(b, false); });
  });

  /** Rows per page (and similar menus): choosing a value submits the form at once. */
  document.addEventListener('change', function (e) {
    var sel = e.target.closest && e.target.closest('select[data-autosubmit]');
    if (sel && sel.form) { if (sel.form.requestSubmit) sel.form.requestSubmit(); else sel.form.submit(); }
  });

  /** A field's message disappears as soon as its value is valid again. */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (el.getAttribute && el.getAttribute('aria-invalid') === 'true' && el.checkValidity() && !el.hasAttribute('data-pw-confirm')) {
      el.removeAttribute('aria-invalid');
      var slot = slotFor(el); if (slot) slot.hidden = true;
    }
    var warnForm = el.closest && el.closest('form[data-unsaved-warning]');
    if (warnForm) warnForm.setAttribute('data-dirty', 'true');
  });
  /** Closing a dialog clears any unsaved-changes flag on forms inside it. */
  document.addEventListener('close', function (e) {
    if (e.target && e.target.tagName === 'DIALOG') {
      $$('form[data-dirty]', e.target).forEach(function (f) { f.removeAttribute('data-dirty'); });
    }
  }, true);
  window.addEventListener('beforeunload', function (e) { if ($('form[data-dirty]')) { e.preventDefault(); e.returnValue = ''; } });

  /** Updates the password requirement checklist. */
  function checkRules(src) {
    var v = src.value, rules = { length: v.length >= 8, number: /[0-9]/.test(v), letter: /[A-Za-z]/.test(v) };
    $$('[data-pw-req]').forEach(function (li) { li.setAttribute('data-met', rules[li.getAttribute('data-pw-req')] ? 'true' : 'false'); });
  }
  document.addEventListener('input', function (e) {
    var el = e.target; if (!el.hasAttribute) return;
    if (el.hasAttribute('data-pw-source')) checkRules(el);
    if (el.hasAttribute('data-pw-confirm') || el.hasAttribute('data-pw-source')) {
      var confirm = el.hasAttribute('data-pw-confirm') ? el : $('[data-pw-confirm="' + el.id + '"]'); if (!confirm) return;
      var src = document.getElementById(confirm.getAttribute('data-pw-confirm')), mismatch = slotFor(confirm, '-mismatch');
      if (mismatch && src) mismatch.hidden = confirm.value === '' || confirm.value === src.value;
    }
  });

  /** Show / Hide password. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-toggle-password]'); if (!b) return;
    var input = document.getElementById(b.getAttribute('aria-controls')); if (!input) return;
    var show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    b.setAttribute('aria-pressed', String(show));
    b.textContent = show ? 'Hide' : 'Show';
  });
})();
