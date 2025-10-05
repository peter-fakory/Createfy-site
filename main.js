
/* Church Template JS: header/footer injection, page highlighting, events/sermons rendering */
async function loadConfig(){
  const res = await fetch('/config.json').catch(()=>null);
  if(!res || !res.ok){ console.warn('config.json not found via absolute path; trying relative'); }
  const rel = res && res.ok ? res : await fetch('config.json').catch(()=>null);
  if(!rel || !rel.ok){
    console.error('Could not load config.json');
    return null;
  }
  return await rel.json();
}

function setThemeColors(cfg){
  if(!cfg) return;
  const root = document.documentElement;
  if(cfg.site?.primary_color) root.style.setProperty('--primary', cfg.site.primary_color);
  if(cfg.site?.accent_color) root.style.setProperty('--accent', cfg.site.accent_color);
}

function activePath(href){
  const path = location.pathname.split('/').pop() || 'index.html';
  const normalized = href.replace('./','');
  return normalized === path || (path === '' && normalized === 'index.html');
}

function buildHeader(cfg){
  const headerEl = document.getElementById('site-header');
  if(!headerEl) return;
  const name = cfg?.site?.name || 'Church';
  const logo = cfg?.site?.logo || 'assets/img/logo.svg';
  const navItems = [
    {href:'index.html', label:'Home'},
    {href:'about.html', label:'About'},
    {href:'ministries.html', label:'Ministries'},
    {href:'sermons.html', label:'Sermons'},
    {href:'events.html', label:'Events'},
    {href:'give.html', label:'Give'},
    {href:'contact.html', label:'Contact'}
  ];
  const navLinks = navItems.map(i=>{
    const current = activePath(i.href) ? 'aria-current="page"' : '';
    return `<li><a class="nav-link" href="${i.href}" ${current}>${i.label}</a></li>`;
  }).join('');
  headerEl.innerHTML = `
  <header class="header" role="banner">
    <div class="container nav">
      <a class="brand" href="index.html">
        <img src="${logo}" alt="${name} logo" width="36" height="36"/>
        <span>${name}</span>
      </a>
      <button class="menu-toggle" aria-label="Toggle Menu" aria-expanded="false">Menu</button>
      <ul class="" id="main-nav" role="navigation" aria-label="Main">
        ${navLinks}
      </ul>
    </div>
  </header>`;

  const btn = headerEl.querySelector('.menu-toggle');
  const list = headerEl.querySelector('#main-nav');
  btn?.addEventListener('click', ()=>{
    const isOpen = list.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
}

function buildFooter(cfg){
  const footerEl = document.getElementById('site-footer');
  if(!footerEl) return;
  const name = cfg?.site?.name || 'Church';
  const tagline = cfg?.site?.tagline || '';
  const email = cfg?.contact?.email || '';
  const phone = cfg?.contact?.phone || '';
  const addr1 = cfg?.contact?.address_line1 || '';
  const addr2 = cfg?.contact?.address_line2 || '';
  const mapUrl = cfg?.contact?.map_url || '#';
  const social = cfg?.social || {};
  footerEl.innerHTML = `
  <footer class="footer" role="contentinfo">
    <div class="container">
      <div class="grid grid-3">
        <div>
          <div class="kicker">About</div>
          <h3>${name}</h3>
          <p>${tagline}</p>
        </div>
        <div>
          <div class="kicker">Visit</div>
          <p>
            ${addr1}<br>${addr2}<br>
            <a href="${mapUrl}">Get directions</a>
          </p>
          <p>
            <strong>Phone:</strong> <a href="tel:${phone}">${phone}</a><br>
            <strong>Email:</strong> <a href="mailto:${email}">${email}</a>
          </p>
        </div>
        <div>
          <div class="kicker">Connect</div>
          <p>
            ${social.facebook ? `<a href="${social.facebook}">Facebook</a><br>`:''}
            ${social.youtube ? `<a href="${social.youtube}">YouTube</a><br>`:''}
            ${social.instagram ? `<a href="${social.instagram}">Instagram</a><br>`:''}
          </p>
        </div>
      </div>
      <p class="small">© ${new Date().getFullYear()} ${name}. All rights reserved.</p>
    </div>
  </footer>`;
}

function populateHome(cfg){
  const svcEl = document.getElementById('service-times');
  if(svcEl && cfg?.service_times){
    svcEl.innerHTML = cfg.service_times.map(s=>`
      <div class="card">
        <div class="kicker">${s.label}</div>
        <h3>${s.time}</h3>
      </div>
    `).join('');
  }
}

function formatDateParts(dateStr){
  const d = new Date(dateStr + "T00:00:00");
  const m = d.toLocaleString(undefined,{month:'short'});
  const day = d.getDate();
  const y = d.getFullYear();
  return {m,day,y};
}

async function renderEvents(){
  const wrap = document.getElementById('events-list');
  if(!wrap) return;
  let resp = await fetch('/content/events.json').catch(()=>null);
  if(!resp || !resp.ok) resp = await fetch('content/events.json').catch(()=>null);
  if(!resp || !resp.ok){ wrap.innerHTML = '<p class="alert">Could not load events.json</p>'; return; }
  const data = await resp.json();
  data.sort((a,b)=> new Date(a.date) - new Date(b.date));
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = data.filter(e=> new Date(e.date) >= today);
  const chosen = (upcoming.length ? upcoming : data).slice(0, 20);
  wrap.innerHTML = chosen.map(e=>{
    const p = formatDateParts(e.date);
    return `
    <article class="card event">
      <div class="date">
        <div class="m">${p.m}</div>
        <div class="d">${p.day}</div>
        <div class="y">${p.y}</div>
      </div>
      <div>
        <h3>${e.title}</h3>
        <p class="meta">${e.date} • ${e.time} • ${e.location}</p>
        <p>${e.description}</p>
        ${e.link ? `<a class="btn ghost" href="${e.link}">Details</a>`:''}
      </div>
    </article>`;
  }).join('');
}

async function renderSermons(){
  const wrap = document.getElementById('sermons-list');
  if(!wrap) return;
  let resp = await fetch('/content/sermons.json').catch(()=>null);
  if(!resp || !resp.ok) resp = await fetch('content/sermons.json').catch(()=>null);
  if(!resp || !resp.ok){ wrap.innerHTML = '<p class="alert">Could not load sermons.json</p>'; return; }
  const data = await resp.json();
  data.sort((a,b)=> new Date(b.date) - new Date(a.date));
  wrap.innerHTML = data.map(s=>`
    <article class="card sermon">
      <h3>${s.title}</h3>
      <div class="meta">${s.series ? `${s.series} • `:''}${s.date} • ${s.speaker}${s.passage? ` • ${s.passage}`:''}</div>
      <div class="links">
        ${s.audio_url ? `<a class="btn" href="${s.audio_url}">Listen</a>`:''}
        ${s.video_url ? `<a class="btn secondary" href="${s.video_url}">Watch</a>`:''}
        ${s.pdf_notes_url ? `<a class="btn ghost" href="${s.pdf_notes_url}">Notes</a>`:''}
      </div>
    </article>
  `).join('');
}

function wireContactForm(cfg){
  const form = document.getElementById('contact-form');
  if(!form) return;
  const endpoint = cfg?.contact?.form_endpoint || '';
  if(endpoint){
    form.setAttribute('action', endpoint);
    form.setAttribute('method', 'POST');
  } else {
    const email = cfg?.contact?.email || '';
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value;
      const subject = encodeURIComponent('Website Inquiry from ' + name);
      const message = form.querySelector('[name="message"]').value;
      const mailto = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(message)}`;
      location.href = mailto;
    });
  }
}

document.addEventListener('DOMContentLoaded', async ()=>{
  const cfg = await loadConfig();
  setThemeColors(cfg);
  buildHeader(cfg);
  buildFooter(cfg);
  populateHome(cfg);
  renderEvents();
  renderSermons();
  wireContactForm(cfg);
});
