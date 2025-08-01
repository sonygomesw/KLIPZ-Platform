# 🚀 Déploiement KLIPZ sur Vercel

## Prérequis

1. **Compte Vercel** : [vercel.com](https://vercel.com)
2. **Variables d'environnement** configurées
3. **Repository GitHub** connecté

## Variables d'environnement à configurer

Dans le dashboard Vercel, ajoutez ces variables :

```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# TikTok Scraper
EXPO_PUBLIC_TIKTOK_SCRAPER_URL=your_tiktok_scraper_url_here
EXPO_PUBLIC_TIKTOK_SCRAPER_API_KEY=your_tiktok_scraper_api_key_here
```

## Étapes de déploiement

### 1. **Connecter le repository GitHub**
- Allez sur [vercel.com](https://vercel.com)
- Cliquez sur "New Project"
- Importez votre repository GitHub `sonygomesw/KLIPZ-Platform`

### 2. **Configurer le projet**
- **Framework Preset** : `Expo`
- **Root Directory** : `frontend`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`

### 3. **Ajouter les variables d'environnement**
- Dans les paramètres du projet Vercel
- Onglet "Environment Variables"
- Ajoutez toutes les variables listées ci-dessus

### 4. **Déployer**
- Cliquez sur "Deploy"
- Vercel va automatiquement construire et déployer l'application

## Configuration automatique

Le fichier `vercel.json` est déjà configuré pour :
- ✅ **Build automatique** avec Expo
- ✅ **CORS headers** pour les API
- ✅ **Routing** pour SPA
- ✅ **Environment variables** support

## URLs de déploiement

- **Production** : `https://klipz-platform.vercel.app`
- **Preview** : `https://klipz-platform-git-feature-branch.vercel.app`

## Monitoring

- **Logs** : Dashboard Vercel → Functions
- **Performance** : Analytics intégrés
- **Errors** : Error tracking automatique

## Mise à jour

Chaque push sur `main` déclenche automatiquement un nouveau déploiement. 