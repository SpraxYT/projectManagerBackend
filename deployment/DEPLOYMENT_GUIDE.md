# 🚀 Guide de Déploiement ProjectManager

Guide complet pour déployer ProjectManager sur CyberPanel avec OpenLiteSpeed.

---

## 📋 Prérequis

- Serveur avec CyberPanel installé
- Domaine configuré dans CyberPanel
- Node.js 18+ installé
- PM2 installé globalement (`npm install -g pm2`)
- Git installé

---

## 🔧 Configuration des Ports

**Chaque instance nécessite 2 ports uniques:**

| Instance | Backend | Frontend | Domaine |
|----------|---------|----------|---------|
| Instance 1 | 4005 | 3015 | lpp.aymcode.fr |
| Instance 2 | 4006 | 3016 | client2.aymcode.fr |
| Instance 3 | 4007 | 3017 | client3.aymcode.fr |
| Instance 4 | 4008 | 3018 | client4.aymcode.fr |

---

## 📦 Déploiement Automatique

### Connexion SSH

```bash
ssh ubuntu@51.77.192.156
# Mot de passe: dQ5J&9ycaio64#SARBxeioHRhB&RPS?HRea@S@di

# Passer en root
sudo su
```

### Télécharger le script

```bash
cd /root
curl -O https://raw.githubusercontent.com/SpraxYT/projectManagerBackend/main/deployment/deploy.sh
chmod +x deploy.sh
```

### Exécuter le déploiement

```bash
./deploy.sh
```

Le script vous demandera:
1. Domaine (ex: `lpp.aymcode.fr`)
2. Port Backend (ex: `4005`)
3. Port Frontend (ex: `3015`)
4. Nom de l'instance (ex: `lpp`)

---

## 🛠️ Déploiement Manuel (Étape par Étape)

### 1. Connexion et Préparation

```bash
# Connexion SSH
ssh ubuntu@51.77.192.156

# Passer en root
sudo su

# Aller dans le dossier du domaine
cd /home/lpp.aymcode.fr

# Créer le dossier private
mkdir -p private
cd private

# Créer le dossier logs
mkdir -p logs
```

### 2. Clonage des Repositories

```bash
# Cloner le backend
git clone https://github.com/SpraxYT/projectManagerBackend.git backend

# Cloner le frontend
git clone https://github.com/SpraxYT/projectManagerFront.git frontend
```

### 3. Configuration Backend

```bash
cd backend

# Installer les dépendances
npm install --production

# Créer le fichier .env
cat > .env << 'EOF'
# Application
NODE_ENV=production
PORT=4005
INSTANCE_NAME=lpp

# JWT (générer des secrets uniques)
JWT_SECRET=REMPLACER_PAR_SECRET_UNIQUE_32_CHARS
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=REMPLACER_PAR_SECRET_UNIQUE_32_CHARS
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL="mysql://lpp_lpp:6NdS2VNrW3m2MnU@localhost:3306/lpp_lpp"

# CORS
ALLOWED_ORIGINS="https://lpp.aymcode.fr,https://www.lpp.aymcode.fr"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Encryption (pour les credentials)
ENCRYPTION_KEY=REMPLACER_PAR_SECRET_UNIQUE_32_CHARS
EOF

# Générer les secrets (exécuter ces commandes et remplacer dans .env)
echo "JWT_SECRET:"
openssl rand -hex 32
echo "JWT_REFRESH_SECRET:"
openssl rand -hex 32
echo "ENCRYPTION_KEY:"
openssl rand -hex 32

# Éditer le .env et remplacer les secrets
nano .env

# Générer Prisma Client
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Build du backend
npm run build
```

### 4. Configuration Frontend

```bash
cd /home/lpp.aymcode.fr/private/frontend

# Installer les dépendances
npm install --production

# Créer le fichier .env.local
cat > .env.local << 'EOF'
# API URL
NEXT_PUBLIC_API_URL=https://lpp.aymcode.fr/api

# Instance
NEXT_PUBLIC_INSTANCE_NAME=lpp
EOF

# Build du frontend
npm run build
```

### 5. Configuration PM2

```bash
cd /home/lpp.aymcode.fr/private

# Créer le fichier ecosystem PM2
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'pm-backend-lpp',
      cwd: '/home/lpp.aymcode.fr/private/backend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 4005,
      },
      error_file: '/home/lpp.aymcode.fr/private/logs/backend-error.log',
      out_file: '/home/lpp.aymcode.fr/private/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
    },
    {
      name: 'pm-frontend-lpp',
      cwd: '/home/lpp.aymcode.fr/private/frontend',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3015,
      },
      error_file: '/home/lpp.aymcode.fr/private/logs/frontend-error.log',
      out_file: '/home/lpp.aymcode.fr/private/logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
    },
  ],
};
EOF

# Démarrer avec PM2
pm2 start ecosystem.config.js

# Sauvegarder la config PM2
pm2 save

# Configurer le démarrage automatique
pm2 startup

# Vérifier le statut
pm2 list
pm2 logs
```

