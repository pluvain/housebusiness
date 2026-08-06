/* ═══════════════════════════════════════════════════════════════
   HOUSE BUSINESS — Assistant IA (panneau flottant)
   Marche 100% offline avec 6 outils pro (js/tools.js) ;
   une clé OpenAI (optionnelle) débloque l'IA complète (js/agent.js).
   ═══════════════════════════════════════════════════════════════ */

const Assistant = (function () {
  const panel = () => document.getElementById('assistantPanel');
  const body = () => document.getElementById('assistantBody');

  function md(text) {
    let t = UI.esc(text);
    t = t.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    t = t.replace(/### (.*)/g, '<b style="color:var(--primary)">$1</b>');
    t = t.replace(/\n/g, '<br>');
    return t;
  }

  function addMsg(text, who, save) {
    const b = body();
    if (!b) return;
    const d = document.createElement('div');
    d.className = 'msg ' + who;
    d.innerHTML = md(text) + `<small>${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</small>`;
    b.appendChild(d);
    b.scrollTop = b.scrollHeight;
    if (save) {
      const chats = Store.getChats();
      chats.push({ role: who === 'user' ? 'user' : 'assistant', content: text, ts: Date.now() });
      Store.setChats(chats);
    }
    return d;
  }

  function showTyping() {
    const d = document.createElement('div');
    d.className = 'msg bot';
    d.id = 'asstTyping';
    d.innerHTML = '<span class="typing-dots"><i></i><i></i><i></i></span>';
    body().appendChild(d);
    body().scrollTop = body().scrollHeight;
  }

  function hideTyping() {
    const t = document.getElementById('asstTyping');
    if (t) t.remove();
  }

  function render() {
    const b = body();
    if (!b) return;
    b.innerHTML = '';
    const chats = Store.getChats();
    if (!chats.length) {
      addMsg(`Salut ! 👋 Je suis **${Store.get().name || 'Assistant HouseBusiness Pro'}**.\n\nJe suis déjà opérationnel **sans internet ni clé API** avec 6 outils pros : estimation, rentabilité locative, génération d'annonces, messages clients, idées business et CRM.\n\n🔥 **Essaie par exemple :**\n• « Estime un 65 m² à Gombe »\n• « 3 business avec 500 $ »\n• « Génère une annonce villa 3 ch »\n\n💎 Tu peux me connecter à GPT-4o dans ⚙️ Paramètres → Assistant IA.`, false);
      return;
    }
    chats.forEach(c => addMsg(c.content, c.role === 'user' ? 'user' : 'bot', false));
  }

  async function send(text) {
    const txt = String(text || '').trim();
    if (!txt) return;
    const input = document.getElementById('assistantInput');
    if (input) input.value = '';
    addMsg(txt, 'user', true);
    showTyping();
    try {
      const reply = await Agent.think(txt);
      hideTyping();
      addMsg(reply, 'bot', true);
    } catch (e) {
      hideTyping();
      addMsg('❌ Oups, une erreur est survenue. Réessaie !', 'bot', true);
    }
  }

  function open() {
    const p = panel();
    if (!p) return;
    p.classList.remove('hidden');
    render();
    setTimeout(() => {
      const i = document.getElementById('assistantInput');
      if (i) i.focus();
    }, 80);
  }

  function close() {
    const p = panel();
    if (p) p.classList.add('hidden');
  }

  function bind() {
    const fab = document.getElementById('assistantFab');
    const closeBtn = document.getElementById('assistantClose');
    const form = document.querySelector('.assistant-composer');
    const chips = document.getElementById('assistantChips');

    if (fab) fab.addEventListener('click', () => {
      panel().classList.contains('hidden') ? open() : close();
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (form) form.addEventListener('submit', e => {
      e.preventDefault();
      send(document.getElementById('assistantInput').value);
    });
    if (chips) chips.addEventListener('click', e => {
      const b = e.target.closest('button[data-q]');
      if (b) send(b.dataset.q);
    });
  }

  return { bind, open, send, render };
})();
