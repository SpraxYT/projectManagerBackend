#!/bin/bash
# Quick Deploy Script - Déploiement ultra simplifié

set -e

echo "=== ProjectManager - Déploiement Rapide ==="
echo ""

# Demander les infos
read -p "Domaine (ex: lpp.aymcode.fr): " DOMAIN
read -p "Port Backend (ex: 4005, 4006, 4007...): " BACKEND_PORT
read -p "Port Frontend (ex: 3015, 3016, 3017...): " FRONTEND_PORT
read -p "Nom court (ex: lpp, client2...): " SHORT_NAME

BASE_DIR="/home/$DOMAIN/private"

echo ""
echo "Domaine: $DOMAIN"
echo "Backend: :$BACKEND_PORT"
echo "Frontend: :$FRONTEND_PORT"
echo "Installation: $BASE_DIR"
echo ""
read -p "OK? (y/n) " -n 1 -r
echo
[[ ! $REPLY =~ ^[Yy]$ ]] && exit 1

# Créer dossiers
mkdir -p $BASE_DIR/logs
cd $BASE_DIR

# Cloner repos
[ ! -d "backend" ] && git clone https://github.com/SpraxYT/projectManagerBackend.git backend
[ ! -d "frontend" ] && git clone https://github.com/SpraxYT/projectManagerFront.git frontend

# Backend
cd backend
npm install

JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH=$(openssl rand -hex 32)
ENCRYPTION=$(openssl rand -hex 32)

cat > .env << EOF
NODE_ENV=production
PORT=$BACKEND_PORT
INSTANCE_NAME=$SHORT_NAME
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=$JWT_REFRESH
JWT_REFRESH_EXPIRES_IN=7d
DATABASE_URL="mysql://lpp_lpp:6NdS2VNrW3m2MnU@localhost:3306/lpp_lpp"
ALLOWED_ORIGINS="https://$DOMAIN,https://www.$DOMAIN"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
ENCRYPTION_KEY=$ENCRYPTION
EOF

npx prisma generate
npx prisma migrate deploy
npm run build

# Frontend
cd ../frontend
npm install

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_INSTANCE_NAME=$SHORT_NAME
EOF

npm run build

# PM2
cd ..
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'pm-backend-$SHORT_NAME',
      cwd: '$BASE_DIR/backend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: $BACKEND_PORT },
      error_file: '$BASE_DIR/logs/backend-error.log',
      out_file: '$BASE_DIR/logs/backend-out.log',
      autorestart: true,
      max_memory_restart: '500M',
    },
    {
      name: 'pm-frontend-$SHORT_NAME',
      cwd: '$BASE_DIR/frontend',
      script: 'npm',
      args: 'start',
      env: { NODE_ENV: 'production', PORT: $FRONTEND_PORT },
      error_file: '$BASE_DIR/logs/frontend-error.log',
      out_file: '$BASE_DIR/logs/frontend-out.log',
      autorestart: true,
      max_memory_restart: '500M',
    },
  ],
};
EOF

pm2 start ecosystem.config.js
pm2 save

echo ""
echo "=== DÉPLOIEMENT TERMINÉ ==="
echo ""
echo "Services démarrés:"
echo "  Backend:  http://localhost:$BACKEND_PORT"
echo "  Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo "Prochaines étapes:"
echo "1. Configurer le vhost OpenLiteSpeed dans CyberPanel"
echo "   Backend port: $BACKEND_PORT"
echo "   Frontend port: $FRONTEND_PORT"
echo ""
echo "2. Générer le SSL pour $DOMAIN"
echo ""
echo "3. Redémarrer OpenLiteSpeed: systemctl restart lsws"
echo ""
echo "4. Tester: https://$DOMAIN"
echo ""
pm2 list
