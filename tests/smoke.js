/* Smoke test House Business — jsdom */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const ROOT = __dirname + '/..';
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// 1. Inject all JS inline (évite les requêtes réseau)
const scripts = ['js/data.js', 'js/db.js', 'js/ui.js', 'js/tools.js', 'js/storage.js', 'js/agent.js', 'js/assistant.js', 'js/app.js']
  .map(f => '<script>' + fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/<\/script>/g, '<\\/script>') + '</' + 'script>')
  .join('\n');
const domHtml = html.replace(/<script src="js\/[^"]+"><\/script>/g, '') + scripts;

const errors = [];
const dom = new JSDOM(domHtml, {
  url: 'https://housebusiness.local/',
  runScripts: 'dangerously',
  pretendToBeVisual: true
});
const { window } = dom;
window.addEventListener('error', e => errors.push('window.onerror: ' + e.message));
const vc = new (require('jsdom').VirtualConsole)();
vc.on('jsdomError', e => errors.push('jsdomError: ' + e.message));

const doc = window.document;
const tick = ms => new Promise(r => setTimeout(r, ms));
let failures = 0;
function assert(cond, label) {
  if (cond) console.log('  ✅ ' + label);
  else { failures++; console.log('  ❌ ' + label); }
}

(async () => {
  await tick(100);

  console.log('— Accueil —');
  assert(doc.querySelector('#view-home.active'), 'vue accueil active');
  assert(doc.querySelectorAll('#homeCats .cat-card').length === 8, '8 catégories affichées');
  assert(doc.querySelectorAll('#homeFeatured .pro-card').length >= 4, 'pros en vedette affichés');
  assert(doc.querySelectorAll('#homeTestimonials .testi-card').length === 3, '3 témoignages');

  console.log('— Recherche —');
  window.location.hash = '#/recherche';
  await tick(80);
  assert(doc.querySelector('#view-search.active'), 'vue recherche active');
  assert(doc.querySelectorAll('#searchResults .pro-card').length === 12, '12 pros dans les résultats');

  console.log('— Filtres —');
  const fQ = doc.getElementById('fQ');
  fQ.value = 'peinture';
  fQ.dispatchEvent(new window.Event('input', { bubbles: true }));
  await tick(60);
  const n1 = doc.querySelectorAll('#searchResults .pro-card').length;
  assert(n1 >= 2 && n1 < 12, 'filtre texte fonctionne (' + n1 + ' résultats)');
  doc.getElementById('filtersReset').click();
  await tick(60);
  assert(doc.querySelectorAll('#searchResults .pro-card').length === 12, 'reset filtres');

  console.log('— Fiche pro —');
  window.location.hash = '#/pro/p5';
  await tick(80);
  assert(doc.querySelector('#view-pro.active'), 'vue fiche pro active');
  assert(doc.getElementById('proName').textContent.includes('Karim'), 'nom du pro affiché');
  assert(doc.querySelectorAll('#proServices .svc-row').length === 3, '3 prestations');
  assert(doc.querySelectorAll('#proReviews .review').length >= 2, 'avis affichés');
  assert(doc.querySelectorAll('#proAvail .day').length === 7, 'disponibilités (7 jours)');

  console.log('— Connexion démo (client) —');
  window.location.hash = '#/connexion';
  await tick(80);
  doc.getElementById('loginEmail').value = 'client@demo.fr';
  doc.getElementById('loginPass').value = 'demo123';
  doc.getElementById('formLogin').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(120);
  assert(window.location.hash.includes('tableau-de-bord'), 'redirigé vers le tableau de bord');
  assert(doc.getElementById('dashContent').innerHTML.length > 100, 'contenu dashboard rendu');
  assert(doc.querySelectorAll('#dashContent .stat-card').length === 4, '4 cartes stats client');

  console.log('— Devis client —');
  window.location.hash = '#/tableau-de-bord/devis';
  await tick(80);
  assert(doc.getElementById('dashContent').textContent.includes('Rénovation appartement'), 'devis du client affichés');

  console.log('— Messages (chat + auto-réponse) —');
  window.location.hash = '#/messages/p5';
  await tick(80);
  assert(doc.querySelector('#view-messages.active'), 'vue messages active');
  assert(doc.querySelectorAll('#msgList .msg-preview').length >= 2, 'conversations listées');
  const input = doc.getElementById('msgInput');
  input.value = 'Bonjour, test du chat !';
  doc.getElementById('msgComposer').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(2200);
  const bubbles = doc.querySelectorAll('#msgThreadBody .bubble');
  assert(bubbles.length >= 4, 'auto-réponse du pro reçue (' + bubbles.length + ' bulles)');

  console.log('— Déconnexion / connexion pro —');
  doc.getElementById('logoutBtn').click();
  await tick(80);
  window.location.hash = '#/connexion';
  await tick(60);
  doc.getElementById('loginEmail').value = 'pro@demo.fr';
  doc.getElementById('loginPass').value = 'demo123';
  doc.getElementById('formLogin').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(120);
  assert(window.location.hash.includes('tableau-de-bord'), 'pro connecté');
  window.location.hash = '#/tableau-de-bord/demandes';
  await tick(80);
  assert(doc.getElementById('dashContent').textContent.includes('Devis') || doc.getElementById('dashContent').textContent.length > 50, 'demandes pro rendues');

  console.log('— Calendrier pro —');
  window.location.hash = '#/tableau-de-bord/calendrier';
  await tick(80);
  assert(doc.querySelector('#dashContent .cal-grid'), 'calendrier rendu');
  assert(doc.querySelectorAll('#dashContent .cal-day').length >= 28, 'grille calendrier complète');

  console.log('— Admin —');
  doc.getElementById('logoutBtn').click();
  await tick(60);
  window.location.hash = '#/connexion';
  await tick(60);
  doc.getElementById('loginEmail').value = 'admin@housebusiness.fr';
  doc.getElementById('loginPass').value = 'admin123';
  doc.getElementById('formLogin').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(120);
  assert(window.location.hash.includes('admin'), 'admin connecté');
  await tick(50);
  assert(doc.querySelectorAll('#adminContent .stat-card').length === 6, '6 stats admin');
  const tabs = doc.querySelectorAll('#adminTabs button');
  tabs[1].click(); await tick(50);
  assert(doc.querySelectorAll('#adminContent table tr').length >= 3, 'onglet utilisateurs');
  tabs[2].click(); await tick(50);
  assert(doc.querySelectorAll('#adminContent table tr').length >= 12, 'onglet pros (12)');

  console.log('— Retour client pour favoris —');
  doc.getElementById('logoutBtn').click();
  await tick(60);
  window.location.hash = '#/connexion';
  await tick(60);
  doc.getElementById('loginEmail').value = 'client@demo.fr';
  doc.getElementById('loginPass').value = 'demo123';
  doc.getElementById('formLogin').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(120);

  console.log('— Assistant IA —');
  doc.getElementById('assistantFab').click();
  await tick(80);
  assert(!doc.getElementById('assistantPanel').classList.contains('hidden'), 'panneau assistant ouvert');
  doc.getElementById('assistantInput').value = 'Estime un 65m2 à Gombe';
  doc.querySelector('.assistant-composer').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(400);
  assert(doc.querySelectorAll('#assistantBody .msg').length >= 3, 'réponse de l’assistant (tools offline)');

  console.log('— Favoris —');
  doc.getElementById('assistantClose').click();
  window.location.hash = '#/pro/p3';
  await tick(80);
  doc.getElementById('proFavBtn').click();
  await tick(60);
  assert(doc.getElementById('proFavBtn').textContent.includes('❤️'), 'favori ajouté');
  window.location.hash = '#/tableau-de-bord/favoris';
  await tick(80);
  assert(doc.getElementById('dashContent').textContent.includes('Maison Claire'), 'favori visible dans le dashboard');

  console.log('— Inscription nouveau pro —');
  doc.getElementById('logoutBtn').click();
  await tick(60);
  window.location.hash = '#/inscription?role=pro';
  await tick(80);
  doc.getElementById('regName').value = 'Test Pro';
  doc.getElementById('regEmail').value = 'testpro@demo.fr';
  doc.getElementById('regPass').value = 'secret1';
  doc.getElementById('regPass2').value = 'secret1';
  doc.getElementById('regPhone').value = '+33 6 00 00 00 00';
  doc.querySelector('input[name="regRole"][value="pro"]').checked = true;
  doc.getElementById('formRegister').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
  await tick(120);
  assert(window.location.hash.includes('tableau-de-bord'), 'nouveau pro connecté');
  assert(doc.getElementById('dashContent').textContent.includes('Actions rapides'), 'aperçu pro rendu');
  window.location.hash = '#/tableau-de-bord/profil';
  await tick(80);
  assert(doc.getElementById('dashContent').textContent.includes('Mon profil professionnel'), 'formulaire profil pro rendu');
  const dbg = window.eval('DB');
  assert(dbg.getPros().some(p => p.company === 'Ma nouvelle entreprise'), 'nouveau pro ajouté au catalogue');
  assert(!!dbg.proOfUser(dbg.currentUser()), 'proOfUser résolu');

  console.log('— Avis —');
  window.location.hash = '#/pro/p5';
  await tick(80);
  doc.getElementById('proReviewBtn').click();
  await tick(60);
  const modal = doc.querySelector('.modal-scrim');
  assert(modal, 'modale avis ouverte');
  doc.getElementById('rvComment').value = 'Superbe travail, très satisfait !';
  doc.getElementById('rvSend').click();
  await tick(80);
  assert(doc.querySelectorAll('#proReviews .review').length >= 3, 'avis publié et affiché');

  console.log('');
  console.log(errors.length ? '⚠️ ERREURS JS: ' + errors.join(' | ') : '✅ Aucune erreur JS');
  console.log(failures === 0 ? '🎉 TOUS LES TESTS PASSENT' : ('❌ ' + failures + ' TEST(S) EN ÉCHEC'));
  process.exit(failures > 0 || errors.length ? 1 : 0);
})();
