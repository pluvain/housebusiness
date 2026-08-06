# 🏠 House Business — Plateforme B2C travaux, déco & aménagement

**La plateforme de mise en relation entre particuliers et professionnels du bâtiment, de la décoration et de l'aménagement intérieur** — architectes, décorateurs, artisans. Entièrement responsive (mobile, tablette, desktop), avec mode sombre, PWA installable et assistant IA intégré.

> **Démo live :** `npx serve .` puis ouvrez l'URL affichée (ou ouvrez directement `index.html`).

---

## ✨ Fonctionnalités

| Module | Détails |
|---|---|
| 🏠 **Accueil** | Héro avec recherche, 8 métiers, pros en vedette, « comment ça marche », témoignages |
| 🔍 **Recherche avancée** | Filtres métier / ville / note, mot-clé, tri (recommandés, note, prix, **distance géolocalisée** 📍) |
| 👤 **Profils pro** | Galerie photos, prestations & tarifs, spécialités, disponibilités, avis clients, pros similaires |
| 🔐 **Authentification** | Connexion / inscription, 3 rôles (**client, pro, admin**), comptes de démonstration |
| 📋 **Devis** | Demande de devis en ligne, réponse du pro (accepté / refusé), suivi de statut |
| 📅 **Réservation** | Créneau (date + horaire), confirmation par le pro, calendrier mensuel pro |
| ⭐ **Avis & notes** | Note sur 5 étoiles, commentaires, modération admin |
| 🤍 **Favoris** | Sauvegarde des pros préférés |
| 💬 **Chat temps réel** | Messagerie client ↔ pro, réponse automatique simulée, notifications |
| 🔔 **Notifications** | Centre de notifications avec compteur non-lu |
| 📊 **Tableau de bord** | Espace client (devis, réservations, favoris, avis) et espace pro (demandes, agenda, calendrier, profil public) |
| 🛡️ **Administration** | Statistiques, graphiques canvas, gestion des utilisateurs (rôles, suppression), vérification des pros, journal d'activité |
| ⚙️ **Paramètres** | Profil, mode sombre, configuration de l'assistant IA |
| 🤖 **Assistant IA** | Chat flottant : 6 outils offline (estimation, ROI locatif, annonces, messages clients, idées business, CRM) + option GPT-4o BYOK |
| 📱 **PWA** | Installable, offline-first (service worker), icônes, manifest |

---

## 🚀 Démarrage rapide

```bash
# Option 1 — serveur local (recommandé)
npx serve .

# Option 2 — ouvrir directement
#   ouvrez index.html dans le navigateur (PWA partielle seulement)
```

### Comptes de démonstration

| Rôle | E-mail | Mot de passe |
|---|---|---|
| 👤 Client | `client@demo.fr` | `demo123` |
| 🧰 Pro (Peinture Premium) | `pro@demo.fr` | `demo123` |
| 🛡️ Admin | `admin@housebusiness.fr` | `admin123` |

(Un clic sur les pastilles de la page de connexion remplit les champs automatiquement.)

---

## 🗂️ Architecture du code

```
index.html          → Coquille SPA (toutes les vues)
style.css           → Design system responsive + dark mode
js/data.js          → Catalogue de démonstration (pros, villes, avis)
js/db.js            → Couche données localStorage (auth, devis, réservations, chat…)
js/ui.js            → Helpers (modales, toasts, étoiles, avatars…)
js/tools.js         → 6 outils offline de l'assistant (estimation, ROI…)
js/storage.js       → Stockage de l'assistant (conservé de la v1)
js/agent.js         → Cerveau IA de l'assistant (tools + OpenAI optionnel)
js/assistant.js     → Panneau chat flottant de l'assistant
js/app.js           → Routeur + toutes les vues
img/                → Photos générées + icônes PWA
manifest.json, sw.js → PWA installable
```

**Choix techniques :** Vanilla JS (zéro dépendance, zéro build, fonctionne sur GitHub Pages/Netlify), données en `localStorage` (privé, instantané, hors-ligne), hash-routing (`#/recherche?cat=peintre`), CSS custom properties pour les thèmes, `color-mix`/`backdrop-filter` pour le glassmorphism.

---

## 🧪 Tests

Un smoke test jsdom couvre les parcours critiques (40+ assertions) :

```bash
npm install    # installe jsdom (dépendance de test uniquement)
npm test       # accueil, recherche, filtres, fiche pro, auth, devis,
               # chat + auto-réponse, calendrier, admin, favoris,
               # avis, assistant IA, inscription pro
```

## 🔒 Sécurité (démo)

- Échappement systématique des entrées utilisateur (`UI.esc`) contre le XSS.
- Validation des formulaires (mots de passe ≥ 6 caractères, e-mail unique).
- Contrôle d'accès par rôle (admin protégé).
- Clé API OpenAI stockée **uniquement** dans le navigateur.

> ⚠️ Version démo : mots de passe en clair dans localStorage. Pour la production, brancher un vrai backend (Supabase/PostgreSQL avec RLS, ou Firebase) — voir « Améliorations ».

---

## 🗺️ Améliorations futures

1. **Backend réel** — Supabase (auth + PostgreSQL + RLS), paiement Stripe, WebSocket pour le chat.
2. **Vidéos** — galeries vidéo des pros (lecteur intégré, upload).
3. **Paiement en ligne** — acompte à la réservation, paiement à la livraison, litiges.
4. **Contrats numériques** — génération PDF (devis accepté → contrat) et signature électronique.
5. **Appels audio/vidéo** — WebRTC intégré à la messagerie.
6. **Géolocalisation réelle** — carte interactive des pros (Leaflet/Mapbox).
7. **Notifications push** — via le service worker (web push).
8. **IA avancée** — recommandations de pros, rédaction automatique de devis, traduction.
9. **Multi-langue** — i18n FR/EN/LN.

---

© 2026 House Business — Démo interactive, données stockées localement.
