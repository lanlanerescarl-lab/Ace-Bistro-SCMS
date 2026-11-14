/*!
 * login.js — the login form. Testing only: it checks the typed credentials against test-accounts.js; the backend's real login replaces it.
 *
 * Reads these hooks:
 *   form[data-login-form]            the form (fields name="username" and name="password")
 *   [data-login-alert="invalid|locked|expired|empty"]   the message boxes (hidden until needed)
 * Used by: login.html.
 */
(function () {
  'use strict';
  var A = window.Ace, form = A.$('[data-login-form]'); if (!form) return;
  var busy = false;

  /** Shows one message box (or none) and moves focus to it. */
  function showAlert(which) {
    A.$$('[data-login-alert]').forEach(function (a) { a.hidden = a.getAttribute('data-login-alert') !== which; });
    var a = which && A.$('[data-login-alert="' + which + '"]'); if (a) a.focus();
  }

  /** Disables or enables the fields and the button while the login is "working". */
  function lock(on) {
    busy = on;
    Array.prototype.forEach.call(form.elements, function (el) { if (el.type !== 'submit') el.disabled = on; });
    A.setLoading(A.$('[type="submit"]', form), on);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var username = form.elements.username.value.trim().toLowerCase(), password = form.elements.password.value;
    if (!username || !password) return showAlert('empty');
    var account = window.ACE_TEST_ACCOUNTS.filter(function (a) { return a.username === username && a.password === password; })[0];
    if (!account) return showAlert('invalid');
    if (account.status === 'locked') return showAlert('locked');
    if (account.status === 'expired') return showAlert('expired');
    showAlert(null);
    lock(true);
    setTimeout(function () { A.session.set(account); location.href = account.landing; }, 600);
  });
})();
