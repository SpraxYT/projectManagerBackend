# 🚀 Déploiement ProjectManager - START HERE

Tout est prêt pour déployer votre application ProjectManager sur CyberPanel !

---

## 📁 Fichiers de Déploiement

| Fichier | Description |
|---------|-------------|
| **COMMANDES_SSH.md** | ⭐ **À UTILISER EN PREMIER** - Toutes les commandes à copier-coller dans l'ordre |
| DEPLOYMENT_GUIDE.md | Guide complet détaillé (pour référence) |
| CYBERPANEL_CONFIG.md | Configuration spécifique CyberPanel |
| README.md | Vue d'ensemble du déploiement |
| deploy.sh | Script automatique de déploiement |
| quick-deploy.sh | Script rapide de déploiement |
| ecosystem.config.js | Template PM2 |
| openlitespeed-vhost.conf | Template vhost OpenLiteSpeed |
| connect-server.bat | Script Windows pour se connecter en SSH |

---

## ⚡ Démarrage Rapide (5 minutes)

### 1. Connexion SSH

**Option A - Avec le script Windows:**
```
Double-cliquer sur: connect-server.bat
```

**Option B - Manuellement:**
```
Host: 51.77.192.156
User: ubuntu
Password: dQ5J&9ycaio64#SARBxeioHRhB&RPS?HRea@S@di
```

### 2. Suivre les Commandes

**Ouvrir le fichier**: `COMMANDES_SSH.md`

**Copier-coller les commandes** dans l'ordre, étape par étape.

### 3. Configurer CyberPanel

Le fichier `COMMANDES_SSH.md` contient aussi la config à copier dans CyberPanel.

---

## 📦 Ports par Instance

| Instance | Backend | Frontend | Domaine |
|----------|---------|----------|---------|
| 1 | 4005 | 3015 | lpp.aymcode.fr |
| 2 | 4006 | 3016 | À définir |
| 3 | 4007 | 3017 | À définir |
| 4 | 4008 | 3018 | À définir |

**Règle**: Incrémenter de 1 pour chaque nouvelle instance.

---

## 🎯 Checklist Rapide

### Avant de Commencer
- [ ] CyberPanel accessible
- [ ] Domaine créé dans CyberPanel
- [ ] DNS pointé vers `51.77.192.156`
- [ ] Fichier `COMMANDES_SSH.md` ouvert

### Pendant le Déploiement
- [ ] Connexion SSH établie
- [ ] Repos clonés
- [ ] Backend configuré + build
- [ ] Frontend configuré + build
- [ ] PM2 démarré
- [ ] Vhost CyberPanel configuré
- [ ] SSL généré
- [ ] OpenLiteSpeed redémarré

### Après le Déploiement
- [ ] Site accessible en HTTPS
- [ ] Compte admin créé
- [ ] Inscription publique désactivée
- [ ] Tests fonctionnels OK

---

## 📞 Aide

### Fichiers à Consulter selon le Problème

- **Commandes ne fonctionnent pas** → `COMMANDES_SSH.md`
- **Erreur de config CyberPanel** → `CYBERPANEL_CONFIG.md`
- **Problème général** → `DEPLOYMENT_GUIDE.md` (section Dépannage)
- **Besoin de comprendre l'architecture** → `DEPLOYMENT_GUIDE.md`

### Commandes de Vérification

```bash
# PM2
pm2 list
pm2 logs --lines 20

# Ports
netstat -tulpn | grep 4005
netstat -tulpn | grep 3015

# Services
curl http://localhost:4005/health
curl https://lpp.aymcode.fr
```

---

## 🔄 Déployer une Autre Instance

1. Ouvrir `COMMANDES_SSH.md`
2. Remplacer:
   - Domaine: `lpp.aymcode.fr` → `nouveau-domaine.fr`
   - Ports: `4005/3015` → `4006/3016`
   - Nom: `lpp` → `nouveau-nom`
3. Refaire toutes les étapes

---

## ✅ Prêt à Déployer !

**👉 Ouvrez maintenant**: `COMMANDES_SSH.md`

**C'est parti !** 🚀
