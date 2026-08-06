/* ═══════════════════════════════════════════════════════════════
   HOUSE BUSINESS — Données de démonstration (seed)
   ═══════════════════════════════════════════════════════════════ */

const HB_CATEGORIES = [
  { id: 'architecte',   label: 'Architectes',    ico: '📐', img: 'img/architecte.jpg' },
  { id: 'decorateur',   label: 'Décorateurs',    ico: '🛋️', img: 'img/decorateur.jpg' },
  { id: 'peintre',      label: 'Peintres',       ico: '🎨', img: 'img/peintre.jpg' },
  { id: 'electricien',  label: 'Électriciens',   ico: '⚡', img: 'img/electricien.jpg' },
  { id: 'plombier',     label: 'Plombiers',      ico: '🔧', img: 'img/plombier.jpg' },
  { id: 'menuisier',    label: 'Menuisiers',     ico: '🪚', img: 'img/menuisier.jpg' },
  { id: 'macon',        label: 'Maçons',         ico: '🧱', img: 'img/macon.jpg' },
  { id: 'jardinier',    label: 'Paysagistes',    ico: '🌿', img: 'img/jardinier.jpg' }
];

const HB_CITIES = [
  { name: 'Paris',      lat: 48.8566, lng: 2.3522 },
  { name: 'Lyon',       lat: 45.7640, lng: 4.8357 },
  { name: 'Marseille',  lat: 43.2965, lng: 5.3698 },
  { name: 'Bordeaux',   lat: 44.8378, lng: -0.5792 },
  { name: 'Lille',      lat: 50.6292, lng: 3.0573 },
  { name: 'Nantes',     lat: 47.2184, lng: -1.5536 },
  { name: 'Toulouse',   lat: 43.6047, lng: 1.4442 },
  { name: 'Kinshasa',   lat: -4.4419, lng: 15.2663 }
];

