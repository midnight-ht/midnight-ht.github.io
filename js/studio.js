(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const art = document.querySelector('[data-studio-art]');
  const hero = document.querySelector('.studio-hero');
  let frame = 0;
  if (art && hero && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    hero.addEventListener('pointermove', event => {
      if (motion.matches || frame) return;
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        art.style.setProperty('--art-rx', `${((event.clientX - rect.left) / rect.width - .5) * 12}deg`);
        art.style.setProperty('--art-ry', `${-((event.clientY - rect.top) / rect.height - .5) * 10}deg`);
        frame = 0;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      art.style.setProperty('--art-rx', '0deg');
      art.style.setProperty('--art-ry', '0deg');
    });
  }
  const menuToggle = document.querySelector('[data-mobile-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  const closeMenu = document.querySelector('button[data-mobile-menu-close]');
  if (menuToggle && mobileMenu && closeMenu) {
    menuToggle.addEventListener('click', () => { if (!mobileMenu.hidden) closeMenu.focus(); });
    document.querySelectorAll('[data-mobile-menu-close]').forEach(node => node.addEventListener('click', () => menuToggle.focus()));
    document.addEventListener('keydown', event => {
      if (mobileMenu.hidden) return;
      if (event.key === 'Escape') { closeMenu.click(); return; }
      if (event.key !== 'Tab') return;
      const nodes = [...mobileMenu.querySelectorAll('a[href],button,select')].filter(node => !node.disabled && node.offsetParent !== null);
      if (event.shiftKey && document.activeElement === nodes[0]) { event.preventDefault(); nodes[nodes.length - 1].focus(); }
      else if (!event.shiftKey && document.activeElement === nodes[nodes.length - 1]) { event.preventDefault(); nodes[0].focus(); }
    });
  }
  const preferences = document.querySelector('.studio-preferences');
  if (preferences) {
    document.addEventListener('pointerdown', event => { if (!preferences.contains(event.target)) preferences.open = false; });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && preferences.open) { preferences.open = false; preferences.querySelector('summary').focus(); } });
    document.addEventListener('focusin', event => { if (!preferences.contains(event.target)) preferences.open = false; });
  }
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      let anchor = href.slice(1);
      try { anchor = decodeURIComponent(anchor); } catch (_) {}
      const target = document.getElementById(anchor) || document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      const close = document.querySelector('button[data-mobile-menu-close]');
      const menu = document.querySelector('[data-mobile-menu]');
      if (close && menu && !menu.hidden) close.click();
      target.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth' });
      history.replaceState(null, '', href);
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  });
  if ('IntersectionObserver' in window && !motion.matches) {
    const nodes = [...document.querySelectorAll('[data-studio-reveal]')];
    document.documentElement.classList.add('studio-reveal-ready');
    nodes.forEach(node => {
      if (node.getBoundingClientRect().top > window.innerHeight) node.classList.add('is-below');
    });
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-below'); observer.unobserve(entry.target); }
    }), { rootMargin: '0px 0px -24px 0px', threshold: .05 });
    nodes.forEach(node => observer.observe(node));
    motion.addEventListener('change', () => {
      if (motion.matches) { nodes.forEach(node => node.classList.remove('is-below')); observer.disconnect(); }
    });
  }
})();

// Mark the section currently being read without hiding or rewriting the article.
(() => {
  const directory = document.querySelector('.post-toc');
  if (directory && window.matchMedia('(max-width: 860px)').matches) directory.open = false;
  const links = [...document.querySelectorAll('.post-toc a[href^="#"]')];
  if (!links.length || !('IntersectionObserver' in window)) return;
  const sections = links.map(link => ({ link, node: document.getElementById(decodeURIComponent(link.hash.slice(1))) || document.getElementById(link.hash.slice(1)) })).filter(item => item.node);
  const update = () => {
    let current = sections[0];
    sections.forEach(item => { if (item.node.getBoundingClientRect().top <= 160) current = item; });
    sections.forEach(item => item === current ? item.link.setAttribute('aria-current', 'location') : item.link.removeAttribute('aria-current'));
  };
  let pending = false;
  window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(() => { update(); pending = false; }); } }, { passive: true });
  update();
})();
