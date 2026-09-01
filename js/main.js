/* ============================================================
   Baranova — interactions
   ============================================================ */

const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(pointer: fine)').matches;

// ---- Inject page chrome (progress bar + grain overlay) ----
const progress = document.createElement('div');
progress.className = 'scroll-progress';
document.body.appendChild(progress);

const grain = document.createElement('div');
grain.className = 'grain';
document.body.appendChild(grain);

const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

function updateProgress() {
  const h = maxScroll();
  progress.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
}

// ---- Loader: play only on first open / reload (see inline <head> script) ----
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  const reveal = () => document.body.classList.add('loaded');
  if (!loader || document.documentElement.classList.contains('skip-splash')) {
    reveal();
    return;
  }
  setTimeout(() => { loader.classList.add('hidden'); reveal(); }, 2850);
});

// ---- Page-transition fade: fade in on arrival, fade out before internal nav ----
// NOTE: deliberately NOT requestAnimationFrame — rAF callbacks are suspended
// while a document isn't actively rendering (backgrounded tab, momentary
// paint-holding during navigation, etc.), which left pages permanently
// stuck at opacity:0 until a manual reload. setTimeout always fires.
setTimeout(() => document.body.classList.add('page-in'), 16);
// Hard safety net: an inline style always wins over an external stylesheet
// rule regardless of selector specificity, so this is the final word no
// matter what CSS is doing. Guarantees the page is visible well before a
// human would perceive it as "broken".
setTimeout(() => { document.body.classList.add('page-in'); document.body.style.opacity = '1'; }, 700);

document.addEventListener('click', (e) => {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest('a[href]');
  if (!a || a.target === '_blank') return;
  const href = a.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || /^https?:\/\//i.test(href)) return;
  if (!/\.html(?:[?#]|$)/i.test(href)) return;
  e.preventDefault();
  document.body.classList.remove('page-in');
  document.body.classList.add('page-out');
  setTimeout(() => { window.location.href = href; }, prefersReduced ? 0 : 260);
});

// ---- Team cards: click to expand for more about that person ----
document.querySelectorAll('.team-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.team-card');
    const open = card.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', String(open));
  });
});

// ---- Mobile menu ----
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('nav.links');
if (menuBtn) {
  const setMenu = (open) => {
    navLinks.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  };
  menuBtn.addEventListener('click', () => setMenu(!navLinks.classList.contains('open')));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  // Escape closes the menu and returns focus to the trigger
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
  });
}

// ---- Header shadow on scroll ----
const header = document.querySelector('header');
function updateHeader() {
  if (header) header.style.boxShadow = window.scrollY > 20 ? '0 8px 30px rgba(0,0,0,.35)' : 'none';
}

// ---- Hero decorative sun-mark: rotate gently with scroll ----
const orbit = document.querySelector('.hero-orbit');
function updateOrbit() {
  if (orbit) orbit.style.transform = `rotate(${window.scrollY * 0.06}deg)`;
}

// ---- Master scroll handler ----
function onScroll() {
  updateProgress();
  updateHeader();
  updateOrbit();
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', updateProgress);
onScroll();

// ---- Reveal on scroll (with sibling stagger) ----
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const sibs = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const idx = sibs.indexOf(el);
    el.style.transitionDelay = (Math.min(Math.max(idx, 0), 5) * 0.08) + 's';
    el.classList.add('in');
    io.unobserve(el);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function observeReveal(el) { el.classList.add('reveal'); io.observe(el); }

// ---- Seam rules: draw themselves in on scroll. Kept off the shared .reveal
// observer on purpose: .reveal sets its own transform and would clobber the
// scaleY the seam animates on. Decorative and aria-hidden, but still given a
// safety net so it can never sit invisible if the observer never fires.
const seamRules = document.querySelectorAll('.seam-rule');
if (seamRules.length && !prefersReduced && 'IntersectionObserver' in window) {
  // Arm (collapse) only once we know we can play it back. The stylesheet
  // default is visible, so any path that skips this leaves the seam drawn.
  seamRules.forEach(el => el.classList.add('armed'));
  const disarm = el => el.classList.remove('armed');
  const seamIo = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      disarm(e.target);
      seamIo.unobserve(e.target);
    });
  }, { threshold: 0.4 });
  seamRules.forEach(el => seamIo.observe(el));
  // Never let it sit collapsed if the observer never fires.
  setTimeout(() => seamRules.forEach(disarm), 2500);
}

