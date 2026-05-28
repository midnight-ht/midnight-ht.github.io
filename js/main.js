(function () {
  const root = document.documentElement;
  const toggles = Array.from(document.querySelectorAll('[data-theme-toggle]'));
  const languageSelects = Array.from(document.querySelectorAll('[data-language-select]'));
  const menuToggle = document.querySelector('[data-mobile-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const menuClosers = Array.from(document.querySelectorAll('[data-mobile-menu-close]'));
  const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const storageKey = 'midnight-theme';
  const languageStorageKey = 'midnight-language';
  const defaultScheme = root.dataset.defaultScheme === 'light' ? 'light' : 'dark';

  function readCookie() {
    const match = document.cookie.match(/(?:^|;\s*)midnight-theme=(light|dark)(?:;|$)/);
    return match ? match[1] : '';
  }

  function readWindowName() {
    const match = String(window.name || '').match(/(?:^|;)midnight-theme=(light|dark)(?:;|$)/);
    return match ? match[1] : '';
  }

  function readStorage(storage) {
    try {
      const value = storage && storage.getItem(storageKey);
      return value === 'light' || value === 'dark' ? value : '';
    } catch (error) {
      return '';
    }
  }

  function readStored() {
    return readStorage(window.localStorage) || readStorage(window.sessionStorage) || readCookie() || readWindowName();
  }

  function writeStored(theme) {
    try {
      document.cookie = `${storageKey}=${theme}; path=/; max-age=31536000; samesite=lax`;
    } catch (error) {}
    try {
      window.name = `${String(window.name || '').replace(/(?:^|;)midnight-theme=(?:light|dark)(?:;|$)/, ';').replace(/^;+|;+$/g, '')};midnight-theme=${theme}`;
    } catch (error) {}
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch (error) {
      root.dataset.themePreference = 'session';
    }
    try {
      window.sessionStorage.setItem(storageKey, theme);
    } catch (error) {
      root.dataset.themePreference = 'session';
    }
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    root.classList.toggle('theme-dark', theme === 'dark');
    root.classList.toggle('theme-light', theme === 'light');
    toggles.forEach((toggle) => {
      const switchLight = toggle.dataset.labelSwitchLight || 'Switch to light theme';
      const switchDark = toggle.dataset.labelSwitchDark || 'Switch to dark theme';
      const isDark = theme === 'dark';
      toggle.dataset.theme = theme;
      toggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
      toggle.setAttribute('aria-label', isDark ? switchLight : switchDark);
      toggle.setAttribute('title', isDark ? switchLight : switchDark);
    });
  }

  root.classList.add('js-ready');
  applyTheme(readStored() || defaultScheme || (systemQuery.matches ? 'dark' : 'light'));

  const onSystemChange = (event) => {
    if (readStored()) return;
    if (defaultScheme) return;
    applyTheme(event.matches ? 'dark' : 'light');
  };
  if (systemQuery.addEventListener) systemQuery.addEventListener('change', onSystemChange);
  else if (systemQuery.addListener) systemQuery.addListener(onSystemChange);

  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      writeStored(next);
      applyTheme(next);
    });
  });

  languageSelects.forEach((languageSelect) => {
    languageSelect.addEventListener('change', () => {
      if (languageSelect.value && languageSelect.value !== window.location.href) {
        const selected = languageSelect.selectedOptions && languageSelect.selectedOptions[0];
        const lang = selected ? selected.getAttribute('hreflang') || selected.textContent.trim() : '';
        if (lang) {
          try { window.localStorage.setItem(languageStorageKey, lang); } catch (error) {}
          try { document.cookie = `${languageStorageKey}=${encodeURIComponent(lang)}; path=/; max-age=31536000; samesite=lax`; } catch (error) {}
        }
        window.location.href = languageSelect.value;
      }
    });
  });

  Array.from(document.querySelectorAll('a[hreflang]')).forEach((link) => {
    link.addEventListener('click', () => {
      const lang = link.getAttribute('hreflang') || '';
      if (!lang) return;
      try { window.localStorage.setItem(languageStorageKey, lang); } catch (error) {}
      try { document.cookie = `${languageStorageKey}=${encodeURIComponent(lang)}; path=/; max-age=31536000; samesite=lax`; } catch (error) {}
    });
  });

  function setNewsletterStatus(form, type, message) {
    const describedBy = form.getAttribute('aria-describedby');
    const status = describedBy ? document.getElementById(describedBy) : null;
    if (!status) return;
    status.textContent = message || '';
    status.classList.toggle('is-success', type === 'success');
    status.classList.toggle('is-error', type === 'error');
  }

  Array.from(document.querySelectorAll('[data-newsletter-form]')).forEach((form) => {
    form.addEventListener('submit', async (event) => {
      const action = form.getAttribute('action');
      if (!action || action === '#') {
        event.preventDefault();
        setNewsletterStatus(form, 'error', form.dataset.missingMessage || 'Newsletter signup is not configured yet.');
        return;
      }

      event.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const successMessage = form.dataset.successMessage || 'Subscription received.';
      const errorMessage = form.dataset.errorMessage || 'Subscription failed. Please try again later.';
      if (button) button.disabled = true;

      try {
        const method = String(form.getAttribute('method') || 'post').toUpperCase();
        const body = new FormData(form);
        const url = method === 'GET' ? `${action}${action.includes('?') ? '&' : '?'}${new URLSearchParams(body).toString()}` : action;
        const response = await fetch(url, {
          method,
          body: method === 'GET' ? undefined : body,
          headers: { Accept: 'application/json' }
        });
        if (!response.ok) throw new Error(`Newsletter request failed: ${response.status}`);
        form.reset();
        setNewsletterStatus(form, 'success', successMessage);
      } catch (error) {
        setNewsletterStatus(form, 'error', errorMessage);
      } finally {
        if (button) button.disabled = false;
      }
    });
  });

  function setMobileMenu(open) {
    if (!mobileMenu || !menuToggle) return;
    mobileMenu.hidden = !open;
    mobileMenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('mobile-menu-open', open);
    menuClosers.forEach((item) => {
      if (item.classList.contains('mobile-menu-backdrop')) item.hidden = !open;
    });
  }

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      setMobileMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
    });
    menuClosers.forEach((item) => item.addEventListener('click', () => setMobileMenu(false)));
    mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMobileMenu(false)));
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') setMobileMenu(false);
    });
  }

  const article = document.querySelector('.post-body .article-content');
  const toc = document.querySelector('.post-toc');
  if (article && toc) {
    const headings = Array.from(article.querySelectorAll('h1, h2, h3')).slice(0, 8);
    const existingLinks = toc.querySelectorAll('.toc-link');
    if (headings.length && !existingLinks.length) {
      const empty = toc.querySelector('.toc-empty');
      if (empty) empty.remove();
      headings.forEach((heading, index) => {
        if (!heading.id) {
          heading.id = `section-${index + 1}-${heading.textContent.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-|-$/g, '')}`;
        }
        const link = document.createElement('a');
        link.className = `toc-link toc-link--${heading.tagName.toLowerCase()}`;
        link.href = `#${heading.id}`;
        link.textContent = heading.textContent.trim();
        toc.appendChild(link);
      });
    }
  }

  if (article) {
    const codeBlocks = Array.from(article.querySelectorAll('figure.highlight, pre')).filter((block) => !block.closest('figure.highlight pre'));
    codeBlocks.forEach((block) => {
      if (block.dataset.enhanced === 'true') return;
      block.dataset.enhanced = 'true';

      const languageClass = Array.from(block.classList).find((name) => !['highlight', 'line-numbers'].includes(name));
      const language = String(languageClass || '').replace(/^lang(uage)?-/, '').toUpperCase() || 'CODE';
      const textSource = block.querySelector('.code pre') || block.querySelector('code') || block;

      const toolbar = document.createElement('div');
      toolbar.className = 'code-toolbar';

      const label = document.createElement('span');
      label.textContent = language;
      toolbar.appendChild(label);

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.textContent = root.dataset.codeCopy || 'Copy';
      button.setAttribute('aria-label', root.dataset.codeCopyLabel || 'Copy code');
      toolbar.appendChild(button);

      block.insertBefore(toolbar, block.firstChild);

      button.addEventListener('click', async () => {
        const code = textSource.textContent || '';
        try {
          await navigator.clipboard.writeText(code);
          button.textContent = root.dataset.codeCopied || 'Copied';
          button.setAttribute('aria-label', root.dataset.codeCopiedLabel || 'Code copied');
        } catch (error) {
          button.textContent = root.dataset.codeFailed || 'Failed';
        }
        window.setTimeout(() => {
          button.textContent = root.dataset.codeCopy || 'Copy';
          button.setAttribute('aria-label', root.dataset.codeCopyLabel || 'Copy code');
        }, 1600);
      });
    });
  }
})();
