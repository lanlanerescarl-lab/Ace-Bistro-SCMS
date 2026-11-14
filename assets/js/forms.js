/*!
 * forms.js — form behaviour: saving state, validation messages, unsaved-changes warning, password helpers.
 *
 * Reads these hooks:
 *   form[data-local-save]             a form that does not send anything yet: after the loading state it closes its dialog and shows the toast
 *                                     named by data-toast-open, then fires the event ace:saved (bubbles). The backend removes this attribute so the form posts for real.
 *   button[type=submit][data-loading-text="Saving…"]   text shown while the button is disabled (default "Saving…")
 *   form with a .form-error banner    checked in the browser on submit: each invalid field shows its <p class="field-error" id="FIELDID-error">
 *                                     slot and the banner (the same attributes the server validates: required, maxlength, pattern, min, max)
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

  /** Resets password fields, show/hide toggles and requirement checklist after a password form is saved. */
  function resetPasswordForm(form) {
    if (!$('[data-pw-source]', form)) return;
    $$('input[type="password"], input[type="text"][autocomplete$="-password"]', form).forEach(function (el) {
      el.value = '';
      el.type = 'password';
      el.removeAttribute('aria-invalid');
      var slot = slotFor(el), mismatch = slotFor(el, '-mismatch');
      if (slot) slot.hidden = true;
      if (mismatch) mismatch.hidden = true;
    });
    $$('[data-toggle-password]', form).forEach(function (b) {
      b.setAttribute('aria-pressed', 'false');
      b.textContent = 'Show';
    });
    $$('[data-pw-req]', form).forEach(function (li) { li.setAttribute('data-met', 'false'); });
  }

  // JavaScript shows the messages itself, so the browser's own bubbles are switched off on these forms.
  $$('form').forEach(function (f) { if ($('.form-error', f)) f.noValidate = true; });

  /** One submit handler: validate, then (for a local-save form) show the saving state, close the dialog and show the toast. */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if ($('.form-error', f) && !validateForm(f)) { e.preventDefault(); return; }
    f.removeAttribute('data-dirty');
    if (!f.hasAttribute('data-local-save')) return;
    e.preventDefault();
    if (f.getAttribute('data-busy')) return;                       // a second click or Enter does nothing
    var button = e.submitter || $('[type="submit"]', f);
    f.setAttribute('data-busy', 'true');
    A.setLoading(button, true);
    setTimeout(function () {
      A.setLoading(button, false);
      f.removeAttribute('data-busy');
      resetPasswordForm(f);
      var dlg = f.closest('dialog') || (button && button.closest('dialog')); if (dlg) dlg.close();
      if (f.getAttribute('data-toast-open')) A.toast(f.getAttribute('data-toast-open'));
      f.dispatchEvent(new CustomEvent('ace:saved', { bubbles: true }));
    }, 600);
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
