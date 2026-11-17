/*!
 * shell.js — the page frame: mobile drawer, dropdown panels (alerts, account), info tooltips, tabs, flash toast, print button.
 * Loaded first on every page; it also creates the small shared object `Ace` that the other scripts use.
 *
 * Reads these hooks:
 *   [data-drawer-open] [data-drawer-close]            open / close the sidebar on small screens (#sidebar, #drawer-overlay)
 *   [data-dropdown-toggle="panel-id"]                 opens the .popover with that id (Escape or a click outside closes it)
 *   .tip > .tip-btn                                   click-to-open help bubble (hover and focus are CSS)
 *   [data-tab-group="g"][data-tab-target="id"]        buttons that show one panel [data-tab-panel="g"]#id and hide the others
 *   #flash-slot [data-flash="success|error|warning"]  the server's message toast: a visible success closes itself after five seconds (paused while hovered or focused);
 *   [data-toast-close]                                the close button of a toast
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

  /** The flash toast: a success message that the server printed visible closes itself after five seconds; errors and warnings stay until dismissed. */
  var flashTimer = null;
  function hideFlash(toast) { toast.hidden = true; clearTimeout(flashTimer); }
  function scheduleFlashHide() {
    clearTimeout(flashTimer);
    var ok = $('#flash-slot [data-flash="success"]:not([hidden])');
    if (ok) flashTimer = setTimeout(function () { hideFlash(ok); }, 5000);
  }
  var flashSlot = document.getElementById('flash-slot');
  if (flashSlot) {
    scheduleFlashHide();
    flashSlot.addEventListener('pointerenter', function () { clearTimeout(flashTimer); });
    flashSlot.addEventListener('pointerleave', scheduleFlashHide);
    flashSlot.addEventListener('focusin', function () { clearTimeout(flashTimer); });
    flashSlot.addEventListener('focusout', function (e) { if (!flashSlot.contains(e.relatedTarget)) scheduleFlashHide(); });
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

  /** The close button of a toast hides it. */
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-toast-close]');
    if (c) { var toast = c.closest('.toast'); if (toast) hideFlash(toast); }
  });

  /** Print button. */
  document.addEventListener('click', function (e) { if (e.target.closest('[data-print]')) window.print(); });
})();