### 6. Configuration OpenLiteSpeed (CyberPanel)

```bash
# 1. Aller dans CyberPanel Web Interface
# URL: https://51.77.192.156:8090

# 2. Websites > List Websites > lpp.aymcode.fr > Manage

# 3. Cliquer sur "Conf" pour éditer la configuration vhost

# 4. Remplacer la configuration par celle du fichier openlitespeed-vhost.conf
# IMPORTANT: Adapter les ports dans extprocessor:
#   - backend-api: address 127.0.0.1:4005
#   - frontend-nextjs: address 127.0.0.1:3015

# 5. Sauvegarder
```

### 7. Configuration SSL

```bash
# Dans CyberPanel
# SSL > Manage SSL > Sélectionner lpp.aymcode.fr
# Cliquer sur "Issue SSL"
# Attendre la génération (Let's Encrypt)
```

### 8. Redémarrage OpenLiteSpeed

```bash
# En SSH (root)
systemctl restart lsws

# Vérifier le statut
systemctl status lsws
```

### 9. Création du Premier Utilisateur

```bash
# 1. Aller sur https://lpp.aymcode.fr/register
# 2. Créer le compte admin principal
# 3. Se connecter
# 4. Aller dans Paramètres > Instance
# 5. Désactiver "Inscription publique"
```

---

## 🔄 Déploiement d'une Nouvelle Instance

### Exemple: Déployer pour client2.aymcode.fr

```bash
# Connexion SSH
ssh ubuntu@51.77.192.156
sudo su

# Créer les dossiers
cd /home/client2.aymcode.fr
mkdir -p private/logs
cd private

# Cloner les repos
git clone https://github.com/SpraxYT/projectManagerBackend.git backend
git clone https://github.com/SpraxYT/projectManagerFront.git frontend

# Backend
cd backend
npm install --production

# Créer .env avec PORT=4006 (port suivant disponible)
cat > .env << 'EOF'
NODE_ENV=production
PORT=4006
INSTANCE_NAME=client2
DATABASE_URL="mysql://lpp_lpp:6NdS2VNrW3m2MnU@localhost:3306/lpp_lpp"
ALLOWED_ORIGINS="https://client2.aymcode.fr,https://www.client2.aymcode.fr"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF

# Ajouter les secrets
echo "JWT_SECRET: $(openssl rand -hex 32)" >> .env
echo "JWT_REFRESH_SECRET: $(openssl rand -hex 32)" >> .env
echo "ENCRYPTION_KEY: $(openssl rand -hex 32)" >> .env

# Éditer pour formater correctement
nano .env

# Prisma
npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd ../frontend
npm install --production

cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://client2.aymcode.fr/api
NEXT_PUBLIC_INSTANCE_NAME=client2
EOF

npm run build

# PM2
cd ..
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'pm-backend-client2',
      cwd: '/home/client2.aymcode.fr/private/backend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 4006 },
      error_file: '/home/client2.aymcode.fr/private/logs/backend-error.log',
      out_file: '/home/client2.aymcode.fr/private/logs/backend-out.log',
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'pm-frontend-client2',
      cwd: '/home/client2.aymcode.fr/private/frontend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: 3016 },
      error_file: '/home/client2.aymcode.fr/private/logs/frontend-error.log',
      out_file: '/home/client2.aymcode.fr/private/logs/frontend-out.log',
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
EOF

pm2 start ecosystem.config.js
pm2 save

# Configurer le vhost dans CyberPanel (ports 4006 et 3016)
# Redémarrer OpenLiteSpeed
systemctl restart lsws
```

---

## 🔍 Commandes Utiles

### Gestion PM2

```bash
# Lister les applications
pm2 list

# Voir les logs
pm2 logs pm-backend-lpp
pm2 logs pm-frontend-lpp

# Redémarrer
pm2 restart pm-backend-lpp
pm2 restart pm-frontend-lpp

# Arrêter
pm2 stop pm-backend-lpp
pm2 stop pm-frontend-lpp

# Supprimer
pm2 delete pm-backend-lpp
pm2 delete pm-frontend-lpp

# Monitoring
pm2 monit
```

