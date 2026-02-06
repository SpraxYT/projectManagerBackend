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
    id: 'dev-sprint',
    name: 'Sprint de développement',
    description: 'Template pour un sprint de développement agile',
    icon: '💻',
    columns: [
      {
        name: 'Backlog',
        color: '#9CA3AF',
        tasks: [
          { title: 'Planification du sprint', description: 'Définir les objectifs et les user stories', priority: 'HIGH' },
          { title: 'Estimation des tâches', description: 'Estimer la complexité de chaque tâche', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'À faire',
        color: '#6B7280',
        tasks: [
          { title: 'Configuration de l\'environnement', description: 'Setup des outils et dépendances', priority: 'HIGH' },
          { title: 'Création de la structure de base', description: 'Architecture initiale du projet', priority: 'HIGH' },
        ],
      },
      {
        name: 'En cours',
        color: '#3B82F6',
        tasks: [
          { title: 'Développement des features', description: 'Implémentation des fonctionnalités', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Review',
        color: '#F59E0B',
        tasks: [
          { title: 'Code review', description: 'Revue de code par les pairs', priority: 'MEDIUM' },
          { title: 'Tests unitaires', description: 'Écriture et exécution des tests', priority: 'HIGH' },
        ],
      },
      {
        name: 'Terminé',
        color: '#10B981',
        tasks: [
          { title: 'Documentation', description: 'Finalisation de la documentation', priority: 'LOW' },
          { title: 'Déploiement', description: 'Mise en production', priority: 'URGENT' },
        ],
      },
    ],
  },
  {
    id: 'marketing-campaign',
    name: 'Campagne Marketing',
    description: 'Template pour gérer une campagne marketing',
    icon: '📢',
    columns: [
      {
        name: 'Idéation',
        color: '#8B5CF6',
        tasks: [
          { title: 'Brainstorming', description: 'Générer des idées de campagne', priority: 'HIGH' },
          { title: 'Analyse de la concurrence', description: 'Étudier les campagnes concurrentes', priority: 'MEDIUM' },
          { title: 'Définition de la cible', description: 'Identifier le public cible', priority: 'HIGH' },
        ],
      },
      {
        name: 'Planification',
        color: '#3B82F6',
        tasks: [
          { title: 'Budget et ressources', description: 'Définir le budget et les ressources nécessaires', priority: 'HIGH' },
          { title: 'Calendrier éditorial', description: 'Planifier les contenus et dates de publication', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Création',
        color: '#F59E0B',
        tasks: [
          { title: 'Design des visuels', description: 'Création des assets graphiques', priority: 'MEDIUM' },
          { title: 'Rédaction des contenus', description: 'Écriture des copies et messages', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Diffusion',
        color: '#EF4444',
        tasks: [
          { title: 'Publication sur les réseaux sociaux', description: 'Diffusion des contenus', priority: 'HIGH' },
          { title: 'Campagne publicitaire', description: 'Lancement des publicités payantes', priority: 'HIGH' },
        ],
      },
      {
        name: 'Analyse',
        color: '#10B981',
        tasks: [
          { title: 'Suivi des KPIs', description: 'Mesure des performances', priority: 'MEDIUM' },
          { title: 'Rapport final', description: 'Synthèse des résultats', priority: 'LOW' },
        ],
      },
    ],
  },
  {
    id: 'bug-tracking',
    name: 'Suivi de Bugs',
    description: 'Template pour gérer les bugs et corrections',
    icon: '🐛',
    columns: [
      {
        name: 'Rapportés',
        color: '#EF4444',
        tasks: [
          { title: 'Bug critique: Erreur de connexion', description: 'Les utilisateurs ne peuvent pas se connecter', priority: 'URGENT' },
          { title: 'Bug mineur: Faute de frappe', description: 'Correction de texte dans l\'interface', priority: 'LOW' },
        ],
      },
      {
        name: 'En investigation',
        color: '#F59E0B',
        tasks: [
          { title: 'Analyser les logs', description: 'Recherche de la cause du bug', priority: 'HIGH' },
          { title: 'Reproduire le bug', description: 'Créer un cas de test', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'En correction',
        color: '#3B82F6',
        tasks: [
          { title: 'Développer le fix', description: 'Implémenter la correction', priority: 'HIGH' },
          { title: 'Tests du fix', description: 'Vérifier que le bug est résolu', priority: 'HIGH' },
        ],
      },
      {
        name: 'À vérifier',
        color: '#8B5CF6',
        tasks: [
          { title: 'QA Testing', description: 'Test qualité complet', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Résolu',
        color: '#10B981',
        tasks: [
          { title: 'Déployer le fix', description: 'Mise en production', priority: 'HIGH' },
        ],
      },
    ],
  },
  {
    id: 'content-creation',
    name: 'Création de Contenu',
    description: 'Template pour la production de contenu',
    icon: '✍️',
    columns: [
      {
        name: 'Idées',
        color: '#F59E0B',
        tasks: [
          { title: 'Brainstorming de sujets', description: 'Générer des idées d\'articles/vidéos', priority: 'MEDIUM' },
          { title: 'Recherche de mots-clés', description: 'SEO et tendances', priority: 'LOW' },
        ],
      },
      {
        name: 'Brouillon',
        color: '#6B7280',
        tasks: [
          { title: 'Rédaction du premier jet', description: 'Écriture initiale du contenu', priority: 'MEDIUM' },
          { title: 'Recherche et sources', description: 'Collecter les informations nécessaires', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Révision',
        color: '#3B82F6',
        tasks: [
          { title: 'Relecture et correction', description: 'Vérification orthographique et grammaticale', priority: 'HIGH' },
          { title: 'Optimisation SEO', description: 'Ajuster pour le référencement', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Design',
        color: '#8B5CF6',
        tasks: [
          { title: 'Création des visuels', description: 'Images, graphiques, vidéos', priority: 'MEDIUM' },
          { title: 'Mise en page', description: 'Formatage final', priority: 'LOW' },
        ],
      },
      {
        name: 'Publié',
        color: '#10B981',
        tasks: [
          { title: 'Publication', description: 'Mise en ligne du contenu', priority: 'HIGH' },
          { title: 'Promotion', description: 'Partage sur les réseaux', priority: 'MEDIUM' },
        ],
      },
    ],
  },
  {
    id: 'product-launch',
    name: 'Lancement de Produit',
    description: 'Template pour le lancement d\'un nouveau produit',
    icon: '🚀',
    columns: [
      {
        name: 'Pré-lancement',
        color: '#6B7280',
        tasks: [
          { title: 'Étude de marché', description: 'Analyse du marché et de la concurrence', priority: 'HIGH' },
          { title: 'Définition du MVP', description: 'Déterminer les fonctionnalités minimales', priority: 'HIGH' },
          { title: 'Stratégie de prix', description: 'Définir le modèle économique', priority: 'MEDIUM' },
        ],
      },
      {
        name: 'Développement',
        color: '#3B82F6',
        tasks: [
          { title: 'Développement du produit', description: 'Construction du MVP', priority: 'URGENT' },
          { title: 'Tests utilisateurs', description: 'Beta testing avec utilisateurs pilotes', priority: 'HIGH' },
        ],
      },
      {
        name: 'Préparation',
        color: '#F59E0B',
        tasks: [
          { title: 'Matériel marketing', description: 'Création des supports de communication', priority: 'HIGH' },
          { title: 'Formation équipe commerciale', description: 'Préparer l\'équipe de vente', priority: 'MEDIUM' },
          { title: 'Plan de communication', description: 'Stratégie d\'annonce', priority: 'HIGH' },
        ],
      },
      {
        name: 'Lancement',
        color: '#EF4444',
        tasks: [
          { title: 'Annonce officielle', description: 'Communication publique du lancement', priority: 'URGENT' },
          { title: 'Ouverture des ventes', description: 'Mise en vente du produit', priority: 'URGENT' },
        ],
      },
      {
        name: 'Post-lancement',
        color: '#10B981',
        tasks: [
          { title: 'Collecte des feedbacks', description: 'Recueillir les retours clients', priority: 'HIGH' },
          { title: 'Support client', description: 'Assistance aux premiers utilisateurs', priority: 'HIGH' },
          { title: 'Amélioration continue', description: 'Itérations basées sur les retours', priority: 'MEDIUM' },
        ],
      },
    ],
  },
];
