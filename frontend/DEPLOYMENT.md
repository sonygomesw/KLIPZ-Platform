# 🚀 Guide de Déploiement KLIPZ sur Vercel

## Prérequis

- Compte Vercel
- Compte GitHub avec le repository KLIPZ
- Comptes Supabase et Stripe configurés

## 📋 Étapes de Déploiement

### 1. Préparation du Repository

Assurez-vous que tous les fichiers sont committés :
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Configuration Vercel

1. Connectez-vous à [Vercel](https://vercel.com)
2. Cliquez sur "New Project"
3. Importez votre repository GitHub KLIPZ
4. Configurez les paramètres :

**Framework Preset:** Create React App  
**Root Directory:** `frontend`  
**Build Command:** `npm run web`  
**Output Directory:** `web-build`  
**Install Command:** `npm install`  

### 3. Variables d'Environnement

Dans les settings de votre projet Vercel, ajoutez ces variables :

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### 4. Déploiement

1. Cliquez sur "Deploy"
2. Attendez que le build se termine
3. Votre site sera disponible sur l'URL fournie par Vercel

## 🔧 Configuration Avancée

### Domaine Personnalisé

1. Allez dans Settings > Domains
2. Ajoutez votre domaine personnalisé
3. Configurez les DNS selon les instructions Vercel

### Variables d'Environnement par Environnement

- **Production:** Variables pour le site live
- **Preview:** Variables pour les branches de feature
- **Development:** Variables pour les tests locaux

## 🚨 Troubleshooting

### Build Errors

Si le build échoue :

1. Vérifiez que toutes les dépendances sont installées
2. Assurez-vous que les variables d'environnement sont correctes
3. Consultez les logs de build dans Vercel

### Runtime Errors

Si l'application ne fonctionne pas en production :

1. Vérifiez la console du navigateur
2. Assurez-vous que Supabase est accessible
3. Vérifiez que les clés Stripe sont correctes

## 📱 Test de l'Application

Après déploiement, testez :

- ✅ Chargement de la page d'accueil
- ✅ Navigation entre les pages
- ✅ Responsive design sur mobile/desktop
- ✅ Connexion/inscription
- ✅ Fonctionnalités principales

## 🔄 Déploiement Automatique

Vercel déploie automatiquement :
- **main branch** → Production
- **autres branches** → Preview deployments

## 📊 Monitoring

Surveillez votre application avec :
- Analytics Vercel
- Logs de runtime
- Performance metrics

## 🛠️ Commandes Utiles

```bash
# Build local pour tester
cd frontend
npm run build:vercel

# Preview local
npm run preview

# Déploiement manuel via CLI
npx vercel --prod
``` 