const HB_PROS = [
  {
    id: 'p1', name: 'Sophie Duval', company: 'Atelier Duval Architecture',
    category: 'architecte', city: 'Paris', rating: 4.9, reviewsCount: 32,
    verified: true, featured: true, price: 90, priceUnit: '€/h', experience: 14, projects: 142,
    photo: 'img/architecte.jpg', gallery: ['img/architecte.jpg', 'img/hero.jpg', 'img/chantier.jpg', 'img/decorateur.jpg'],
    bio: "Architecte DPLG passionnée par les maisons qui racontent une histoire. J'accompagne particuliers et promoteurs de l'esquisse à la livraison : extension, surélévation, rénovation complète et maison neuve.",
    specialties: ['Extension', 'Rénovation complète', 'Permis de construire', 'Plans 3D', 'Maîtrise d’œuvre'],
    services: [
      { name: 'Visite conseil sur site', desc: 'Diagnostic du projet, budget, faisabilité', price: '150 €' },
      { name: 'Plans + dossier permis de construire', desc: 'Étude complète de votre projet', price: '2 900 €' },
      { name: 'Maîtrise d’œuvre complète', desc: 'Suivi de chantier jusqu’à la réception', price: 'Sur devis' }
    ],
    availability: [1, 2, 3, 4, 5], responseTime: '< 2 h', lat: 48.8620, lng: 2.3550, phone: '+33 6 12 34 56 78'
  },
  {
    id: 'p2', name: 'Marc Lefèvre', company: 'ArchiStudio Lyon',
    category: 'architecte', city: 'Lyon', rating: 4.7, reviewsCount: 21,
    verified: true, featured: false, price: 80, priceUnit: '€/h', experience: 10, projects: 87,
    photo: 'img/architecte.jpg', gallery: ['img/architecte.jpg', 'img/chantier.jpg'],
    bio: "Studio d'architecture spécialisé dans la réhabilitation d'appartements haussmanniens et la transformation de bureaux en logements lumineux.",
    specialties: ['Réhabilitation', 'Aménagement intérieur', 'Conseil'],
    services: [
      { name: 'Visite conseil', desc: '1 h sur site + note d’intention', price: '120 €' },
      { name: 'Avant-projet + plans', desc: 'Plans 2D/3D et perspectives', price: '1 800 €' }
    ],
    availability: [1, 2, 3, 4], responseTime: '< 4 h', lat: 45.7640, lng: 4.8357, phone: '+33 6 22 44 66 88'
  },
  {
    id: 'p3', name: 'Claire Martin', company: 'Maison Claire — Déco d’intérieur',
    category: 'decorateur', city: 'Paris', rating: 4.8, reviewsCount: 45,
    verified: true, featured: true, price: 70, priceUnit: '€/h', experience: 9, projects: 120,
    photo: 'img/decorateur.jpg', gallery: ['img/decorateur.jpg', 'img/hero.jpg', 'img/chantier.jpg'],
    bio: "Décoratrice d'intérieur. Je transforme vos espaces avec des matériaux naturels et une palette douce. Projets clé en main : du moodboard aux achats, jusqu'à l'installation.",
    specialties: ['Home staging', 'Décoration complète', 'Moodboard', 'Sélection mobilier'],
    services: [
      { name: 'Consultation déco en ligne', desc: 'Visio 45 min, plan d’action', price: '90 €' },
      { name: 'Projet déco pièce', desc: 'Moodboard + plans + shopping list', price: '890 €' },
      { name: 'Projet complet logement', desc: 'Accompagnement de A à Z', price: '2 400 €' }
    ],
    availability: [1, 2, 3, 4, 5], responseTime: '< 1 h', lat: 48.8740, lng: 2.3290, phone: '+33 6 98 76 54 32'
  },
  {
    id: 'p4', name: 'Élodie Roche', company: 'Déco & Harmonie',
    category: 'decorateur', city: 'Bordeaux', rating: 4.6, reviewsCount: 18,
    verified: false, featured: false, price: 60, priceUnit: '€/h', experience: 6, projects: 54,
    photo: 'img/decorateur.jpg', gallery: ['img/decorateur.jpg'],
    bio: 'Décoratrice spécialiste des petits espaces et des budgets maîtrisés. Je redonne vie à vos intérieurs sans tout casser.',
    specialties: ['Petits espaces', 'Rangement', 'Upcycling'],
    services: [
      { name: 'Consultation déco', desc: '1 h sur place', price: '75 €' },
      { name: 'Relooking pièce', desc: 'Moodboard + liste d’achats', price: '590 €' }
    ],
    availability: [2, 3, 4, 5, 6], responseTime: '< 6 h', lat: 44.8378, lng: -0.5792, phone: '+33 6 11 22 33 44'
  },
  {
    id: 'p5', name: 'Karim Benali', company: 'Peinture Premium',
    category: 'peintre', city: 'Paris', rating: 4.9, reviewsCount: 67,
    verified: true, featured: true, price: 32, priceUnit: '€/h', experience: 15, projects: 310,
    photo: 'img/peintre.jpg', gallery: ['img/peintre.jpg', 'img/chantier.jpg', 'img/hero.jpg'],
    bio: "Artisan peintre de père en fils. Finitions soignées, chantiers propres et délais tenus. Je travaille avec des peintures écologiques sans COV et je protège vos sols et meubles.",
    specialties: ['Peinture intérieure', 'Papier peint', 'Enduits décoratifs', 'Façades'],
    services: [
      { name: 'Peinture d’une chambre', desc: 'Préparation + 2 couches', price: '420 €' },
      { name: 'Rénovation appartement T3', desc: 'Murs + plafonds complets', price: '2 600 €' },
      { name: 'Enduit décoratif (effet béton)', desc: 'Au m², matériaux inclus', price: '55 €/m²' }
    ],
    availability: [0, 1, 2, 3, 4, 5], responseTime: '< 30 min', lat: 48.8606, lng: 2.3376, phone: '+33 6 55 44 33 22'
  },
  {
    id: 'p6', name: 'Antoine Ricci', company: 'Couleurs Sud',
    category: 'peintre', city: 'Marseille', rating: 4.5, reviewsCount: 23,
    verified: true, featured: false, price: 28, priceUnit: '€/h', experience: 8, projects: 96,
    photo: 'img/peintre.jpg', gallery: ['img/peintre.jpg'],
    bio: 'Peintre en bâtiment passionné, spécialiste des couleurs méditerranéennes et des façades qui durent.',
    specialties: ['Façades', 'Peinture intérieure'],
    services: [
      { name: 'Peinture pièce', desc: 'Forfait salon ou chambre', price: '380 €' },
      { name: 'Ravalement de façade', desc: 'Nettoyage + peinture', price: 'Sur devis' }
    ],
    availability: [1, 2, 3, 4, 6], responseTime: '< 12 h', lat: 43.2965, lng: 5.3698, phone: '+33 6 77 88 99 00'
  },
  {
    id: 'p7', name: 'Thomas Girard', company: 'ElecPro Services',
    category: 'electricien', city: 'Lyon', rating: 4.8, reviewsCount: 54,
    verified: true, featured: false, price: 45, priceUnit: '€/h', experience: 12, projects: 240,
    photo: 'img/electricien.jpg', gallery: ['img/electricien.jpg', 'img/chantier.jpg'],
    bio: 'Électricien certifié, spécialiste de la mise aux normes, du tableau électrique et des installations domotiques. Devis gratuit et rapide.',
    specialties: ['Mise aux normes', 'Tableau électrique', 'Domotique', 'Dépannage'],
    services: [
      { name: 'Mise aux normes tableau', desc: 'Remplacement + certificat', price: '650 €' },
      { name: 'Dépannage électricité', desc: 'Déplacement inclus', price: '90 €' },
      { name: 'Installation prise / éclairage', desc: 'À l’unité, fournitures en sus', price: '45 €' }
    ],
    availability: [1, 2, 3, 4, 5, 6], responseTime: '< 1 h', lat: 45.7500, lng: 4.8500, phone: '+33 6 31 42 53 64'
  },
  {
    id: 'p8', name: 'Julien Petit', company: 'Volt & Fils',
    category: 'electricien', city: 'Paris', rating: 4.6, reviewsCount: 30,
    verified: true, featured: false, price: 42, priceUnit: '€/h', experience: 7, projects: 130,
    photo: 'img/electricien.jpg', gallery: ['img/electricien.jpg'],
    bio: 'Jeune entreprise électrique, réactive et transparente. Je vous conseille sur les aides (MaPrimeRénov’) pour vos travaux.',
    specialties: ['Rénovation électrique', 'Éclairage LED', 'Bornes VE'],
    services: [
      { name: 'Rénovation partielle', desc: 'Points lumineux + prises', price: 'Sur devis' },
      { name: 'Installation borne VE', desc: 'Forfait pose', price: '450 €' }
    ],
    availability: [1, 2, 3, 4], responseTime: '< 3 h', lat: 48.8840, lng: 2.3220, phone: '+33 6 09 87 65 43'
  },
  {
    id: 'p9', name: 'Hassan El Amrani', company: 'Plomberie Express',
    category: 'plombier', city: 'Paris', rating: 4.7, reviewsCount: 41,
    verified: true, featured: true, price: 55, priceUnit: '€/h', experience: 13, projects: 380,
    photo: 'img/plombier.jpg', gallery: ['img/plombier.jpg', 'img/chantier.jpg'],
    bio: 'Plombier-chauffagiste disponible 7j/7 pour dépannage et rénovation. Intervention rapide, prix annoncé avant intervention, facture détaillée.',
    specialties: ['Dépannage urgence', 'Salle de bain', 'Chauffe-eau', 'Démarrage chauffage'],
    services: [
      { name: 'Dépannage fuite', desc: 'Déplacement + réparation', price: '95 €' },
      { name: 'Remplacement chauffe-eau', desc: 'Pose incluse, appareil en sus', price: '250 €' },
      { name: 'Rénovation salle de bain', desc: 'Forfait complet plomberie', price: 'Sur devis' }
    ],
    availability: [0, 1, 2, 3, 4, 5, 6], responseTime: '< 45 min', lat: 48.8530, lng: 2.3490, phone: '+33 6 24 68 13 57'
  },
  {
    id: 'p10', name: 'Pierre Martin', company: 'Menuiserie Martin',
    category: 'menuisier', city: 'Lille', rating: 4.9, reviewsCount: 38,
    verified: true, featured: false, price: 40, priceUnit: '€/h', experience: 18, projects: 265,
    photo: 'img/menuisier.jpg', gallery: ['img/menuisier.jpg', 'img/hero.jpg'],
    bio: "Menuisier-ébéniste : portes, escaliers, cuisine sur mesure et agencements en bois massif. L'art du bois, la précision en plus.",
    specialties: ['Cuisine sur mesure', 'Portes & fenêtres', 'Escaliers', 'Agencement'],
    services: [
      { name: 'Pose porte intérieure', desc: 'Fourniture + pose', price: '380 €' },
      { name: 'Cuisine sur mesure', desc: 'Étude + fabrication', price: 'Sur devis' },
      { name: 'Fabrication étagère / meuble', desc: 'Sur mesure, bois massif', price: 'À partir de 250 €' }
    ],
    availability: [1, 2, 3, 4, 5], responseTime: '< 2 h', lat: 50.6292, lng: 3.0573, phone: '+33 6 45 67 89 01'
  },
  {
    id: 'p11', name: 'David Cohen', company: 'Maçonnerie Solide',
    category: 'macon', city: 'Marseille', rating: 4.6, reviewsCount: 27,
    verified: true, featured: false, price: 38, priceUnit: '€/h', experience: 20, projects: 150,
    photo: 'img/macon.jpg', gallery: ['img/macon.jpg', 'img/chantier.jpg'],
    bio: 'Maçon depuis 20 ans : fondations, murs, dalles, extension et ravalement. Chantiers solides, garantis décennaux.',
    specialties: ['Extension', 'Dalle béton', 'Ravalement', 'Murs porteurs'],
    services: [
      { name: 'Dalle béton', desc: 'Fourniture + coulage', price: '45 €/m²' },
      { name: 'Ouverture mur porteur', desc: 'Étaiement + IPN', price: 'Sur devis' },
      { name: 'Extension (clé en main)', desc: 'Maçonnerie complète', price: 'Sur devis' }
    ],
    availability: [1, 2, 3, 4, 5, 6], responseTime: '< 24 h', lat: 43.2965, lng: 5.3698, phone: '+33 6 13 57 92 46'
  },
  {
    id: 'p12', name: 'Léa Fontaine', company: 'Jardins & Paysages',
    category: 'jardinier', city: 'Nantes', rating: 4.8, reviewsCount: 19,
    verified: false, featured: false, price: 35, priceUnit: '€/h', experience: 6, projects: 72,
    photo: 'img/jardinier.jpg', gallery: ['img/jardinier.jpg', 'img/hero.jpg'],
    bio: 'Paysagiste : conception et entretien de jardins, terrasses, murets et plantations. Des extérieurs qui vivent toute l’année.',
    specialties: ['Création jardin', 'Terrasse bois', 'Plantation', 'Entretien'],
    services: [
      { name: 'Création de massif', desc: 'Plantes + paillage + pose', price: '480 €' },
      { name: 'Terrasse bois', desc: 'Fourniture + pose', price: '65 €/m²' },
      { name: 'Entretien jardin', desc: 'Tonte, taille, nettoyage', price: '35 €/h' }
    ],
    availability: [1, 2, 3, 4, 5], responseTime: '< 8 h', lat: 47.2184, lng: -1.5536, phone: '+33 6 81 23 45 67'
  }
];

