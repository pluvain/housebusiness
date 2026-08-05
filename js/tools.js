// HouseBusiness Pro Tools - works 100% offline

const CITY_PRICES = {
  'kin-gombe': { min: 800, max: 1500, label: 'Kinshasa Gombe', currency: '$' },
  'kin-lemba': { min: 300, max: 600, label: 'Kinshasa Lemba', currency: '$' },
  'kin-ngaliema': { min: 500, max: 900, label: 'Kinshasa Ngaliema', currency: '$' },
  'paris': { min: 9000, max: 13000, label: 'Paris', currency: '€' },
  'lyon': { min: 4000, max: 5500, label: 'Lyon', currency: '€' },
  'abidjan': { min: 400, max: 800, label: 'Abidjan', currency: '$' },
  'dakar': { min: 350, max: 700, label: 'Dakar', currency: '$' },
  'custom': { min: 500, max: 800, label: 'Autre zone', currency: '$' }
};

const Tools = {
  estimate({surface, villeKey='kin-gombe', etat='bon'}){
    surface = parseFloat(surface)||0;
    if(surface<=0) return {error:'Surface invalide'};
    const city = CITY_PRICES[villeKey] || CITY_PRICES['custom'];
    let coeff = 1;
    if(etat==='neuf') coeff = 1.25;
    if(etat==='moyen') coeff = 0.8;
    const min = Math.round(city.min * coeff * surface);
    const max = Math.round(city.max * coeff * surface);
    const moyen = Math.round((min+max)/2);
    const loyerEst = Math.round(moyen * 0.007); // 0.7% du prix en loyer estimé (standard Kinshasa)
    return {
      city: city.label,
      surface,
      min, max, moyen,
      currency: city.currency,
      loyerEst,
      details: `Basé sur ${city.label}: ${city.min}-${city.max}${city.currency}/m² (coeff état ${coeff})`,
      conseil: moyen > 100000 ? "Prix élevé: vise client diaspora ou ONG, photos pro + video drone." : "Bon prix pour marché local: publie sur Facebook Marketplace Kinshasa et WhatsApp Business."
    };
  },

  rentabilite({prix, loyer, charges=0}){
    prix=parseFloat(prix)||0; loyer=parseFloat(loyer)||0; charges=parseFloat(charges)||0;
    if(prix<=0||loyer<=0) return {error:'Prix et loyer requis'};
    const revenuAnnuel = loyer*12;
    const net = revenuAnnuel - charges;
    const roiBrut = (revenuAnnuel/prix)*100;
    const roiNet = (net/prix)*100;
    const cashflow = loyer - (charges/12);
    const paybackYears = prix / net;
    return {
      revenuAnnuel, net, roiBrut: roiBrut.toFixed(1), roiNet: roiNet.toFixed(1),
      cashflow: Math.round(cashflow), payback: paybackYears.toFixed(1),
      verdict: roiNet >= 10 ? "🔥 EXCELLENT - Fonce" : roiNet >=7 ? "✅ BON - Au dessus du marché" : roiNet>=4 ? "⚠️ MOYEN - Négocie le prix" : "❌ FAIBLE - Passe",
      astuce: "À Kinshasa, un bon deal = 8-12% net. Ajoute caution 3 mois + frais notaire 10% dans ton calcul final."
    };
  },

  annonce({typeBien='Maison', surface='80m2', prix='50000$'}){
    const annonces = [
      `🏠 **${typeBien.toUpperCase()} À VENDRE - AFFAIRE RARE**\n\n📍 Superficie: ${surface}\n💰 Prix: ${prix} (légèrement discutable)\n\n✨ POINTS FORTS:\n• Emplacement stratégique, accès facile\n• Construction solide, prêt à habiter\n• Électricité + eau + fosse septique OK\n• Documents parcellaires en ordre\n\n📞 Contacte moi maintenant sur WhatsApp pour visite: \nPremier arrivé, premier servi !\n\n#Kinshasa #MaisonAVendre #HouseBusiness`,
      `🔑 **OPPORTUNITÉ ${typeBien} - ${surface} - ${prix}**\n\nVous cherchez un bien rentable à Kinshasa ?\n\nJe vous propose ${typeBien.toLowerCase()} de ${surface}, idéal famille ou investissement locatif. Quartier sécurisé, voisins calmes.\n\n💡 Potentiel locatif estimé: 500-700$/mois → 12% ROI\n\n⚡ Visite possible ce week-end. Frais agence 5%\n\n📲 Écris-moi "VISITE ${typeBien}" pour bloquer créneau.`,
    ];
    return annonces[Math.floor(Math.random()*annonces.length)];
  },

  messageClient({contexte, ton='pro'}){
    const templates = {
      pro: `Bonjour [Prénom],\n\nSuite à votre intérêt pour le bien situé à [Adresse], je vous confirme que la visite reste possible ${contexte||'ce samedi à 14h'}.\n\nMerci de me confirmer votre présence avec une capture de ce message.\n\nBien à vous,\n[Votre Nom] - HouseBusiness\n📞 [Votre Numéro]`,
      amical: `Salut [Prénom] ! 👋\n\nToujours OK pour ${contexte||'la visite'} ?\nMoi je suis chaud, le bien est encore dispo mais j'ai 2 autres personnes dessus.\n\nTu me confirmes ? 🙏`,
      relance: `Bonjour [Prénom],\n\nJe reviens vers vous concernant ${contexte||'votre projet immo'}.\nLe propriétaire me met un peu la pression, dites moi si vous restez intéressé ou si on classe le dossier.\n\nBonne journée !`
    };
    return templates[ton] || templates.pro;
  },

  businessIdeas({budget=500, ville='Kinshasa'}){
    const ideas = [
      { titre: '📸 Photographe Immo Mobile', invest: '50$ (trépied + grand angle)', revenu: '80-150$ / shooting', temps: 'Début demain', plan: 'Tu shootes maisons avec ton tel en grand angle, retouches avec Lightroom mobile gratuit. Poste sur FB: "Photos pro maison 50$". 1 client/jour = 1500$/mois' },
      { titre: '🔑 Conciergerie Airbnb', invest: '0$ (juste ton temps)', revenu: '15-20% des locations', temps: '1 semaine', plan: 'Tu gères check-in, ménage, linge pour proprio diaspora. 5 apparts x 400$ = 300-400$/mois passif. Contrat WhatsApp simple.' },
      { titre: '🎨 Home Staging Express', invest: '100$ (peinture, plantes)', revenu: '200-400$ / maison', temps: '3 jours', plan: 'Tu relookes appartement vide pour vente rapide. Peinture blanche + déco minimaliste IKEA local. Proprios vendent 20% plus vite, ils te payent cash.' },
      { titre: '📲 Agent WhatsApp Automation', invest: '0$', revenu: '100-300$ / client / mois', temps: 'Aujourd’hui', plan: 'Tu installes WhatsApp Business + messages auto pour agences immo. Réponses auto, catalogue, quick replies. Ils gagnent du temps, tu factures abonnement.' },
      { titre: '🧹 Service État des Lieux Digital', invest: '20$ (appli)', revenu: '30-50$ / état des lieux', temps: 'Immédiat', plan: 'Avec app Checkify gratuite, tu fais états des lieux photos + PDF pro. Agences ont besoin en masse. 3 par jour = 3000$/mois.' },
    ];
    return ideas.slice(0,3).map(i=>`### ${i.titre}\n💵 Invest: ${i.invest} | 💰 ${i.revenu}\n⏱️ ${i.temps}\n📋 ${i.plan}`).join('\n\n---\n\n');
  }
};

