# Configuration CyberPanel pour ProjectManager

## 📝 Configuration du Vhost OpenLiteSpeed

### Accès à la Configuration

1. Connectez-vous à CyberPanel: `https://51.77.192.156:8090`
2. Allez dans **Websites** > **List Websites**
3. Trouvez votre domaine (ex: `lpp.aymcode.fr`)
4. Cliquez sur **Manage**
5. Cliquez sur **Conf** (configuration OpenLiteSpeed)

### Configuration à Copier

**⚠️ REMPLACER LES PORTS SELON VOTRE INSTANCE**

Pour `lpp.aymcode.fr` (Backend: 4005, Frontend: 3015):

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

### 6. Cliquez sur **Save** en bas de page

### 7. Redémarrer OpenLiteSpeed

Via CyberPanel:
- **Server Status** > **Restart LiteSpeed**

Ou via SSH:
```bash
systemctl restart lsws
```

---

## 🔐 Configuration SSL

### Via CyberPanel (Recommandé)

1. Allez dans **SSL** > **Manage SSL**
2. Sélectionnez votre domaine dans la liste déroulante
3. Cliquez sur **Issue SSL**
4. Attendez la génération (Let's Encrypt)
5. Le SSL sera automatiquement appliqué au vhost

### Via SSH (Manuel)

```bash
# Installer Certbot (si pas déjà installé)
apt-get update
apt-get install certbot

# Générer le certificat
certbot certonly --webroot -w /home/lpp.aymcode.fr/public_html -d lpp.aymcode.fr -d www.lpp.aymcode.fr

# Les certificats seront dans:
# /etc/letsencrypt/live/lpp.aymcode.fr/
```

---

## 🎯 Checklist Configuration CyberPanel

### Pour Chaque Nouvelle Instance

- [ ] Créer le website dans CyberPanel (Websites > Create Website)
- [ ] Pointer le DNS vers le serveur (51.77.192.156)
- [ ] Éditer la configuration vhost (Conf)
- [ ] Adapter les ports backend/frontend dans `extprocessor`
- [ ] Sauvegarder la configuration
- [ ] Générer le SSL
- [ ] Redémarrer OpenLiteSpeed
- [ ] Tester l'accès HTTPS

---

## 🔢 Tableau des Ports par Instance

| Instance | Backend | Frontend | CyberPanel Config |
|----------|---------|----------|-------------------|
| lpp | 4005 | 3015 | ✅ Fait |
| Instance 2 | 4006 | 3016 | ⏳ À faire |
| Instance 3 | 4007 | 3017 | ⏳ À faire |
| Instance 4 | 4008 | 3018 | ⏳ À faire |

**Règle**: Incrémenter les ports de 1 pour chaque nouvelle instance.

---

## 🎨 Exemple pour une 2ème Instance

### Domaine: `client2.aymcode.fr`
### Ports: Backend `4006`, Frontend `3016`

**Configuration `extprocessor` à modifier:**

```
extprocessor backend-api {
  type proxy
  address 127.0.0.1:4006    # ← CHANGER ICI
  maxConns 100
  initTimeout 1800
  retryTimeout 0
  respBuffer 0
  pcKeepAliveTimeout 60
}

extprocessor frontend-nextjs {
  type proxy
  address 127.0.0.1:3016    # ← CHANGER ICI
  maxConns 100
  initTimeout 1800
  retryTimeout 0
  respBuffer 0
  pcKeepAliveTimeout 60
}
```

**Le reste de la config reste identique!**

---

## 💡 Astuces

### Tester les Ports Avant Config

```bash
# Vérifier qu'un port est libre
netstat -tulpn | grep :4006

# Si aucun résultat = port libre ✅
```

### Vérifier la Config OpenLiteSpeed

```bash
# Tester la config avant redémarrage
/usr/local/lsws/bin/lswsctrl configtest

# Si OK, redémarrer
systemctl restart lsws
```

### Logs OpenLiteSpeed en Temps Réel

```bash
tail -f /usr/local/lsws/logs/error.log
```
