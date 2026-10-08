(function () {
  'use strict';
  const requests = new Map();
  document.querySelectorAll('[data-article-metric]').forEach((node) => {
    const kind = node.dataset.articleMetric;
    const path = node.dataset.metricPath;
    const record = node.dataset.metricRecord === 'true';
    let url;
    try {
      url = new URL(node.dataset.metricEndpoint, window.location.href);
      if (!['https:', 'http:'].includes(url.protocol)) return;
      url.searchParams.set('path', path);
    } catch (error) { return; }
    const key = `${url.href}:${record}`;
    if (!requests.has(key)) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      requests.set(key, fetch(url.href, {
        method: record ? 'POST' : 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
        ...(record ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }) } : {})
      }).then((response) => {
        if (!response.ok) throw new Error('Statistics unavailable');
        return response.json();
      }).finally(() => clearTimeout(timeout)));
    }
    requests.get(key).then((data) => {
      const count = data && data[kind];
      if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) return;
      node.querySelector('[data-metric-value]').textContent = String(count);
      node.hidden = false;
    }).catch(() => { /* Keep unavailable statistics hidden. */ });
  });
})();
