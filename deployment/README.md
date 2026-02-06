# 📦 Déploiement Production ProjectManager

Guide ultra-simplifié pour déployer ProjectManager sur CyberPanel.

---

## ⚡ Déploiement Express (5 minutes)

### 1. Se connecter au serveur

```bash
ssh ubuntu@51.77.192.156
# Mot de passe: dQ5J&9ycaio64#SARBxeioHRhB&RPS?HRea@S@di
sudo su
```

### 2. Lancer le script

```bash
cd /root
wget https://raw.githubusercontent.com/SpraxYT/projectManagerBackend/main/deployment/quick-deploy.sh
chmod +x quick-deploy.sh
./quick-deploy.sh
```

**Le script vous demandera:**
- Domaine (ex: `lpp.aymcode.fr`)
- Port Backend (ex: `4005`)
- Port Frontend (ex: `3015`)
- Nom court (ex: `lpp`)

### 3. Configurer CyberPanel

1. **CyberPanel** → **Websites** → **List Websites** → **Manage**
2. Cliquer sur **Conf**
3. Copier la config de `openlitespeed-vhost.conf`
4. **Adapter les 2 ports** dans `extprocessor`
5. Sauvegarder

### 4. Générer SSL

1. **CyberPanel** → **SSL** → **Manage SSL**
2. Sélectionner le domaine
3. **Issue SSL**

### 5. Redémarrer

```bash
systemctl restart lsws
```

### 6. Créer l'Admin

1. Aller sur `https://votre-domaine.fr/register`
2. Créer le compte admin
3. Se connecter
4. **Paramètres** → Désactiver "Inscription publique"

✅ **C'est fini !**

---

## 📊 Ports Utilisés

| Instance | Backend | Frontend |
|----------|---------|----------|
| lpp      | 4005    | 3015     |
| Client 2 | 4006    | 3016     |
| Client 3 | 4007    | 3017     |
| Client 4 | 4008    | 3018     |

**Incrémenter de 1 pour chaque nouvelle instance.**

---

## 🔄 Déployer une 2ème Instance

```bash
# Même commande, autres ports!
cd /root
./quick-deploy.sh

# Entrer:
# - Domaine: client2.aymcode.fr
# - Backend: 4006
# - Frontend: 3016
# - Nom: client2

# Puis configurer CyberPanel avec les ports 4006 et 3016
```

---

## 📋 Commandes Utiles

```bash
# Voir les apps PM2
pm2 list

# Logs
pm2 logs pm-backend-lpp

# Redémarrer
pm2 restart pm-backend-lpp

# Mise à jour
cd /home/lpp.aymcode.fr/private/backend
git pull
npm install --production
npm run build
pm2 restart pm-backend-lpp
```

---

## 📁 Structure des Fichiers

```
/home/lpp.aymcode.fr/
├── public_html/           (CyberPanel)
├── logs/                  (OpenLiteSpeed logs)
└── private/
    ├── backend/           (Code backend)
    │   ├── .env
    │   └── dist/
    ├── frontend/          (Code frontend)
    │   ├── .env.local
    │   └── .next/
    ├── logs/              (PM2 logs)
    └── ecosystem.config.js
```

---

## 🆘 En cas de Problème

```bash
# Vérifier que les services tournent
pm2 list
netstat -tulpn | grep 4005

# Voir les logs
pm2 logs

# Redémarrer tout
pm2 restart all
systemctl restart lsws

# Tester le backend
curl http://localhost:4005/health
```

---

## 📞 Support

**Guide détaillé**: Voir `DEPLOYMENT_GUIDE.md`
**Config CyberPanel**: Voir `CYBERPANEL_CONFIG.md`
