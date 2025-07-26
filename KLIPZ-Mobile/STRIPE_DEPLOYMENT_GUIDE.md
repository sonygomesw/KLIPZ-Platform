# 🚀 Guide de Déploiement Stripe pour KLIPZ

## 📋 Prérequis

1. **Compte Stripe** configuré en mode test
2. **Projet Supabase** avec les clés d'API
3. **Variables d'environnement** configurées

## 🔧 Configuration Stripe

### 1. Récupérer les clés Stripe

Dans votre dashboard Stripe :
- **Clé publique** : `pk_test_...`
- **Clé secrète** : `sk_test_...`
- **Webhook secret** : À créer après déploiement

### 2. Configurer les variables d'environnement

Créez un fichier `.env` dans `KLIPZ-Mobile/` :

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=votre_url_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon_supabase

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_votre_clé_publique
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret
```

## 🗄️ Configuration Base de Données

### 1. Exécuter le script SQL

Dans votre dashboard Supabase SQL Editor, exécutez :

```sql
-- Copier le contenu de stripe-database-setup.sql
```

### 2. Vérifier les tables créées

- `wallets` : Gestion des soldes utilisateurs
- `users` : Colonne `stripe_account_id` ajoutée
- Fonctions RPC : `add_balance`, `deduct_balance`, `get_or_create_wallet`

## 🔧 Déploiement des Edge Functions

### 1. Déployer les 4 Edge Functions

```bash
# Dans le dossier supabase/
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-connect-link
supabase functions deploy payout-clipper
```

### 2. Configurer les variables d'environnement Supabase

Dans votre dashboard Supabase > Settings > Edge Functions :

```env
STRIPE_SECRET_KEY=sk_test_votre_clé_secrète
STRIPE_WEBHOOK_SECRET=whsec_votre_webhook_secret
SUPABASE_URL=votre_url_supabase
SUPABASE_SERVICE_ROLE_KEY=votre_clé_service_role
```

## 🔗 Configuration Webhook Stripe

### 1. Créer le webhook

Dans votre dashboard Stripe > Developers > Webhooks :

- **URL** : `https://votre-projet.supabase.co/functions/v1/stripe-webhook`
- **Événements** :
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### 2. Récupérer le secret webhook

Copiez le `whsec_...` et ajoutez-le à vos variables d'environnement.

## 🧪 Tests

### 1. Cartes de test Stripe

Utilisez ces cartes pour tester :

- **Succès** : `4242 4242 4242 4242`
- **Échec** : `4000 0000 0000 0002`
- **3D Secure** : `4000 0025 0000 3155`

### 2. Tester le rechargement

1. Lancez l'app : `npm start`
2. Allez dans "Paiements"
3. Cliquez sur un montant
4. Utilisez une carte de test
5. Vérifiez que le solde se met à jour

### 3. Tester Stripe Connect

1. Créez un compte clipper
2. Cliquez sur "Se connecter à Stripe"
3. Complétez l'onboarding
4. Vérifiez que `stripe_account_id` est sauvegardé

## 🔍 Debugging

### 1. Logs Edge Functions

Dans Supabase > Edge Functions > Logs

### 2. Logs Stripe

Dans Stripe Dashboard > Developers > Logs

### 3. Erreurs communes

- **Webhook non reçu** : Vérifiez l'URL et les événements
- **Signature invalide** : Vérifiez le webhook secret
- **Solde non mis à jour** : Vérifiez les fonctions RPC

## 🚀 Production

### 1. Passer en mode production

1. Changez les clés Stripe vers les clés live
2. Mettez à jour les variables d'environnement
3. Redéployez les Edge Functions

### 2. Sécurité

- Utilisez toujours HTTPS
- Validez les signatures webhook
- Limitez les accès avec RLS
- Surveillez les logs

## 📞 Support

En cas de problème :
1. Vérifiez les logs Supabase
2. Vérifiez les logs Stripe
3. Testez avec les cartes de test
4. Vérifiez les variables d'environnement

---

**✅ Système Stripe complet déployé !** 