### Mise à Jour d'une Instance

```bash
# Backend
cd /home/lpp.aymcode.fr/private/backend
git pull
npm install --production
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart pm-backend-lpp

# Frontend
cd /home/lpp.aymcode.fr/private/frontend
git pull
npm install --production
npm run build
pm2 restart pm-frontend-lpp
```

### Logs et Débuggage

```bash
# Logs backend
tail -f /home/lpp.aymcode.fr/private/logs/backend-error.log
tail -f /home/lpp.aymcode.fr/private/logs/backend-out.log

# Logs frontend
tail -f /home/lpp.aymcode.fr/private/logs/frontend-error.log
tail -f /home/lpp.aymcode.fr/private/logs/frontend-out.log

# Logs OpenLiteSpeed
tail -f /usr/local/lsws/logs/error.log
tail -f /home/lpp.aymcode.fr/logs/lpp.aymcode.fr.error_log

# Tester les ports
curl http://localhost:4005/health
curl http://localhost:3015
```

### Vérifications

```bash
# Vérifier que les ports écoutent
netstat -tulpn | grep :4005
netstat -tulpn | grep :3015

# Vérifier PM2
pm2 status
pm2 info pm-backend-lpp

# Vérifier la BDD
mysql -u lpp_lpp -p -e "SHOW DATABASES;"
# Mot de passe: 6NdS2VNrW3m2MnU
```

---

## 📝 Configuration OpenLiteSpeed Détaillée

### Template de Vhost

Copier ce template dans CyberPanel > Websites > Manage > Conf:

```
docRoot $VH_ROOT/public_html
vhDomain $VH_NAME
vhAliases www.$VH_NAME
adminEmails aymeric@aymcode.fr
enableGzip 1
enableIpGeo 1

errorlog $VH_ROOT/logs/$VH_NAME.error_log {
  useServer 0
  logLevel WARN
  rollingSize 10M
}

accesslog $VH_ROOT/logs/$VH_NAME.access_log {
  useServer 0
  logFormat "%h %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-Agent}i\""
  logHeaders 5
  rollingSize 10M
  keepDays 10
  compressArchive 1
}

extprocessor backend-api {
  type proxy
  address 127.0.0.1:4005
  maxConns 100
  initTimeout 1800
  retryTimeout 0
  respBuffer 0
  pcKeepAliveTimeout 60
}

extprocessor frontend-nextjs {
  type proxy
  address 127.0.0.1:3015
  maxConns 100
  initTimeout 1800
  retryTimeout 0
  respBuffer 0
  pcKeepAliveTimeout 60
}

context /api/ {
  type proxy
  handler backend-api
  addDefaultCharset off
  reqTimeout 1800
  retryTimeout 0
  respTimeout 1800
}

context /uploads/ {
  type proxy
  handler backend-api
  addDefaultCharset off
}

context / {
  type proxy
  handler frontend-nextjs
  addDefaultCharset off
  reqTimeout 1800
  retryTimeout 0
  respTimeout 1800
}

context /.well-known/acme-challenge {
  location /usr/local/lsws/Example/html/.well-known/acme-challenge
  allowBrowse 1
  rewrite {
    enable 0
  }
  addDefaultCharset off
}

vhssl {
  keyFile /etc/letsencrypt/live/$VH_NAME/privkey.pem
  certFile /etc/letsencrypt/live/$VH_NAME/fullchain.pem
  certChain 1
  sslProtocol 24
  enableECDHE 1
  renegProtection 1
  sslSessionCache 1
  enableSpdy 15
  enableStapling 1
  ocspRespMaxAge 86400
}
```

**⚠️ IMPORTANT:** Adapter les ports dans `extprocessor` selon votre instance.

---

## 🔐 Fichiers .env

### Backend `.env`

```env
# Application
NODE_ENV=production
PORT=4005                           # À CHANGER pour chaque instance
INSTANCE_NAME=lpp                   # À CHANGER pour chaque instance

# JWT (générer avec: openssl rand -hex 32)
JWT_SECRET=VOTRE_SECRET_UNIQUE_32_CHARS
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=VOTRE_SECRET_UNIQUE_32_CHARS
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL="mysql://lpp_lpp:6NdS2VNrW3m2MnU@localhost:3306/lpp_lpp"

# CORS (adapter le domaine)
ALLOWED_ORIGINS="https://lpp.aymcode.fr,https://www.lpp.aymcode.fr"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Encryption (générer avec: openssl rand -hex 32)
ENCRYPTION_KEY=VOTRE_SECRET_UNIQUE_32_CHARS
```

