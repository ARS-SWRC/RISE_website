(function () {
  'use strict';

  function isPdfLink(a) {
    if (!a || !a.href) return false;
    var url;
    try {
      url = new URL(a.href, window.location.href);
    } catch (e) {
      return false;
    }
    return /\.pdf$/i.test(url.pathname);
  }

  var overlay, iframe, statusEl, titleEl, newTabLink;
  var lastFocused = null;
  var objectUrl = null;

  function build() {
    overlay = document.createElement('div');
    overlay.className = 'pdf-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.innerHTML =
      '<div class="pdf-overlay__panel">' +
        '<div class="pdf-overlay__header">' +
          '<span class="pdf-overlay__title"></span>' +
          '<a class="pdf-overlay__link" target="_blank" rel="noopener"></a>' +
          '<button type="button" class="pdf-overlay__close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="pdf-overlay__body">' +
          '<div class="pdf-overlay__status">' +
            '<div class="pdf-overlay__spinner"></div>' +
            '<span>Loading PDF&hellip;</span>' +
          '</div>' +
          '<iframe title="PDF preview"></iframe>' +
        '</div>' +
      '</div>';
    document.body.appendChild(overlay);

    iframe = overlay.querySelector('iframe');
    statusEl = overlay.querySelector('.pdf-overlay__status');
    titleEl = overlay.querySelector('.pdf-overlay__title');
    newTabLink = overlay.querySelector('.pdf-overlay__link');
    iframe.style.display = 'none';

    overlay.querySelector('.pdf-overlay__close').addEventListener('click', close);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('pdf-overlay--active')) close();
    });
  }

  function setStatus(html) {
    statusEl.innerHTML = html;
    statusEl.style.display = 'flex';
    iframe.style.display = 'none';
  }

  function open(href, label) {
    if (!overlay) build();

    lastFocused = document.activeElement;
    titleEl.textContent = label || '';
    newTabLink.href = href;
    setStatus('<div class="pdf-overlay__spinner"></div><span>Loading PDF&hellip;</span>');

    overlay.classList.add('pdf-overlay--active');
    document.body.classList.add('pdf-overlay-open');
    overlay.querySelector('.pdf-overlay__close').focus();

    fetch(href)
      .then(function (response) {
        if (!response.ok) throw new Error('Request failed: ' + response.status);
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        var blob = new Blob([buffer], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        iframe.src = objectUrl;
        iframe.style.display = 'block';
        statusEl.style.display = 'none';
      })
      .catch(function () {
        setStatus(
          '<span>This PDF couldn&rsquo;t be previewed here.</span>' +
          '<a href="' + href + '" target="_blank" rel="noopener">Open it in a new tab</a>'
        );
      });
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove('pdf-overlay--active');
    document.body.classList.remove('pdf-overlay-open');
    iframe.src = 'about:blank';
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      objectUrl = null;
    }
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null;
    if (!isPdfLink(a)) return;
    e.preventDefault();
    open(a.href, a.textContent.replace(/\s+/g, ' ').trim());
  });
})();
