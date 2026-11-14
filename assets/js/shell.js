/*!
 * shell.js — the page frame: mobile drawer, dropdown panels (alerts, account), info tooltips, tabs, toasts, print button.
 * Loaded first on every page; it also creates the small shared object `Ace` that the other scripts use.
 *
 * Reads these hooks:
 *   [data-drawer-open] [data-drawer-close]            open / close the sidebar on small screens (#sidebar, #drawer-overlay)
 *   [data-dropdown-toggle="panel-id"]                 opens the .popover with that id (Escape or a click outside closes it)
 *   .tip > .tip-btn                                   click-to-open help bubble (hover and focus are CSS)
 *   [data-tab-group="g"][data-tab-target="id"]        buttons that show one panel [data-tab-panel="g"]#id and hide the others
 *   [data-toast-open="toast-id"], [data-toast-close]  show / dismiss a .toast element that is already in the page (#toast-root)
 *   [data-print]                                      calls window.print()
 */
window.Ace = window.Ace || {};

(function () {
  'use strict';
  var A = window.Ace;

  /** Shorthand for querySelector / querySelectorAll (the second returns a real array). */
  A.$ = function (selector, root) { return (root || document).querySelector(selector); };
  A.$$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };
  var $ = A.$, $$ = A.$$;

  /**
   * Puts a button into (or out of) its loading state: disabled, aria-busy, a spinner and the text of data-loading-text ("Saving…" by default).
   * Used by every form that saves something so that it cannot be sent twice.
   */
  A.setLoading = function (button, on) {
    if (!button) return;
    if (on) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + (button.getAttribute('data-loading-text') || 'Saving…');
    } else {
      if (button.dataset.originalHtml !== undefined) button.innerHTML = button.dataset.originalHtml;
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  };

  /** Shows the toast with this id for five seconds (paused while hovered or focused) and hides any other toast. */
  var activeToast = null;
  function scheduleToastHide() {
    clearTimeout(A.toast.timer);
    if (!activeToast) return;
    A.toast.timer = setTimeout(function () {
      if (activeToast) activeToast.classList.add('hidden');
      activeToast = null;
    }, 5000);
  }
  A.toast = function (id) {
    var t = document.getElementById(id); if (!t) return;
    $$('#toast-root .toast').forEach(function (x) { x.classList.add('hidden'); });
    t.classList.remove('hidden');
    activeToast = t;
    scheduleToastHide();
  };
  var toastRoot = document.getElementById('toast-root');
  if (toastRoot) {
    toastRoot.addEventListener('pointerenter', function () { clearTimeout(A.toast.timer); });
    toastRoot.addEventListener('pointerleave', scheduleToastHide);
    toastRoot.addEventListener('focusin', function () { clearTimeout(A.toast.timer); });
    toastRoot.addEventListener('focusout', function (e) { if (!toastRoot.contains(e.relatedTarget)) scheduleToastHide(); });
  }

  /** Opens or closes the mobile drawer. Off-screen sidebar links are made inert so they stay out of the tab order. */
  var sidebar = $('#sidebar'), overlay = $('#drawer-overlay'), wide = window.matchMedia('(min-width: 1024px)');
  function setDrawer(open) {
    if (!sidebar) return;
    open = open && !wide.matches;
    sidebar.classList.toggle('-translate-x-full', !open && !wide.matches);
    if (overlay) overlay.classList.toggle('hidden', !open);
    sidebar.inert = !wide.matches && !open;
    $$('[data-drawer-open]').forEach(function (b) { b.setAttribute('aria-expanded', String(open)); });
    document.body.classList.toggle('overflow-hidden', open);
    if (open) { var first = $('a, button', sidebar); if (first) first.focus(); }
  }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-drawer-open]')) setDrawer(true);
    else if (e.target.closest('[data-drawer-close]') || e.target === overlay) {
      setDrawer(false);
      var o = $('[data-drawer-open]'); if (o && !wide.matches) o.focus();
    }
  });
  wide.addEventListener('change', function () { setDrawer(false); });
  setDrawer(false);

  /** Closes every dropdown panel except the one passed in; returns the toggle button of any closed panel when restoreFocus is true. */
  function closeDropdowns(except, restoreFocus) {
    $$('[data-dropdown-toggle]').forEach(function (b) {
      var p = document.getElementById(b.getAttribute('data-dropdown-toggle'));
      if (p && p !== except && !p.classList.contains('hidden')) {
        var hadFocus = p.contains(document.activeElement) || document.activeElement === b;
        p.classList.add('hidden');
        b.setAttribute('aria-expanded', 'false');
        if (restoreFocus && hadFocus) b.focus();
      }
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-dropdown-toggle]');
    if (btn) {
      var panel = document.getElementById(btn.getAttribute('data-dropdown-toggle')); if (!panel) return;
      var open = panel.classList.contains('hidden');
      closeDropdowns(open ? panel : null);
      panel.classList.toggle('hidden', !open);
      btn.setAttribute('aria-expanded', String(open));
      return;
    }
    if (!e.target.closest('.popover') || e.target.closest('.popover a, .popover button')) closeDropdowns();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeDropdowns(null, true);
      if (document.body.classList.contains('overflow-hidden') && !$('dialog[open]')) { setDrawer(false); var o = $('[data-drawer-open]'); if (o) o.focus(); }
    }
  });

  /** Closes every open info tooltip except the one passed in. */
  function closeTips(except) {
    $$('.tip.is-open').forEach(function (t) {
      if (t !== except) { t.classList.remove('is-open'); t.querySelector('.tip-btn').setAttribute('aria-expanded', 'false'); }
    });
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.tip-btn');
    closeTips(btn ? btn.parentElement : null);
    if (btn) { var open = btn.parentElement.classList.toggle('is-open'); btn.setAttribute('aria-expanded', String(open)); }
  });

  /** Tabs and segmented controls: show the panel named by data-tab-target, hide the other panels of the group. */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab-group]'); if (!b) return;
    var g = b.getAttribute('data-tab-group'), target = b.getAttribute('data-tab-target');
    $$('[data-tab-group="' + g + '"]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    $$('[data-tab-panel="' + g + '"]').forEach(function (p) { p.hidden = p.id !== target; });
  });

  /** Toasts: a button shows one; the close button hides it. (A form with data-toast-open shows its toast when it is saved: see forms.js.) */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-toast-open]');
    if (o && o.tagName !== 'FORM') { A.toast(o.getAttribute('data-toast-open')); return; }
    var c = e.target.closest('[data-toast-close]');
    if (c) {
      var t = c.closest('.toast');
      if (t) { t.classList.add('hidden'); if (activeToast === t) { activeToast = null; clearTimeout(A.toast.timer); } }
    }
  });

  /** Print button. */
  document.addEventListener('click', function (e) { if (e.target.closest('[data-print]')) window.print(); });
})();
