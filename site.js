(() => {
 const dialog=document.querySelector('#research-dialog');
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let lastTrigger;
 document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
  const p=window.RESEARCH_PROJECTS.find(p=>p.id===button.dataset.project); if(!p)return;
  lastTrigger=button;
  document.querySelector('#dialog-body').innerHTML=`<p class="dialog-eyebrow">${escape(p.topic)} / ${escape(p.status)}</p><h2 class="dialog-title" id="dialog-title">${escape(p.name)}</h2><p class="dialog-paper-title">${escape(p.title)}</p><figure class="dialog-overview"><img src="assets/${escape(p.overview_asset)}" alt="Method overview from the ${escape(p.name)} paper"></figure><div class="dialog-columns"><div><h3>The research question</h3><p>${escape(p.question)}</p><h3 style="margin-top:20px">The approach</h3><p>${escape(p.summary)}</p></div><div><h3>Method highlights</h3><ul>${p.contributions.map(c=>`<li>${escape(c)}</li>`).join('')}</ul><h3 style="margin-top:20px">Evaluation setting</h3><p>${escape(p.evaluation)}</p></div></div><details class="result-toggle"><summary>View a figure from the paper’s evaluation</summary><img src="assets/${escape(p.results_asset)}" alt="Evaluation figure from ${escape(p.name)}"><p>Original figure from the linked manuscript. See the paper for the full experimental setting.</p></details><div class="dialog-links"><a href="${escape(p.pdf)}" target="_blank" rel="noopener">Read the paper ↗</a><a href="${escape(p.code)}" target="_blank" rel="noopener">Explore the code ↗</a></div>`;
  dialog.showModal();document.body.style.overflow='hidden';
 }));
 const close=()=>dialog.close();document.querySelector('.dialog-close').addEventListener('click',close);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}});
 dialog.addEventListener('close',()=>{document.body.style.overflow='';lastTrigger?.focus();});
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.filter;let count=0;
  document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));});
  document.querySelectorAll('.publication').forEach(p=>{p.hidden=filter!=='all'&&p.dataset.status!==filter;if(!p.hidden)count++;});
  document.querySelector('.filter-count').textContent=`${count} ${filter==='all'?'selected':button.textContent.toLowerCase()} ${count===1?'work':'works'}`;
 }));
 const nav=[...document.querySelectorAll('nav a')];let pending=false;
 function update(){let current=nav[0];for(const a of nav){const section=document.querySelector(a.hash);if(section.getBoundingClientRect().top<170)current=a;}nav.forEach(a=>{if(a===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});pending=false;}
 window.addEventListener('scroll',()=>{if(!pending){pending=true;requestAnimationFrame(update);}},{passive:true});update();
})();
