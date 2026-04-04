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
    +   '<div class="sidebar-actions">'
    +     '<a href="https://github.com/analyticsinmotion/decibri" class="sidebar-github" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg></a>'
    +     '<button class="sidebar-theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme" title="Toggle theme">'
    +       '<svg class="icon-moon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
    +       '<svg class="icon-sun" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>'
    +     '</button>'
    +   '</div>'
    + '</div>'
    + '<nav class="sidebar-nav">'
    +   '<div class="sidebar-section">'
    +     '<div class="sidebar-section-title">Node.js</div>'
    +     link('/docs/node/index.html', 'Getting Started')
    +     link('/docs/node/api-reference.html', 'API Reference')
    +     '<div class="sidebar-section-title" style="margin-top:12px">Integrations</div>'
    +     link('/docs/node/integrations/index.html', 'Choosing an Integration')
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">Sherpa-ONNX</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/sherpa-onnx-stt.html', 'Speech-to-Text')
    +         link('/docs/node/integrations/sherpa-onnx-kws.html', 'Keyword Spotting')
    +         link('/docs/node/integrations/sherpa-onnx-vad.html', 'Voice Activity Detection')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">Whisper.cpp</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/whisper-cpp.html', 'Speech-to-Text')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">Deepgram</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/deepgram.html', 'Real-Time Transcription')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">AssemblyAI</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/assemblyai.html', 'Real-Time Transcription')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">OpenAI</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/openai-realtime.html', 'Real-Time Transcription')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">Mistral</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/mistral-voxtral.html', 'Real-Time Transcription')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">AWS</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/aws-transcribe.html', 'Streaming Transcription')
    +       '</div>'
    +     '</div>'
    +     '<div class="sidebar-sub">'
    +       '<div class="sidebar-section-title" style="font-size:10px;letter-spacing:1px">Google</div>'
    +       '<div class="sidebar-sub">'
    +         link('/docs/node/integrations/google-speech.html', 'Streaming Transcription')
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

  // Inject mobile menu
  var mobileMenuHtml = ''
    + '<div class="mobile-menu-section">Node.js</div>'
    + '<a href="/docs/node/index.html" onclick="toggleMobileMenu()">Getting Started</a>'
    + '<a href="/docs/node/api-reference.html" onclick="toggleMobileMenu()">API Reference</a>'
    + '<div class="mobile-menu-section">Integrations</div>'
    + '<a href="/docs/node/integrations/index.html" onclick="toggleMobileMenu()">Choosing an Integration</a>'
    + '<div class="mobile-menu-subsection">Sherpa-ONNX</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/sherpa-onnx-stt.html" onclick="toggleMobileMenu()">Speech-to-Text</a>'
    + '<a href="/docs/node/integrations/sherpa-onnx-kws.html" onclick="toggleMobileMenu()">Keyword Spotting</a>'
    + '<a href="/docs/node/integrations/sherpa-onnx-vad.html" onclick="toggleMobileMenu()">Voice Activity Detection</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">Whisper.cpp</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/whisper-cpp.html" onclick="toggleMobileMenu()">Speech-to-Text</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">Deepgram</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/deepgram.html" onclick="toggleMobileMenu()">Real-Time Transcription</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">AssemblyAI</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/assemblyai.html" onclick="toggleMobileMenu()">Real-Time Transcription</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">OpenAI</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/openai-realtime.html" onclick="toggleMobileMenu()">Real-Time Transcription</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">Mistral</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/mistral-voxtral.html" onclick="toggleMobileMenu()">Real-Time Transcription</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">AWS</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/aws-transcribe.html" onclick="toggleMobileMenu()">Streaming Transcription</a>'
    + '</div>'
    + '<div class="mobile-menu-subsection">Google</div>'
    + '<div class="mobile-menu-sub-links">'
    + '<a href="/docs/node/integrations/google-speech.html" onclick="toggleMobileMenu()">Streaming Transcription</a>'
    + '</div>'
    + '<div class="mobile-menu-divider"></div>'
    + '<a href="/">Back to decibri.dev</a>';

  var mobileMenu = document.querySelector('.mobile-menu');
  if (mobileMenu) mobileMenu.innerHTML = mobileMenuHtml;

  // Desktop sidebar overlay (click to close)
  var overlay = document.querySelector('.sidebar-overlay');

  function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  if (overlay) overlay.addEventListener('click', closeSidebar);

  // Mobile menu toggle
  window.toggleMobileMenu = function () {
    var menu = document.querySelector('.mobile-menu');
    menu.classList.toggle('open');
    document.querySelector('.mobile-menu-overlay').classList.toggle('open');
    document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : '';
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
