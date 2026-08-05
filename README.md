# 🏠 HouseBusiness AI Agent - LIVE

**Ton agent immobilier intelligent, 100% mobile, utilisable immédiatement.**

### 🔴 LIVE DEMO (en ligne 24/7)
👉 **https://pluvain.github.io/housebusiness/**  *(active après premier push sur main - voir instructions ci-dessous)*

Preview local Arena: ouvre `index.html` ou `npx serve .`

---

### ⚡ Utilisation immédiate (même sans clé API)

L'agent marche déjà à 100% en mode **gratuit offline** avec 6 outils pros intégrés:

1. **📊 Estimation Express Kinshasa** - prix au m² par quartier (Gombe, Lemba, Ngaliema...)
2. **💰 Calcul Rentabilité Locative** - ROI brut/net, cashflow, payback
3. **📝 Générateur d'Annonces** - annonces qui vendent pour Facebook/WhatsApp/Marketplace
4. **✉️ Messages clients** - pros, amicaux, relances
5. **💡 5 Business Maison** avec 0-500$ (photographe immo, conciergerie Airbnb, home staging...)
6. **📋 CRM intégré** - gestion prospects, visites, localStorage

Juste ouvre l'app sur ton téléphone et tape:
- "Estime 65m2 Gombe"
- "Calcule rentabilité 50000$ 400$/mois"
- "Génère annonce villa 3 ch"
- "Idées business 500$ Kinshasa"

### 🚀 Mode IA GPT-4o (optionnel, 10x plus puissant)

1. Va sur **platform.openai.com** -> Create API Key (faisable 100% sur mobile)
2. Dans l'app, clique ⚙️ -> colle ta clé -> Sauvegarder
3. L'agent devient GPT-4o avec mémoire, il comprend tout.

Clé stockée uniquement dans ton navigateur, jamais envoyée ailleurs que OpenAI.

---

### 📲 Installer comme une vraie App (iOS / Android)

1. Ouvre le lien sur ton tel
2. Chrome: Menu (3 points) > **Installer l'app** ou **Ajouter à l'écran d'accueil**
3. Safari iPhone: Partager (carré flèche) > **Sur l'écran d'accueil**
4. Tu as une icône HouseBusiness comme WhatsApp, qui marche offline.

---

### 🛠️ Tech Stack

- **Frontend:** Vanilla JS, PWA, 100% static (marche sur GitHub Pages)
- **IA:** BYOK OpenAI (gpt-4o-mini / gpt-4o) + fallback local intelligent
- **Offline:** Service Worker + LocalStorage CRM
- **Mobile-first:** Design glassmorphism, 520px max, gestures
- **No backend needed** - zéro coût hébergement

Fichiers:
```
index.html -> UI principale
style.css -> design mobile premium
js/storage.js -> LocalStorage
js/tools.js -> 6 outils business offline
js/agent.js -> Cerveau agent (tool detection + LLM)
js/ui.js -> UI logic
manifest.json + sw.js -> PWA installable
```

### 🌍 Déployer en ligne (GitHub Pages)

**Méthode auto (recommandée):**
1. Push ce code sur `main`
2. GitHub Action se lance auto (`.github/workflows/deploy.yml`)
3. Va dans repo Settings > Pages > Source: GitHub Actions
4. Ton lien live sera: `https://pluvain.github.io/housebusiness/`

**Méthode drag & drop (depuis mobile):**
1. Va sur app.netlify.com (sur mobile)
2. Drag & drop le dossier -> tu as un lien instantané.

### 🔥 Roadmap idées pour toi

- [ ] Connecter WhatsApp API pour envoi auto
- [ ] Scraper prix SeLoger / Facebook Marketplace
- [ ] Générateur de contrats location (PDF)
- [ ] Voice agent (parler à ton agent)
- [ ] Carte interactive Kinshasa avec prix m²

Dis-moi ce que tu veux en plus, je te l'ajoute direct.

---

### 👤 Auteur
Pluvain - HouseBusiness
Base Kinshasa - Agent imaginé pour marcher même avec 3G

**Lance l'app maintenant et commence à vendre !** 🚀
