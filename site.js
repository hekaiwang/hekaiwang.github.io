(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dialog = document.querySelector('#research-dialog');
  const body = document.querySelector('#dialog-body');
  let lastTrigger, toastTimer;
  const notify = message => {
    const toast = document.querySelector('.toast');
    clearTimeout(toastTimer); toast.textContent = message; toast.hidden = false;
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4200);
  };
  function openDialog(trigger) {
    if (!dialog.open) {
      lastTrigger = trigger;
      dialog.showModal();
    }
    dialog.scrollTop = 0;
    document.body.style.overflow = 'hidden';
  }
  function showProject(id, trigger) {
    const p = window.RESEARCH_PROJECTS.find(item => item.id === id);
    if (!p) return;
    body.innerHTML = `<p class="dialog-eyebrow">${escape(p.topic)} / ${escape(p.status)}</p><h2 class="dialog-title" id="dialog-title">${escape(p.name)}</h2><p class="dialog-paper-title">${escape(p.title)}</p><div class="figure-tabs" role="group" aria-label="Choose research figure"><button type="button" data-figure="overview" aria-pressed="true">Method overview</button><button type="button" data-figure="results" aria-pressed="false">Results & evaluation</button></div><figure class="dialog-overview"><img id="dialog-figure" src="assets/${escape(p.overview_asset)}" alt="Method overview from ${escape(p.name)}"></figure><p class="figure-caption">${escape(p.method_caption || "Original method figure from the linked paper.")}</p><div class="dialog-columns"><div><h3>The research question</h3><p>${escape(p.question)}</p><h3 class="subheading">The approach</h3><p>${escape(p.summary)}</p></div><div><h3>Method highlights</h3><ul>${p.contributions.map(c => `<li>${escape(c)}</li>`).join('')}</ul><h3 class="subheading">Evaluation setting</h3><p>${escape(p.evaluation)}</p></div></div><div class="dialog-links"><a href="${escape(p.pdf)}" target="_blank" rel="noopener">Read paper ↗</a><a href="${escape(p.code)}" target="_blank" rel="noopener">View repository ↗</a><button type="button" class="citation-button" data-citation="${escape(p.id)}">BibTeX</button></div>`;
    body.querySelectorAll('[data-figure]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.figure;
      body.querySelectorAll('[data-figure]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      const img = body.querySelector('#dialog-figure');
      img.src = 'assets/' + p[kind + '_asset'];
      img.alt = (kind === 'overview' ? 'Method overview' : 'Evaluation figure') + ' from ' + p.name;
      body.querySelector('.figure-caption').textContent = kind === 'overview' ? (p.method_caption || 'Original method figure from the linked paper.') : 'Original evaluation figure. Refer to the paper for the full experimental setting.';
    }));
    openDialog(trigger);
  }
  function showCitation(id, trigger) {
    const citation = window.RESEARCH_CITATIONS[id];
    if (!citation) return;
    const title = window.RESEARCH_PROJECTS.find(item => item.id === id)?.title || 'Beyond the Best Guess: Source-Identifiable Candidate Support Learning for Cross-Modal Medical Image Synthesis';
    body.innerHTML = `<p class="dialog-eyebrow">Citation</p><h2 class="dialog-title" id="dialog-title">BibTeX</h2><p class="dialog-paper-title">${escape(title)}</p><textarea class="citation-fallback" aria-label="BibTeX citation" readonly></textarea><div class="dialog-links"><button type="button" data-copy-citation="${escape(id)}">Copy BibTeX</button><a class="citation-download" download="${escape(id)}.bib">Download .bib ↗</a></div>`;
    const field = body.querySelector('textarea');
    field.value = citation;
    body.querySelector('.citation-download').href = 'data:application/x-bibtex;charset=utf-8,' + encodeURIComponent(citation);
    openDialog(trigger); field.focus(); field.select();
  }
  async function copyCitation(id) {
    const citation = window.RESEARCH_CITATIONS[id];
    if (!citation) return;
    try {
      await navigator.clipboard.writeText(citation);
      notify('BibTeX citation copied.');
    } catch {
      const field = body.querySelector('.citation-fallback');
      field.focus(); field.select();
      notify('Select and copy the citation, or download the .bib file.');
    }
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-project], [data-citation], [data-copy-citation]');
    if (!trigger) return;
    if (trigger.dataset.project) showProject(trigger.dataset.project, trigger);
    else if (trigger.dataset.citation) showCitation(trigger.dataset.citation, trigger);
    else copyCitation(trigger.dataset.copyCitation);
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (lastTrigger?.isConnected) lastTrigger.focus(); });

  // Campus changes are slow, pausable, and suspended off screen.
  const hero = document.querySelector('.profile-hero');
  const campusButtons = [...document.querySelectorAll('[data-campus]')];
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const pauseButton = document.querySelector('.campus-pause');
  const campusNames = ['UCAS · Yanqihu campus', 'SIAT, CAS · Shenzhen'];
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let activeCampus = 0, campusTimer, userPaused = motionPreference.matches, heroVisible = true, resumeWhileFocused = false;
  function selectCampus(index) {
    activeCampus = index;
    scenes.forEach((scene, i) => scene.classList.toggle('is-active', i === index));
    campusButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    document.querySelector('#campus-caption').textContent = campusNames[index];
  }
  function syncCampusPlayback() {
    clearInterval(campusTimer);
    const paused = userPaused || motionPreference.matches;
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Play campus slideshow' : 'Pause campus slideshow');
    pauseButton.title = paused ? 'Play campus slideshow' : 'Pause campus slideshow';
    if (!paused && heroVisible && !document.hidden && (resumeWhileFocused || !hero.querySelector('.campus-switcher').contains(document.activeElement))) {
      campusTimer = setInterval(() => selectCampus((activeCampus + 1) % scenes.length), 9000);
    }
  }
  campusButtons.forEach((button, index) => button.addEventListener('click', () => {
    selectCampus(index); userPaused = true; syncCampusPlayback();
  }));
  pauseButton.addEventListener('click', () => {
    if (motionPreference.matches) { userPaused = true; notify('Automatic motion is disabled by your device preference. You can switch campuses manually.'); }
    else { userPaused = !userPaused; resumeWhileFocused = !userPaused; }
    syncCampusPlayback();
  });
  document.addEventListener('visibilitychange', syncCampusPlayback);
  const controls = hero.querySelector('.campus-switcher');
  controls.addEventListener('focusin', () => { resumeWhileFocused = false; syncCampusPlayback(); });
  controls.addEventListener('focusout', () => requestAnimationFrame(syncCampusPlayback));
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    heroVisible = entries[0].isIntersecting; syncCampusPlayback();
  }, {threshold:0}).observe(hero);
  motionPreference.addEventListener('change', () => { if (motionPreference.matches) userPaused = true; syncCampusPlayback(); });
  syncCampusPlayback();
  // Small pointer depth is limited to fine pointers and respects reduced motion.
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  let pointerFrame, pointerX = 0, pointerY = 0;
  hero.addEventListener('pointermove', event => {
    if (motionPreference.matches || !finePointer.matches) return;
    const bounds = hero.getBoundingClientRect();
    pointerX = (event.clientX - bounds.left) / bounds.width - .5;
    pointerY = (event.clientY - bounds.top) / bounds.height - .5;
    if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
      hero.style.setProperty('--depth-x', `${pointerX * 8}px`);
      hero.style.setProperty('--depth-y', `${pointerY * 6}px`);
      pointerFrame = null;
    });
  });
  function resetDepth() {
    cancelAnimationFrame(pointerFrame); pointerFrame = null;
    hero.style.setProperty('--depth-x', '0px'); hero.style.setProperty('--depth-y', '0px');
  }
  hero.addEventListener('pointerleave', resetDepth);
  motionPreference.addEventListener('change', resetDepth);

  const gallery = document.querySelector('#research-gallery');
  const galleryButtons = [...document.querySelectorAll('[data-gallery]')];
  function syncGallery() {
    const end = Math.max(0, gallery.scrollWidth - gallery.clientWidth);
    galleryButtons.forEach(button => {
      button.disabled = button.dataset.gallery === 'prev' ? gallery.scrollLeft < 4 : gallery.scrollLeft >= end - 4;
    });
  }
  function moveGallery(direction) {
    const card = gallery.querySelector('.project-card');
    const gap = parseFloat(getComputedStyle(gallery).columnGap) || 24;
    gallery.scrollBy({left: direction * (card.getBoundingClientRect().width + gap), behavior: reducedMotion ? 'auto' : 'smooth'});
  }
  galleryButtons.forEach(button => button.addEventListener('click', () => moveGallery(button.dataset.gallery === 'prev' ? -1 : 1)));
  gallery.addEventListener('scroll', syncGallery, {passive:true});
  gallery.addEventListener('keydown', event => {
    if (event.target === gallery && ['ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault(); moveGallery(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  if ('ResizeObserver' in window) new ResizeObserver(syncGallery).observe(gallery);
  window.addEventListener('resize', syncGallery, {passive:true});
  syncGallery();

  const header = document.querySelector('.header');
  const menuToggle = document.querySelector('.menu-toggle');
  function setMenu(open) {
    header.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  }
  menuToggle.addEventListener('click', () => setMenu(menuToggle.getAttribute('aria-expanded') !== 'true'));
  header.querySelectorAll('nav a, .brand').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('click', event => { if (!header.contains(event.target)) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') { setMenu(false); menuToggle.focus(); }
  });
  window.matchMedia('(min-width:741px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  const filters = [...document.querySelectorAll('[data-filter]')];
  const publications = [...document.querySelectorAll('.publication')];
  let selected = 'all';
  function filterPapers() {
    const query = document.querySelector('#paper-search').value.trim().toLowerCase();
    const terms = query.split(/\s+/).filter(Boolean);
    let count = 0;
    publications.forEach(p => {
      const text = p.dataset.search + ' ' + p.textContent.toLowerCase();
      p.hidden = (selected !== 'all' && p.dataset.status !== selected) || !terms.every(term => text.includes(term));
      if (!p.hidden) count++;
    });
    document.querySelector('.filter-count').textContent = `${count} of ${publications.length} selected works${query ? ' · Search results' : ''}`;
    document.querySelector('.empty-search').hidden = count !== 0;
  }
  filters.forEach(button => button.addEventListener('click', () => {
    selected = button.dataset.filter;
    filters.forEach(b => { b.classList.toggle('selected', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    filterPapers();
  }));
  document.querySelector('#paper-search').addEventListener('input', filterPapers);
  document.querySelector('#paper-search').addEventListener('search', filterPapers);
  filterPapers();

  const theme = document.querySelector('.theme-toggle');
  function syncTheme() {
    const dark = root.dataset.theme === 'dark';
    theme.setAttribute('aria-pressed', String(dark));
    theme.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    theme.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#101010' : '#ffffff';
  }
  theme.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('hekai-theme', root.dataset.theme); } catch {}
    syncTheme();
  }); syncTheme();

  if (!reducedMotion && 'IntersectionObserver' in window) {
    root.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), {threshold:0.07});
    document.querySelectorAll('.project-card, .poster-banner, .timeline-entry, .research-lens').forEach(el => { el.classList.add('reveal'); observer.observe(el); });
  }
  const nav = [...document.querySelectorAll('nav a')]; let pending = false;
  function updateNavigation() {
    let current = nav[0];
    for (const link of nav) if (document.querySelector(link.hash).getBoundingClientRect().top < 170) current = link;
    nav.forEach(link => { if (link === current) link.setAttribute('aria-current','location'); else link.removeAttribute('aria-current'); });
    pending = false;
  }
  window.addEventListener('scroll', () => { if (!pending) { pending = true; requestAnimationFrame(updateNavigation); } }, {passive:true});
  updateNavigation();
})();
