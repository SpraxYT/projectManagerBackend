// Templates de tâches prédéfinis

export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: Array<{
    name: string;
    color: string;
    tasks: Array<{
      title: string;
      description?: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    }>;
  }>;
}

export const taskTemplates: TaskTemplate[] = [
  {
    id: 'prestashop',
    name: 'Boutique PrestaShop',
    description: 'Développement complet d\'une boutique PrestaShop',
    icon: '🛒',
    columns: [
      {
        name: 'Installation & Config',
        color: '#6B7280',
        tasks: [
          { title: 'Installation PrestaShop', description: 'Installation de PrestaShop sur le serveur', priority: 'URGENT' },
          { title: 'Configuration serveur', description: 'PHP, MySQL, Apache/Nginx', priority: 'HIGH' },
          { title: 'Configuration SSL', description: 'Certificat HTTPS', priority: 'HIGH' },
          { title: 'Paramétrage de base', description: 'Langue, devise, zones géographiques', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Développement',
        color: '#3B82F6',
        tasks: [
          { title: 'Développement du thème', description: 'Création du design personnalisé', priority: 'HIGH' },
          { title: 'Module de paiement', description: 'Intégration Stripe/PayPal', priority: 'URGENT' },
          { title: 'Module de livraison', description: 'Calcul des frais de port', priority: 'HIGH' },
          { title: 'Module de newsletter', description: 'Inscription newsletter', priority: 'MEDIUM' },
          { title: 'Module de comptabilité', description: 'Export comptable', priority: 'LOW' },
          { title: 'Personnalisation back-office', description: 'Interface admin personnalisée', priority: 'LOW' },
        ],
      },
      {
        name: 'Contenu',
        color: '#F59E0B',
        tasks: [
          { title: 'Import des produits', description: 'Catalogue complet avec images', priority: 'HIGH' },
          { title: 'Catégories et filtres', description: 'Organisation du catalogue', priority: 'MEDIUM' },
          { title: 'Pages légales', description: 'CGV, mentions légales, RGPD', priority: 'HIGH' },
          { title: 'Pages informatives', description: 'À propos, contact, livraison', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'SEO & Marketing',
        color: '#8B5CF6',
        tasks: [
          { title: 'Optimisation SEO', description: 'Meta titles, descriptions, URLs', priority: 'HIGH' },
          { title: 'Google Analytics', description: 'Installation et configuration', priority: 'MEDIUM' },
          { title: 'Google Search Console', description: 'Intégration et sitemap', priority: 'MEDIUM' },
          { title: 'Réseaux sociaux', description: 'Intégration Facebook Pixel, Instagram', priority: 'LOW' },
        ],
      },
      {
        name: 'Tests & Mise en prod',
        color: '#10B981',
        tasks: [
          { title: 'Tests de commande', description: 'Processus complet d\'achat', priority: 'URGENT' },
          { title: 'Tests de paiement', description: 'Validation des transactions', priority: 'URGENT' },
          { title: 'Tests responsive', description: 'Mobile, tablette, desktop', priority: 'HIGH' },
          { title: 'Formation client', description: 'Gestion des commandes et produits', priority: 'MEDIUM' },
          { title: 'Mise en production', description: 'Déploiement final', priority: 'URGENT' },
        ],
      },
    ],
  },
  {
    id: 'saas',
    name: 'Application SaaS',
    description: 'Développement d\'une application SaaS multi-tenant',
    icon: '☁️',
    columns: [
      {
        name: 'Infrastructure',
        color: '#6B7280',
        tasks: [
          { title: 'Architecture base de données', description: 'Schema MySQL/PostgreSQL multi-tenant', priority: 'URGENT' },
          { title: 'Configuration serveur', description: 'VPS, Docker, PM2', priority: 'HIGH' },
          { title: 'Configuration domaine', description: 'DNS et sous-domaines', priority: 'HIGH' },
          { title: 'Système d\'authentification', description: 'JWT, refresh tokens', priority: 'URGENT' },
          { title: 'Gestion des rôles', description: 'Système de permissions', priority: 'HIGH' },
        ],
      },
      {
        name: 'Développement Backend',
        color: '#3B82F6',
        tasks: [
          { title: 'API REST', description: 'Endpoints CRUD', priority: 'URGENT' },
          { title: 'Gestion des instances', description: 'Multi-tenant isolation', priority: 'HIGH' },
          { title: 'Système de facturation', description: 'Stripe subscription', priority: 'HIGH' },
          { title: 'Webhooks', description: 'Intégrations externes', priority: 'MEDIUM' },
          { title: 'Notifications emails', description: 'SMTP, templates', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Développement Frontend',
        color: '#10B981',
        tasks: [
          { title: 'Interface d\'authentification', description: 'Login, register, forgot password', priority: 'URGENT' },
          { title: 'Dashboard principal', description: 'Vue d\'ensemble et statistiques', priority: 'HIGH' },
          { title: 'Gestion des utilisateurs', description: 'CRUD utilisateurs et rôles', priority: 'HIGH' },
          { title: 'Paramètres d\'instance', description: 'Configuration personnalisée', priority: 'MEDIUM' },
          { title: 'Interface responsive', description: 'Mobile-first design', priority: 'HIGH' },
        ],
      },
      {
        name: 'Tests & Qualité',
        color: '#F59E0B',
        tasks: [
          { title: 'Tests unitaires', description: 'Backend et frontend', priority: 'MEDIUM' },
          { title: 'Tests d\'intégration', description: 'API endpoints', priority: 'HIGH' },
          { title: 'Tests de sécurité', description: 'Injection SQL, XSS, CSRF', priority: 'URGENT' },
          { title: 'Tests de performance', description: 'Load testing', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Déploiement',
        color: '#8B5CF6',
        tasks: [
          { title: 'CI/CD Pipeline', description: 'GitHub Actions / GitLab CI', priority: 'MEDIUM' },
          { title: 'Backup automatique', description: 'Sauvegardes BDD quotidiennes', priority: 'HIGH' },
          { title: 'Monitoring', description: 'Uptime, logs, alertes', priority: 'HIGH' },
          { title: 'Documentation technique', description: 'API, déploiement', priority: 'LOW' },
          { title: 'Mise en production', description: 'Déploiement final', priority: 'URGENT' },
        ],
      },
    ],
  },
  {
    id: 'crm',
    name: 'CRM Personnalisé',
    description: 'Développement d\'un système CRM pour gestion clients',
    icon: '📊',
    columns: [
      {
        name: 'Configuration',
        color: '#6B7280',
        tasks: [
          { title: 'Architecture BDD', description: 'Schema contacts, entreprises, opportunités', priority: 'URGENT' },
          { title: 'Système d\'authentification', description: 'Login multi-utilisateurs', priority: 'HIGH' },
          { title: 'Gestion des permissions', description: 'Rôles : Admin, Manager, Commercial', priority: 'HIGH' },
        ],
      },
      {
        name: 'Gestion Contacts',
        color: '#3B82F6',
        tasks: [
          { title: 'CRUD Contacts', description: 'Création, édition, suppression contacts', priority: 'URGENT' },
          { title: 'Fiche contact détaillée', description: 'Historique, notes, documents', priority: 'HIGH' },
          { title: 'Import/Export contacts', description: 'CSV, Excel', priority: 'MEDIUM' },
          { title: 'Recherche avancée', description: 'Filtres et recherche multicritères', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Pipeline Commercial',
        color: '#10B981',
        tasks: [
          { title: 'Gestion des opportunités', description: 'Suivi du pipeline de vente', priority: 'HIGH' },
          { title: 'Étapes personnalisables', description: 'Prospect > Négociation > Gagné/Perdu', priority: 'HIGH' },
          { title: 'Prévisions de ventes', description: 'Statistiques et projections', priority: 'MEDIUM' },
          { title: 'Devis et factures', description: 'Génération PDF', priority: 'HIGH' },
        ],
      },
      {
        name: 'Communication',
        color: '#F59E0B',
        tasks: [
          { title: 'Historique des échanges', description: 'Emails, appels, rendez-vous', priority: 'HIGH' },
          { title: 'Intégration email', description: 'SMTP/IMAP, envoi automatique', priority: 'MEDIUM' },
          { title: 'Calendrier', description: 'Gestion des rendez-vous', priority: 'MEDIUM' },
          { title: 'Rappels automatiques', description: 'Notifications et relances', priority: 'LOW' },
        ],
      },
      {
        name: 'Finalisation',
        color: '#8B5CF6',
        tasks: [
          { title: 'Tableau de bord', description: 'Statistiques et KPIs', priority: 'HIGH' },
          { title: 'Rapports personnalisés', description: 'Export PDF/Excel', priority: 'MEDIUM' },
          { title: 'Formation utilisateurs', description: 'Documentation et formation', priority: 'MEDIUM' },
          { title: 'Tests et ajustements', description: 'Tests utilisateurs finaux', priority: 'HIGH' },
        ],
      },
    ],
  },
  {
    id: 'site-vitrine',
    name: 'Site Vitrine',
    description: 'Création d\'un site vitrine professionnel',
    icon: '🌐',
    columns: [
      {
        name: 'Conception',
        color: '#8B5CF6',
        tasks: [
          { title: 'Maquettes desktop', description: 'Design Figma/Adobe XD', priority: 'HIGH' },
          { title: 'Maquettes mobile', description: 'Version responsive', priority: 'HIGH' },
          { title: 'Charte graphique', description: 'Couleurs, typographie, logo', priority: 'MEDIUM' },
          { title: 'Architecture du site', description: 'Arborescence des pages', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Développement',
        color: '#3B82F6',
        tasks: [
          { title: 'Page d\'accueil', description: 'Hero, présentation, CTA', priority: 'URGENT' },
          { title: 'Page À propos', description: 'Histoire, équipe, valeurs', priority: 'MEDIUM' },
          { title: 'Page Services', description: 'Détail des offres', priority: 'HIGH' },
          { title: 'Page Contact', description: 'Formulaire + carte', priority: 'HIGH' },
          { title: 'Blog/Actualités', description: 'Système de blog (optionnel)', priority: 'LOW' },
          { title: 'Responsive design', description: 'Adaptation mobile/tablette', priority: 'HIGH' },
        ],
      },
      {
        name: 'Contenu',
        color: '#F59E0B',
        tasks: [
          { title: 'Rédaction des textes', description: 'Copywriting professionnel', priority: 'HIGH' },
          { title: 'Photos et images', description: 'Banque d\'images ou shooting', priority: 'MEDIUM' },
          { title: 'Optimisation des médias', description: 'Compression images/vidéos', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'SEO & Marketing',
        color: '#10B981',
        tasks: [
          { title: 'Optimisation SEO on-page', description: 'Meta, balises, structure', priority: 'HIGH' },
          { title: 'Google My Business', description: 'Fiche d\'établissement', priority: 'MEDIUM' },
          { title: 'Réseaux sociaux', description: 'Liens et intégrations', priority: 'LOW' },
          { title: 'Google Analytics', description: 'Suivi des visiteurs', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Livraison',
        color: '#6B7280',
        tasks: [
          { title: 'Tests cross-browser', description: 'Chrome, Firefox, Safari, Edge', priority: 'HIGH' },
          { title: 'Tests de performance', description: 'PageSpeed, GTmetrix', priority: 'MEDIUM' },
          { title: 'Formulaire de contact', description: 'Test d\'envoi emails', priority: 'HIGH' },
          { title: 'Formation client', description: 'Gestion du contenu', priority: 'MEDIUM' },
          { title: 'Mise en ligne', description: 'Déploiement production', priority: 'URGENT' },
        ],
      },
    ],
  },
  {
    id: 'wordpress',
    name: 'Site WordPress',
    description: 'Développement d\'un site WordPress professionnel',
    icon: '📝',
    columns: [
      {
        name: 'Installation',
        color: '#6B7280',
        tasks: [
          { title: 'Installation WordPress', description: 'Setup sur hébergement', priority: 'URGENT' },
          { title: 'Choix du thème', description: 'Thème premium ou custom', priority: 'HIGH' },
          { title: 'Installation des plugins', description: 'SEO, sécurité, cache, formulaires', priority: 'HIGH' },
          { title: 'Configuration SSL', description: 'Certificat HTTPS', priority: 'HIGH' },
        ],
      },
      {
        name: 'Personnalisation',
        color: '#3B82F6',
        tasks: [
          { title: 'Personnalisation du thème', description: 'Couleurs, logo, polices', priority: 'HIGH' },
          { title: 'Création du menu', description: 'Navigation principale', priority: 'MEDIUM' },
          { title: 'Widget sidebar/footer', description: 'Zones de contenu', priority: 'LOW' },
          { title: 'Page builder', description: 'Elementor/Gutenberg setup', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Pages & Contenu',
        color: '#F59E0B',
        tasks: [
          { title: 'Page d\'accueil', description: 'Design et contenu', priority: 'URGENT' },
          { title: 'Pages principales', description: 'Services, À propos, Contact', priority: 'HIGH' },
          { title: 'Blog', description: 'Configuration et premiers articles', priority: 'MEDIUM' },
          { title: 'Pages légales', description: 'CGU, Mentions, Confidentialité', priority: 'HIGH' },
          { title: 'Formulaires', description: 'Contact, devis, newsletter', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Optimisation',
        color: '#10B981',
        tasks: [
          { title: 'SEO Yoast', description: 'Configuration et optimisation', priority: 'HIGH' },
          { title: 'Cache et performance', description: 'WP Rocket ou W3 Total Cache', priority: 'HIGH' },
          { title: 'Sécurité', description: 'Wordfence, iThemes Security', priority: 'HIGH' },
          { title: 'Backup automatique', description: 'UpdraftPlus ou BackupBuddy', priority: 'MEDIUM' },
          { title: 'Tests de vitesse', description: 'PageSpeed, GTmetrix', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Livraison',
        color: '#8B5CF6',
        tasks: [
          { title: 'Tests complets', description: 'Tous les navigateurs et devices', priority: 'HIGH' },
          { title: 'Formation client', description: 'Ajout articles, pages, médias', priority: 'MEDIUM' },
          { title: 'Documentation', description: 'Guide d\'utilisation', priority: 'LOW' },
          { title: 'Mise en production', description: 'Vérification finale et lancement', priority: 'URGENT' },
        ],
      },
    ],
  },
  {
    id: 'app-mobile',
    name: 'Application Mobile',
    description: 'Développement d\'une application mobile (iOS/Android)',
    icon: '📱',
    columns: [
      {
        name: 'Setup & Architecture',
        color: '#6B7280',
        tasks: [
          { title: 'Choix de la technologie', description: 'React Native / Flutter / Native', priority: 'URGENT' },
          { title: 'Configuration du projet', description: 'Initialisation et dépendances', priority: 'HIGH' },
          { title: 'Architecture de l\'app', description: 'Navigation, state management', priority: 'HIGH' },
          { title: 'Configuration API', description: 'Backend REST/GraphQL', priority: 'HIGH' },
        ],
      },
      {
        name: 'Développement UI',
        color: '#3B82F6',
        tasks: [
          { title: 'Écran de connexion', description: 'Login, register, forgot password', priority: 'URGENT' },
          { title: 'Onboarding', description: 'Tutoriel première utilisation', priority: 'MEDIUM' },
          { title: 'Écran principal', description: 'Dashboard ou home', priority: 'URGENT' },
          { title: 'Navigation', description: 'TabBar, Drawer, Stack', priority: 'HIGH' },
          { title: 'Écrans secondaires', description: 'Profil, paramètres, listes', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Fonctionnalités',
        color: '#10B981',
        tasks: [
          { title: 'Notifications push', description: 'Firebase Cloud Messaging', priority: 'HIGH' },
          { title: 'Gestion offline', description: 'Stockage local et sync', priority: 'MEDIUM' },
          { title: 'Camera et galerie', description: 'Upload de photos', priority: 'LOW' },
          { title: 'Géolocalisation', description: 'Maps et localisation', priority: 'LOW' },
          { title: 'Paiement in-app', description: 'Stripe / Apple Pay / Google Pay', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Tests',
        color: '#F59E0B',
        tasks: [
          { title: 'Tests sur devices', description: 'iOS (iPhone/iPad), Android (Samsung, etc)', priority: 'HIGH' },
          { title: 'Tests de performance', description: 'Fluidité, batterie, mémoire', priority: 'HIGH' },
          { title: 'Beta testing', description: 'TestFlight (iOS) / Beta interne (Android)', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Publication',
        color: '#8B5CF6',
        tasks: [
          { title: 'App Store submission', description: 'Screenshots, description, review', priority: 'HIGH' },
          { title: 'Google Play submission', description: 'Listing et publication', priority: 'HIGH' },
          { title: 'Support et updates', description: 'Corrections post-launch', priority: 'MEDIUM' },
        ],
      },
    ],
  },
  {
    id: 'refonte-site',
    name: 'Refonte de Site Web',
    description: 'Refonte complète d\'un site existant',
    icon: '🔄',
    columns: [
      {
        name: 'Audit',
        color: '#6B7280',
        tasks: [
          { title: 'Audit du site actuel', description: 'Analyse UX, SEO, performance', priority: 'HIGH' },
          { title: 'Analyse de la concurrence', description: 'Benchmark et best practices', priority: 'MEDIUM' },
          { title: 'Définition des objectifs', description: 'Cahier des charges', priority: 'HIGH' },
          { title: 'Inventaire du contenu', description: 'Liste des pages et médias à migrer', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Conception',
        color: '#8B5CF6',
        tasks: [
          { title: 'Wireframes', description: 'Structure des pages', priority: 'HIGH' },
          { title: 'Maquettes graphiques', description: 'Design complet desktop/mobile', priority: 'HIGH' },
          { title: 'Validation client', description: 'Présentation et ajustements', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Développement',
        color: '#3B82F6',
        tasks: [
          { title: 'Setup nouveau site', description: 'Installation et configuration', priority: 'URGENT' },
          { title: 'Intégration du design', description: 'HTML/CSS/JS responsive', priority: 'HIGH' },
          { title: 'Migration du contenu', description: 'Textes, images, médias', priority: 'HIGH' },
          { title: 'Redirections 301', description: 'Préserver le SEO', priority: 'URGENT' },
          { title: 'Nouvelles fonctionnalités', description: 'Features additionnelles', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'SEO & Performance',
        color: '#10B981',
        tasks: [
          { title: 'Optimisation SEO', description: 'Meta, URLs, sitemap', priority: 'HIGH' },
          { title: 'Optimisation performance', description: 'Cache, CDN, compression', priority: 'HIGH' },
          { title: 'Tests de vitesse', description: 'PageSpeed > 90', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Mise en ligne',
        color: '#EF4444',
        tasks: [
          { title: 'Tests pré-production', description: 'Environnement de staging', priority: 'HIGH' },
          { title: 'Validation client finale', description: 'Recette complète', priority: 'HIGH' },
          { title: 'Basculement DNS', description: 'Mise en prod du nouveau site', priority: 'URGENT' },
          { title: 'Surveillance post-launch', description: 'Monitoring 48h', priority: 'HIGH' },
        ],
      },
    ],
  },
  {
    id: 'api-rest',
    name: 'API REST',
    description: 'Développement d\'une API REST complète',
    icon: '🔌',
    columns: [
      {
        name: 'Architecture',
        color: '#6B7280',
        tasks: [
          { title: 'Design de l\'API', description: 'Endpoints, routes, ressources', priority: 'URGENT' },
          { title: 'Schema de la BDD', description: 'Modèles et relations', priority: 'URGENT' },
          { title: 'Choix du stack', description: 'Express/Fastify, Prisma/TypeORM', priority: 'HIGH' },
          { title: 'Structure du projet', description: 'Organisation des dossiers', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Authentification',
        color: '#EF4444',
        tasks: [
          { title: 'Système JWT', description: 'Access + refresh tokens', priority: 'URGENT' },
          { title: 'Middleware d\'auth', description: 'Protection des routes', priority: 'HIGH' },
          { title: 'Gestion des rôles', description: 'RBAC (Role-Based Access Control)', priority: 'HIGH' },
          { title: 'Rate limiting', description: 'Protection anti-spam', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Endpoints CRUD',
        color: '#3B82F6',
        tasks: [
          { title: 'Endpoints utilisateurs', description: 'GET, POST, PUT, DELETE', priority: 'HIGH' },
          { title: 'Endpoints ressources', description: 'CRUD principal', priority: 'HIGH' },
          { title: 'Validation des données', description: 'Zod / Joi schemas', priority: 'HIGH' },
          { title: 'Gestion des erreurs', description: 'Error handler global', priority: 'MEDIUM' },
          { title: 'Pagination', description: 'Limit, offset, cursors', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Documentation',
        color: '#F59E0B',
        tasks: [
          { title: 'Swagger / OpenAPI', description: 'Documentation interactive', priority: 'HIGH' },
          { title: 'Exemples de requêtes', description: 'Postman collection', priority: 'MEDIUM' },
          { title: 'Guide d\'intégration', description: 'README détaillé', priority: 'LOW' },
        ],
      },
      {
        name: 'Tests & Déploiement',
        color: '#10B981',
        tasks: [
          { title: 'Tests unitaires', description: 'Jest / Mocha', priority: 'HIGH' },
          { title: 'Tests d\'intégration', description: 'Supertest', priority: 'HIGH' },
          { title: 'CI/CD', description: 'GitHub Actions', priority: 'MEDIUM' },
          { title: 'Déploiement', description: 'VPS, Docker, PM2', priority: 'URGENT' },
          { title: 'Monitoring', description: 'Logs et alertes', priority: 'MEDIUM' },
        ],
      },
    ],
  },
  {
    id: 'dashboard-admin',
    name: 'Dashboard Admin',
    description: 'Interface d\'administration complète',
    icon: '⚡',
    columns: [
      {
        name: 'Setup',
        color: '#6B7280',
        tasks: [
          { title: 'Installation Next.js/React', description: 'Configuration du projet frontend', priority: 'URGENT' },
          { title: 'Configuration Tailwind', description: 'Setup CSS framework', priority: 'HIGH' },
          { title: 'Structure des composants', description: 'Atomic design pattern', priority: 'MEDIUM' },
          { title: 'Système d\'authentification', description: 'Login, JWT, protected routes', priority: 'URGENT' },
        ],
      },
      {
        name: 'Composants UI',
        color: '#8B5CF6',
        tasks: [
          { title: 'Sidebar navigation', description: 'Menu latéral responsive', priority: 'HIGH' },
          { title: 'Composants formulaires', description: 'Input, Select, Checkbox, etc.', priority: 'HIGH' },
          { title: 'Tableaux de données', description: 'Table avec tri, filtres, pagination', priority: 'HIGH' },
          { title: 'Modals', description: 'Modals réutilisables', priority: 'MEDIUM' },
          { title: 'Notifications/Toasts', description: 'Système d\'alertes', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Pages Admin',
        color: '#3B82F6',
        tasks: [
          { title: 'Dashboard principal', description: 'Statistiques et graphiques', priority: 'HIGH' },
          { title: 'Gestion des utilisateurs', description: 'CRUD utilisateurs', priority: 'URGENT' },
          { title: 'Gestion des rôles', description: 'Permissions granulaires', priority: 'HIGH' },
          { title: 'Paramètres', description: 'Configuration de l\'instance', priority: 'MEDIUM' },
          { title: 'Logs d\'activité', description: 'Historique des actions', priority: 'LOW' },
        ],
      },
      {
        name: 'Fonctionnalités',
        color: '#F59E0B',
        tasks: [
          { title: 'Upload de fichiers', description: 'Drag & drop, preview', priority: 'MEDIUM' },
          { title: 'Export de données', description: 'CSV, Excel, PDF', priority: 'MEDIUM' },
          { title: 'Recherche globale', description: 'Search bar avec filtres', priority: 'LOW' },
          { title: 'Dark mode', description: 'Thème sombre', priority: 'LOW' },
        ],
      },
      {
        name: 'Production',
        color: '#10B981',
        tasks: [
          { title: 'Tests E2E', description: 'Cypress ou Playwright', priority: 'MEDIUM' },
          { title: 'Optimisation bundle', description: 'Code splitting, lazy loading', priority: 'HIGH' },
          { title: 'Build et déploiement', description: 'Vercel / VPS', priority: 'URGENT' },
        ],
      },
    ],
  },
];
