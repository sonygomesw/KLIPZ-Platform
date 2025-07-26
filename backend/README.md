# 🔧 Backend KLIPZ

## 📁 Structure

```
backend/
├── supabase/         # Base de données et Edge Functions
├── scripts/          # Scripts SQL et migrations
├── docs/            # Documentation backend
└── api/             # API routes (si nécessaire)
```

## 🗄️ Base de données

### Tables principales
- `users` - Utilisateurs (streamers/clippers)
- `campaigns` - Campagnes de clips
- `submissions` - Soumissions de clips
- `declarations` - Déclarations de vues
- `wallets` - Système de wallet
- `payments` - Historique des paiements

### Fonctions SQL
- `add_balance()` - Ajouter du solde
- `deduct_balance()` - Déduire du solde
- `get_or_create_wallet()` - Gestion automatique des wallets

## 🔄 Edge Functions

### Stripe
- `stripe-webhook` - Webhooks Stripe
- `create-payment-intent` - Création de paiements
- `stripe-create-account` - Création comptes Stripe
- `payout-clipper` - Paiements automatiques

### Intégrations
- `twitch-followers` - API Twitch
- `get-streamer-data` - Données streamers

## 🚀 Démarrage

### 1. Configuration Supabase
```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier le projet
supabase link --project-ref YOUR_PROJECT_REF
```

### 2. Déployer les Edge Functions
```bash
cd supabase/functions
supabase functions deploy
```

### 3. Exécuter les migrations
```bash
# Dans Supabase Dashboard > SQL Editor
# Exécuter les scripts SQL dans l'ordre
```

## 🧪 Tests

Voir `BACKEND_TESTING_PLAN.md` pour la liste complète des tests.

## 📚 Documentation

- [API](./API.md) - Documentation API
- [Deployment](./DEPLOYMENT.md) - Guide de déploiement
- [Stripe](./STRIPE_SETUP.md) - Configuration Stripe 