#!/bin/bash

# ============================================================================
# Script de déploiement ProjectManager
# ============================================================================

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Déploiement ProjectManager ===${NC}"

# Paramètres
read -p "Domaine (ex: lpp.aymcode.fr): " DOMAIN
read -p "Port Backend (ex: 4005): " BACKEND_PORT
read -p "Port Frontend (ex: 3015): " FRONTEND_PORT
read -p "Nom de l'instance (ex: lpp): " INSTANCE_NAME

INSTALL_DIR="/home/$DOMAIN/private"
FRONTEND_DIR="$INSTALL_DIR/frontend"
BACKEND_DIR="$INSTALL_DIR/backend"

echo -e "${YELLOW}Configuration:${NC}"
echo "Domaine: $DOMAIN"
echo "Backend Port: $BACKEND_PORT"
echo "Frontend Port: $FRONTEND_PORT"
echo "Instance: $INSTANCE_NAME"
echo "Installation: $INSTALL_DIR"

read -p "Continuer? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    exit 1
fi

# ============================================================================
# 1. CRÉATION DES DOSSIERS
# ============================================================================

echo -e "${GREEN}[1/9] Création des dossiers...${NC}"
mkdir -p "$INSTALL_DIR"
mkdir -p "$INSTALL_DIR/logs"
cd "$INSTALL_DIR"

# ============================================================================
# 2. CLONAGE DES REPOS GITHUB
# ============================================================================

echo -e "${GREEN}[2/9] Clonage des repositories...${NC}"

if [ -d "$BACKEND_DIR" ]; then
    echo "Backend existe déjà, mise à jour..."
    cd "$BACKEND_DIR"
    git pull
else
    git clone https://github.com/SpraxYT/projectManagerBackend.git backend
fi

if [ -d "$FRONTEND_DIR" ]; then
    echo "Frontend existe déjà, mise à jour..."
    cd "$FRONTEND_DIR"
    git pull
else
    git clone https://github.com/SpraxYT/projectManagerFront.git frontend
fi

# ============================================================================
# 3. CONFIGURATION BACKEND
# ============================================================================

echo -e "${GREEN}[3/9] Configuration du backend...${NC}"
cd "$BACKEND_DIR"

# Installation des dépendances
npm install

# Création du fichier .env
cat > .env << EOF
# Application
NODE_ENV=production
PORT=$BACKEND_PORT
INSTANCE_NAME=$INSTANCE_NAME

# JWT
JWT_SECRET=$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_EXPIRES_IN=7d

# Database
DATABASE_URL="mysql://lpp_lpp:6NdS2VNrW3m2MnU@localhost:3306/lpp_lpp"

# CORS
ALLOWED_ORIGINS="https://$DOMAIN,https://www.$DOMAIN"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Encryption (pour les credentials)
ENCRYPTION_KEY=$(openssl rand -hex 32)
EOF

echo -e "${YELLOW}Fichier .env backend créé${NC}"

# ============================================================================
# 4. MIGRATION PRISMA
# ============================================================================

echo -e "${GREEN}[4/9] Migration de la base de données...${NC}"
npx prisma generate
npx prisma migrate deploy

# ============================================================================
# 5. BUILD BACKEND
# ============================================================================

echo -e "${GREEN}[5/9] Build du backend...${NC}"
npm run build:prod

# ============================================================================
# 6. CONFIGURATION FRONTEND
# ============================================================================

echo -e "${GREEN}[6/9] Configuration du frontend...${NC}"
cd "$FRONTEND_DIR"

# Installation des dépendances
npm install

# Création du fichier .env.local
cat > .env.local << EOF
# API URL
NEXT_PUBLIC_API_URL=https://$DOMAIN/api

# Instance
NEXT_PUBLIC_INSTANCE_NAME=$INSTANCE_NAME
EOF

echo -e "${YELLOW}Fichier .env.local frontend créé${NC}"

# ============================================================================
# 7. BUILD FRONTEND
# ============================================================================

echo -e "${GREEN}[7/9] Build du frontend...${NC}"
npm run build

# ============================================================================
# 8. CONFIGURATION PM2
# ============================================================================

echo -e "${GREEN}[8/9] Configuration PM2...${NC}"
cd "$INSTALL_DIR"

# Créer le fichier ecosystem PM2
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'pm-backend-$INSTANCE_NAME',
      cwd: '$BACKEND_DIR',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: $BACKEND_PORT,
      },
      error_file: '$INSTALL_DIR/logs/backend-error.log',
      out_file: '$INSTALL_DIR/logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 4000,
    },
    {
      name: 'pm-frontend-$INSTANCE_NAME',
      cwd: '$FRONTEND_DIR',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: $FRONTEND_PORT,
      },
      error_file: '$INSTALL_DIR/logs/frontend-error.log',
      out_file: '$INSTALL_DIR/logs/frontend-out.log',
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

# Démarrer les applications avec PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# ============================================================================
# 9. VÉRIFICATION
# ============================================================================

echo -e "${GREEN}[9/9] Vérification des services...${NC}"
pm2 list

echo ""
echo -e "${GREEN}=== Déploiement terminé ! ===${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes:${NC}"
echo "1. Configurer le vhost OpenLiteSpeed dans CyberPanel"
echo "   - Aller dans CyberPanel > Websites > Manage"
echo "   - Éditer le vhost de $DOMAIN"
echo "   - Remplacer la configuration avec celle du fichier openlitespeed-vhost.conf"
echo "   - Adapter les ports: Backend=$BACKEND_PORT, Frontend=$FRONTEND_PORT"
echo ""
echo "2. Créer le certificat SSL:"
echo "   - CyberPanel > SSL > Manage SSL"
echo "   - Sélectionner $DOMAIN et générer"
echo ""
echo "3. Redémarrer OpenLiteSpeed:"
echo "   - systemctl restart lsws"
echo ""
echo "4. Créer le premier utilisateur admin:"
echo "   - Aller sur https://$DOMAIN/register"
echo "   - Créer le compte admin"
echo "   - Désactiver l'inscription publique dans les paramètres"
echo ""
echo -e "${GREEN}Services démarrés:${NC}"
echo "- Backend: http://localhost:$BACKEND_PORT"
echo "- Frontend: http://localhost:$FRONTEND_PORT"
echo "- Site: https://$DOMAIN"