/* Avis génériques (pool) pour la démo — 2 par pro */
const HB_REVIEW_POOL = [
  { name: 'Nathalie P.', text: 'Travail impeccable et équipe très ponctuelle. Je recommande les yeux fermés !' },
  { name: 'Grégory M.', text: 'Excellent rapport qualité/prix. Devis clair, chantier propre, livré dans les temps.' },
  { name: 'Sandra K.', text: 'Professionnel à l’écoute, de bons conseils. Le résultat est encore plus beau qu’espéré.' },
  { name: 'François L.', text: 'Très satisfait : communication fluide et finitions soignées. Je referai appel à eux.' },
  { name: 'Aminata D.', text: 'Un vrai pro, réactif du début à la fin. Merci pour ce superbe travail !' },
  { name: 'Hugo B.', text: 'Sérieux, gentil et efficace. Le chantier est magnifique, mes voisins veulent son numéro.' },
  { name: 'Clara V.', text: 'Prix respectés, délais respectés, matériaux de qualité. Rien à redire.' },
  { name: 'Théo R.', text: 'Je recommande à 100%. Intervention rapide, explications claires et travail soigné.' }
];

const HB_TESTIMONIALS = [
  {
    name: 'Céline R.', project: 'Rénovation cuisine — Paris',
    text: 'Grâce à House Business, j’ai comparé 3 artisans en 2 jours. Devis reçus en 24 h, chantier superbe. La réservation en ligne est un vrai plus !',
    stars: 5
  },
  {
    name: 'Moussa T.', project: 'Extension maison — Lyon',
    text: 'L’architecte trouvé sur la plateforme a géré le permis de construire et le suivi de chantier. Tout était centralisé : messages, devis, paiements.',
    stars: 5
  },
  {
    name: 'Isabelle G.', project: 'Relooking déco — Bordeaux',
    text: 'En tant que pro, je reçois des demandes qualifiées sans intermédiaire. Le calendrier intégré me fait gagner un temps fou.',
    stars: 5
  }
];
