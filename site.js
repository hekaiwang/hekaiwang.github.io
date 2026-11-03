(() => {
  'use strict';

  const doc = document.documentElement;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const header = $('.site-header');
  const hero = $('.hero');
  const nav = $('#site-nav');
  const menuButton = $('.menu-button');
  const live = $('#live');

  const announce = message => {
    if (!live) return;
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = message; });
  };

  /* Header: transparent over the photograph, solid once the photograph has scrolled away. */
  if (hero && 'IntersectionObserver' in window) {
    let observer;
    const watch = () => {
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(([entry]) => {
        header.classList.toggle('is-solid', !entry.isIntersecting);
      }, { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` });
      observer.observe(hero);
    };
    watch();
    let resizeTimer;
    addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(watch, 200); });
  } else {
    header.classList.add('is-solid');
  }

  /* Mobile menu. */
  const menuOpen = () => menuButton.getAttribute('aria-expanded') === 'true';
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    $('.label', menuButton).textContent = open ? 'Close' : 'Menu';
  };
  menuButton.addEventListener('click', () => setMenu(!menuOpen()));
  nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('click', event => { if (menuOpen() && !header.contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuOpen()) { setMenu(false); menuButton.focus(); }
  });
  matchMedia('(min-width: 861px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  /* Smooth in-page scrolling, switched on only after the first paint. */
  addEventListener('load', () => requestAnimationFrame(() => doc.classList.add('smooth')), { once: true });

  /* Navigation highlight: the current page, or Contact once the contact block is reached. */
  const pageLink = $('[aria-current="page"]', nav);
  const links = $$('a[href^="#"]', nav).filter(link => link.hash.length > 1 && link.hash !== '#top');
  const targets = links.map(link => document.getElementById(link.hash.slice(1)));
  let spyQueued = false;
  const spy = () => {
    spyQueued = false;
    const line = header.offsetHeight + innerHeight * 0.45;
    let current = -1;
    targets.forEach((target, i) => { if (target && target.getBoundingClientRect().top <= line) current = i; });
    if (current < 0 && targets.length && innerHeight + scrollY >= doc.scrollHeight - 4 && doc.scrollHeight > innerHeight + 4) current = targets.length - 1;
    links.forEach((link, i) => {
      if (i === current) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (pageLink) {
      if (current >= 0) pageLink.removeAttribute('aria-current');
      else pageLink.setAttribute('aria-current', 'page');
    }
  };
  addEventListener('scroll', () => { if (!spyQueued) { spyQueued = true; requestAnimationFrame(spy); } }, { passive: true });
  addEventListener('resize', spy, { passive: true });
  spy();

  /* Campus photographs: phones and desktops each cycle their own set with a slow cross-fade. */
  if (hero) {
    const all = $$('.slide', hero);
    const caption = $('.hero-caption', hero);
    const compact = matchMedia('(max-width: 760px), (max-aspect-ratio: 4/5)');
    const imageOf = slide => (slide.tagName === 'IMG' ? slide : $('img', slide));
    const isReady = slide => { const img = imageOf(slide); return img.complete && img.naturalWidth > 0; };
    const currentSet = () => all.filter(slide => !slide.classList.contains(compact.matches ? 'only-desk' : 'only-phone'));
    let slides = currentSet();
    let index = 0;
    let timer = 0;
    let heroVisible = true;
    let pageLoaded = document.readyState === 'complete';
    let captionTimer = 0;

    const hydrate = () => slides.forEach(slide => {
      const img = imageOf(slide);
      if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    });
    const setCaption = text => {
      if (!caption || !text || caption.textContent === text) return;
      clearTimeout(captionTimer);
      caption.classList.add('is-fading');
      captionTimer = setTimeout(() => { caption.textContent = text; caption.classList.remove('is-fading'); }, 450);
    };
    const show = next => {
      all.forEach(slide => slide.classList.toggle('is-active', slide === slides[next]));
      index = next;
      setCaption(slides[index].dataset.caption);
    };
    const advance = () => {
      const next = (index + 1) % slides.length;
      if (isReady(slides[next])) show(next);
    };
    const sync = () => {
      clearInterval(timer);
      timer = 0;
      if (reduceMotion.matches) { show(0); return; }
      if (!pageLoaded || slides.length < 2) return;
      hydrate();
      if (heroVisible && !document.hidden) timer = setInterval(advance, 7000);
    };
    const reset = () => { slides = currentSet(); show(0); sync(); };

    addEventListener('load', () => { pageLoaded = true; sync(); }, { once: true });
    document.addEventListener('visibilitychange', sync);
    compact.addEventListener('change', reset);
    reduceMotion.addEventListener('change', sync);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; sync(); }).observe(hero);
    }
    sync();
  }

  /* Disclosures: paper details open in place, no overlays. */
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-toggle]');
    if (!button) return;
    const panel = document.getElementById(button.getAttribute('aria-controls'));
    if (!panel) return;
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    panel.classList.toggle('is-open', open);
    const label = $('.label', button);
    if (label && button.dataset.open) label.textContent = open ? button.dataset.open : button.dataset.closed;
  });

  /* Copy to clipboard, with a fallback for browsers that block the async API. */
  const copyText = async text => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0';
      document.body.append(field);
      field.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      field.remove();
      return ok;
    }
  };
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy]');
    if (!button) return;
    const reference = button.dataset.copy;
    const source = reference.startsWith('#') ? $(reference) : null;
    const text = source ? source.textContent.trim() : reference;
    const ok = await copyText(text);
    const label = $('.label', button) || button;
    if (!button.dataset.idle) button.dataset.idle = label.textContent;
    label.textContent = ok ? 'Copied' : 'Press Ctrl+C';
    button.classList.toggle('is-done', ok);
    announce(ok ? 'Copied to clipboard.' : 'Copy was blocked. The text is selected; press Ctrl+C or Command+C.');
    if (!ok) {
      const target = source || $('#email-address');
      if (target) {
        const range = document.createRange();
        range.selectNodeContents(target);
        const selection = getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
    clearTimeout(button.copyTimer);
    button.copyTimer = setTimeout(() => {
      label.textContent = button.dataset.idle;
      button.classList.remove('is-done');
    }, 1800);
  });
})();
