/* ═══════════════════════════════════════════════════════════════
   HOUSE BUSINESS — Couche données (localStorage, zéro backend)
   Démo : les données vivent dans le navigateur (privé, instantané).
   ═══════════════════════════════════════════════════════════════ */

const DB = {
  KEY: 'hb_platform_v1',

  /* ── Base ─────────────────────────────────────────────── */
  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || null; }
    catch (e) { return null; }
  },
  save(db) {
    localStorage.setItem(this.KEY, JSON.stringify(db));
  },
  uid(prefix) {
    return prefix + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  },

  /* ── Seed ─────────────────────────────────────────────── */
  seedIfNeeded() {
    if (this.load()) return this.load();
    const db = {
      version: 1,
      users: [],
      session: null,
      proEdits: {},
      favorites: {},          // userId -> [proId]
      quotes: [],
      bookings: [],
      reviews: [],
      conversations: {},      // "userId:proId" -> [msg]
      notifs: [],
      activity: [],
      settings: { dark: false }
    };

    // Comptes de démo
    const now = Date.now();
    db.users.push(
      { id: 'u_admin', name: 'Admin House Business', email: 'admin@housebusiness.fr', pass: 'admin123', role: 'admin', phone: '', city: 'Paris', bio: 'Administrateur de la plateforme.', createdAt: now },
      { id: 'u_client', name: 'Marie Dupont', email: 'client@demo.fr', pass: 'demo123', role: 'client', phone: '+33 6 10 20 30 40', city: 'Paris', bio: 'Propriétaire en quête de travaux de rénovation.', createdAt: now - 40 * 864e5 },
      { id: 'u_pro', name: 'Karim Benali', email: 'pro@demo.fr', pass: 'demo123', role: 'pro', proId: 'p5', phone: '+33 6 55 44 33 22', city: 'Paris', bio: 'Artisan peintre — Peinture Premium. Finitions soignées.', createdAt: now - 200 * 864e5 }
    );
    db.favorites['u_client'] = ['p1', 'p5', 'p9'];

    // Avis seed (2 par pro)
    db.reviews = [];
    HB_PROS.forEach((pro, i) => {
      for (let k = 0; k < 2; k++) {
        const r = HB_REVIEW_POOL[(i * 2 + k) % HB_REVIEW_POOL.length];
        db.reviews.push({
          id: this.uid('rev'),
          proId: pro.id, userId: 'seed_' + i + k,
          author: r.name, rating: Math.max(4, Math.round((pro.rating + (k === 0 ? -0.2 : 0.1)) * 10) / 10),
          comment: r.text, createdAt: now - (i * 7 + k * 3) * 864e5
        });
      }
    });

    // Devis entrant pour le pro démo (p5)
    db.quotes.push(
      {
        id: this.uid('q'), userId: 'u_client', proId: 'p5', service: 'Rénovation appartement T3',
        details: 'Appartement 68 m² à repeindre entièrement (murs + plafonds). 2 chambres, salon, couloir. Peinture blanche/beige.',
        budget: '2 500 – 3 000 €', date: now + 2 * 864e5, status: 'repondue',
        proReply: 'Bonjour Marie, merci pour votre demande ! Le T3 est tout à fait dans mes cordes. Je peux passer l’estimer gratuitement cette semaine : 2 800 € TTC tout compris, peinture sans COV. Dispo jeudi ou vendredi. 🎨',
        createdAt: now - 2 * 864e5
      },
      {
        id: this.uid('q'), userId: 'u_seed', proId: 'p5', service: 'Peinture d’une chambre',
        details: 'Chambre 14 m², besoin d’un rafraîchissement complet : rebouchage, ponçage, 2 couches. Couleur terracotta.',
        budget: '400 – 500 €', date: now + 5 * 864e5, status: 'envoyee', proReply: '',
        createdAt: now - 1 * 864e5
      }
    );

    // Réservations pour le pro démo (dates au format YYYY-MM-DD)
    const isoDay = d => {
      const p = n => String(n).padStart(2, '0');
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
    };
    db.bookings.push(
      { id: this.uid('b'), userId: 'u_client', proId: 'p5', service: 'Rénovation appartement T3', date: isoDay(new Date(now + 4 * 864e5)), time: '09:00', status: 'confirmee', createdAt: now - 1 * 864e5 },
      { id: this.uid('b'), userId: 'u_seed2', proId: 'p5', service: 'Peinture d’une chambre', date: isoDay(new Date(now - 12 * 864e5)), time: '14:00', status: 'terminee', createdAt: now - 30 * 864e5 },
      { id: this.uid('b'), userId: 'u_client', proId: 'p1', service: 'Visite conseil sur site', date: isoDay(new Date(now + 6 * 864e5)), time: '10:30', status: 'confirmee', createdAt: now - 3 * 864e5 }
    );

    // Conversation seed entre client démo et pro p5
    db.conversations['u_client:p5'] = [
      { id: this.uid('m'), from: 'pro', text: 'Bonjour Marie 👋 J’ai bien reçu votre demande de devis. Le créneau de jeudi vous convient-il ?', ts: now - 2 * 864e5, read: true },
      { id: this.uid('m'), from: 'user', text: 'Bonjour Karim ! Oui jeudi 9h c’est parfait, je vous attends.', ts: now - 2 * 864e5 + 3600e3, read: true }
    ];
    db.conversations['u_client:p1'] = [
      { id: this.uid('m'), from: 'user', text: 'Bonjour, êtes-vous disponible pour une extension de 20 m² ?', ts: now - 3 * 864e5, read: true },
      { id: this.uid('m'), from: 'pro', text: 'Bonjour Marie, avec plaisir ! Je vous envoie un créneau de visite conseil cette semaine.', ts: now - 3 * 864e5 + 1800e3, read: true }
    ];

    // Notifications initiales
    db.notifs.push(
      { id: this.uid('n'), userId: 'u_client', type: 'bienvenue', text: 'Bienvenue Marie ! Explorez les pros vérifiés près de chez vous.', ts: now, read: false },
      { id: this.uid('n'), userId: 'u_client', type: 'devis', text: 'Karim Benali (Peinture Premium) a répondu à votre devis.', proId: 'p5', ts: now - 2 * 864e5, read: false },
      { id: this.uid('n'), userId: 'u_pro', type: 'devis', text: 'Nouvelle demande de devis pour "Rénovation appartement T3".', ts: now - 1 * 864e5, read: false },
      { id: this.uid('n'), userId: 'u_pro', type: 'reservation', text: 'Marie Dupont a réservé : Rénovation appartement T3 (jeudi 09:00).', ts: now - 1 * 864e5, read: false },
      { id: this.uid('n'), userId: 'u_admin', type: 'system', text: 'Plateforme initialisée. Bienvenue dans l’espace admin.', ts: now, read: false }
    );

    db.activity.push(
      { ico: '🚀', text: 'Plateforme House Business initialisée (données de démonstration).', ts: now },
      { ico: '👤', text: 'Marie Dupont s’est inscrite.', ts: now - 40 * 864e5 },
      { ico: '🧰', text: 'Karim Benali a rejoint en tant que professionnel (Peinture Premium).', ts: now - 200 * 864e5 },
      { ico: '📋', text: 'Demande de devis reçue : Rénovation appartement T3.', ts: now - 2 * 864e5 }
    );

    this.save(db);
    return db;
  },

  /* ── Utilisateurs & session ───────────────────────────── */
  get users() { return this.seedIfNeeded().users; },

  findUser(email) {
    const e = String(email || '').trim().toLowerCase();
    return this.users.find(u => u.email.toLowerCase() === e) || null;
  },
  getUser(id) { return this.users.find(u => u.id === id) || null; },
  currentUser() {
    const db = this.seedIfNeeded();
    return this.getUser(db.session) || null;
  },
  login(email, pass) {
    const db = this.seedIfNeeded();
    const u = this.findUser(email);
    if (!u || u.pass !== pass) return { error: 'E-mail ou mot de passe incorrect.' };
    db.session = u.id;
    this.save(db);
    return { user: u };
  },
  register(data) {
    const db = this.seedIfNeeded();
    if (this.findUser(data.email)) return { error: 'Un compte existe déjà avec cet e-mail.' };
    if (!data.name || !data.email || !data.pass) return { error: 'Tous les champs sont requis.' };
    if (String(data.pass).length < 6) return { error: 'Le mot de passe doit contenir au moins 6 caractères.' };
    const u = {
      id: this.uid('u'), name: data.name.trim(), email: data.email.trim().toLowerCase(),
      pass: data.pass, role: data.role === 'pro' ? 'pro' : 'client',
      phone: data.phone || '', city: data.city || 'Paris', bio: data.bio || '',
      proId: data.role === 'pro' ? this.uid('p') : null, createdAt: Date.now()
    };
    db.users.push(u);
    if (u.role === 'pro') {
      db.proEdits[u.proId] = {
        name: u.name.split(' ')[0] || u.name, company: 'Ma nouvelle entreprise',
        category: 'peintre', city: u.city || 'Paris', price: 35, priceUnit: '€/h',
        bio: 'Entreprise nouvellement inscrite sur House Business.', specialties: [],
        services: [{ name: 'Devis sur mesure', desc: 'Décrivez votre projet', price: 'Sur devis' }],
        availability: [1, 2, 3, 4, 5], verified: false, photo: ''
      };
    }
    db.session = u.id;
    db.notifs.push({ id: this.uid('n'), userId: u.id, type: 'bienvenue', text: `Bienvenue ${u.name.split(' ')[0]} ! Votre compte est prêt. 🎉`, ts: Date.now(), read: false });
    this.save(db);
    return { user: u };
  },
  updateUser(id, patch) {
    const db = this.seedIfNeeded();
    const u = this.getUser(id);
    if (!u) return;
    Object.assign(u, patch);
    this.save(db);
  },
  logout() {
    const db = this.seedIfNeeded();
    db.session = null;
    this.save(db);
  },

  /* ── Pros (catalogue + éditions pro) ───────────────────── */
  getPros() {
    const db = this.seedIfNeeded();
    const merged = HB_PROS.map(p => {
      const edit = db.proEdits[p.id];
      return edit ? { ...p, ...edit } : p;
    });
    // Pros créés via inscription (absents du catalogue statique)
    Object.keys(db.proEdits).forEach(id => {
      if (!HB_PROS.some(p => p.id === id)) {
        merged.push(this.mergeNewPro(id, db.proEdits[id]));
      }
    });
    return merged;
  },
  mergeNewPro(id, edit) {
    const city = HB_CITIES.find(c => c.name === edit.city) || HB_CITIES[0];
    return {
      id, name: edit.name || 'Pro', company: edit.company || 'Entreprise',
      category: edit.category || 'peintre', city: edit.city || 'Paris',
      rating: 0, reviewsCount: 0, verified: false, featured: false,
      price: edit.price != null ? edit.price : 35, priceUnit: edit.priceUnit || '€/h',
      experience: 0, projects: 0, photo: edit.photo || '',
      gallery: edit.photo ? [edit.photo] : [], bio: edit.bio || '',
      specialties: edit.specialties || [],
      services: edit.services && edit.services.length ? edit.services : [{ name: 'Devis sur mesure', desc: 'Décrivez votre projet', price: 'Sur devis' }],
      availability: edit.availability || [1, 2, 3, 4, 5],
      responseTime: '< 24 h', lat: city.lat, lng: city.lng, phone: ''
    };
  },
  getPro(id) { return this.getPros().find(p => p.id === id) || null; },
  saveProEdit(proId, patch) {
    const db = this.seedIfNeeded();
    db.proEdits[proId] = { ...(db.proEdits[proId] || {}), ...patch };
    this.save(db);
  },
  proOfUser(user) {
    if (!user || user.role !== 'pro' || !user.proId) return null;
    return this.getPro(user.proId) || null;
  },
  /* Un pro "catalogue" peut être rattaché à un compte : proId == user.proId */
  proHasAccount(proId) {
    return this.users.some(u => u.role === 'pro' && u.proId === proId);
  },

  /* ── Favoris ───────────────────────────────────────────── */
  toggleFavorite(proId) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return { error: 'Connectez-vous pour enregistrer des favoris.' };
    const favs = db.favorites[u.id] || (db.favorites[u.id] = []);
    const i = favs.indexOf(proId);
    if (i >= 0) { favs.splice(i, 1); this.save(db); return { fav: false }; }
    favs.push(proId);
    this.save(db);
    return { fav: true };
  },
  isFavorite(proId) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return false;
    return (db.favorites[u.id] || []).includes(proId);
  },
  getFavorites() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return [];
    return (db.favorites[u.id] || [])
      .map(id => this.getPro(id))
      .filter(Boolean);
  },

  /* ── Devis ─────────────────────────────────────────────── */
  addQuote({ proId, service, details, budget, date }) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return { error: 'Connectez-vous pour envoyer un devis.' };
    const q = {
      id: this.uid('q'), userId: u.id, proId, service, details, budget, date,
      status: 'envoyee', proReply: '', createdAt: Date.now()
    };
    db.quotes.push(q);
    this.pushNotifToPro(proId, { type: 'devis', text: `${u.name} a envoyé une demande de devis : "${service}".`, proId });
    db.activity.unshift({ ico: '📋', text: `Demande de devis reçue : ${service}.`, ts: Date.now() });
    if (db.activity.length > 60) db.activity.pop();
    this.save(db);
    return { quote: q };
  },
  getQuotesForClient() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return [];
    return db.quotes.filter(q => q.userId === u.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  getQuotesForPro() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    const pro = this.proOfUser(u);
    if (!pro) return [];
    return db.quotes.filter(q => q.proId === pro.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  replyQuote(qId, reply, accept) {
    const db = this.seedIfNeeded();
    const q = db.quotes.find(x => x.id === qId);
    if (!q) return;
    q.proReply = reply;
    q.status = accept ? 'acceptee' : 'refusee';
    const client = this.getUser(q.userId);
    this.pushNotif(q.userId, {
      type: accept ? 'devis' : 'devis',
      text: accept
        ? `Bonne nouvelle ! Votre devis "${q.service}" a été accepté par ${this.getPro(q.proId).company}.`
        : `Le pro a répondu à votre devis "${q.service}" (voir le détail).`,
      proId: q.proId
    });
    this.save(db);
  },

  /* ── Réservations ──────────────────────────────────────── */
  addBooking({ proId, service, date, time, notes }) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return { error: 'Connectez-vous pour réserver un créneau.' };
    const b = {
      id: this.uid('b'), userId: u.id, proId, service, date, time,
      notes: notes || '', status: 'en_attente', createdAt: Date.now()
    };
    db.bookings.push(b);
    this.pushNotifToPro(proId, { type: 'reservation', text: `${u.name} a réservé : "${service}" le ${new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à ${time}.`, proId });
    this.save(db);
    return { booking: b };
  },
  getBookingsForClient() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return [];
    return db.bookings.filter(b => b.userId === u.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  getBookingsForPro() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    const pro = this.proOfUser(u);
    if (!pro) return [];
    return db.bookings.filter(b => b.proId === pro.id)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
  setBookingStatus(bId, status) {
    const db = this.seedIfNeeded();
    const b = db.bookings.find(x => x.id === bId);
    if (!b) return;
    b.status = status;
    if (status === 'confirmee') {
      this.pushNotif(b.userId, { type: 'reservation', text: `✅ Votre réservation "${b.service}" (${new Date(b.date + 'T12:00:00').toLocaleDateString('fr-FR')} à ${b.time}) a été confirmée par le pro.`, proId: b.proId });
    }
    this.save(db);
  },

  /* ── Avis ──────────────────────────────────────────────── */
  addReview({ proId, rating, comment }) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return { error: 'Connectez-vous pour laisser un avis.' };
    const r = {
      id: this.uid('rev'), proId, userId: u.id, author: u.name,
      rating: Math.min(5, Math.max(1, Math.round(rating))), comment, createdAt: Date.now()
    };
    db.reviews.push(r);
    this.pushNotifToPro(proId, { type: 'avis', text: `${u.name} a laissé un avis ${r.rating}★ sur votre profil.`, proId });
    this.save(db);
    return { review: r };
  },
  getReviews(proId) {
    const db = this.seedIfNeeded();
    return db.reviews.filter(r => r.proId === proId).sort((a, b) => b.createdAt - a.createdAt);
  },
  getReviewsByUser() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return [];
    return db.reviews.filter(r => r.userId === u.id).sort((a, b) => b.createdAt - a.createdAt);
  },

  /* ── Messagerie ─────────────────────────────────────────── */
  _convKey(userId, proId) { return userId + ':' + proId; },
  getConversation(proId) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return null;
    return db.conversations[this._convKey(u.id, proId)] || [];
  },
  sendMessage(proId, text) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return { error: 'Connectez-vous pour envoyer un message.' };
    const key = this._convKey(u.id, proId);
    if (!db.conversations[key]) db.conversations[key] = [];
    const msg = { id: this.uid('m'), from: 'user', text, ts: Date.now(), read: false };
    db.conversations[key].push(msg);
    this.pushNotifToPro(proId, { type: 'message', text: `${u.name} vous a envoyé un message.`, proId });
    this.save(db);
    return { msg };
  },
  proReplyMessage(userId, proId, text) {
    const db = this.seedIfNeeded();
    const key = this._convKey(userId, proId);
    if (!db.conversations[key]) db.conversations[key] = [];
    db.conversations[key].push({ id: this.uid('m'), from: 'pro', text, ts: Date.now(), read: false });
    this.pushNotif(userId, { type: 'message', text: `Nouveau message de ${this.getPro(proId).company}.`, proId });
    this.save(db);
  },
  getConversationsForUser() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return [];
    const out = [];
    Object.keys(db.conversations).forEach(key => {
      const [userId, proId] = key.split(':');
      if (userId === u.id) {
        const msgs = db.conversations[key];
        const pro = this.getPro(proId);
        if (pro) out.push({ pro, msgs, last: msgs[msgs.length - 1] });
      }
    });
    return out.sort((a, b) => b.last.ts - a.last.ts);
  },
  getConversationsForPro() {
    const db = this.seedIfNeeded();
    const pro = this.proOfUser(this.currentUser());
    if (!pro) return [];
    const out = [];
    Object.keys(db.conversations).forEach(key => {
      const [userId, proId] = key.split(':');
      if (proId === pro.id) {
        const msgs = db.conversations[key];
        const user = this.getUser(userId);
        if (user) out.push({ userId, pro, user, msgs, last: msgs[msgs.length - 1] });
      }
    });
    return out.sort((a, b) => b.last.ts - a.last.ts);
  },
  markConvRead(proId) {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return;
    const key = this._convKey(u.id, proId);
    (db.conversations[key] || []).forEach(m => { m.read = true; });
    this.save(db);
  },
  markConvReadForPro(userId, proId) {
    const db = this.seedIfNeeded();
    const key = this._convKey(userId, proId);
    (db.conversations[key] || []).forEach(m => { m.read = true; });
    this.save(db);
  },
  proSendMessage(userId, proId, text) {
    const db = this.seedIfNeeded();
    const key = this._convKey(userId, proId);
    if (!db.conversations[key]) db.conversations[key] = [];
    db.conversations[key].push({ id: this.uid('m'), from: 'pro', text, ts: Date.now(), read: true });
    this.save(db);
  },

  /* ── Notifications ──────────────────────────────────────── */
  pushNotif(userId, { type, text, proId }) {
    const db = this.seedIfNeeded();
    db.notifs.push({ id: this.uid('n'), userId, type, text, proId: proId || null, ts: Date.now(), read: false });
    if (db.notifs.length > 150) db.notifs = db.notifs.slice(-150);
  },
  pushNotifToPro(proId, n) {
    const owner = this.users.find(u => u.role === 'pro' && u.proId === proId);
    if (owner) this.pushNotif(owner.id, n);
  },
  getNotifs() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return [];
    return db.notifs.filter(n => n.userId === u.id).sort((a, b) => b.ts - a.ts);
  },
  unreadCount() {
    return this.getNotifs().filter(n => !n.read).length;
  },
  markNotifsRead() {
    const db = this.seedIfNeeded();
    const u = this.currentUser();
    if (!u) return;
    db.notifs.forEach(n => { if (n.userId === u.id) n.read = true; });
    this.save(db);
  },

  /* ── Réglages ───────────────────────────────────────────── */
  getSettings() {
    const db = this.seedIfNeeded();
    return db.settings;
  },
  saveSettings(patch) {
    const db = this.seedIfNeeded();
    db.settings = { ...db.settings, ...patch };
    this.save(db);
  },

  /* ── Admin ─────────────────────────────────────────────── */
  stats() {
    const db = this.seedIfNeeded();
    const allReviews = db.reviews;
    const avg = allReviews.length
      ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
      : '—';
    return {
      users: db.users.length,
      pros: this.getPros().length,
      verifiedPros: this.getPros().filter(p => p.verified).length,
      quotes: db.quotes.length,
      bookings: db.bookings.length,
      reviews: allReviews.length,
      avgRating: avg,
      favorites: Object.values(db.favorites).reduce((s, f) => s + f.length, 0)
    };
  },
  getActivity() {
    const db = this.seedIfNeeded();
    return db.activity.slice(0, 30);
  },
  logActivity(ico, text) {
    const db = this.seedIfNeeded();
    db.activity.unshift({ ico, text, ts: Date.now() });
    if (db.activity.length > 60) db.activity.pop();
    this.save(db);
  },
  resetAll() {
    localStorage.removeItem(this.KEY);
    this.seedIfNeeded();
  }
};
