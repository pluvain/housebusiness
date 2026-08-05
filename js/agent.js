// Core Agent - handles AI + local tools + decision

const Agent = {
  config(){
    return Store.get();
  },

  async think(userMsg){
    const cfg = this.config();
    const lower = userMsg.toLowerCase();

    // 1. Try to detect tool intent locally first (100% offline works)
    if(lower.includes('estim') || lower.includes('prix') || lower.includes('combien vaut') || lower.includes('m2')){
      // Try extract numbers
      const m = userMsg.match(/(\d+)\s*m2/);
      const surface = m ? m[1] : 65;
      const ville = lower.includes('gombe') ? 'kin-gombe' : lower.includes('lemba') ? 'kin-lemba' : lower.includes('ngal') ? 'kin-ngaliema' : 'kin-gombe';
      const r = Tools.estimate({surface, villeKey: ville, etat: 'bon'});
      if(!r.error){
        return `🧠 **J'ai utilisé l'outil Estimation Pro (offline)**\n\n📍 ${r.city} - ${surface}m²\n💰 **${r.min.toLocaleString()} - ${r.max.toLocaleString()} ${r.currency}**\nMoyenne: ${r.moyen.toLocaleString()} ${r.currency}\nLoyer estimé: ${r.loyerEst}$/mois\n\n${r.conseil}\n\nTu veux que je te génère l'annonce de vente pour ce prix ?`;
      }
    }

    if(lower.includes('rentab') || lower.includes('roi') || lower.includes('cashflow') || lower.match(/\d+\$\s*.*\d+\$/)){
      const nums = [...userMsg.matchAll(/(\d+)\s*\$/g)].map(x=>parseInt(x[1]));
      if(nums.length>=2){
        const r = Tools.rentabilite({prix: nums[0], loyer: nums[1], charges: 800});
        return `📈 **Calcul rentabilité (outil local)**\n\nPrix: ${nums[0]}$ | Loyer: ${nums[1]}$\nROI Brut: ${r.roiBrut}% | Net: ${r.roiNet}%\nCashflow: ${r.cashflow}$/mois\nVerdict: ${r.verdict}\n\nTu veux que je l'ajoute dans ton CRM ?`;
      }
    }

    if(lower.includes('annonce') || lower.includes('publier') || lower.includes('leboncoin') || lower.includes('marketplace')){
      const type = userMsg.replace(/génère|annonce|pour|une/gi,'').trim().slice(0,40) || "Maison 3 chambres";
      const txt = Tools.annonce({typeBien: type, surface: '100m2', prix: '65000$'});
      return `✍️ **Annonce générée (outil local)**\n\n${txt}\n\nJe l'ai copiable en un clic dans l'onglet Outils Pro > Générateur d'annonce. Tu veux une version plus courte pour WhatsApp ?`;
    }

    if(lower.includes('idée') || lower.includes('business') || lower.includes('gagner') || lower.includes('argent')){
      const ideas = Tools.businessIdeas({budget: 500});
      return `💡 **3 Business HouseBusiness - Spécial Kinshasa (outil local)**\n\n${ideas}\n\nDis-moi le numéro qui t'intéresse (1,2,3) et je te fais le plan d'action complet jour par jour.`;
    }

    if(lower.includes('message') || lower.includes('whatsapp') || lower.includes('client') || lower.includes('relance')){
      const msg = Tools.messageClient({contexte: userMsg, ton: lower.includes('amical')?'amical':'pro'});
      return `✉️ **Message prêt à envoyer:**\n\n${msg}\n\nTu veux que je change le ton ou que je l'enregistre pour un lead ?`;
    }

    // 2. If API key present -> call OpenAI with tools context
    if(cfg.apiKey && cfg.apiKey.startsWith('sk-')){
      return await this.callLLM(userMsg);
    }

    // 3. Fallback smart local response
    return this.localLLM(userMsg);
  },

  localLLM(msg){
    const cfg = this.config();
    const name = cfg.name || 'Assistant';
    return `Salut ! C'est ${name} 👋 (mode gratuit offline)\n\nTu m'as dit: *"${msg.slice(0,120)}"*\n\nJe peux déjà faire tout ça **sans internet/IA**:\n\n📊 **Estimation** - dis "Estime 70m2 Gombe"\n💰 **Rentabilité** - dis "Calcule 50000$ achat 400$ loyer"\n📝 **Annonce** - dis "Génère annonce villa"\n💡 **Business** - dis "Idées business 500$"\n✉️ **Message client** - dis "Message pour annuler visite"\n\n👉 Va dans l'onglet **🛠️ Outils Pro** pour les calculateurs visuels.\n\n💎 Pour me rendre 10x plus intelligent (GPT-4o qui rédige tout auto), ajoute ta clé OpenAI dans ⚙️ - ça prend 30s sur mobile et ça reste sur ton tel.\n\nTu veux tester quoi maintenant ?`;
  },

  async callLLM(userMsg){
    const cfg = this.config();
    const system = `${cfg.prompt || 'Tu es un assistant immobilier.'}\n\nTu as accès à ces outils locaux (que tu peux simuler dans ta réponse):\n- estimate(surface, ville) -> estimation prix\n- rentabilite(prix, loyer, charges)\n- annonce(typeBien)\n- businessIdeas(budget)\nOutils: explique que tu as lancé l'outil et donne les chiffres.\nTu es sur mobile, réponses courtes, emojis, chiffres concrets, orienté action.\nVille principale: ${cfg.role || 'Kinshasa'}`;

    // Get history
    const history = Store.getChats().slice(-10).map(m=>({role:m.role, content:m.content}));
    
    try{
      const res = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${cfg.apiKey}`},
        body: JSON.stringify({
          model: cfg.model || 'gpt-4o-mini',
          messages:[
            {role:'system', content: system},
            ...history,
            {role:'user', content: userMsg}
          ],
          temperature:0.7,
          max_tokens:800
        })
      });
      const data = await res.json();
      if(data.error) throw new Error(data.error.message);
      return data.choices[0].message.content;
    }catch(e){
      return `❌ Erreur IA: ${e.message}\n\nJe repasse en mode offline:\n\n`+ this.localLLM(userMsg);
    }
  }
};
