# Chat L'Heureux 56 — Application Web (React + Vite + Firebase)

Application web officielle de l'association de protection animale **Chat L'Heureux 56** (Colpo, Morbihan).

Ce projet a été entièrement modernisé et converti depuis un ensemble de pages HTML statiques vers une **Single Page Application (SPA)** ultra-performante basée sur **React 18**, **Vite**, **Tailwind CSS** et le **SDK Firebase v9+ / v11 (modulaire)**.

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** (v18+ ou v24 LTS recommandé)
- **npm** (v9+)

### Installation des dépendances
```bash
npm install
```

### Lancement du serveur de développement
```bash
npm run dev
```
L'application est accessible par défaut sur `http://localhost:5173`.

### Compilation pour la production
```bash
npm run build
```
Les fichiers statiques optimisés sont générés dans le dossier `dist/`.

### Prévisualisation du build de production
```bash
npm run preview
```

### Exécution des tests unitaires
```bash
npm test
```

---

## 📁 Architecture du Projet

```text
chat-lheureux-56/
├── public/                     # Fichiers statiques servis directement (favicon.svg, robots, etc.)
├── legacy_html/                # Sauvegarde intégrale des anciens fichiers HTML statiques
├── netlify/
│   └── edge-functions/
│       └── og-preview.js       # Netlify Edge Function pour les aperçus Open Graph (bots Facebook, WhatsApp, etc.)
├── src/
│   ├── components/
│   │   ├── BackToTop.jsx       # Bouton flottant de retour en haut de page
│   │   ├── CatCard.jsx         # Carte individuelle de chat réutilisable avec favoris réactifs
│   │   ├── Footer.jsx          # Pied de page avec mentions légales, contacts et SIREN/SIRET
│   │   └── Header.jsx          # Navigation fixe en glassmorphism avec compteur de favoris et tiroir mobile
│   ├── context/
│   │   ├── AuthContext.jsx     # Contexte d'authentification Firebase (état connecté, rôles, actions)
│   │   ├── FavoritesContext.jsx# Contexte des coups de cœur (persistance localStorage, badge en temps réel)
│   │   └── ToastContext.jsx    # Système de notifications Toast animées et stylisées
│   ├── firebase/
│   │   ├── authService.js      # Authentification, réinitialisation mot de passe, traduction des erreurs
│   │   ├── catsService.js      # CRUD Firestore pour les chats, verrou anti-conflit et purge
│   │   ├── config.js           # Initialisation Firebase App, Auth et Firestore (IndexedDB multi-onglets)
│   │   └── storiesService.js   # CRUD Firestore pour les avis d'adoptants
│   ├── pages/
│   │   ├── AdminPage.jsx       # Tableau de bord complet d'administration avec authentification et modales
│   │   ├── AdoptionPage.jsx    # Catalogue avec recherche instantanée, filtres et compatibilités
│   │   ├── AssociationPage.jsx # Présentation de l'association, modèle Familles d'Accueil et FAQ
│   │   ├── CatDetailPage.jsx   # Fiche détaillée du chat, galerie photos, bilan véto et candidature
│   │   ├── DonContactPage.jsx  # Page de soutien, dons financiers/matériels et formulaire de contact
│   │   ├── HomePage.jsx        # Page d'accueil (Hero, sélection de chats, valeurs, témoignages tirés au sort)
│   │   ├── MentionsLegalesPage.jsx # Mentions légales, SIRET, hébergeurs et politique RGPD
│   │   ├── NotFoundPage.jsx    # Page 404 chaleureuse avec retour à l'accueil
│   │   └── TestimonialsPage.jsx# Récits et photos d'adoptants avec accordéon de lecture
│   ├── utils/
│   │   ├── age.js              # Calcul dynamique de l'âge en français et gestion de l'expiration à 60j
│   │   └── imageCompressor.js  # Compression Canvas côté client pour respecter la limite Firestore 1 Mo
│   ├── App.jsx                 # Routage React Router avec alias rétrocompatibles
│   ├── index.css               # Directives Tailwind CSS et styles graphiques glassmorphism
│   └── main.jsx                # Point d'entrée React 18
├── tests/
│   └── unit.test.mjs           # Suite de tests unitaires (Node.js test runner)
├── firestore.rules             # Règles de sécurité Firestore en production
├── netlify.toml                # Configuration Netlify (SPA redirects + Edge Functions)
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🔒 Configuration Firebase & Sécurité

### 1. Clés et Identifiants (`src/firebase/config.js`)
Les identifiants Firebase du projet `chat-lheureux-56` sont configurés :
- `projectId`: `chat-lheureux-56`
- `authDomain`: `chat-lheureux-56.firebaseapp.com`
- `storageBucket`: `chat-lheureux-56.firebasestorage.app`

### 2. Règles de sécurité Firestore (`firestore.rules`)
Les règles de sécurité garantissent :
- **Lecture publique** pour les collections `chats` et `testimonials` afin de permettre l'affichage fluide du site et l'interrogation par l'Edge Function Netlify.
- **Écriture strictement protégée** : seuls les administrateurs connectés via Firebase Authentication (`request.auth != null`) peuvent créer, modifier ou supprimer des chats et témoignages.
- **Validation du schéma** : validation des champs requis (`name`, `status`, `gender`, `photos`).

#### Déploiement des règles :
```bash
npx firebase-tools deploy --only firestore:rules
```

---

## 🌐 Déploiement Netlify

Le fichier `netlify.toml` est configuré pour :
1. Publier automatiquement le dossier de build `dist/`.
2. Router toutes les requêtes SPA vers `/index.html` (évite les erreurs 404 lors des rafraîchissements sur les sous-pages).
3. Conserver l'exécution des Edge Functions sur `/chat-detail*` et `/chat/*` pour générer dynamiquement les balises Open Graph pour les robots de réseaux sociaux (Facebook, Twitter, WhatsApp, Discord).

---

## 📋 Checklist Complète de Tests (Recette QA)

| Domaine | Scénario à vérifier | Résultat attendu |
|---|---|---|
| **Navigation & SPA** | Accéder à `/`, `/adoption`, `/temoignages`, `/association`, `/soutenir`, `/mentions-legales` | Navigation instantanée sans rechargement de page |
| **Rétrocompatibilité** | Ouvrir `/admin.html`, `/adoption.html`, `/chat-detail.html?id=xyz` | Redirection immédiate vers les routes React correspondantes |
| **Catalogue & Filtres** | Filtrer par Statut (Disponibles, Urgences, Réservés, Adoptés) | La grille s'ajuste instantanément et l'état vide s'affiche si aucun résultat |
| **Coups de cœur** | Cliquer sur l'icône cœur d'un chat | Mise à jour immédiate du badge Header et filtrage "Coups de cœur" |
| **Fiche Chat & Adoption** | Cliquer sur "Remplir le questionnaire d'adoption" | Ouverture du Google Form officiel dans un nouvel onglet |
| **Partage Social** | Cliquer sur WhatsApp / Facebook / Copier le lien | Lien pré-rempli généré correctement avec titre et photo |
| **Dons & Soutien** | Cliquer sur Teaming (1€/mois) ou HelloAsso | Accès direct aux formulaires officiels de dons |
| **Devenir FA** | Cliquer sur "Devenir Famille d'Accueil" sur `/association` ou `/soutenir` | Ouverture du formulaire officiel Google Forms |
| **Admin - Auth** | Tenter une connexion avec mauvais identifiants | Message en français explicite traduit depuis Firebase Auth |
| **Admin - Verrou** | Ouvrir la même fiche chat dans 2 fenêtres ou 2 comptes | Notification de verrouillage concurrent temps réel |
| **Admin - Photos** | Sélectionner plusieurs photos (fichiers ou URLs) | Compression Canvas automatique (800px, 0.65) plafonnée à 5 photos |
| **Admin - Purge** | Cliquer sur "Purger les fiches expirées" si chats adoptés >60j | Suppression par lot dans Firestore et mise à jour des statistiques |
| **Admin - Sauvegarde** | Cliquer sur "Sauvegarde JSON" | Téléchargement d'un export JSON complet et horodaté |
