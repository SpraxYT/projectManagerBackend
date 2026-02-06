# ProjectManager Backend

Backend API pour ProjectManager - Système de gestion de projet simplifié avec Kanban.

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos paramètres

# Générer Prisma Client
npm run prisma:generate

# Exécuter les migrations
npm run prisma:migrate

# Démarrer en développement
npm run dev
```

## 📋 Scripts Disponibles

- `npm run dev` - Démarrage en mode développement (hot reload)
- `npm run build` - Build pour production
- `npm start` - Démarrage en production
- `npm run prisma:generate` - Générer le client Prisma
- `npm run prisma:migrate` - Créer/appliquer migrations
- `npm run prisma:studio` - Interface graphique Prisma
- `npm test` - Lancer les tests
- `npm run lint` - Vérifier le code
- `npm run lint:fix` - Corriger automatiquement

## 🗄️ Base de Données

Créer la base de données MySQL :

```sql
CREATE DATABASE projectmanager_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 🔑 Générer les Secrets

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Refresh Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption Key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📚 Documentation

Voir le dossier `docs/` à la racine du projet pour la documentation complète.

## 🔗 API Endpoints

### Phase 1 - Authentication & Roles

**Auth:**
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Profil utilisateur

**Users:**
- `GET /api/users` - Liste des utilisateurs
- `GET /api/users/:id` - Détails utilisateur
- `PUT /api/users/:id` - Modifier utilisateur
- `DELETE /api/users/:id` - Supprimer utilisateur

**Roles:**
- `GET /api/roles` - Liste des rôles
- `POST /api/roles` - Créer un rôle
- `GET /api/roles/:id` - Détails rôle
- `PUT /api/roles/:id` - Modifier rôle
- `DELETE /api/roles/:id` - Supprimer rôle

## 🔐 Sécurité

- Mots de passe hashés avec bcrypt
- JWT avec expiration
- Refresh tokens stockés en DB
- Rate limiting
- Helmet pour les headers de sécurité
- CORS configuré

## 📝 License

MIT
