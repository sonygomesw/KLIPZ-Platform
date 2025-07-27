# 🚀 Guide de Déploiement - TikTok Scraper

## 📋 Prérequis

### 1. VPS (Serveur Virtuel Privé)
- **Recommandé :** Hetzner Cloud (4€/mois - 2GB RAM, 1 CPU)
- **Alternative :** DigitalOcean, Linode, Vultr
- **OS :** Ubuntu 20.04+ ou Debian 11+

### 2. Proxy Résidentiel
- **BrightData** (recommandé) : 15€/mois pour 40GB
- **ScraperAPI** : 29€/mois pour 1000 requêtes
- **Oxylabs** : 15€/mois pour 40GB

## 🔧 Installation sur VPS

### Étape 1 : Préparer le serveur
```bash
# Mettre à jour le système
sudo apt update && sudo apt upgrade -y

# Installer Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installer PM2 pour la gestion des processus
sudo npm install -g pm2

# Installer les dépendances système pour Puppeteer
sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget
```

### Étape 2 : Déployer le code
```bash
# Cloner le projet (ou uploader les fichiers)
cd /opt
sudo mkdir tiktok-scraper
sudo chown $USER:$USER tiktok-scraper
cd tiktok-scraper

# Copier les fichiers du projet
# (package.json, tiktok-scraper.js, server.js, etc.)

# Installer les dépendances
npm install
```

### Étape 3 : Configuration
```bash
# Copier le fichier d'environnement
cp env.example .env

# Éditer la configuration
nano .env
```

**Configuration `.env` :**
```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Supabase Configuration
SUPABASE_URL=https://ajbfgeojhfbtbmouynva.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Proxy Configuration (BrightData)
BRIGHTDATA_USERNAME=your_brightdata_username
BRIGHTDATA_PASSWORD=your_brightdata_password
BRIGHTDATA_HOST=brd.superproxy.io
BRIGHTDATA_PORT=22225

# TikTok Scraper Settings
MAX_RETRIES=3
TIMEOUT=30000
DELAY_BETWEEN_REQUESTS=2000

# Security
API_KEY=your_secure_api_key_here
```

### Étape 4 : Démarrer avec PM2
```bash
# Démarrer le service
pm2 start server.js --name "tiktok-scraper"

# Configurer le démarrage automatique
pm2 startup
pm2 save

# Vérifier le statut
pm2 status
pm2 logs tiktok-scraper
```

## 🔐 Configuration du Proxy

### Option 1 : BrightData (Recommandé)

1. **Créer un compte** sur [BrightData](https://brightdata.com/)
2. **Créer un proxy résidentiel** dans le dashboard
3. **Récupérer les credentials** et les ajouter dans `.env`

### Option 2 : ScraperAPI

1. **Créer un compte** sur [ScraperAPI](https://www.scraperapi.com/)
2. **Récupérer la clé API** et l'ajouter dans `.env`
3. **Modifier le code** pour utiliser ScraperAPI

## 🌐 Configuration du Frontend

### Ajouter les variables d'environnement
```env
# Dans frontend/.env
EXPO_PUBLIC_TIKTOK_SCRAPER_URL=http://your-vps-ip:3001
EXPO_PUBLIC_TIKTOK_SCRAPER_API_KEY=your_secure_api_key_here
```

### Mettre à jour le service de scraping
Le service `TikTokScraperService` est déjà configuré pour utiliser le nouveau scraper.

## 🧪 Tests

### Test local
```bash
# Tester le scraper
npm test

# Tester l'API
curl http://localhost:3001/health
```

### Test de scraping
```bash
curl -X POST http://localhost:3001/scrape-single \
  -H "Content-Type: application/json" \
  -H "x-api-key: your_api_key" \
  -d '{"url": "https://www.tiktok.com/@user/video/123"}'
```

## 📊 Monitoring

### Logs PM2
```bash
# Voir les logs en temps réel
pm2 logs tiktok-scraper

# Voir les logs d'erreur
pm2 logs tiktok-scraper --err

# Redémarrer le service
pm2 restart tiktok-scraper
```

### Statistiques
```bash
# Obtenir les stats du service
curl http://localhost:3001/stats \
  -H "x-api-key: your_api_key"
```

## 🔄 Intégration avec Supabase

### Mise à jour automatique
Le scraper met automatiquement à jour :
- Les vues dans la table `submissions`
- Les gains calculés
- Le statut de paiement si le seuil est atteint

### Cron Job (Optionnel)
```bash
# Ajouter un cron job pour le scraping automatique
crontab -e

# Scraper toutes les heures
0 * * * * curl -X POST http://localhost:3001/scrape-all \
  -H "x-api-key: your_api_key"
```

## 💰 Estimation des Coûts

### Mensuel
- **VPS Hetzner :** 4€
- **Proxy BrightData :** 15€
- **Total :** ~19€/mois

### Par requête
- **1000 clips/jour :** ~0.50€
- **10000 clips/jour :** ~5€

## 🚨 Dépannage

### Problèmes courants

1. **Erreur de proxy**
   ```bash
   # Vérifier la configuration
   curl --proxy http://username:password@host:port https://httpbin.org/ip
   ```

2. **Puppeteer ne démarre pas**
   ```bash
   # Installer les dépendances manquantes
   sudo apt-get install -y chromium-browser
   ```

3. **TikTok bloque toujours**
   - Vérifier la configuration du proxy
   - Augmenter les délais entre les requêtes
   - Utiliser des User-Agents différents

### Logs utiles
```bash
# Logs détaillés
pm2 logs tiktok-scraper --lines 100

# Statut du service
pm2 show tiktok-scraper
```

## 🔒 Sécurité

### Recommandations
1. **Changer l'API key** par défaut
2. **Configurer un firewall** sur le VPS
3. **Utiliser HTTPS** en production
4. **Limiter l'accès** par IP si possible

### Firewall UFW
```bash
sudo ufw allow ssh
sudo ufw allow 3001
sudo ufw enable
```

## 📈 Optimisation

### Performance
- **Augmenter la RAM** si nécessaire
- **Utiliser plusieurs instances** PM2
- **Optimiser les délais** entre requêtes

### Scalabilité
- **Load balancer** pour plusieurs VPS
- **Base de données** dédiée pour les logs
- **Monitoring** avancé (Grafana, etc.)

---

## ✅ Checklist de Déploiement

- [ ] VPS configuré avec Node.js 18+
- [ ] Proxy résidentiel configuré
- [ ] Variables d'environnement définies
- [ ] Service démarré avec PM2
- [ ] Tests de scraping réussis
- [ ] Frontend configuré
- [ ] Monitoring en place
- [ ] Sécurité configurée

**🎉 Votre TikTok Scraper est maintenant prêt !** 