// Global wrappers for UI buttons
function runEstimation(){
  const surface = document.getElementById('est-surface').value;
  const ville = document.getElementById('est-ville').value;
  const etat = document.getElementById('est-etat').value;
  const r = Tools.estimate({surface, villeKey: ville, etat});
  const el = document.getElementById('est-result');
  el.classList.remove('hidden');
  if(r.error){ el.innerHTML = `❌ ${r.error}`; return; }
  el.innerHTML = `
    <b>📍 ${r.city} - ${r.surface}m² (${etat})</b><br>
    💰 <b>${r.min.toLocaleString()} - ${r.max.toLocaleString()} ${r.currency}</b><br>
    Moyenne: <b>${r.moyen.toLocaleString()} ${r.currency}</b> | Loyer estimé: ${r.loyerEst} ${r.currency}/mois<br><br>
    <small>${r.details}</small><br><br>
    💡 ${r.conseil}<br><br>
    <button class="btn-small" onclick="navigator.clipboard.writeText(\`Estimation ${r.city} ${r.surface}m2: ${r.moyen}${r.currency}\`);this.textContent='Copié!'">📋 Copier</button>
  `;
}

function runRentabilite(){
  const prix = document.getElementById('rent-prix').value;
  const loyer = document.getElementById('rent-loyer').value;
  const charges = document.getElementById('rent-charges').value;
  const r = Tools.rentabilite({prix, loyer, charges});
  const el = document.getElementById('rent-result');
  el.classList.remove('hidden');
  if(r.error){ el.innerHTML = `❌ ${r.error}`; return; }
  el.innerHTML = `
    📊 <b>ROI Brut: ${r.roiBrut}% | Net: ${r.roiNet}%</b><br>
    💵 Revenu an: ${r.revenuAnnuel}$ | Net: ${r.net}$<br>
    💸 Cashflow: ${r.cashflow}$/mois | Payback: ${r.payback} ans<br><br>
    <b>${r.verdict}</b><br><br>
    <small>${r.astuce}</small>
  `;
}

function runAnnonce(){
  const typeBien = document.getElementById('ann-type').value;
  const surface = document.getElementById('ann-surface').value;
  const prix = document.getElementById('ann-prix').value;
  const txt = Tools.annonce({typeBien, surface, prix});
  const el = document.getElementById('ann-result');
  el.classList.remove('hidden');
  el.innerHTML = `<pre style="white-space:pre-wrap;background:transparent;border:none;padding:0">${txt}</pre><br><button class="btn-small" onclick="navigator.clipboard.writeText(\`${txt.replace(/`/g,'')}\`);this.textContent='Copié!'">📋 Copier annonce</button>`;
}
