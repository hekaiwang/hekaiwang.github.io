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

  /* Campus photographs: phones and desktops each have their own set. They cross-fade
     automatically; arrows (desktop), dots and swipes (phones) move by hand. */
  if (hero) {
    const all = $$('.slide', hero);
    const caption = $('.hero-caption', hero);
    const controls = $('.hero-controls', hero);
    const nowEl = controls && $('.hc-now', controls);
    const totalEl = controls && $('.hc-total', controls);
    const dotsEl = controls && $('.hc-dots', controls);
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
    let pending = null;

    const hydrateOne = slide => {
      const img = imageOf(slide);
      if (img.dataset.src) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
    };
    const setCaption = text => {
      if (!caption || !text || caption.textContent === text) return;
      clearTimeout(captionTimer);
      caption.classList.add('is-fading');
      captionTimer = setTimeout(() => { caption.textContent = text; caption.classList.remove('is-fading'); }, 450);
    };
    const buildDots = () => {
      if (!controls) return;
      controls.hidden = slides.length < 2;
      totalEl.textContent = String(slides.length);
      dotsEl.innerHTML = slides.map((_, n) => `<button class="hc-dot" type="button" data-hero-go="${n}" aria-label="Photograph ${n + 1} of ${slides.length}"></button>`).join('');
    };
    const render = () => {
      if (!controls) return;
      nowEl.textContent = String(index + 1);
      $$('.hc-dot', dotsEl).forEach((dot, n) => dot.setAttribute('aria-current', n === index ? 'true' : 'false'));
    };
    const show = next => {
      pending = null;
      all.forEach(slide => slide.classList.toggle('is-active', slide === slides[next]));
      index = next;
      setCaption(slides[index].dataset.caption);
      render();
    };
    const restart = () => {
      clearInterval(timer);
      timer = 0;
      if (!reduceMotion.matches && pageLoaded && heroVisible && !document.hidden && slides.length > 1) timer = setInterval(advance, 7000);
    };
    const advance = () => {
      const next = (index + 1) % slides.length;
      if (isReady(slides[next])) show(next);
    };
    const goTo = next => {
      if (slides.length < 2) return;
      next = (next % slides.length + slides.length) % slides.length;
      const slide = slides[next];
      hydrateOne(slide);
      pending = next;
      if (isReady(slide)) show(next);
      else imageOf(slide).addEventListener('load', () => { if (pending === next) show(next); }, { once: true });
      restart();
    };
    const sync = () => {
      if (pageLoaded && !reduceMotion.matches) slides.forEach(hydrateOne);
      restart();
    };
    const reset = () => { slides = currentSet(); buildDots(); show(0); sync(); };

    if (controls) {
      controls.addEventListener('click', event => {
        const step = event.target.closest('[data-hero-step]');
        const dot = event.target.closest('[data-hero-go]');
        if (step) goTo(index + Number(step.dataset.heroStep));
        else if (dot) goTo(Number(dot.dataset.heroGo));
      });
      controls.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(index - 1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); goTo(index + 1); }
      });
    }

    /* Swipe: a mostly horizontal flick of 40px or more changes the photograph;
       vertical movement is left to the page so scrolling is never blocked. */
    let touchX = 0, touchY = 0, tracking = false;
    hero.addEventListener('touchstart', event => {
      if (event.touches.length !== 1) { tracking = false; return; }
      touchX = event.touches[0].clientX; touchY = event.touches[0].clientY; tracking = true;
    }, { passive: true });
    hero.addEventListener('touchend', event => {
      if (!tracking) return;
      tracking = false;
      const t = event.changedTouches[0];
      const dx = t.clientX - touchX, dy = t.clientY - touchY;
      if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(index + (dx < 0 ? 1 : -1));
    }, { passive: true });
    hero.addEventListener('touchcancel', () => { tracking = false; }, { passive: true });

    addEventListener('load', () => { pageLoaded = true; sync(); }, { once: true });
    document.addEventListener('visibilitychange', restart);
    compact.addEventListener('change', reset);
    reduceMotion.addEventListener('change', restart);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => { heroVisible = entry.isIntersecting; restart(); }).observe(hero);
    }
    buildDots();
    render();
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

  /* Figure preview: opens over the page; closes on a click outside the figure,
     the Close button, Esc, the mouse wheel, or the browser/phone Back button. */
  const figureLinks = $$('.figure a');
  if (figureLinks.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.hidden = true;
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Figure preview');
    box.innerHTML = '<figure class="lb-figure"><img alt=""><figcaption><span class="lb-caption"></span><span class="lb-hint lb-hint-pointer">Click outside the figure or press Esc to close.</span><span class="lb-hint lb-hint-touch">Tap outside the figure to close.</span></figcaption></figure>'
      + '<div class="lb-bar"><a class="lb-open" target="_blank" rel="noopener">Open original</a><button class="lb-close" type="button">Close</button></div>';
    document.body.append(box);
    const boxImg = $('img', box);
    const boxCaption = $('.lb-caption', box);
    const openLink = $('.lb-open', box);
    const closeButton = $('.lb-close', box);
    let trigger = null;
    let historyEntry = false;
    let hideTimer = 0;

    const isOpen = () => !box.hidden && box.classList.contains('is-open');
    const open = link => {
      const img = $('img', link);
      const caption = link.closest('.figure')?.querySelector('figcaption')?.textContent.replace(/\s*Click to enlarge\.?\s*$/, '') || '';
      clearTimeout(hideTimer);
      trigger = link;
      boxImg.src = img.currentSrc || img.src;
      boxImg.alt = img.alt;
      boxCaption.textContent = caption;
      openLink.href = link.href;
      box.hidden = false;
      doc.classList.add('lb-lock');
      requestAnimationFrame(() => box.classList.add('is-open'));
      history.pushState({ figurePreview: true }, '');
      historyEntry = true;
      closeButton.focus({ preventScroll: true });
    };
    const close = ({ fromHistory = false } = {}) => {
      if (box.hidden) return;
      box.classList.remove('is-open');
      doc.classList.remove('lb-lock');
      hideTimer = setTimeout(() => { box.hidden = true; boxImg.removeAttribute('src'); }, reduceMotion.matches ? 0 : 220);
      if (trigger) trigger.focus({ preventScroll: true });
      if (historyEntry) {
        historyEntry = false;
        if (!fromHistory) history.back();
      }
    };

    figureLinks.forEach(link => link.addEventListener('click', event => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      open(link);
    }));
    box.addEventListener('click', event => {
      if (event.target === boxImg || event.target.closest('.lb-open')) return;
      close();
    });
    box.addEventListener('wheel', event => { if (!event.ctrlKey) close(); }, { passive: true });
    document.addEventListener('keydown', event => {
      if (!isOpen()) return;
      if (event.key === 'Escape') { event.preventDefault(); close(); }
      if (event.key === 'Tab') {
        event.preventDefault();
        (document.activeElement === closeButton ? openLink : closeButton).focus();
      }
    });
    addEventListener('popstate', () => { if (historyEntry) close({ fromHistory: true }); });
  }
})();
