/*!
 * menu-images.js — the dish picture upload in the Add dish and Edit dish dialogs: choose or drop a file, check it, show a preview.
 * Nothing is uploaded; the preview lives in the browser only (URL.createObjectURL). The form posts the file as name="image"
 * (multipart/form-data) for the backend to store.
 *
 * Reads these hooks:
 *   [data-image-upload]            the whole upload block (one per dialog)
 *     input[type=file]             the file input (accept jpeg, png, webp); also reached by clicking or dropping on [data-image-drop]
 *     [data-image-drop]            the click / drop area (a <label> for the file input)
 *     [data-image-preview]         the <img> that shows the chosen picture; data-placeholder on it is the picture shown when there is none
 *     [data-image-remove]          the "Remove image" button: shows the placeholder again and sets the hidden remove_image field to 1
 *     [data-image-error]           the error slot (type or size problems)
 *     input[name=remove_image]     hidden field the backend reads (1 = delete the stored picture)
 *   data-max-mb on [data-image-upload]: the size limit, 2 by default
 * A dialog that closes or re-opens starts again from its own picture (row-dialog.js sets the preview from the row).
 * Used by: menu.
 */
(function () {
  'use strict';
  var A = window.Ace, $ = A.$, $$ = A.$$;
  var TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /** Frees the temporary preview address of a block, if it has one. */
  function release(box) { if (box._url) { URL.revokeObjectURL(box._url); box._url = null; } }

  /** Shows a message in the error slot (and marks the input), or clears it. */
  function setError(box, message) {
    var slot = $('[data-image-error]', box), input = $('input[type=file]', box);
    slot.textContent = message || ''; slot.hidden = !message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  /** Back to "no new file": empty input, no error, no remove flag; the preview returns to the picture the dialog was opened with. */
  function reset(box) {
    release(box); setError(box, '');
    $('input[type=file]', box).value = '';
    var flag = $('input[name=remove_image]', box); if (flag) flag.value = '';
    var img = $('[data-image-preview]', box); if (img && box._original !== undefined) img.src = box._original;
    $('[data-image-remove]', box).hidden = !shows(box);
  }

  /** True when the preview shows a real picture and not the placeholder. */
  function shows(box) { var img = $('[data-image-preview]', box); return img.getAttribute('src') !== img.getAttribute('data-placeholder'); }

  /** Checks a chosen file and, when it is fine, previews it. */
  function choose(box, file) {
    var input = $('input[type=file]', box), limit = Number(box.getAttribute('data-max-mb') || 2);
    if (!file) return;
    if (TYPES.indexOf(file.type) === -1) { input.value = ''; setError(box, 'Choose a JPEG, PNG or WebP picture.'); return; }
    if (file.size > limit * 1024 * 1024) { input.value = ''; setError(box, 'The picture is larger than ' + limit + ' MB. Choose a smaller one.'); return; }
    release(box); setError(box, '');
    box._url = URL.createObjectURL(file);
    $('[data-image-preview]', box).src = box._url;
    var flag = $('input[name=remove_image]', box); if (flag) flag.value = '';
    $('[data-image-remove]', box).hidden = false;
  }

  document.addEventListener('change', function (e) {
    var box = e.target.closest('[data-image-upload]'); if (box && e.target.type === 'file') choose(box, e.target.files[0]);
  });

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-image-remove]'); if (!btn) return;
    var box = btn.closest('[data-image-upload]'), img = $('[data-image-preview]', box);
    release(box); setError(box, ''); $('input[type=file]', box).value = '';
    img.src = img.getAttribute('data-placeholder'); btn.hidden = true;
    var flag = $('input[name=remove_image]', box); if (flag) flag.value = '1';
  });

  ['dragenter', 'dragover'].forEach(function (name) {
    document.addEventListener(name, function (e) { var d = e.target.closest('[data-image-drop]'); if (d) { e.preventDefault(); d.classList.add('is-over'); } });
  });
  ['dragleave', 'drop'].forEach(function (name) {
    document.addEventListener(name, function (e) {
      var d = e.target.closest('[data-image-drop]'); if (!d) return;
      d.classList.remove('is-over');
      if (name === 'drop') {
        e.preventDefault();
        var box = d.closest('[data-image-upload]'), file = e.dataTransfer && e.dataTransfer.files[0];
        if (file) { try { var dt = new DataTransfer(); dt.items.add(file); $('input[type=file]', box).files = dt.files; } catch (err) { /* older browsers: the check below still runs */ } choose(box, file); }
      }
    });
  });

  /** A dialog that opens remembers its picture as the starting point; one that closes goes back to it. */
  document.addEventListener('dialog:open', function (e) { $$('[data-image-upload]', e.target).forEach(function (box) { reset(box); box._original = $('[data-image-preview]', box).getAttribute('src'); $('[data-image-remove]', box).hidden = !shows(box); }); });
  document.addEventListener('close', function (e) { $$('[data-image-upload]', e.target).forEach(reset); }, true);
})();
