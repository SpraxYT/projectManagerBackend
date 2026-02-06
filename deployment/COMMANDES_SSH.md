# 🚀 Commandes de Déploiement - À Copier-Coller

**Ouvrez PuTTY ou un terminal SSH et connectez-vous:**

```
Host: 51.77.192.156
User: ubuntu
Password: dQ5J&9ycaio64#SARBxeioHRhB&RPS?HRea@S@di
```

---

## 📋 ÉTAPE 1 : Connexion et Préparation

Copiez-collez ces commandes **une par une**:

```bash
# Passer en root
sudo su

# Installer les dépendances si nécessaire
which node || (curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && apt-get install -y nodejs)
which pm2 || npm install -g pm2

# Aller dans le dossier du site
cd /home/lpp.aymcode.fr

# Créer le dossier private
mkdir -p private/logs
cd private
```

---

## 📋 ÉTAPE 2 : Clonage des Repositories

```bash
# Cloner le backend
git clone https://github.com/SpraxYT/projectManagerBackend.git backend

# Cloner le frontend
git clone https://github.com/SpraxYT/projectManagerFront.git frontend
```

---

## 📋 ÉTAPE 3 : Configuration Backend

```bash
cd backend
npm install
```

**Créer le fichier .env** (copiez tout d'un coup):

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=4005
INSTANCE_NAME=lpp
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL="mysql://lpp_lpp:6NdS2VNrW3m2MnU@localhost:3306/lpp_lpp"
ALLOWED_ORIGINS="https://lpp.aymcode.fr,https://www.lpp.aymcode.fr"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
```

**Générer les secrets** (copiez chaque ligne):

```bash
# JWT_SECRET
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env

# JWT_REFRESH_SECRET
echo "JWT_REFRESH_SECRET=$(openssl rand -hex 32)" >> .env

# ENCRYPTION_KEY
echo "ENCRYPTION_KEY=$(openssl rand -hex 32)" >> .env
```

**Vérifier le fichier .env:**

```bash
cat .env
```

**Continuer le backend:**

```bash
# Prisma
npx prisma generate
npx prisma migrate deploy

# Build
npm run build
```

---

## 📋 ÉTAPE 4 : Configuration Frontend

```bash
cd /home/lpp.aymcode.fr/private/frontend
npm install
```

**Créer .env.local:**

```bash
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=https://lpp.aymcode.fr/api
NEXT_PUBLIC_INSTANCE_NAME=lpp
EOF
```

**Build:**

```bash
npm run build
```

---

## 📋 ÉTAPE 5 : Configuration PM2

```bash
cd /home/lpp.aymcode.fr/private
```

**Créer ecosystem.config.js:**

```bash
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
```

**Démarrer PM2:**

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

**⚠️ PM2 va vous donner une commande à copier-coller, exécutez-la !**

**Vérifier:**

```bash
pm2 list
pm2 logs --lines 20
```

**Tester les services:**

```bash
curl http://localhost:4005/health
curl http://localhost:3015
```

---

## 📋 ÉTAPE 6 : Configuration CyberPanel

1. **Ouvrez CyberPanel**: `https://51.77.192.156:8090`

2. **Allez dans**: Websites > List Websites > `lpp.aymcode.fr` > **Manage**

3. **Cliquez sur**: **Conf** (en haut à droite)

4. **Remplacez TOUT le contenu** par:

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

5. **Cliquez sur** "Save Changes" (en bas)

---

## 📋 ÉTAPE 7 : SSL

1. **Dans CyberPanel**: SSL > Manage SSL
2. **Sélectionner**: `lpp.aymcode.fr`
3. **Cliquer**: "Issue SSL"
4. **Attendre** que le certificat soit généré

---

## 📋 ÉTAPE 8 : Redémarrage

**En SSH:**

```bash
systemctl restart lsws
```

**Ou dans CyberPanel**: Server Status > Restart LiteSpeed

---

## 📋 ÉTAPE 9 : Test Final

1. **Ouvrir**: `https://lpp.aymcode.fr`
2. **Aller sur**: `/register`
3. **Créer** le compte admin
4. **Se connecter**
5. **Paramètres** > Instance > **Désactiver** "Inscription publique"

---

## ✅ C'est terminé !

**Vérifications:**
```bash
pm2 list
curl https://lpp.aymcode.fr
```

---

## 🔄 Pour Déployer une 2ème Instance

**Remplacer dans toutes les commandes:**
- `lpp.aymcode.fr` → `client2.aymcode.fr`
- Port `4005` → `4006`
- Port `3015` → `3016`
- `pm-backend-lpp` → `pm-backend-client2`
- `pm-frontend-lpp` → `pm-frontend-client2`

**Et refaire toutes les étapes ci-dessus !**

---

## 📞 Commandes Utiles

```bash
# Status PM2
pm2 list
pm2 logs pm-backend-lpp --lines 50

# Redémarrer
pm2 restart pm-backend-lpp
pm2 restart pm-frontend-lpp

# Vérifier les ports
netstat -tulpn | grep 4005
netstat -tulpn | grep 3015

# Logs
tail -f /home/lpp.aymcode.fr/private/logs/backend-error.log
```
