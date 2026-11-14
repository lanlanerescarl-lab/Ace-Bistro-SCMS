/*!
 * session.js — the signed-in user. Testing only: the backend's real login and session replace this file.
 * The head of every page already checked the session (see the "Session guard" comment); this file fills in the user and handles log out.
 * The user is kept in sessionStorage (key "ace-bistro-scm:user") so another tab or a reload of an old tab can never change a role.
 *
 * Reads these hooks:
 *   [data-user-name] [data-user-initials] [data-user-role] [data-user-username] [data-user-username-text]   text (or the value of an input) filled from the session
 *   form[data-session-name]                                                       after it is saved, its field "name" (and "username", if the form has one) replace the session's values
 *   [data-user-chip]                                                              the top-bar chip; shown once it is filled
 *   [data-home-link]                                                              "my start page": its href becomes the user's landing page
 *   [data-logout]                                                                 confirm button of #logout-dialog: clears the session, goes to login.html
 * Used by: every page (login.html uses Ace.session.set).
 */
(function () {
  'use strict';
  var A = window.Ace, KEY = 'ace-bistro-scm:user';
  var ROLE_LABELS = { admin: 'Administrator / Owner', cashier: 'Cashier / Service Staff', kitchen: 'Kitchen Staff / Cook', inventory: 'Inventory Staff', procurement: 'Procurement Officer' };

  /** The session store: get() returns the signed-in user or null, set() stores one, clear() ends the session. */
  A.session = {
    get: function () { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } },
    set: function (account) {
      var user = { username: account.username, name: account.name, role: account.role, roleLabel: ROLE_LABELS[account.role], landing: account.landing };
      try { sessionStorage.setItem(KEY, JSON.stringify(user)); } catch (e) { /* storage blocked: the login cannot continue */ }
      return user;
    },
    clear: function () { try { sessionStorage.removeItem(KEY); } catch (e) { /* nothing to clear */ } }
  };

  /** "Carl John" becomes "CJ". */
  function initials(name) { return name.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }

  /** Writes the user's name, initials, role and start page into the hooks of the page. */
  function fill(user) {
    var text = { name: user.name, initials: initials(user.name), role: user.roleLabel, username: user.username, 'username-text': user.username };
    Object.keys(text).forEach(function (k) {
      A.$$('[data-user-' + k + ']').forEach(function (el) { if (el.tagName === 'INPUT') el.value = text[k]; else el.textContent = text[k]; });
    });
    A.$$('[data-home-link]').forEach(function (a) { a.setAttribute('href', user.landing); });
    A.$$('[data-user-chip]').forEach(function (el) { el.classList.add('is-ready'); });
  }

  var user = A.session.get();
  var onLogin = !!A.$('[data-login-form]');
  if (onLogin) { if (user) location.replace(user.landing); }       // already signed in: skip the login page
  else if (user) fill(user);

  /** My account: a saved name replaces the name in the session, so the top bar and the menu change at once. */
  document.addEventListener('ace:saved', function (e) {
    var f = e.target, u = A.session.get();
    if (!u || !f.hasAttribute('data-session-name') || !f.elements.name.value.trim()) return;
    u.name = f.elements.name.value.trim();
    if (f.elements.username && f.elements.username.value.trim() && !f.elements.username.hidden && f.elements.username.offsetParent !== null) u.username = f.elements.username.value.trim().toLowerCase();
    try { sessionStorage.setItem(KEY, JSON.stringify(u)); } catch (err) { return; }
    fill(u);
  });

  /** Log out: the confirm button of the dialog ends the session. */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-logout]')) return;
    A.session.clear();
    location.replace('login.html');
  });

  /** A page restored from the back/forward cache after logging out must not show signed-in content. */
  window.addEventListener('pageshow', function (e) { if (e.persisted && !onLogin && !A.session.get()) location.replace('login.html'); });
})();