// ---- Team: HTML in about.html is the crawlable source of truth (kept in
// sync with data/team.json by hand). Only hydrate from JSON if the markup
// was ever left empty — e.g. a future CMS-only workflow. ----
const teamGrid = document.getElementById('team-grid');
if (teamGrid && !teamGrid.children.length) {
  fetch('data/team.json').then(r => r.json()).then(({ members }) => {
    teamGrid.innerHTML = members.map(m => `
      <div class="card">
        <div class="icon-badge">${m.photo
          ? `<img src="${escapeHtml(m.photo)}" alt="${escapeHtml(m.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:14px">`
          : escapeHtml(m.initials || m.name.slice(0, 2).toUpperCase())}</div>
        <h3 style="font-size:18px;margin-bottom:8px">${escapeHtml(m.name)}</h3>
        <p style="color:var(--accent-light);font-size:14px;margin-bottom:10px">${escapeHtml(m.role)}</p>
        <p>${escapeHtml(m.bio)}</p>
      </div>`).join('');
    [...teamGrid.children].forEach(observeReveal);
  }).catch(() => {});
} else if (teamGrid) {
  [...teamGrid.children].forEach(observeReveal);
}

// ---- Work: same pattern — work.html markup is the source of truth,
// data/work.json only fills in if the container was left empty. ----
const workScroller = document.getElementById('work-scroller');
if (workScroller && !workScroller.children.length) {
  fetch('data/work.json').then(r => r.json()).then(({ projects }) => {
    workScroller.innerHTML = projects.map((p, i) => `
      <div class="card work-card">
        <span class="num">${String(i + 1).padStart(2, '0')}</span>
        <span class="pill">${escapeHtml(p.category)}</span>
        <h3 style="font-size:24px;margin:6px 0 12px">${escapeHtml(p.title)}</h3>
        <p style="margin-bottom:20px">${escapeHtml(p.description)}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px">
          ${(p.tags || []).map(t => `<span class="pill">${escapeHtml(t)}</span>`).join('')}
        </div>
        <a href="contact.html" class="btn btn-ghost">Discuss a similar build →</a>
      </div>`).join('');
    [...workScroller.children].forEach(observeReveal);
  }).catch(() => {});
} else if (workScroller) {
  [...workScroller.children].forEach(observeReveal);
}

// ---- Count-up stats (+ fade in the icon above each number) ----
document.querySelectorAll('.stat h3').forEach(el => {
  const m = el.textContent.trim().match(/^(\d+)(.*)$/);
  if (!m) return;
  const end = +m[1], suffix = m[2];
  el.textContent = '0' + suffix;
  const statEl = el.closest('.stat');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(el);
      if (statEl) statEl.classList.add('in');
      if (prefersReduced) { el.textContent = end + suffix; return; }
      const dur = 1400, t0 = performance.now();
      (function tick(t) {
        const p = Math.min((t - t0) / dur, 1);
        el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * end) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    });
  }, { threshold: 0.6 });
  obs.observe(el);
});

// ---- Smooth inertia scroll (desktop wheel only) ----
if (!prefersReduced && finePointer) {
  let target = window.scrollY;
  let current = target;
  let running = false;

  function clamp(v) { return Math.max(0, Math.min(v, maxScroll())); }

  function raf() {
    current += (target - current) * 0.14;
    if (Math.abs(target - current) < 0.4) { current = target; running = false; }
    window.scrollTo(0, current);
    if (running) requestAnimationFrame(raf);
  }
  function start() { if (!running) { running = true; requestAnimationFrame(raf); } }

  window.addEventListener('wheel', (e) => {
    // Let native handle zoom and the horizontal Work scroller
    if (e.ctrlKey || (e.target.closest && e.target.closest('.work-scroller'))) return;
    e.preventDefault();
    target = clamp(target + e.deltaY);
    start();
  }, { passive: false });

  // Resync when scroll comes from elsewhere (keyboard, anchors, resize)
  window.addEventListener('scroll', () => {
    if (!running) { target = current = window.scrollY; }
  }, { passive: true });
  window.addEventListener('resize', () => { target = clamp(target); });
}

// ---- Contact form (demo) ----
const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const original = btn.textContent;
    btn.textContent = 'Message sent';
    btn.style.pointerEvents = 'none';
    form.reset();
    setTimeout(() => { btn.textContent = original; btn.style.pointerEvents = 'auto'; }, 3000);
  });
}
