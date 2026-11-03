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
    body.innerHTML = `<p class="dialog-eyebrow">${escape(p.topic)} / ${escape(p.status)}</p><h2 class="dialog-title" id="dialog-title">${escape(p.name)}</h2><p class="dialog-paper-title">${escape(p.title)}</p><div class="figure-tabs" role="group" aria-label="Choose research figure"><button type="button" data-figure="overview" aria-pressed="true">Method overview</button><button type="button" data-figure="results" aria-pressed="false">Results & evaluation</button></div><figure class="dialog-overview"><img id="dialog-figure" src="assets/${escape(p.overview_asset)}" alt="Method overview from ${escape(p.name)}"></figure><p class="figure-caption">Original method figure from the linked paper.</p><div class="dialog-columns"><div><h3>The research question</h3><p>${escape(p.question)}</p><h3 class="subheading">The approach</h3><p>${escape(p.summary)}</p></div><div><h3>Method highlights</h3><ul>${p.contributions.map(c => `<li>${escape(c)}</li>`).join('')}</ul><h3 class="subheading">Evaluation setting</h3><p>${escape(p.evaluation)}</p></div></div><div class="dialog-links"><a href="${escape(p.pdf)}" target="_blank" rel="noopener">Read paper ↗</a><a href="${escape(p.code)}" target="_blank" rel="noopener">View repository ↗</a><button type="button" class="citation-button" data-citation="${escape(p.id)}">Copy citation</button></div>`;
    body.querySelectorAll('[data-figure]').forEach(button => button.addEventListener('click', () => {
      const kind = button.dataset.figure;
      body.querySelectorAll('[data-figure]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
      const img = body.querySelector('#dialog-figure');
      img.src = 'assets/' + p[kind + '_asset'];
      img.alt = (kind === 'overview' ? 'Method overview' : 'Evaluation figure') + ' from ' + p.name;
      body.querySelector('.figure-caption').textContent = kind === 'overview' ? 'Original method figure from the linked paper.' : 'Original evaluation figure. Refer to the paper for the full experimental setting.';
    }));
    openDialog(trigger);
  }
  async function copyCitation(id, trigger) {
    const citation = window.RESEARCH_CITATIONS[id];
    if (!citation) return;
    try {
      await navigator.clipboard.writeText(citation);
      notify('BibTeX citation copied.');
    } catch {
      body.innerHTML = '<p class="dialog-eyebrow">BIBTEX</p><h2 class="dialog-title" id="dialog-title">Copy citation</h2><p class="dialog-paper-title">Select and copy the citation below.</p><textarea class="citation-fallback" aria-label="BibTeX citation" readonly></textarea>';
      body.querySelector('textarea').value = citation;
      openDialog(trigger); body.querySelector('textarea').focus(); body.querySelector('textarea').select();
    }
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-project], [data-citation]');
    if (!trigger) return;
    if (trigger.dataset.project) showProject(trigger.dataset.project, trigger);
    else copyCitation(trigger.dataset.citation, trigger);
  });
  document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; if (lastTrigger?.isConnected) lastTrigger.focus(); });

  const showcase = [
    {image:'segmentation.webp',alt:'Multi-organ abdominal MRI segmentation examples from AP-Mamba',topic:'AP-Mamba · Abdominal MRI',title:'Anatomy-aware segmentation.',description:'Learning organ relationships and refining boundaries in abdominal MRI.',project:'ap-mamba',name:'AP-Mamba'},
    {image:'synthesis.webp',alt:'MRI synthesis examples from PriorFM',topic:'PriorFM · Missing modalities',title:'Recovering missing MRI contrasts.',description:'Using observed anatomy to guide missing-modality MRI synthesis.',project:'prior-flow',name:'PriorFM'},
    {image:'review.webp',alt:'Anatomical retention and report review framework from OA-CXR',topic:'OA-CXR · Image–language consistency',title:'Image-grounded report review.',description:'Connecting retained anatomy with statements that warrant report review.',project:'oa-cxr',name:'OA-CXR'}
  ];
  document.querySelectorAll('[data-showcase]').forEach(button => button.addEventListener('click', () => {
    const i = Number(button.dataset.showcase), item = showcase[i];
    document.querySelectorAll('[data-showcase]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    const img = document.querySelector('#showcase-image'); img.src = 'assets/' + item.image; img.alt = item.alt;
    document.querySelector('#showcase-topic').textContent = item.topic;
    document.querySelector('#showcase-title').textContent = item.title;
    document.querySelector('#showcase-description').textContent = item.description;
    document.querySelector('.showcase-counter').textContent = `0${i+1} / 03`;
    const link = document.querySelector('.showcase-link'); link.dataset.project = item.project; link.innerHTML = `Explore ${escape(item.name)} <span aria-hidden="true">↗</span>`;
    const imageButton = document.querySelector('.showcase-window');
    imageButton.dataset.project = item.project;
    imageButton.setAttribute('aria-label', `Open ${item.name} research details`);
    if (!reducedMotion && img.animate) img.animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:330,easing:'cubic-bezier(.2,.7,.2,1)'});
  }));

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