### Frontend `.env.local`

```env
# API URL (adapter le domaine)
NEXT_PUBLIC_API_URL=https://lpp.aymcode.fr/api

# Instance (adapter le nom)
NEXT_PUBLIC_INSTANCE_NAME=lpp
```

---

## 🚦 Checklist de Déploiement

### Avant le Déploiement

- [ ] Domaine créé dans CyberPanel
- [ ] Ports disponibles (vérifier avec `netstat -tulpn`)
- [ ] Base de données accessible
- [ ] Node.js 18+ installé (`node -v`)
- [ ] PM2 installé (`pm2 -v`)

### Pendant le Déploiement

- [ ] Repos clonés
- [ ] Dépendances installées (backend + frontend)
- [ ] Fichiers .env créés avec secrets uniques
- [ ] Migrations Prisma exécutées
- [ ] Builds réussis (backend + frontend)
- [ ] PM2 démarré et sauvegardé
- [ ] Vhost OpenLiteSpeed configuré avec bons ports
- [ ] SSL généré

### Après le Déploiement

- [ ] Site accessible en HTTPS
- [ ] Backend répond sur `/health`
- [ ] Premier compte admin créé
- [ ] Inscription publique désactivée
- [ ] Tests des fonctionnalités principales
- [ ] PM2 redémarre automatiquement au reboot serveur

---

## 🆘 Dépannage

### Backend ne démarre pas

```bash
# Vérifier les logs
pm2 logs pm-backend-lpp --lines 50

# Vérifier la BDD
mysql -u lpp_lpp -p lpp_lpp -e "SHOW TABLES;"

# Vérifier Prisma
cd /home/lpp.aymcode.fr/private/backend
npx prisma studio
```

### Frontend ne démarre pas

```bash
# Vérifier les logs
pm2 logs pm-frontend-lpp --lines 50

# Vérifier le build
cd /home/lpp.aymcode.fr/private/frontend
ls -la .next/

# Rebuild
npm run build
pm2 restart pm-frontend-lpp
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que PM2 tourne
pm2 list

# Vérifier que les ports écoutent
netstat -tulpn | grep 4005
netstat -tulpn | grep 3015

# Redémarrer OpenLiteSpeed
systemctl restart lsws
```

### Erreur CORS

```bash
# Vérifier le .env backend
cat /home/lpp.aymcode.fr/private/backend/.env | grep ALLOWED_ORIGINS

# Doit contenir le domaine exact
# ALLOWED_ORIGINS="https://lpp.aymcode.fr,https://www.lpp.aymcode.fr"

# Redémarrer le backend
pm2 restart pm-backend-lpp
```

---

## 📊 Architecture de Déploiement

```
┌─────────────────────────────────────────┐
│         Internet (HTTPS)                │
│         lpp.aymcode.fr                  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      OpenLiteSpeed (Port 443)           │
│  ┌────────────────────────────────┐     │
│  │  Context /api/*                │     │
│  │  Proxy → 127.0.0.1:4005        │     │
│  └────────────────────────────────┘     │
│  ┌────────────────────────────────┐     │
│  │  Context /*                    │     │
│  │  Proxy → 127.0.0.1:3015        │     │
│  └────────────────────────────────┘     │
└─────────────────┬───────────────────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
┌────▼─────┐          ┌───────▼────┐
│ Backend  │          │  Frontend  │
│  (PM2)   │          │   (PM2)    │
│ :4005    │◄────────►│  :3015     │
└────┬─────┘          └────────────┘
     │
┌────▼─────┐
│  MySQL   │
│  :3306   │
└──────────┘
```

---

## 📦 Liste des Instances Déployées

| Instance | Domaine | Backend Port | Frontend Port | PM2 Backend | PM2 Frontend |
|----------|---------|--------------|---------------|-------------|--------------|
| lpp | lpp.aymcode.fr | 4005 | 3015 | pm-backend-lpp | pm-frontend-lpp |
| *À compléter* | | | | | |

---

## 🔄 Script Rapide de Déploiement

Pour déployer rapidement une nouvelle instance, utilisez ce one-liner:

```bash
curl -s https://raw.githubusercontent.com/SpraxYT/projectManagerBackend/main/deployment/deploy.sh | bash
```

---

## 📞 Support

En cas de problème:
1. Vérifier les logs PM2 (`pm2 logs`)
2. Vérifier les logs OpenLiteSpeed
3. Vérifier que les ports sont bien utilisés (`netstat -tulpn`)
4. Vérifier la configuration du vhost
5. Redémarrer les services (`pm2 restart all && systemctl restart lsws`)
