// Decibri Docs Shared Sidebar Navigation
(function () {
  var path = window.location.pathname;

  // Normalize path for matching (works with both file:// and hosted URLs)
  function isActive(href) {
    return path.endsWith(href) || path.endsWith(href.replace('/docs/', '/'));
  }

  function link(href, label) {
    var active = isActive(href);
    return '<a href="' + href + '" class="sidebar-link' + (active ? ' active' : '') + '">' + label + '</a>';
  }

  var html = ''
    + '<div class="sidebar-header">'
    +   '<a href="/docs/index.html" class="sidebar-logo">deci<span>bri</span> docs</a>'
    +   '<button class="sidebar-theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme" title="Toggle theme">'
    +     '<svg class="icon-moon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    +     '<svg class="icon-sun" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    +   '</button>'
    + '</div>'
    + '<nav class="sidebar-nav">'
    +   '<div class="sidebar-section">'
    +     '<div class="sidebar-section-title">Node.js</div>'
    +     link('/docs/node/index.html', 'Getting Started')
    +     link('/docs/node/api-reference.html', 'API Reference')
    +     '<div class="sidebar-section-title" style="margin-top:12px">Integrations</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">Sherpa-ONNX</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/sherpa-onnx-stt.html', 'Speech-to-Text')
    +         link('/docs/node/integrations/sherpa-onnx-kws.html', 'Keyword Spotting')
    +         link('/docs/node/integrations/sherpa-onnx-vad.html', 'Voice Activity Detection')
    +       '</div>'
    +     '</div>'
    +   '</div>'
    + '</nav>'
    + '<div class="sidebar-back">'
    +   '<a href="/">'
    +     '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>'
    +     'Back to decibri.dev'
    +   '</a>'
    + '</div>';

  // Inject sidebar
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.innerHTML = html;

  // Desktop sidebar overlay (click to close)
  var overlay = document.querySelector('.sidebar-overlay');

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Mobile menu toggle
  window.toggleMobileMenu = function () {
    document.querySelector('.mobile-menu').classList.toggle('open');
    document.querySelector('.mobile-menu-overlay').classList.toggle('open');
  };

  // Theme toggle
  window.toggleTheme = function () {
    var el = document.documentElement;
    var current = el.getAttribute('data-theme');
    var next = current === 'light' ? 'dark' : 'light';
    el.setAttribute('data-theme', next);
    localStorage.setItem('decibri-theme', next);
  };
})();
