/* ═══════════════════════════════════════════════════════════════
   HOUSE BUSINESS — Application (router + vues)
   SPA vanilla JS : accueil, recherche, fiche pro, auth, tableau
   de bord, messagerie, admin, paramètres. Données : localStorage.
   ═══════════════════════════════════════════════════════════════ */

/* ── Helpers globaux ─────────────────────────────────────────── */
function catById(id) {
  return HB_CATEGORIES.find(c => c.id === id) || { id: id || '', label: id || 'Pro', ico: '🛠️' };
}
function cityByName(name) {
  return HB_CITIES.find(c => c.name === name) || null;
}
function localIso(d) {
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}
function displayRating(proId) {
  const rs = DB.getReviews(proId);
  if (!rs.length) return 0;
  return Math.round(rs.reduce((s, r) => s + r.rating, 0) / rs.length * 10) / 10;
}
function haversineKm(a, b) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
}
function parseHash() {
  const h = (location.hash || '').replace(/^#\/?/, '');
  const [pathPart, queryPart] = h.split('?');
  const segs = pathPart.split('/').filter(Boolean);
  const params = {};
  (queryPart || '').split('&').filter(Boolean).forEach(p => {
    const [k, v] = p.split('=');
    params[decodeURIComponent(k)] = decodeURIComponent(v || '');
  });
  return { segs, params };
}
const STATUS_META = {
  envoyee: { label: 'En attente', cls: 'gray', ico: '⏳' },
  repondue: { label: 'Réponse reçue', cls: 'gold', ico: '💬' },
  acceptee: { label: 'Accepté', cls: 'green', ico: '✅' },
  refusee: { label: 'Refusé', cls: 'red', ico: '❌' },
  en_attente: { label: 'En attente', cls: 'gray', ico: '⏳' },
  confirmee: { label: 'Confirmée', cls: 'green', ico: '✅' },
  terminee: { label: 'Terminée', cls: 'gray', ico: '🏁' },
  annulee: { label: 'Annulée', cls: 'red', ico: '🚫' }
};
const AUTO_REPLIES = [
  'Merci pour votre message ! Je reviens vers vous avec mes disponibilités. 🙏',
  'Bien reçu ! Pouvez-vous me préciser le secteur et la date souhaitée ?',
  'Parfait, je note. Je peux passer cette semaine pour une estimation gratuite.',
  'C’est noté ✅ Je vous envoie un devis détaillé sous 24 h.',
  'Avec plaisir ! Voulez-vous réserver un créneau directement sur la plateforme ?'
];
function statusBadge(key) {
  const s = STATUS_META[key] || { label: key, cls: 'gray', ico: '•' };
  return `<span class="badge ${s.cls}">${s.ico} ${s.label}</span>`;
}
function fmtDayBox(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const days = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
  return `<div class="b-date"><small>${days[d.getDay()]}</small>${d.getDate()}</div>`;
}

/* ── Application ──────────────────────────────────────────────── */
const App = {
  searchState: { q: '', cat: '', ville: '', note: 0, sort: 'reco', geo: null },
  calMonth: new Date(),
  _replyTimer: null,
  _msgThread: null,

  /* ═══ INIT ═══ */
  init() {
    DB.seedIfNeeded();
    this.initTheme();
    this.populateSelects();
    this.bindShell();
    this.bindHome();
    this.bindSearch();
    this.bindAuth();
    this.bindSettings();
    Assistant.bind();
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  populateSelects() {
    const catOpts = HB_CATEGORIES.map(c => `<option value="${c.id}">${c.label}</option>`).join('');
    const hsCat = document.getElementById('hsCat');
    if (hsCat) hsCat.innerHTML = '<option value="">Tous les métiers</option>' + catOpts;
    const fCat = document.getElementById('fCat');
    if (fCat) fCat.innerHTML = '<option value="">Tous les métiers</option>' + catOpts;
    const cityOpts = HB_CITIES.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    ['fVille', 'regCity', 'setCity'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = (id === 'fVille' ? '<option value="">Toutes les villes</option>' : '') + cityOpts;
    });
  },

  initTheme() {
    const dark = DB.getSettings().dark;
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = dark ? '☀️' : '🌙';
  },

  /* ═══ SHELL (navbar, drawer, notifs) ═══ */
  bindShell() {
    const menuBtn = document.getElementById('menuBtn');
    const drawer = document.getElementById('drawer');
    const scrim = document.getElementById('drawerScrim');
    const close = document.getElementById('drawerClose');
    const cta = document.getElementById('drawerCta');
    const themeBtn = document.getElementById('themeBtn');
    const notifBtn = document.getElementById('notifBtn');
    const notifPanel = document.getElementById('notifPanel');
    const notifReadAll = document.getElementById('notifReadAll');

    menuBtn.addEventListener('click', () => { drawer.classList.remove('hidden'); scrim.classList.remove('hidden'); });
    close.addEventListener('click', () => { drawer.classList.add('hidden'); scrim.classList.add('hidden'); });
    scrim.addEventListener('click', () => { drawer.classList.add('hidden'); scrim.classList.add('hidden'); });
    cta.addEventListener('click', () => {
      drawer.classList.add('hidden'); scrim.classList.add('hidden');
      location.hash = DB.currentUser() ? '#/tableau-de-bord' : '#/connexion';
    });

    themeBtn.addEventListener('click', () => {
      const dark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', dark ? 'light' : 'dark');
      DB.saveSettings({ dark: !dark });
      themeBtn.textContent = dark ? '🌙' : '☀️';
    });

    notifBtn.addEventListener('click', e => {
      e.stopPropagation();
      const show = notifPanel.classList.toggle('hidden');
      if (!show) this.renderNotifs();
    });
    notifReadAll.addEventListener('click', () => { DB.markNotifsRead(); this.renderNotifs(); this.updateShell(); });
    document.addEventListener('click', e => {
      if (!notifPanel.classList.contains('hidden') && !e.target.closest('.notif-panel') && !e.target.closest('.notif-btn')) {
        notifPanel.classList.add('hidden');
      }
    });
    this.updateShell();
  },

  updateShell() {
    const u = DB.currentUser();
    const navUser = document.getElementById('navUser');
    const cta = document.getElementById('drawerCta');
    const adminLinks = document.querySelectorAll('.admin-only');

    // Nav user area
    if (u) {
      navUser.innerHTML = `
        <div class="user-menu">
          <button class="icon-btn" id="userBtn" aria-label="Mon compte" style="width:auto;padding:0">
            ${UI.avatarHtml(u.name)}
          </button>
          <div class="user-drop hidden" id="userDrop">
            <div style="padding:10px 12px;border-bottom:1px solid var(--line);margin-bottom:6px">
              <b>${UI.esc(u.name)}</b><br><small class="muted">${u.role === 'admin' ? 'Administrateur' : u.role === 'pro' ? 'Professionnel' : 'Client'}</small>
            </div>
            <a href="#/tableau-de-bord">📊 Tableau de bord</a>
            <a href="#/messages">💬 Messages</a>
            <a href="#/parametres">⚙️ Paramètres</a>
            ${u.role === 'admin' ? '<a href="#/admin">🛡️ Administration</a>' : ''}
            <div class="sep"></div>
            <button class="danger-item" id="logoutBtn">🚪 Déconnexion</button>
          </div>
        </div>`;
      document.getElementById('userBtn').addEventListener('click', e => {
        e.stopPropagation();
        document.getElementById('userDrop').classList.toggle('hidden');
      });
      document.getElementById('logoutBtn').addEventListener('click', () => {
        DB.logout();
        this.updateShell();
        UI.toast('À bientôt 👋');
        location.hash = '#/';
      });
      if (cta) cta.textContent = 'Mon tableau de bord';
      adminLinks.forEach(a => a.classList.remove('hidden'));
    } else {
      navUser.innerHTML = `<a href="#/connexion" class="btn-primary">Se connecter</a>`;
      if (cta) { cta.textContent = 'Se connecter'; cta.onclick = () => { location.hash = '#/connexion'; }; }
      adminLinks.forEach(a => a.classList.add('hidden'));
    }

    // Badges
    const n = DB.unreadCount();
    const dot = document.getElementById('notifDot');
    if (dot) dot.classList.toggle('hidden', n === 0);
    const mBadge = document.querySelector('.bottomnav a[data-nav="msg"] .bn-badge');
    const mu = this.msgUnread();
    if (mBadge) {
      if (mu > 0) { mBadge.textContent = mu > 9 ? '9+' : mu; mBadge.style.display = 'flex'; }
      else mBadge.style.display = 'none';
    }
  },

  msgUnread() {
    const u = DB.currentUser();
    if (!u) return 0;
    const lastUnread = c => {
      const last = c.msgs[c.msgs.length - 1];
      return last && !last.read;
    };
    if (u.role === 'pro') return DB.getConversationsForPro().filter(c => lastUnread(c) && c.last.from === 'user').length;
    return DB.getConversationsForUser().filter(c => lastUnread(c) && c.last.from === 'pro').length;
  },

  renderNotifs() {
    const list = document.getElementById('notifList');
    const notifs = DB.getNotifs();
    if (!notifs.length) {
      list.innerHTML = '<div class="notif-empty">🔕 Aucune notification pour le moment.</div>';
      return;
    }
    const ico = { devis: '📋', reservation: '📅', message: '💬', avis: '⭐', bienvenue: '🎉', system: '🔧' };
    list.innerHTML = notifs.slice(0, 30).map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-nid="${n.id}">
        <div class="n-ico">${ico[n.type] || '🔔'}</div>
        <div style="flex:1"><p style="margin:0">${UI.esc(n.text)}</p><small>${UI.timeAgo(n.ts)}</small></div>
      </div>`).join('');
    list.querySelectorAll('.notif-item').forEach(el => {
      el.addEventListener('click', () => {
        const n = notifs.find(x => x.id === el.dataset.nid);
        if (n) {
          if (n.proId) location.hash = '#/pro/' + n.proId;
          else if (n.type === 'devis' || n.type === 'reservation') location.hash = '#/tableau-de-bord';
          else if (n.type === 'message') location.hash = '#/messages';
          else location.hash = '#/tableau-de-bord';
          DB.markNotifsRead();
          this.updateShell();
        }
        document.getElementById('notifPanel').classList.add('hidden');
      });
    });
  },

  /* ═══ ROUTER ═══ */
  route() {
    try { window.scrollTo({ top: 0 }); } catch (e) { /* jsdom et autres environnements sans scroll */ }
    const { segs, params } = parseHash();
    const name = segs[0] || 'home';
    this.setActiveNav(name);
    document.getElementById('notifPanel').classList.add('hidden');
    const drop = document.getElementById('userDrop');
    if (drop) drop.classList.add('hidden');
    if (this._replyTimer) { clearTimeout(this._replyTimer); this._replyTimer = null; }

    switch (name) {
      case '': case 'home': return this.renderHome();
      case 'recherche': return this.renderSearch(params);
      case 'pro': return segs[1] ? this.renderPro(segs[1]) : this.renderHome();
      case 'connexion': return this.renderAuth('login');
      case 'inscription': return this.renderAuth('register', params.role);
      case 'tableau-de-bord': return this.renderDashboard(segs[1] || 'apercu');
      case 'messages': return this.renderMessages(segs[1]);
      case 'admin': return this.renderAdmin();
      case 'parametres': return this.renderSettings();
      default: return this.showView('view-notfound');
    }
  },

  showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
  },

  setActiveNav(name) {
    const map = { home: 'home', recherche: 'search', 'tableau-de-bord': 'dash', messages: 'msg', admin: 'admin', parametres: 'settings', connexion: 'settings', inscription: 'settings' };
    const key = map[name] || '';
    document.querySelectorAll('.nav-links a, .bottomnav a').forEach(a => {
      a.classList.toggle('active', a.dataset.nav === key);
    });
  },

  /* ═══ HOME ═══ */
  bindHome() {
    const form = document.getElementById('heroSearch');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const q = document.getElementById('hsQ').value.trim();
      const cat = document.getElementById('hsCat').value;
      const params = [];
      if (q) params.push('q=' + encodeURIComponent(q));
      if (cat) params.push('cat=' + encodeURIComponent(cat));
      location.hash = '#/recherche' + (params.length ? '?' + params.join('&') : '');
    });
  },

  renderHome() {
    this.showView('view-home');
    // Stats
    const pros = DB.getPros();
    document.getElementById('statPros').textContent = pros.length;
    document.getElementById('statCats').textContent = HB_CATEGORIES.length;
    // Categories
    const catsEl = document.getElementById('homeCats');
    catsEl.innerHTML = HB_CATEGORIES.map(c => {
      const n = pros.filter(p => p.category === c.id).length;
      return `
        <a class="cat-card" href="#/recherche?cat=${c.id}" aria-label="${UI.esc(c.label)} — ${n} pros">
          <img src="${c.img}" alt="" loading="lazy">
          <span class="cat-veil"></span>
          <span class="cat-ico">${c.ico}</span>
          <span class="cat-label"><b>${UI.esc(c.label)}</b><span>${n} pro${n > 1 ? 's' : ''} vérifié${n > 1 ? 's' : ''}</span></span>
        </a>`;
    }).join('');
    // Featured
    const feats = pros.filter(p => p.featured).slice(0, 6);
    document.getElementById('homeFeatured').innerHTML = feats.map(p => this.proCard(p)).join('');
    // Testimonials
    document.getElementById('homeTestimonials').innerHTML = HB_TESTIMONIALS.map(t => `
      <div class="testi-card">
        <div class="testi-stars">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</div>
        <p>« ${UI.esc(t.text)} »</p>
        <div class="t-who">${UI.avatarHtml(t.name)}<div><b>${UI.esc(t.name)}</b><small>${UI.esc(t.project)}</small></div></div>
      </div>`).join('');
  },

  /* ═══ PRO CARD ═══ */
  proCard(p, opts) {
    opts = opts || {};
    const cat = catById(p.category);
    const rating = displayRating(p.id);
    const count = DB.getReviews(p.id).length;
    const fav = DB.isFavorite(p.id);
    const dist = opts.distance != null ? `<span class="badge gray">📍 ${opts.distance} km</span>` : '';
    return `
      <article class="pro-card">
        <div class="pc-media" onclick="location.hash='#/pro/${p.id}'" role="link" tabindex="0"
             onkeydown="if(event.key==='Enter')location.hash='#/pro/${p.id}'">
          <img src="${p.photo || 'img/hero.jpg'}" alt="Photo de ${UI.esc(p.name)}" loading="lazy"
               onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#0f766e,#134e4a)'">
          <div class="pc-badges">
            ${p.verified ? '<span class="badge">✓ Vérifié</span>' : ''}
            ${dist}
          </div>
          <button class="pc-fav ${fav ? 'active' : ''}" onclick="event.stopPropagation();App.toggleFav('${p.id}', this)"
                  aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${fav ? '❤️' : '🤍'}</button>
        </div>
        <div class="pc-body">
          <span class="pc-cat">${cat.ico} ${UI.esc(cat.label)}</span>
          <h3 class="pc-name" onclick="location.hash='#/pro/${p.id}'">${UI.esc(p.name)}</h3>
          <p class="pc-company">${UI.esc(p.company)} · ${UI.esc(p.city)}</p>
          ${UI.stars(rating, count)}
          <div class="pc-meta">
            <span class="price">${UI.esc(p.price)} ${UI.esc(p.priceUnit)}</span>
            <span>${p.experience} ans d’exp.</span>
          </div>
          <div class="pc-foot">
            <span class="muted">⚡ ${UI.esc(p.responseTime)}</span>
            <button class="btn-small" onclick="location.hash='#/pro/${p.id}'">Voir le profil →</button>
          </div>
        </div>
      </article>`;
  },

  toggleFav(proId, btn) {
    const r = DB.toggleFavorite(proId);
    if (r.error) { UI.toast(r.error); location.hash = '#/connexion'; return; }
    UI.toast(r.fav ? '❤️ Ajouté aux favoris' : 'Retiré des favoris', r.fav ? 'success' : '');
    if (btn) btn.textContent = r.fav ? '❤️' : '🤍';
    btn.classList.toggle('active', r.fav);
    this.updateShell();
  },

  /* ═══ SEARCH ═══ */
  bindSearch() {
    const panel = document.getElementById('filtersPanel');
    const toggle = document.getElementById('filtersToggle');
    toggle.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      if (open) {
        const s = document.createElement('div');
        s.id = 'filtersScrim';
        s.style.cssText = 'position:fixed;inset:0;background:rgba(2,6,23,.5);z-index:135';
        s.addEventListener('click', () => this.closeFilters());
        document.body.appendChild(s);
      } else this.closeFilters();
    });
    document.getElementById('filtersReset').addEventListener('click', () => {
      ['fQ', 'fCat', 'fVille', 'fNote', 'fSort'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('fSort').value = 'reco';
      this.searchState = { q: '', cat: '', ville: '', note: 0, sort: 'reco', geo: this.searchState.geo };
      this.applySearch();
    });
    document.getElementById('searchEmptyReset').addEventListener('click', () => {
      document.getElementById('filtersReset').click();
    });
    ['fQ', 'fCat', 'fVille', 'fNote', 'fSort'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        this.syncSearchState();
        this.applySearch();
      });
      document.getElementById(id).addEventListener('input', () => {
        if (id === 'fQ') { this.syncSearchState(); this.applySearch(); }
      });
    });
    document.getElementById('fGeo').addEventListener('click', () => this.locate());
  },

  closeFilters() {
    document.getElementById('filtersPanel').classList.remove('open');
    const s = document.getElementById('filtersScrim');
    if (s) s.remove();
  },

  syncSearchState() {
    this.searchState.q = document.getElementById('fQ').value.trim();
    this.searchState.cat = document.getElementById('fCat').value;
    this.searchState.ville = document.getElementById('fVille').value;
    this.searchState.note = parseFloat(document.getElementById('fNote').value) || 0;
    this.searchState.sort = document.getElementById('fSort').value;
  },

  locate() {
    if (!navigator.geolocation) { UI.toast('Géolocalisation non supportée'); return; }
    UI.toast('📍 Localisation en cours…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.searchState.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        document.getElementById('fGeoLabel').textContent = '📍 Position détectée';
        document.getElementById('fGeoNote').textContent = 'Tri par distance activé.';
        UI.toast('✅ Position détectée !', 'success');
        this.applySearch();
      },
      () => { UI.toast('❌ Position refusée ou indisponible', 'error'); },
      { timeout: 8000 }
    );
  },

  renderSearch(params) {
    this.showView('view-search');
    const s = this.searchState;
    const fresh = !params.q && !params.cat && !params.ville && !params.note && !params.sort;
    s.q = params.q || (fresh ? '' : s.q || '');
    s.cat = params.cat || (fresh ? '' : s.cat) || '';
    s.ville = params.ville || (fresh ? '' : s.ville) || '';
    s.note = parseFloat(params.note) || (fresh ? 0 : s.note) || 0;
    s.sort = params.sort || (fresh ? 'reco' : s.sort) || 'reco';
    document.getElementById('fQ').value = s.q;
    document.getElementById('fCat').value = s.cat;
    document.getElementById('fVille').value = s.ville;
    document.getElementById('fNote').value = String(s.note);
    document.getElementById('fSort').value = s.sort;
    this.applySearch();
  },

  applySearch() {
    const s = this.searchState;
    let pros = DB.getPros();

    if (s.cat) pros = pros.filter(p => p.category === s.cat);
    if (s.ville) pros = pros.filter(p => p.city === s.ville);
    if (s.note) pros = pros.filter(p => displayRating(p.id) >= s.note);
    if (s.q) {
      const q = s.q.toLowerCase();
      pros = pros.filter(p => {
        const hay = [p.name, p.company, p.bio, p.city, catById(p.category).label, ...(p.specialties || [])].join(' ').toLowerCase();
        return hay.includes(q);
      });
    }

    // distances
    let distances = {};
    if (s.geo) {
      pros.forEach(p => { distances[p.id] = haversineKm(s.geo, { lat: p.lat, lng: p.lng }); });
    }

    // sort
    switch (s.sort) {
      case 'note': pros.sort((a, b) => displayRating(b.id) - displayRating(a.id)); break;
      case 'prix-asc': pros.sort((a, b) => a.price - b.price); break;
      case 'prix-desc': pros.sort((a, b) => b.price - a.price); break;
      case 'distance':
        if (s.geo) pros.sort((a, b) => distances[a.id] - distances[b.id]);
        else document.getElementById('fGeoNote').textContent = '📌 Cliquez sur « Pros autour de moi » pour trier par distance.';
        break;
      default:
        pros.sort((a, b) => (b.verified - a.verified) || (displayRating(b.id) - displayRating(a.id)) || (b.reviewsCount - a.reviewsCount));
    }

    // chips
    const chips = [];
    if (s.q) chips.push(`<span class="chip">« ${UI.esc(s.q)} »<span class="chip-remove" data-rm="q">✕</span></span>`);
    if (s.cat) chips.push(`<span class="chip">${catById(s.cat).label}<span class="chip-remove" data-rm="cat">✕</span></span>`);
    if (s.ville) chips.push(`<span class="chip">📍 ${UI.esc(s.ville)}<span class="chip-remove" data-rm="ville">✕</span></span>`);
    if (s.note) chips.push(`<span class="chip">★ ${String(s.note).replace('.', ',')}+<span class="chip-remove" data-rm="note">✕</span></span>`);
    const chipsEl = document.getElementById('searchChips');
    chipsEl.innerHTML = chips.join('');
    chipsEl.querySelectorAll('.chip-remove').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.rm;
        this.searchState[key] = key === 'note' ? 0 : '';
        document.getElementById(key === 'q' ? 'fQ' : key === 'note' ? 'fNote' : 'f' + key.charAt(0).toUpperCase() + key.slice(1)).value = key === 'note' ? '0' : '';
        this.applySearch();
      });
    });

    // count + title
    document.getElementById('searchTitle').textContent =
      (s.cat ? catById(s.cat).label : 'Découvrir les pros');
    document.getElementById('searchCount').textContent =
      `${pros.length} professionnel${pros.length > 1 ? 's' : ''} trouvé${pros.length > 1 ? 's' : ''}`;

    // results
    const res = document.getElementById('searchResults');
    const empty = document.getElementById('searchEmpty');
    if (!pros.length) {
      res.innerHTML = '';
      empty.classList.remove('hidden');
    } else {
      empty.classList.add('hidden');
      res.innerHTML = pros.map(p => this.proCard(p, { distance: distances[p.id] })).join('');
    }
  },

  /* ═══ PRO DETAIL ═══ */
  renderPro(id) {
    const pro = DB.getPro(id);
    if (!pro) { this.showView('view-notfound'); return; }
    this.showView('view-pro');
    const u = DB.currentUser();
    const isOwn = u && u.role === 'pro' && u.proId === pro.id;
    const cat = catById(pro.category);
    const rating = displayRating(pro.id);
    const count = DB.getReviews(pro.id).length;

    document.getElementById('proBreadcrumb').innerHTML = `
      <a href="#/">Accueil</a><span class="sep">›</span>
      <a href="#/recherche">Pros</a><span class="sep">›</span>
      <a href="#/recherche?cat=${pro.category}">${UI.esc(cat.label)}</a><span class="sep">›</span>
      <span>${UI.esc(pro.name)}</span>`;

    document.getElementById('proGallery').innerHTML = `
      <img class="pg-main" src="${pro.photo || 'img/hero.jpg'}" alt="Photo de ${UI.esc(pro.name)}"
           onerror="this.src='img/hero.jpg'">
      <span class="pg-count">📸 ${pro.gallery.length} photos</span>`;

    document.getElementById('proCat').textContent = cat.ico + ' ' + cat.label;
    document.getElementById('proName').textContent = pro.name;
    document.getElementById('proCompany').textContent = pro.company;
    const fav = DB.isFavorite(pro.id);
    document.getElementById('proFavBtn').innerHTML = fav ? '❤️ Favori' : '🤍 Favori';
    document.getElementById('proFavBtn').onclick = () => {
      const r = DB.toggleFavorite(pro.id);
      if (r.error) { UI.toast(r.error); location.hash = '#/connexion'; return; }
      document.getElementById('proFavBtn').innerHTML = r.fav ? '❤️ Favori' : '🤍 Favori';
      UI.toast(r.fav ? '❤️ Ajouté aux favoris' : 'Retiré des favoris', r.fav ? 'success' : '');
      this.updateShell();
    };

    document.getElementById('proMeta').innerHTML = `
      <span>${UI.stars(rating, count)}</span>
      <span>📍 <b>${UI.esc(pro.city)}</b></span>
      <span>💶 <b>${UI.esc(pro.price)} ${UI.esc(pro.priceUnit)}</b></span>
      <span>🎓 <b>${pro.experience} ans</b> d’expérience</span>
      ${pro.verified ? '<span class="badge green">✓ Pro vérifié</span>' : '<span class="badge gray">Non vérifié</span>'}`;

    document.getElementById('proBio').textContent = pro.bio;
    document.getElementById('proSpecs').innerHTML = (pro.specialties || []).map(sp => `<span class="chip">${UI.esc(sp)}</span>`).join('');

    document.getElementById('proServices').innerHTML = pro.services.map(sv => `
      <div class="svc-row">
        <div>
          <div class="svc-name">${UI.esc(sv.name)}</div>
          <div class="svc-desc">${UI.esc(sv.desc || '')}</div>
        </div>
        <span class="svc-price">${UI.esc(sv.price)}</span>
      </div>`).join('');

    document.getElementById('proAbout').innerHTML = `
      <p>${UI.esc(pro.bio)}</p>
      <div class="chips">
        <span class="chip">🏢 ${UI.esc(pro.company)}</span>
        <span class="chip">📞 ${UI.esc(pro.phone)}</span>
        <span class="chip">🏗️ ${pro.projects} projets réalisés</span>
        <span class="chip">⚡ Répond en ${UI.esc(pro.responseTime)}</span>
      </div>`;

    // Side info
    const sideInfo = document.getElementById('proSideInfo');
    sideInfo.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
        ${UI.avatarHtml(pro.name, 'lg')}
        <div><b style="font-size:17px">${UI.esc(pro.name)}</b><br><small class="muted">${UI.esc(pro.company)}</small></div>
      </div>
      <div class="side-info-row"><span>Tarif</span><b>${UI.esc(pro.price)} ${UI.esc(pro.priceUnit)}</b></div>
      <div class="side-info-row"><span>Réponse</span><b>⚡ ${UI.esc(pro.responseTime)}</b></div>
      <div class="side-info-row"><span>Projets</span><b>${pro.projects}</b></div>
      <div class="side-info-row"><span>Ville</span><b>${UI.esc(pro.city)}</b></div>`;

    const quoteBtn = document.getElementById('proQuoteBtn');
    const bookBtn = document.getElementById('proBookBtn');
    const chatBtn = document.getElementById('proChatBtn');
    if (isOwn) {
      quoteBtn.outerHTML = `<a class="btn-primary full" href="#/tableau-de-bord/profil">✏️ Modifier mon profil</a>`;
      document.getElementById('proBookBtn').remove();
      document.getElementById('proChatBtn').remove();
    } else {
      quoteBtn.onclick = () => this.openQuoteModal(pro);
      bookBtn.onclick = () => this.openBookingModal(pro);
      chatBtn.onclick = () => {
        if (!DB.currentUser()) { UI.toast('Connectez-vous pour envoyer un message.'); location.hash = '#/connexion'; return; }
        location.hash = '#/messages/' + pro.id;
      };
    }

    // Availability
    const dayLbl = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    document.getElementById('proAvail').innerHTML = dayLbl.map((d, i) =>
      `<div class="day ${pro.availability.includes(i) ? 'ok' : ''}"><b>${d}</b>${pro.availability.includes(i) ? '✓' : '—'}</div>`).join('');

    // Reviews
    this.renderProReviews(pro);

    // Similar
    const similar = DB.getPros().filter(p => p.category === pro.category && p.id !== pro.id).slice(0, 3);
    const body = document.querySelector('#view-pro .pro-layout');
    let simEl = document.getElementById('proSimilar');
    if (similar.length) {
      if (!simEl) {
        body.insertAdjacentHTML('afterend', `<div class="container similar-title" id="proSimilarWrap"><h2>Pros similaires</h2><div id="proSimilar" class="pros-grid"></div></div>`);
        simEl = document.getElementById('proSimilar');
      }
      simEl.innerHTML = similar.map(p => this.proCard(p)).join('');
    } else if (simEl && document.getElementById('proSimilarWrap')) {
      document.getElementById('proSimilarWrap').remove();
    }
  },

  renderProReviews(pro) {
    const reviews = DB.getReviews(pro.id);
    const el = document.getElementById('proReviews');
    if (!reviews.length) {
      el.innerHTML = '<p class="muted">Aucun avis pour le moment. Soyez le premier !</p>';
    } else {
      el.innerHTML = reviews.map(r => `
        <div class="review">
          ${UI.avatarHtml(r.author)}
          <div class="r-body">
            <div class="r-head">
              <b>${UI.esc(r.author)}</b>
              ${UI.stars(r.rating)}
              <span class="r-date">${UI.timeAgo(r.createdAt)}</span>
            </div>
            <p>${UI.esc(r.comment)}</p>
          </div>
        </div>`).join('');
    }
    document.getElementById('proReviewBtn').onclick = () => this.openReviewModal(pro);
  },

  openQuoteModal(pro) {
    const u = DB.currentUser();
    if (!u) { UI.toast('Connectez-vous pour demander un devis.'); location.hash = '#/connexion'; return; }
    const m = UI.modal(`
      <div class="modal-head"><h3>📋 Demander un devis</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <div class="modal-body">
        <p class="muted" style="margin-bottom:8px">Devis à : <b>${UI.esc(pro.company)}</b> (${UI.esc(pro.city)})</p>
        <label for="qService">Prestation</label>
        <select id="qService">${pro.services.map((s, i) => `<option>${UI.esc(s.name)}</option>`).join('')}<option>Autre demande</option></select>
        <label for="qDetails">Décrivez votre projet</label>
        <textarea id="qDetails" rows="4" placeholder="Surface, pièces, état actuel, attentes…"></textarea>
        <div class="form-row">
          <div><label for="qBudget">Budget estimé</label><input id="qBudget" type="text" placeholder="ex : 2 500 – 3 000 €"></div>
          <div><label for="qDate">Date souhaitée</label><input id="qDate" type="date"></div>
        </div>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close>Annuler</button>
        <button class="btn-primary" id="qSend">Envoyer la demande →</button>
      </div>`);
    m.q('#qDate').min = localIso(new Date());
    m.q('#qSend').addEventListener('click', () => {
      const service = m.q('#qService').value;
      const details = m.q('#qDetails').value.trim();
      const budget = m.q('#qBudget').value.trim();
      const date = m.q('#qDate').value;
      if (!details) { UI.toast('Décrivez votre projet (2 lignes minimum)', 'error'); return; }
      const r = DB.addQuote({ proId: pro.id, service, details, budget, date });
      if (r.error) { UI.toast(r.error, 'error'); return; }
      m.close();
      UI.toast('✅ Devis envoyé ! Le pro répond en général sous 24 h.', 'success');
      DB.logActivity('📋', `Demande de devis : ${service} (${pro.company}).`);
      this.updateShell();
    });
  },

  openBookingModal(pro) {
    const u = DB.currentUser();
    if (!u) { UI.toast('Connectez-vous pour réserver un créneau.'); location.hash = '#/connexion'; return; }
    const times = ['09:00', '10:30', '14:00', '15:30', '17:00'];
    const m = UI.modal(`
      <div class="modal-head"><h3>📅 Réserver un créneau</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <div class="modal-body">
        <p class="muted" style="margin-bottom:8px">Avec : <b>${UI.esc(pro.company)}</b> — ${UI.esc(pro.price)} ${UI.esc(pro.priceUnit)}</p>
        <label for="bService">Prestation</label>
        <select id="bService">${pro.services.map((s, i) => `<option>${UI.esc(s.name)}</option>`).join('')}<option>Autre</option></select>
        <label for="bDate">Date</label>
        <input id="bDate" type="date">
        <label>Horaire</label>
        <div class="time-slots" id="bSlots">${times.map(t => `<button type="button" class="time-slot" data-t="${t}">${t}</button>`).join('')}</div>
        <label for="bNotes">Notes <small class="muted">(optionnel)</small></label>
        <textarea id="bNotes" rows="2" placeholder="Adresse, accès, précisions…"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close>Annuler</button>
        <button class="btn-accent" id="bSend">Confirmer la réservation</button>
      </div>`);
    const min = new Date();
    m.q('#bDate').min = localIso(min);
    m.q('#bDate').max = localIso(new Date(Date.now() + 45 * 864e5));
    m.q('#bDate').value = localIso(new Date(Date.now() + 864e5));
    let picked = null;
    m.q('#bSlots').addEventListener('click', e => {
      const b = e.target.closest('.time-slot');
      if (!b) return;
      m.q('#bSlots').querySelectorAll('.time-slot').forEach(x => x.classList.remove('on'));
      b.classList.add('on');
      picked = b.dataset.t;
    });
    m.q('#bSend').addEventListener('click', () => {
      const service = m.q('#bService').value;
      const date = m.q('#bDate').value;
      const notes = m.q('#bNotes').value.trim();
      if (!date) { UI.toast('Choisissez une date', 'error'); return; }
      if (!picked) { UI.toast('Choisissez un horaire', 'error'); return; }
      const r = DB.addBooking({ proId: pro.id, service, date, time: picked, notes });
      if (r.error) { UI.toast(r.error, 'error'); return; }
      m.close();
      UI.toast('✅ Demande de réservation envoyée !', 'success');
      DB.logActivity('📅', `Réservation : ${service} (${pro.company}).`);
      this.updateShell();
    });
  },

  openReviewModal(pro) {
    const u = DB.currentUser();
    if (!u) { UI.toast('Connectez-vous pour laisser un avis.'); location.hash = '#/connexion'; return; }
    let rating = 5;
    const m = UI.modal(`
      <div class="modal-head"><h3>⭐ Votre avis sur ${UI.esc(pro.name)}</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <div class="modal-body">
        <label>Note</label>
        <div class="rate-picker" id="rp">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-v="${i}" aria-label="${i} étoiles">★</button>`).join('')}</div>
        <label for="rvComment">Votre avis</label>
        <textarea id="rvComment" rows="4" placeholder="Qualité, ponctualité, rapport qualité/prix…"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn-secondary" data-close>Annuler</button>
        <button class="btn-primary" id="rvSend">Publier l’avis</button>
      </div>`);
    const pick = m.q('#rp');
    pick.querySelectorAll('button').forEach(b => {
      b.classList.toggle('on', Number(b.dataset.v) <= rating);
      b.addEventListener('click', () => {
        rating = Number(b.dataset.v);
        pick.querySelectorAll('button').forEach(x => x.classList.toggle('on', Number(x.dataset.v) <= rating));
      });
    });
    m.q('#rvSend').addEventListener('click', () => {
      const comment = m.q('#rvComment').value.trim();
      if (!comment) { UI.toast('Écrivez un petit commentaire', 'error'); return; }
      const r = DB.addReview({ proId: pro.id, rating, comment });
      if (r.error) { UI.toast(r.error, 'error'); return; }
      m.close();
      UI.toast('⭐ Merci pour votre avis !', 'success');
      DB.logActivity('⭐', `Nouvel avis ${rating}★ sur ${pro.company}.`);
      this.renderPro(pro.id);
      this.updateShell();
    });
  },

  /* ═══ AUTH ═══ */
  bindAuth() {
    const setMode = mode => {
      document.getElementById('formLogin').classList.toggle('hidden', mode !== 'login');
      document.getElementById('formRegister').classList.toggle('hidden', mode !== 'register');
      document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
      document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
    };
    document.getElementById('tabLogin').addEventListener('click', () => setMode('login'));
    document.getElementById('tabRegister').addEventListener('click', () => setMode('register'));
    document.querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => setMode(b.dataset.goto)));

    document.querySelectorAll('.chip-demo').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('loginEmail').value = chip.dataset.email;
        document.getElementById('loginPass').value = chip.dataset.pass;
        document.getElementById('formLogin').requestSubmit();
      });
    });

    document.getElementById('formLogin').addEventListener('submit', e => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const pass = document.getElementById('loginPass').value;
      const r = DB.login(email, pass);
      if (r.error) {
        document.getElementById('loginError').textContent = r.error;
        return;
      }
      document.getElementById('loginError').textContent = '';
      UI.toast('👋 Bonjour ' + r.user.name.split(' ')[0] + ' !', 'success');
      this.updateShell();
      location.hash = r.user.role === 'admin' ? '#/admin' : '#/tableau-de-bord';
    });

    document.getElementById('formRegister').addEventListener('submit', e => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const pass = document.getElementById('regPass').value;
      const pass2 = document.getElementById('regPass2').value;
      const city = document.getElementById('regCity').value;
      const phone = document.getElementById('regPhone').value.trim();
      const role = document.querySelector('input[name="regRole"]:checked').value;
      const err = document.getElementById('regError');
      if (pass !== pass2) { err.textContent = 'Les mots de passe ne correspondent pas.'; return; }
      const r = DB.register({ name, email, pass, city, phone, role });
      if (r.error) { err.textContent = r.error; return; }
      err.textContent = '';
      UI.toast('🎉 Compte créé ! Bienvenue sur House Business.', 'success');
      this.updateShell();
      location.hash = '#/tableau-de-bord';
    });
  },

  renderAuth(mode, roleParam) {
    this.showView('view-auth');
    const login = document.getElementById('formLogin');
    const reg = document.getElementById('formRegister');
    login.classList.toggle('hidden', mode !== 'login');
    reg.classList.toggle('hidden', mode !== 'register');
    document.getElementById('tabLogin').classList.toggle('active', mode === 'login');
    document.getElementById('tabRegister').classList.toggle('active', mode === 'register');
    if (roleParam === 'pro') {
      document.querySelector('input[name="regRole"][value="pro"]').checked = true;
      document.getElementById('tabRegister').click();
    }
    if (DB.currentUser()) {
      UI.toast('Vous êtes déjà connecté(e).');
      location.hash = '#/tableau-de-bord';
    }
  },

  /* ═══ DASHBOARD ═══ */
  renderDashboard(tab) {
    const u = DB.currentUser();
    if (!u) { UI.toast('Connectez-vous pour accéder à votre espace.'); location.hash = '#/connexion'; return; }
    if (u.role === 'admin') { location.hash = '#/admin'; return; }
    this.showView('view-dashboard');

    const isPro = u.role === 'pro';
    const pro = isPro ? DB.proOfUser(u) : null;
    const tabs = isPro ? [
      ['apercu', '📊', 'Aperçu'],
      ['demandes', '📋', 'Demandes'],
      ['reservations', '📅', 'Réservations'],
      ['calendrier', '🗓️', 'Calendrier'],
      ['avis', '⭐', 'Avis reçus'],
      ['profil', '🧰', 'Mon profil pro']
    ] : [
      ['apercu', '📊', 'Aperçu'],
      ['devis', '📋', 'Mes devis'],
      ['reservations', '📅', 'Réservations'],
      ['favoris', '🤍', 'Favoris'],
      ['avis', '⭐', 'Mes avis'],
      ['messages', '💬', 'Messages']
    ];
    if (!tabs.some(t => t[0] === tab)) tab = 'apercu';

    document.getElementById('dashUserCard').innerHTML = `
      ${UI.avatarHtml(u.name)}
      <div><b>${UI.esc(u.name)}</b><small>${isPro ? '🧰 ' + UI.esc(pro ? pro.company : 'Professionnel') : '🙋 Compte client'}</small></div>`;
    document.getElementById('dashNav').innerHTML = tabs.map(t =>
      `<button data-tab="${t[0]}" class="${t[0] === tab ? 'active' : ''}"><span>${t[1]}</span>${t[2]}</button>`).join('');
    document.getElementById('dashTabs').innerHTML = tabs.map(t =>
      `<button data-tab="${t[0]}" class="${t[0] === tab ? 'active' : ''}">${t[1]} ${t[2]}</button>`).join('');
    document.querySelectorAll('#dashNav button, #dashTabs button').forEach(b => {
      b.addEventListener('click', () => { location.hash = '#/tableau-de-bord/' + b.dataset.tab; });
    });

    const content = document.getElementById('dashContent');
    if (isPro) {
      if (!pro) { content.innerHTML = '<div class="card"><p>Profil pro introuvable.</p></div>'; return; }
      switch (tab) {
        case 'apercu': content.innerHTML = this.dashProApercu(u, pro); break;
        case 'demandes': content.innerHTML = this.dashProDemandes(u, pro); break;
        case 'reservations': content.innerHTML = this.dashProReservations(u, pro); break;
        case 'calendrier': this.dashProCalendrier(content, u, pro); break;
        case 'avis': content.innerHTML = this.dashProAvis(u, pro); break;
        case 'profil': content.innerHTML = this.dashProProfil(u, pro, 'pf'); this.bindProForm(content, pro, 'pf'); break;
      }
    } else {
      switch (tab) {
        case 'apercu': content.innerHTML = this.dashClientApercu(u); break;
        case 'devis': content.innerHTML = this.dashClientDevis(u); break;
        case 'reservations': content.innerHTML = this.dashClientReservations(u); break;
        case 'favoris': content.innerHTML = this.dashClientFavoris(u); break;
        case 'avis': content.innerHTML = this.dashClientAvis(u); break;
        case 'messages': content.innerHTML = this.dashClientMessages(u); break;
      }
    }
  },

  dashClientApercu(u) {
    const quotes = DB.getQuotesForClient();
    const bookings = DB.getBookingsForClient();
    const favs = DB.getFavorites();
    const reviews = DB.getReviewsByUser();
    const upcoming = bookings.filter(b => b.date >= localIso(new Date()) && b.status !== 'annulee').slice(0, 3);
    return `
      <div class="stat-grid">
        <div class="stat-card"><div class="s-ico">📋</div><b>${quotes.length}</b><span>Devis envoyés</span></div>
        <div class="stat-card"><div class="s-ico">📅</div><b>${upcoming.length}</b><span>Réservations à venir</span></div>
        <div class="stat-card"><div class="s-ico">🤍</div><b>${favs.length}</b><span>Pros favoris</span></div>
        <div class="stat-card"><div class="s-ico">⭐</div><b>${reviews.length}</b><span>Avis laissés</span></div>
      </div>
      ${upcoming.length ? `
      <div class="card list-card" style="margin-bottom:18px">
        <h3 style="margin-bottom:8px">📅 Prochaines réservations</h3>
        ${upcoming.map(b => {
          const pro = DB.getPro(b.proId);
          return `<div class="booking-row">
            ${fmtDayBox(b.date)}
            <div style="flex:1"><b>${UI.esc(b.service)}</b><br><small class="muted">${UI.esc(pro ? pro.company : '')} · ${b.time}</small></div>
            ${statusBadge(b.status)}
          </div>`;
        }).join('')}
      </div>` : ''}
      <div class="card list-card" style="margin-bottom:18px">
        <h3 style="margin-bottom:8px">📋 Devis récents</h3>
        ${quotes.slice(0, 3).map(q => {
          const pro = DB.getPro(q.proId);
          return `<div class="booking-row">
            <div class="b-date" style="background:var(--accent-soft);color:var(--accent-strong)"><small>DEVIS</small></div>
            <div style="flex:1"><b>${UI.esc(q.service)}</b><br><small class="muted">${UI.esc(pro ? pro.company : '')} · ${UI.fmtDate(q.date)}</small></div>
            ${statusBadge(q.status)}
          </div>`;
        }).join('') || '<p class="muted">Aucun devis pour le moment.</p>'}
      </div>
      <div class="card">
        <h3 style="margin-bottom:12px">🚀 Actions rapides</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn-primary" href="#/recherche">🔍 Trouver un pro</a>
          <a class="btn-secondary" href="#/tableau-de-bord/devis">📋 Mes devis</a>
          <a class="btn-secondary" href="#/tableau-de-bord/favoris">🤍 Mes favoris</a>
        </div>
      </div>`;
  },

  dashClientDevis() {
    const quotes = DB.getQuotesForClient();
    if (!quotes.length) return '<div class="empty"><span class="empty-icon">📋</span><h3>Aucun devis</h3><p>Demandez un devis à un pro depuis sa fiche.</p><a class="btn-primary" href="#/recherche">Trouver un pro</a></div>';
    return `<div style="display:flex;flex-direction:column;gap:14px">
      ${quotes.map(q => {
        const pro = DB.getPro(q.proId);
        const st = STATUS_META[q.status];
        return `<div class="quote-card">
          <div class="q-body">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <h3>${UI.esc(q.service)}</h3>${statusBadge(q.status)}
            </div>
            <div class="q-meta">
              <span>🏢 ${UI.esc(pro ? pro.company : '')}</span>
              <span>💶 ${UI.esc(q.budget || '—')}</span>
              <span>📅 ${UI.fmtDate(q.date)}</span>
              <span>🕒 ${UI.timeAgo(q.createdAt)}</span>
            </div>
            <p style="margin-top:8px;font-size:14px">${UI.esc(q.details)}</p>
            ${q.proReply ? `<div class="q-reply ${q.status === 'refusee' ? 'refused' : ''}"><b>Réponse du pro :</b><br>${UI.esc(q.proReply)}</div>` : ''}
          </div>
          <div class="item-actions">
            ${q.status === 'repondue' || q.status === 'acceptee' ? `<button class="btn-sm btn-primary" onclick="location.hash='#/messages/${q.proId}'">💬 Discuter</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  dashClientReservations() {
    const bookings = DB.getBookingsForClient();
    if (!bookings.length) return '<div class="empty"><span class="empty-icon">📅</span><h3>Aucune réservation</h3><p>Réservez un créneau depuis la fiche d’un pro.</p><a class="btn-primary" href="#/recherche">Trouver un pro</a></div>';
    return `<div class="card list-card">
      ${bookings.map(b => {
        const pro = DB.getPro(b.proId);
        return `<div class="booking-row">
          ${fmtDayBox(b.date)}
          <div style="flex:1"><b>${UI.esc(b.service)}</b><br><small class="muted">${UI.esc(pro ? pro.company : '')} · ${b.time}${b.notes ? ' · ' + UI.esc(b.notes) : ''}</small></div>
          ${statusBadge(b.status)}
          <div class="item-actions">
            ${b.status === 'en_attente' ? `<button class="btn-sm btn-secondary" onclick="App.cancelBooking('${b.id}')">Annuler</button>` : ''}
            <button class="btn-sm btn-secondary" onclick="location.hash='#/messages/${b.proId}'">💬</button>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  cancelBooking(id) {
    UI.confirm('Annuler la réservation ?', 'Cette action est irréversible.', 'Annuler la réservation').then(ok => {
      if (ok) { DB.setBookingStatus(id, 'annulee'); UI.toast('Réservation annulée'); this.renderDashboard('reservations'); }
    });
  },

  dashClientFavoris() {
    const favs = DB.getFavorites();
    if (!favs.length) return '<div class="empty"><span class="empty-icon">🤍</span><h3>Aucun favori</h3><p>Cliquez sur le cœur d’un pro pour le retrouver ici.</p><a class="btn-primary" href="#/recherche">Découvrir les pros</a></div>';
    return `<div class="pros-grid">${favs.map(p => this.proCard(p)).join('')}</div>`;
  },

  dashClientAvis() {
    const reviews = DB.getReviewsByUser();
    if (!reviews.length) return '<div class="empty"><span class="empty-icon">⭐</span><h3>Aucun avis</h3><p>Partagez votre expérience après un chantier.</p><a class="btn-primary" href="#/recherche">Découvrir les pros</a></div>';
    return `<div class="card list-card">
      ${reviews.map(r => {
        const pro = DB.getPro(r.proId);
        return `<div class="review">
          ${UI.avatarHtml(pro ? pro.company : 'Pro')}
          <div class="r-body">
            <div class="r-head"><b>${UI.esc(pro ? pro.company : '')}</b>${UI.stars(r.rating)}<span class="r-date">${UI.timeAgo(r.createdAt)}</span></div>
            <p>${UI.esc(r.comment)}</p>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  dashClientMessages() {
    const convs = DB.getConversationsForUser();
    if (!convs.length) return '<div class="empty"><span class="empty-icon">💬</span><h3>Aucune conversation</h3><p>Contactez un pro depuis sa fiche.</p><a class="btn-primary" href="#/recherche">Trouver un pro</a></div>';
    return `<div class="card list-card">
      ${convs.map(c => `<div class="booking-row" style="cursor:pointer" onclick="location.hash='#/messages/${c.pro.id}'">
        ${UI.avatarHtml(c.pro.name)}
        <div style="flex:1"><b>${UI.esc(c.pro.company)}</b><br><small class="muted">${UI.esc(c.last.text.slice(0, 60))}</small></div>
        <small class="muted">${UI.timeAgo(c.last.ts)}</small>
      </div>`).join('')}
    </div>`;
  },

  dashProApercu(u, pro) {
    const quotes = DB.getQuotesForPro().filter(q => q.status === 'envoyee');
    const bookings = DB.getBookingsForPro();
    const upcoming = bookings.filter(b => b.date >= localIso(new Date()) && b.status !== 'annulee');
    const done = bookings.filter(b => b.status === 'terminee').length;
    const rating = displayRating(pro.id);
    const reviews = DB.getReviews(pro.id);
    return `
      <div class="stat-grid">
        <div class="stat-card"><div class="s-ico">📋</div><b>${quotes.length}</b><span>Devis à traiter</span></div>
        <div class="stat-card"><div class="s-ico">📅</div><b>${upcoming.length}</b><span>Réservations à venir</span></div>
        <div class="stat-card"><div class="s-ico">⭐</div><b>${String(rating).replace('.', ',')}/5</b><span>${reviews.length} avis</span></div>
        <div class="stat-card"><div class="s-ico">🏗️</div><b>${done}</b><span>Chantiers terminés</span></div>
      </div>
      ${quotes.length ? `
      <div class="card list-card" style="margin-bottom:18px">
        <h3 style="margin-bottom:8px">⏳ Demandes de devis en attente</h3>
        ${quotes.slice(0, 3).map(q => {
          const client = DB.getUser(q.userId);
          return `<div class="booking-row">
            <div class="b-date" style="background:var(--accent-soft);color:var(--accent-strong)"><small>DEVIS</small></div>
            <div style="flex:1"><b>${UI.esc(q.service)}</b><br><small class="muted">${UI.esc(client ? client.name : 'Client')} · ${UI.fmtDate(q.date)}</small></div>
            <button class="btn-sm btn-primary" onclick="App.openProReply('${q.id}')">Répondre</button>
          </div>`;
        }).join('')}
      </div>` : ''}
      ${upcoming.length ? `
      <div class="card list-card" style="margin-bottom:18px">
        <h3 style="margin-bottom:8px">📅 Prochaines réservations</h3>
        ${upcoming.slice(0, 3).map(b => {
          const client = DB.getUser(b.userId);
          return `<div class="booking-row">
            ${fmtDayBox(b.date)}
            <div style="flex:1"><b>${UI.esc(b.service)}</b><br><small class="muted">${UI.esc(client ? client.name : 'Client')} · ${b.time}</small></div>
            ${statusBadge(b.status)}
            ${b.status === 'en_attente' ? `<button class="btn-sm btn-primary" onclick="App.confirmBooking('${b.id}')">Confirmer</button>` : ''}
          </div>`;
        }).join('')}
      </div>` : ''}
      <div class="card">
        <h3 style="margin-bottom:12px">🚀 Actions rapides</h3>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a class="btn-primary" href="#/tableau-de-bord/profil">✏️ Modifier mon profil</a>
          <a class="btn-secondary" href="#/tableau-de-bord/calendrier">🗓️ Mon calendrier</a>
          <a class="btn-secondary" href="#/pro/${pro.id}">👁️ Voir ma fiche publique</a>
        </div>
      </div>`;
  },

  dashProDemandes() {
    const quotes = DB.getQuotesForPro();
    if (!quotes.length) return '<div class="empty"><span class="empty-icon">📋</span><h3>Aucune demande</h3><p>Les devis demandés par les clients apparaîtront ici.</p></div>';
    return `<div style="display:flex;flex-direction:column;gap:14px">
      ${quotes.map(q => {
        const client = DB.getUser(q.userId);
        const name = client ? client.name : 'Client';
        return `<div class="quote-card">
          <div class="q-body">
            <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
              <h3>${UI.esc(q.service)}</h3>${statusBadge(q.status)}
            </div>
            <div class="q-meta">
              <span>👤 ${UI.esc(name)}</span>
              <span>💶 ${UI.esc(q.budget || '—')}</span>
              <span>📅 ${UI.fmtDate(q.date)}</span>
              <span>🕒 ${UI.timeAgo(q.createdAt)}</span>
            </div>
            <p style="margin-top:8px;font-size:14px">${UI.esc(q.details)}</p>
            ${q.proReply ? `<div class="q-reply ${q.status === 'refusee' ? 'refused' : ''}"><b>Votre réponse :</b><br>${UI.esc(q.proReply)}</div>` : ''}
          </div>
          <div class="item-actions">
            ${q.status === 'envoyee' ? `<button class="btn-sm btn-primary" onclick="App.openProReply('${q.id}')">✍️ Répondre</button>` : ''}
            ${client ? `<button class="btn-sm btn-secondary" onclick="location.hash='#/messages/${client.id}'">💬</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  dashProReservations() {
    const bookings = DB.getBookingsForPro();
    if (!bookings.length) return '<div class="empty"><span class="empty-icon">📅</span><h3>Aucune réservation</h3><p>Les réservations de vos clients apparaîtront ici.</p></div>';
    return `<div class="card list-card">
      ${bookings.map(b => {
        const client = DB.getUser(b.userId);
        return `<div class="booking-row">
          ${fmtDayBox(b.date)}
          <div style="flex:1"><b>${UI.esc(b.service)}</b><br><small class="muted">${UI.esc(client ? client.name : 'Client')} · ${b.time}${b.notes ? ' · ' + UI.esc(b.notes) : ''}</small></div>
          ${statusBadge(b.status)}
          <div class="item-actions">
            ${b.status === 'en_attente' ? `<button class="btn-sm btn-primary" onclick="App.confirmBooking('${b.id}')">Confirmer</button>` : ''}
            ${b.status === 'confirmee' ? `<button class="btn-sm btn-secondary" onclick="App.finishBooking('${b.id}')">Terminer</button>` : ''}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  bindProForm(scope, pro, idp) {
    const form = scope.querySelector('#' + idp + 'Form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const avails = [];
      scope.querySelectorAll('input[data-day]').forEach(c => { if (c.checked) avails.push(Number(c.dataset.day)); });
      DB.saveProEdit(pro.id, {
        company: document.getElementById(idp + 'Company').value.trim(),
        price: parseFloat(document.getElementById(idp + 'Price').value) || pro.price,
        category: document.getElementById(idp + 'Cat').value,
        city: document.getElementById(idp + 'City').value,
        bio: document.getElementById(idp + 'Bio').value.trim(),
        specialties: document.getElementById(idp + 'Specs').value.split(',').map(s => s.trim()).filter(Boolean),
        availability: avails.length ? avails : [1, 2, 3, 4, 5],
        photo: document.getElementById(idp + 'Photo').value.trim()
      });
      UI.toast('✅ Profil pro mis à jour !', 'success');
    });
  },

  confirmBooking(id) {
    DB.setBookingStatus(id, 'confirmee');
    UI.toast('✅ Réservation confirmée, le client a été notifié.', 'success');
    this.updateShell();
    this.renderDashboard('reservations');
  },
  finishBooking(id) {
    DB.setBookingStatus(id, 'terminee');
    UI.toast('🏁 Chantier marqué comme terminé.');
    this.renderDashboard('reservations');
  },

  openProReply(qId) {
    const db = DB.seedIfNeeded();
    const q = db.quotes.find(x => x.id === qId);
    if (!q) return;
    const client = DB.getUser(q.userId);
    const m = UI.modal(`
      <div class="modal-head"><h3>✍️ Répondre au devis</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
      <div class="modal-body">
        <p class="muted" style="margin-bottom:8px"><b>${UI.esc(q.service)}</b> — ${UI.esc(client ? client.name : 'Client')}<br>${UI.esc(q.details.slice(0, 140))}${q.details.length > 140 ? '…' : ''}</p>
        <label for="prText">Votre réponse</label>
        <textarea id="prText" rows="4" placeholder="Prix, disponibilités, conditions…"></textarea>
      </div>
      <div class="modal-foot">
        <button class="btn-danger" id="prRefuse">Refuser</button>
        <button class="btn-secondary" data-close>Annuler</button>
        <button class="btn-primary" id="prSend">Envoyer la réponse</button>
      </div>`);
    m.q('#prSend').addEventListener('click', () => {
      const text = m.q('#prText').value.trim();
      if (!text) { UI.toast('Écrivez votre réponse', 'error'); return; }
      DB.replyQuote(qId, text, true);
      m.close();
      UI.toast('✅ Réponse envoyée au client !', 'success');
      DB.logActivity('📋', `Devis accepté : ${q.service}.`);
      this.updateShell();
      this.renderDashboard('demandes');
    });
    m.q('#prRefuse').addEventListener('click', () => {
      DB.replyQuote(qId, 'Nous ne pouvons malheureusement pas donner suite à cette demande.', false);
      m.close();
      UI.toast('Devis refusé');
      this.renderDashboard('demandes');
    });
  },

  dashProCalendrier(content, u, pro) {
    const bookings = DB.getBookingsForPro().filter(b => b.status !== 'annulee');
    const y = this.calMonth.getFullYear();
    const mo = this.calMonth.getMonth();
    const monthName = new Date(y, mo).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const first = new Date(y, mo, 1);
    const startDow = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const bksOfMonth = bookings.filter(b => b.date.slice(0, 7) === localIso(first).slice(0, 7));

    let grid = '<div class="cal-grid">' + ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < startDow; i++) grid += '<div class="cal-day other"></div>';
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, mo, d);
      const iso = localIso(date);
      const has = bookings.filter(b => b.date === iso).length;
      const isToday = date.getTime() === today.getTime();
      grid += `<div class="cal-day ${isToday ? 'today' : ''} ${has ? 'has-booking' : ''}" data-iso="${iso}">${d}</div>`;
    }
    grid += '</div>';

    content.innerHTML = `
      <div class="card cal-card">
        <div style="flex:1;min-width:300px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <button class="icon-btn" id="calPrev" aria-label="Mois précédent">←</button>
            <b style="text-transform:capitalize">${UI.esc(monthName)}</b>
            <button class="icon-btn" id="calNext" aria-label="Mois suivant">→</button>
          </div>
          ${grid}
        </div>
        <div class="cal-side" id="calSide">
          <h3 style="margin-bottom:10px">📅 Rendez-vous du mois</h3>
          ${bksOfMonth.length ? bksOfMonth.sort((a, b) => a.date.localeCompare(b.date)).map(b => {
            const client = DB.getUser(b.userId);
            return `<div class="booking-row">
              ${fmtDayBox(b.date)}
              <div style="flex:1"><b>${UI.esc(b.service)}</b><br><small class="muted">${UI.esc(client ? client.name : 'Client')} · ${b.time}</small></div>
              ${statusBadge(b.status)}
            </div>`;
          }).join('') : '<p class="muted">Aucun rendez-vous ce mois-ci.</p>'}
        </div>
      </div>`;
    document.getElementById('calPrev').addEventListener('click', () => {
      this.calMonth = new Date(y, mo - 1, 1);
      this.dashProCalendrier(content, u, pro);
    });
    document.getElementById('calNext').addEventListener('click', () => {
      this.calMonth = new Date(y, mo + 1, 1);
      this.dashProCalendrier(content, u, pro);
    });
    content.querySelector('.cal-grid').addEventListener('click', e => {
      const day = e.target.closest('.cal-day[data-iso]');
      if (!day || !day.dataset.iso) return;
      const iso = day.dataset.iso;
      const dayBks = bookings.filter(b => b.date === iso);
      const side = document.getElementById('calSide');
      if (!dayBks.length) {
        side.innerHTML = `<h3 style="margin-bottom:10px">📅 ${new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3><p class="muted">Aucun rendez-vous ce jour-là.</p>`;
        return;
      }
      side.innerHTML = `<h3 style="margin-bottom:10px">📅 ${new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>` +
        dayBks.map(b => {
          const client = DB.getUser(b.userId);
          return `<div class="booking-row">
            <div class="b-date"><small>${b.time.slice(0, 2)}</small>${b.time.slice(3)}</div>
            <div style="flex:1"><b>${UI.esc(b.service)}</b><br><small class="muted">${UI.esc(client ? client.name : 'Client')}</small></div>
            ${statusBadge(b.status)}
          </div>`;
        }).join('');
    });
  },

  dashProAvis() {
    const reviews = DB.getReviews(DB.proOfUser(DB.currentUser()).id);
    if (!reviews.length) return '<div class="empty"><span class="empty-icon">⭐</span><h3>Aucun avis reçu</h3><p>Les avis de vos clients apparaîtront ici.</p></div>';
    return `<div class="card list-card">
      ${reviews.map(r => `<div class="review">
        ${UI.avatarHtml(r.author)}
        <div class="r-body">
          <div class="r-head"><b>${UI.esc(r.author)}</b>${UI.stars(r.rating)}<span class="r-date">${UI.timeAgo(r.createdAt)}</span></div>
          <p>${UI.esc(r.comment)}</p>
        </div>
      </div>`).join('')}
    </div>`;
  },

  dashProProfil(u, pro, idp) {
    idp = idp || 'pf';
    const categories = HB_CATEGORIES.map(c => `<option value="${c.id}" ${c.id === pro.category ? 'selected' : ''}>${UI.esc(c.label)}</option>`).join('');
    const cities = HB_CITIES.map(c => `<option ${c.name === pro.city ? 'selected' : ''}>${UI.esc(c.name)}</option>`).join('');
    const dayLbl = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const avails = dayLbl.map((d, i) => `
      <label style="display:flex;align-items:center;gap:8px;font-weight:500;font-size:14px;margin:6px 0">
        <input type="checkbox" data-day="${i}" ${pro.availability.includes(i) ? 'checked' : ''} style="width:auto"> ${d}
      </label>`).join('');
    return `
      <div class="card">
        <h3 style="margin-bottom:6px">🧰 Mon profil professionnel</h3>
        <p class="muted" style="margin-bottom:14px">Ces informations sont visibles publiquement sur votre fiche. ${pro.verified ? '<span class="badge green">✓ Vérifié</span>' : '<span class="badge gray">En attente de vérification</span>'}</p>
        <form id="${idp}Form">
          <div class="form-row">
            <div><label for="${idp}Company">Nom de l’entreprise</label><input id="${idp}Company" value="${UI.esc(pro.company)}"></div>
            <div><label for="${idp}Price">Tarif horaire (€)</label><input id="${idp}Price" type="number" min="0" value="${pro.price}"></div>
          </div>
          <div class="form-row">
            <div><label for="${idp}Cat">Métier</label><select id="${idp}Cat">${categories}</select></div>
            <div><label for="${idp}City">Ville</label><select id="${idp}City">${cities}</select></div>
          </div>
          <label for="${idp}Bio">Bio</label>
          <textarea id="${idp}Bio" rows="3">${UI.esc(pro.bio)}</textarea>
          <label for="${idp}Specs">Spécialités <small class="muted">(séparées par des virgules)</small></label>
          <input id="${idp}Specs" value="${UI.esc((pro.specialties || []).join(', '))}">
          <label>Jours d’intervention</label>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr))">${avails}</div>
          <label for="${idp}Photo">Photo de profil <small class="muted">(URL ou laisser vide)</small></label>
          <input id="${idp}Photo" value="${UI.esc(pro.photo || '')}" placeholder="https://…">
          <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap">
            <button class="btn-primary" type="submit">💾 Enregistrer</button>
            <a class="btn-secondary" href="#/pro/${pro.id}">👁️ Voir ma fiche</a>
          </div>
        </form>
      </div>`;
  },

  /* ═══ MESSAGES ═══ */
  renderMessages(threadId) {
    const u = DB.currentUser();
    if (!u) { UI.toast('Connectez-vous pour accéder à la messagerie.'); location.hash = '#/connexion'; return; }
    this.showView('view-messages');
    document.getElementById('msgListPane').classList.remove('hidden');
    document.getElementById('msgThreadPane').classList.remove('open');
    this.renderMsgList();
    if (threadId) this.openMsgThread(threadId);
    else this.setMsgPlaceholder();
  },

  renderMsgList() {
    const u = DB.currentUser();
    const list = document.getElementById('msgList');
    const isPro = u.role === 'pro';
    const convs = isPro ? DB.getConversationsForPro() : DB.getConversationsForUser();
    if (!convs.length) {
      list.innerHTML = '<div class="notif-empty">💬 Aucune conversation.<br><br><a class="btn-primary" href="#/recherche">Trouver un pro</a></div>';
      return;
    }
    list.innerHTML = convs.map(c => {
      const last = c.last;
      const unread = last && !last.read && ((isPro && last.from === 'user') || (!isPro && last.from === 'pro'));
      const who = isPro ? c.user : c.pro;
      const id = isPro ? c.userId : c.pro.id;
      return `
        <div class="msg-preview ${unread ? 'unread' : ''} ${this._msgThread === id ? 'active' : ''}" data-thread="${id}">
          ${UI.avatarHtml(who.name)}
          <div class="mp-body">
            <b>${UI.esc(isPro ? c.user.name : c.pro.company)}</b>
            <p>${UI.esc(last.text.slice(0, 70))}</p>
          </div>
          <span class="mp-time">${UI.timeAgo(last.ts)}</span>
        </div>`;
    }).join('');
    list.querySelectorAll('.msg-preview').forEach(el => {
      el.addEventListener('click', () => this.openMsgThread(el.dataset.thread));
    });
  },

  setMsgPlaceholder() {
    const head = document.getElementById('msgThreadHead');
    const body = document.getElementById('msgThreadBody');
    head.innerHTML = '<b>Messagerie</b>';
    body.innerHTML = '<div class="notif-empty" style="margin:auto"><span class="empty-icon">💬</span><p>Sélectionnez une conversation<br>ou contactez un pro depuis sa fiche.</p></div>';
    document.getElementById('msgComposer').classList.add('hidden');
  },

  openMsgThread(id) {
    const u = DB.currentUser();
    const isPro = u.role === 'pro';
    const convs = isPro ? DB.getConversationsForPro() : DB.getConversationsForUser();
    const conv = convs.find(c => isPro ? c.userId === id : c.pro.id === id);
    if (!conv) { this.setMsgPlaceholder(); return; }
    this._msgThread = id;
    const pane = document.getElementById('msgThreadPane');
    pane.classList.add('open');
    if (isPro) {
      DB.markConvReadForPro(id, conv.pro.id);
      const head = document.getElementById('msgThreadHead');
      head.innerHTML = `<button class="icon-btn back-btn" id="msgBack" aria-label="Retour">←</button>
        ${UI.avatarHtml(conv.user.name)}
        <div><b>${UI.esc(conv.user.name)}</b><br><small class="muted">Client · ${UI.esc(conv.user.city || '')}</small></div>`;
    } else {
      DB.markConvRead(conv.pro.id);
      const head = document.getElementById('msgThreadHead');
      head.innerHTML = `<button class="icon-btn back-btn" id="msgBack" aria-label="Retour">←</button>
        ${UI.avatarHtml(conv.pro.name)}
        <div><b>${UI.esc(conv.pro.company)}</b><br><small class="muted">${UI.esc(conv.pro.category)} · ${UI.esc(conv.pro.city)}</small></div>`;
    }
    document.getElementById('msgBack').addEventListener('click', () => {
      pane.classList.remove('open');
      location.hash = '#/messages';
    });
    this.renderMsgThread(conv, isPro);
    this.renderMsgList();
    this.updateShell();
  },

  renderMsgThread(conv, isPro) {
    const body = document.getElementById('msgThreadBody');
    const composer = document.getElementById('msgComposer');
    composer.classList.remove('hidden');
    let lastDay = '';
    body.innerHTML = conv.msgs.map(m => {
      const day = new Date(m.ts).toLocaleDateString('fr-FR');
      let html = '';
      if (day !== lastDay) html += `<div class="msg-day">${day}</div>`;
      lastDay = day;
      const me = isPro ? m.from === 'pro' : m.from === 'user';
      return html + `<div class="bubble ${me ? 'me' : 'them'}">${UI.esc(m.text)}<span class="b-time">${new Date(m.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span></div>`;
    }).join('');
    body.scrollTop = body.scrollHeight;

    composer.onsubmit = e => {
      e.preventDefault();
      const input = document.getElementById('msgInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      if (isPro) {
        DB.proSendMessage(conv.userId, conv.pro.id, text);
        conv.msgs.push({ from: 'pro', text, ts: Date.now(), read: true });
        this.renderMsgThread(conv, true);
      } else {
        DB.sendMessage(conv.pro.id, text);
        conv.msgs.push({ from: 'user', text, ts: Date.now(), read: true });
        this.renderMsgThread(conv, false);
        this.updateShell();
        // Réponse automatique du pro (simulation temps réel)
        if (this._replyTimer) clearTimeout(this._replyTimer);
        const u = DB.currentUser();
        const proId = conv.pro.id;
        this._replyTimer = setTimeout(() => {
          const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
          if (location.hash === '#/messages/' + proId && DB.currentUser() && DB.currentUser().id === u.id) {
            DB.proReplyMessage(u.id, proId, reply);
            conv.msgs.push({ from: 'pro', text: reply, ts: Date.now(), read: false });
            this.renderMsgThread(conv, false);
            this.renderMsgList();
            this.updateShell();
          }
        }, 1600);
      }
    };
  },

  closeThreadMobile() {
    document.getElementById('msgThreadPane').classList.remove('open');
    this.renderMsgList();
  },

  /* ═══ ADMIN ═══ */
  renderAdmin() {
    const u = DB.currentUser();
    if (!u || u.role !== 'admin') {
      UI.toast('Accès réservé aux administrateurs.');
      location.hash = u ? '#/tableau-de-bord' : '#/connexion';
      return;
    }
    this.showView('view-admin');
    const box = document.getElementById('adminContent');
    box.innerHTML = `
      <div class="admin-tabs" id="adminTabs">
        <button data-atab="overview" class="active">📊 Vue d’ensemble</button>
        <button data-atab="users">👥 Utilisateurs</button>
        <button data-atab="pros">🧰 Pros</button>
        <button data-atab="activity">🕒 Activité</button>
      </div>
      <div id="adminPane"></div>`;
    document.querySelectorAll('#adminTabs button').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#adminTabs button').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        this.renderAdminPane(b.dataset.atab);
      });
    });
    this.renderAdminPane('overview');
  },

  renderAdminPane(tab) {
    const pane = document.getElementById('adminPane');
    const st = DB.stats();
    if (tab === 'overview') {
      pane.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card"><div class="s-ico">👥</div><b>${st.users}</b><span>Utilisateurs</span></div>
          <div class="stat-card"><div class="s-ico">🧰</div><b>${st.pros}</b><span>Pros (${st.verifiedPros} vérifiés)</span></div>
          <div class="stat-card"><div class="s-ico">📋</div><b>${st.quotes}</b><span>Devis échangés</span></div>
          <div class="stat-card"><div class="s-ico">📅</div><b>${st.bookings}</b><span>Réservations</span></div>
          <div class="stat-card"><div class="s-ico">⭐</div><b>${st.avgRating}</b><span>Note moyenne (${st.reviews} avis)</span></div>
          <div class="stat-card"><div class="s-ico">🤍</div><b>${st.favorites}</b><span>Favoris enregistrés</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px" class="admin-charts">
          <div class="card"><h3>📈 Inscriptions — 30 derniers jours</h3><div class="chart-box"><canvas id="chartLine"></canvas></div></div>
          <div class="card"><h3>📊 Demandes par métier</h3><div class="chart-box"><canvas id="chartBars"></canvas></div>
            <div class="chart-legend" id="chartLegend"></div>
          </div>
        </div>
        <div class="card" style="margin-top:18px">
          <h3 style="margin-bottom:10px">🕒 Activité récente</h3>
          ${DB.getActivity().slice(0, 8).map(a => `<div class="activity-item"><span class="a-ico">${a.ico}</span><div><span>${UI.esc(a.text)}</span><br><small class="muted">${UI.timeAgo(a.ts)}</small></div></div>`).join('')}
        </div>`;
      (window.requestAnimationFrame || (fn => setTimeout(fn, 0)))(() => this.drawAdminCharts());
    } else if (tab === 'users') {
      const users = DB.users;
      pane.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Utilisateur</th><th>E-mail</th><th>Rôle</th><th>Inscrit</th><th>Actions</th></tr></thead>
          <tbody>
          ${users.map(uu => `<tr>
            <td>${UI.avatarHtml(uu.name)} <b>${UI.esc(uu.name)}</b>${uu.id === DB.session ? ' <span class="badge">vous</span>' : ''}</td>
            <td>${UI.esc(uu.email)}</td>
            <td>${uu.role === 'admin' ? '<span class="badge red">Admin</span>' : uu.role === 'pro' ? '<span class="badge gold">Pro</span>' : '<span class="badge gray">Client</span>'}</td>
            <td class="muted">${UI.fmtDate(uu.createdAt)}</td>
            <td>
              <div style="display:flex;gap:6px">
                ${uu.role !== 'admin' ? `
                  <button class="btn-sm btn-secondary" onclick="App.setUserRole('${uu.id}','${uu.role === 'pro' ? 'client' : 'pro'}')">${uu.role === 'pro' ? '→ Client' : '→ Pro'}</button>
                  <button class="btn-sm btn-danger" onclick="App.deleteUser('${uu.id}')">Suppr.</button>` : '<span class="muted">—</span>'}
              </div>
            </td>
          </tr>`).join('')}
          </tbody>
        </table></div>`;
    } else if (tab === 'pros') {
      const pros = DB.getPros();
      pane.innerHTML = `
        <div class="table-wrap"><table>
          <thead><tr><th>Pro</th><th>Entreprise</th><th>Métier</th><th>Ville</th><th>Note</th><th>Tarif</th><th>Statut</th></tr></thead>
          <tbody>
          ${pros.map(p => `<tr>
            <td>${UI.avatarHtml(p.name)} <b>${UI.esc(p.name)}</b></td>
            <td>${UI.esc(p.company)}</td>
            <td>${catById(p.category).label}</td>
            <td>${UI.esc(p.city)}</td>
            <td>${UI.stars(displayRating(p.id))}</td>
            <td>${UI.esc(p.price)} ${UI.esc(p.priceUnit)}</td>
            <td>${p.verified
              ? '<span class="badge green">✓ Vérifié</span>'
              : `<button class="btn-sm btn-primary" onclick="App.verifyPro('${p.id}')">✓ Vérifier</button>`}</td>
          </tr>`).join('')}
          </tbody>
        </table></div>`;
    } else if (tab === 'activity') {
      pane.innerHTML = `<div class="card list-card">
        ${DB.getActivity().map(a => `<div class="activity-item"><span class="a-ico">${a.ico}</span><div><span>${UI.esc(a.text)}</span><br><small class="muted">${new Date(a.ts).toLocaleString('fr-FR')}</small></div></div>`).join('')}
      </div>`;
    }
  },

  setUserRole(id, role) {
    DB.updateUser(id, { role });
    DB.logActivity('👥', `Rôle modifié pour un utilisateur (${role}).`);
    UI.toast('Rôle mis à jour', 'success');
    this.renderAdminPane('users');
    this.updateShell();
  },
  deleteUser(id) {
    UI.confirm('Supprimer cet utilisateur ?', 'Ses données locales (devis, réservations, avis) resteront liées à son identifiant.', 'Supprimer').then(ok => {
      if (!ok) return;
      const db = DB.seedIfNeeded();
      db.users = db.users.filter(x => x.id !== id);
      DB.save(db);
      DB.logActivity('🗑️', 'Un utilisateur a été supprimé.');
      UI.toast('Utilisateur supprimé');
      this.renderAdminPane('users');
    });
  },
  verifyPro(proId) {
    const p = DB.getPro(proId);
    DB.saveProEdit(proId, { verified: !p.verified });
    DB.logActivity('✅', `${p.company} a été vérifié(e).`);
    UI.toast('✅ Pro vérifié !', 'success');
    this.renderAdminPane('pros');
  },

  drawAdminCharts() {
    const line = document.getElementById('chartLine');
    const bars = document.getElementById('chartBars');
    if (!line || !bars) return;
    const css = getComputedStyle(document.documentElement);
    const primary = css.getPropertyValue('--primary').trim() || '#0f766e';
    const muted = css.getPropertyValue('--muted').trim() || '#64748b';
    const lineC = css.getPropertyValue('--line').trim() || '#e2e8f0';

    // Signups (déterministe pour la démo)
    const labels = [], values = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 864e5);
      labels.push(d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }));
      values.push(Math.max(0, Math.round(6 + 4 * Math.sin(i / 3) + ((i * 2654435761) % 5))));
    }
    this.drawLine(line, labels, values, primary, muted, lineC);

    // Demandes par métier
    const catLabels = [], catValues = [], catColors = [];
    HB_CATEGORIES.forEach((c, i) => {
      const pros = DB.getPros().filter(p => p.category === c.id);
      const quotes = DB.seedIfNeeded().quotes.filter(q => pros.some(p => p.id === q.proId)).length;
      catLabels.push(c.label);
      catValues.push(pros.length * 3 + quotes + ((i * 7) % 5));
      catColors.push(['#0f766e', '#0ea5e9', '#8b5cf6', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#4f46e5'][i]);
    });
    this.drawBars(bars, catLabels, catValues, catColors, muted, lineC);
    const legend = document.getElementById('chartLegend');
    if (legend) {
      legend.innerHTML = catLabels.map((l, i) => `<span><i style="background:${catColors[i]}"></i>${UI.esc(l)}</span>`).join('');
    }
  },

  drawLine(canvas, labels, values, color, muted, lineC) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 220;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const pad = { t: 12, r: 10, b: 24, l: 32 };
    const max = Math.max(...values) * 1.2;
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const X = i => pad.l + (i / (values.length - 1)) * iw;
    const Y = v => pad.t + ih - (v / max) * ih;

    ctx.strokeStyle = lineC; ctx.fillStyle = muted; ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    for (let g = 0; g <= 3; g++) {
      const y = pad.t + (ih / 3) * g;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillText(String(Math.round(max - (max / 3) * g)), 4, y + 3);
    }
    const grad = ctx.createLinearGradient(0, pad.t, 0, h - pad.b);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + '00');
    ctx.beginPath();
    values.forEach((v, i) => i === 0 ? ctx.moveTo(X(i), Y(v)) : ctx.lineTo(X(i), Y(v)));
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.lineTo(X(values.length - 1), h - pad.b); ctx.lineTo(X(0), h - pad.b); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    values.forEach((v, i) => {
      ctx.beginPath(); ctx.arc(X(i), Y(v), 2.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    });
    for (let i = 0; i < labels.length; i += 5) {
      ctx.fillStyle = muted;
      ctx.fillText(labels[i], X(i) - 12, h - 7);
    }
  },

  drawBars(canvas, labels, values, colors, muted, lineC) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 300, h = canvas.clientHeight || 220;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    const pad = { t: 12, r: 8, b: 28, l: 30 };
    const max = Math.max(...values) * 1.15;
    const iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const bw = iw / values.length * 0.62;

    ctx.strokeStyle = lineC; ctx.fillStyle = muted; ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    for (let g = 0; g <= 3; g++) {
      const y = pad.t + (ih / 3) * g;
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(w - pad.r, y); ctx.stroke();
      ctx.fillText(String(Math.round(max - (max / 3) * g)), 4, y + 3);
    }
    values.forEach((v, i) => {
      const x = pad.l + (iw / values.length) * i + (iw / values.length - bw) / 2;
      const y = pad.t + ih - (v / max) * ih;
      const bh = (v / max) * ih;
      const grad = ctx.createLinearGradient(0, y, 0, y + bh);
      grad.addColorStop(0, colors[i] + 'dd'); grad.addColorStop(1, colors[i] + '88');
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, bw, bh, 4);
      else ctx.rect(x, y, bw, bh);
      ctx.fill();
      ctx.fillStyle = muted;
      ctx.save();
      ctx.translate(x + bw / 2, h - 10);
      ctx.rotate(-Math.PI / 3.2);
      ctx.fillText(String(labels[i]).slice(0, 8), 0, 0);
      ctx.restore();
    });
  },

  /* ═══ SETTINGS ═══ */
  bindSettings() {
    document.getElementById('settingsProfile').addEventListener('submit', e => {
      e.preventDefault();
      const u = DB.currentUser();
      if (!u) return;
      DB.updateUser(u.id, {
        name: document.getElementById('setName').value.trim() || u.name,
        phone: document.getElementById('setPhone').value.trim(),
        city: document.getElementById('setCity').value,
        bio: document.getElementById('setBio').value.trim()
      });
      UI.toast('✅ Profil mis à jour !', 'success');
      this.updateShell();
    });

    document.getElementById('setDark').addEventListener('change', e => {
      const dark = e.target.checked;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
      DB.saveSettings({ dark });
      document.getElementById('themeBtn').textContent = dark ? '☀️' : '🌙';
    });

    document.getElementById('settingsAssistant').addEventListener('submit', e => {
      e.preventDefault();
      Store.set({
        name: document.getElementById('setAgentName').value.trim(),
        apiKey: document.getElementById('setApiKey').value.trim()
      });
      UI.toast('✅ Assistant configuré !', 'success');
      Assistant.render();
    });

    document.getElementById('dangerReset').addEventListener('click', () => {
      UI.confirm('Réinitialiser la plateforme ?', 'Tous les comptes, devis, réservations et avis locaux seront remplacés par les données de démonstration.', 'Réinitialiser').then(ok => {
        if (!ok) return;
        DB.resetAll();
        UI.toast('♻️ Données réinitialisées');
        setTimeout(() => location.reload(), 600);
      });
    });
  },

  renderSettings() {
    const u = DB.currentUser();
    if (!u) { UI.toast('Connectez-vous pour accéder aux paramètres.'); location.hash = '#/connexion'; return; }
    this.showView('view-settings');
    document.getElementById('setName').value = u.name;
    document.getElementById('setPhone').value = u.phone || '';
    document.getElementById('setCity').value = u.city || '';
    document.getElementById('setBio').value = u.bio || '';
    document.getElementById('setDark').checked = DB.getSettings().dark;

    const cfg = Store.get();
    document.getElementById('setAgentName').value = cfg.name || 'Assistant HouseBusiness Pro';
    document.getElementById('setApiKey').value = cfg.apiKey || '';

    const box = document.getElementById('proSettingsBox');
    const pro = DB.proOfUser(u);
    if (pro) {
      box.innerHTML = this.dashProProfil(u, pro, 'sf');
      this.bindProForm(box, pro, 'sf');
    } else {
      box.innerHTML = '';
    }
  }
};

/* ── Démarrage ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => App.init());
