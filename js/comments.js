(function () {
  'use strict';
  var root = document.documentElement;
  document.querySelectorAll('[data-comments-auto-theme="true"]').forEach(function (section) {
    var provider = section.dataset.commentsProvider;
    var origin = provider === 'giscus' ? 'https://giscus.app' : 'https://utteranc.es';
    var frames = new WeakSet();
    function send(frame) {
      if (!frame.contentWindow) return;
      var theme = root.dataset.theme === 'dark' ? section.dataset.commentsDark : section.dataset.commentsLight;
      var payload = provider === 'giscus' ? { giscus: { setConfig: { theme: theme } } } : { type: 'set-theme', theme: theme };
      frame.contentWindow.postMessage(payload, origin);
    }
    function sync() {
      section.querySelectorAll('iframe').forEach(function (frame) {
        if (!frames.has(frame)) {
          frames.add(frame);
          frame.addEventListener('load', function () { send(frame); });
        }
        send(frame);
      });
    }
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    new MutationObserver(sync).observe(section, { childList: true, subtree: true });
    sync();
  });
})();
