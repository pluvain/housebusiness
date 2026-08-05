// UI Logic

const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');

function renderChats(){
  const chats = Store.getChats();
  if(chats.length===0){
    // Initial message
    addBubble(`Salut ! 👋 Je suis ton agent **${Store.get().name||'HouseBusiness Pro'}**.\n\nJe suis déjà opérationnel sans clé API avec 6 outils pros intégrés (estimation Kinshasa, rentabilité, annonces...).\n\n🔥 **Essaye maintenant:**\n• "Estime 60m2 Gombe"\n• "3 business avec 500$"\n• Clique sur 🛠️ Outils Pro\n\nSi tu ajoutes ta clé OpenAI dans ⚙️, je deviens GPT-4o illimité.`, 'bot', false);
    return;
  }
  chatEl.innerHTML='';
  chats.forEach(c=> addBubble(c.content, c.role==='user'?'user':'bot', false));
}

function addBubble(text, who='bot', save=true){
  const div = document.createElement('div');
  div.className = `message ${who}`;
  // Simple markdown
  let html = text
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<b>$1</b>')
    .replace(/\n/g,'<br>');
  div.innerHTML = `<div class="bubble">${html}<br><button class="copy-btn" onclick="navigator.clipboard.writeText(\`${text.replace(/`/g,' ').replace(/\$/g,'\\$')}\`);this.textContent='✅ Copié'">📋 Copier</button></div>`;
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;

  if(save){
    const chats = Store.getChats();
    chats.push({role: who==='user'?'user':'assistant', content: text, ts: Date.now()});
    Store.setChats(chats);
  }
  return div;
}

async function handleSend(){
  const txt = inputEl.value.trim();
  if(!txt) return;
  inputEl.value='';
  inputEl.style.height='auto';
  addBubble(txt,'user');

  // typing
  const typing = document.createElement('div');
  typing.className='message bot';
  typing.id='typing';
  typing.innerHTML=`<div class="bubble"><div class="typing"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
  chatEl.appendChild(typing);
  chatEl.scrollTop = chatEl.scrollHeight;

  const reply = await Agent.think(txt);
  const t = document.getElementById('typing');
  if(t) t.remove();
  addBubble(reply,'bot');
}

// Events
sendBtn.onclick = handleSend;
inputEl.addEventListener('keydown', e=>{
  if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); handleSend(); }
});
inputEl.addEventListener('input', ()=>{
  inputEl.style.height='auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight,110)+'px';
});

document.querySelectorAll('#quickActions button').forEach(b=>{
  b.onclick = ()=>{ inputEl.value = b.dataset.q; handleSend(); };
});

// Tabs
document.querySelectorAll('.tab').forEach(tab=>{
  tab.onclick = ()=>{
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c=>c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-'+tab.dataset.tab).classList.add('active');
  };
});

// Settings
const settingsPanel = document.getElementById('settingsPanel');
document.getElementById('settingsBtn').onclick = ()=> settingsPanel.classList.remove('hidden');
document.getElementById('closeSettings').onclick = ()=> settingsPanel.classList.add('hidden');
settingsPanel.onclick = (e)=>{ if(e.target===settingsPanel) settingsPanel.classList.add('hidden'); };

function loadSettingsUI(){
  const cfg = Store.get();
  document.getElementById('agentName').value = cfg.name||'Assistant HouseBusiness Pro';
  document.getElementById('agentRole').value = cfg.role||'Expert immobilier Kinshasa & business maison';
  document.getElementById('systemPrompt').value = cfg.prompt||document.getElementById('systemPrompt').value;
  document.getElementById('apiKey').value = cfg.apiKey||'';
  document.getElementById('model').value = cfg.model||'gpt-4o-mini';
}
loadSettingsUI();

document.getElementById('saveSettings').onclick = ()=>{
  Store.set({
    name: document.getElementById('agentName').value,
    role: document.getElementById('agentRole').value,
    prompt: document.getElementById('systemPrompt').value,
    apiKey: document.getElementById('apiKey').value.trim(),
    model: document.getElementById('model').value
  });
  settingsPanel.classList.add('hidden');
  addBubble(`✅ Config sauvegardée ! Je suis maintenant **${Store.get().name}**.\n${Store.get().apiKey ? '🚀 Mode IA GPT-4o activé - illimité !' : '🔧 Mode gratuit offline actif (6 outils pros). Ajoute une clé API pour GPT-4o.'}`, 'bot');
};

document.getElementById('resetBtn').onclick = ()=>{
  if(confirm('Réinitialiser tout ?')){
    localStorage.clear();
    location.reload();
  }
};

// CRM
function renderCRM(){
  const leads = Store.getLeads();
  const list = document.getElementById('crm-list');
  list.innerHTML='';
  if(leads.length===0){
    list.innerHTML='<div style="text-align:center;color:var(--muted);padding:20px;font-size:13px">Aucun prospect. Clique sur + Ajouter<br>Ou dis à l\'agent "Ajoute lead Dupont 100k budget"</div>';
  } else {
    leads.forEach((l,i)=>{
      const div = document.createElement('div');
      div.className='crm-item';
      div.innerHTML=`
        <div class="left"><b>${l.name}</b><span>📞 ${l.phone} • 🏠 ${l.bien} • 💰 ${l.budget}</span></div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <span class="crm-badge">${l.status}</span>
          <button class="btn-small" onclick="deleteLead(${i})">🗑️</button>
        </div>`;
      list.appendChild(div);
    });
  }
  document.getElementById('stat-total').textContent = leads.length;
  document.getElementById('stat-visites').textContent = leads.filter(l=>l.status==='visite').length;
  document.getElementById('stat-ca').textContent = (leads.length*2.5)+'k $'; // estimation
}

let editingLead = null;
function addLead(){
  document.getElementById('leadModal').classList.remove('hidden');
}
function closeLeadModal(){ document.getElementById('leadModal').classList.add('hidden'); }
function saveLead(){
  const lead = {
    name: document.getElementById('lead-name').value || 'Sans nom',
    phone: document.getElementById('lead-phone').value,
    bien: document.getElementById('lead-bien').value,
    budget: document.getElementById('lead-budget').value,
    status: document.getElementById('lead-status').value
  };
  const leads = Store.getLeads();
  leads.unshift(lead);
  Store.setLeads(leads);
  closeLeadModal();
  renderCRM();
  // clear
  ['lead-name','lead-phone','lead-bien','lead-budget'].forEach(id=>document.getElementById(id).value='');
}
function deleteLead(i){
  const leads = Store.getLeads();
  leads.splice(i,1);
  Store.setLeads(leads);
  renderCRM();
}

// Share
document.getElementById('shareBtn').onclick = async ()=>{
  const url = window.location.href;
  if(navigator.share){
    try{ await navigator.share({title:'HouseBusiness AI Agent', text:'Mon agent immo IA', url}); }catch{}
  } else {
    await navigator.clipboard.writeText(url);
    alert('Lien copié: '+url);
  }
};

// Init
renderChats();
renderCRM();

// Expose for tools.js buttons
window.runEstimation = runEstimation;
window.runRentabilite = runRentabilite;
window.runAnnonce = runAnnonce;
window.addLead = addLead;
window.closeLeadModal = closeLeadModal;
window.saveLead = saveLead;
window.deleteLead = deleteLead;
