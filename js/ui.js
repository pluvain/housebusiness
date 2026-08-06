/* ═══════════════════════════════════════════════════════════════
   HOUSE BUSINESS — Helpers UI (toasts, modales, formatage)
   ═══════════════════════════════════════════════════════════════ */

const UI = {
  esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  money(n) {
    if (n == null) return '—';
    return Number(n).toLocaleString('fr-FR') + ' €';
  },

  timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 60) return "à l'instant";
    const m = Math.floor(s / 60);
    if (m < 60) return 'il y a ' + m + ' min';
    const h = Math.floor(m / 60);
    if (h < 24) return 'il y a ' + h + ' h';
    const d = Math.floor(h / 24);
    if (d === 1) return 'hier';
    if (d < 30) return 'il y a ' + d + ' j';
    return 'il y a ' + Math.floor(d / 30) + ' mois';
  },

  fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  fmtDateLong(iso) {
    return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  },

  initials(name) {
    return String(name || '?').split(' ').filter(Boolean).slice(0, 2)
      .map(w => w[0].toUpperCase()).join('') || '?';
  },

  AVATAR_COLORS: ['#0f766e', '#0ea5e9', '#8b5cf6', '#db2777', '#ea580c', '#16a34a', '#ca8a04', '#4f46e5'],
  avatarHtml(name, sizeCls) {
    const n = String(name || '?');
    let h = 0;
    for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
    const color = this.AVATAR_COLORS[h % this.AVATAR_COLORS.length];
    return `<span class="avatar ${sizeCls || ''}" style="background:${color}" title="${this.esc(n)}">${this.esc(this.initials(n))}</span>`;
  },

  stars(rating, count) {
    const r = Number(rating) || 0;
    const full = Math.floor(r);
    const frac = r - full;
    let s = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= full) s += '★';
      else if (i === full + 1 && frac >= 0.25) {
        s += `<span class="star-box" aria-hidden="true">★<i style="width:${Math.round(frac * 100)}%">★</i></span>`;
      } else s += '☆';
    }
    return `<span class="stars" role="img" aria-label="${String(r).replace('.', ',')} sur 5">${s}<span class="num">${String(r).replace('.', ',')}</span>${count != null ? `<span class="count">(${count})</span>` : ''}</span>`;
  },

  toast(msg, type) {
    const root = document.getElementById('toastRoot');
    if (!root) return;
    const t = document.createElement('div');
    t.className = 'toast' + (type ? ' ' + type : '');
    t.textContent = msg;
    root.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .3s';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 320);
    }, 3200);
  },

  modal(html, opts) {
    opts = opts || {};
    const root = document.getElementById('modalRoot');
    const scrim = document.createElement('div');
    scrim.className = 'modal-scrim';
    scrim.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true">${html}</div>`;
    root.appendChild(scrim);
    function close() { scrim.remove(); }
    scrim.addEventListener('mousedown', e => { if (e.target === scrim && !opts.static) close(); });
    scrim.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    const q = sel => scrim.querySelector(sel);
    return { close, el: scrim, q };
  },

  confirm(title, msg, okLabel) {
    return new Promise(resolve => {
      let done = false;
      const finish = v => { if (!done) { done = true; resolve(v); } };
      const m = this.modal(`
        <div class="modal-head"><h3>${this.esc(title)}</h3><button class="icon-btn" data-close aria-label="Fermer">✕</button></div>
        <div class="modal-body"><p style="font-size:15px">${this.esc(msg)}</p></div>
        <div class="modal-foot">
          <button class="btn-secondary" data-close>Annuler</button>
          <button class="btn-danger" id="confirmOk">${this.esc(okLabel || 'Confirmer')}</button>
        </div>`, { static: true });
      m.q('[data-close]').forEach(b => b.addEventListener('click', () => finish(false)));
      const origClose = m.close;
      m.close = () => { origClose(); finish(false); };
      m.q('#confirmOk').addEventListener('click', () => { finish(true); origClose(); });
    });
  }
};
