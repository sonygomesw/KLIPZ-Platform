# 🧪 Guide de Test - Stripe Connect Express

## 📋 Prérequis

1. **Variables d'environnement configurées** :
   - `STRIPE_SECRET_KEY` (clé secrète Stripe)
   - `SUPABASE_URL` (URL de votre projet Supabase)
   - `SUPABASE_SERVICE_ROLE_KEY` (clé service role Supabase)

2. **Edge Functions déployées** :
   - `stripe-create-account`
   - `stripe-onboarding-link`
   - `stripe-payout`

3. **Base de données** :
   - Table `users` avec colonne `stripe_account_id`
   - Table `withdrawals` créée

## 🚀 Déploiement

### 1. Déployer les Edge Functions

```bash
# Dans le répertoire racine du projet
./deploy-stripe-functions.sh
```

### 2. Vérifier les URLs

Les fonctions doivent être accessibles via :
- `https://<project>.supabase.co/functions/v1/stripe-create-account`
- `https://<project>.supabase.co/functions/v1/stripe-onboarding-link`
- `https://<project>.supabase.co/functions/v1/stripe-payout`

## 🧪 Tests Manuels

### Test 1 : Création de compte Stripe Connect

**Objectif** : Vérifier qu'un compte Stripe Connect Express est créé pour un utilisateur.

**Étapes** :
1. Ouvrir l'app mobile
2. Se connecter avec un compte clipper
3. Aller sur l'écran "Mes Gains"
4. Cliquer sur "Retirer mes gains"
5. **Résultat attendu** : L'onboarding Stripe s'ouvre dans le navigateur

**Vérifications** :
- ✅ Le compte Stripe Connect est créé dans le dashboard Stripe
- ✅ L'ID du compte est stocké dans `users.stripe_account_id`
- ✅ L'onboarding s'ouvre correctement

### Test 2 : Onboarding Stripe Connect

**Objectif** : Vérifier que l'utilisateur peut compléter l'onboarding.

**Étapes** :
1. Suivre le processus d'onboarding Stripe
2. Remplir les informations personnelles
3. Ajouter un compte bancaire (utiliser les données de test Stripe)
4. Compléter la vérification

**Données de test Stripe** :
- **IBAN** : `DE89370400440532013000`
- **Code postal** : `12345`
- **Ville** : `Berlin`
- **Pays** : `Germany`

**Résultat attendu** :
- ✅ Retour à l'app via deep link `klipz://stripe-onboarding-success`
- ✅ Notification de succès affichée

### Test 3 : Demande de retrait

**Objectif** : Vérifier qu'un clipper peut demander un retrait.

**Prérequis** : Avoir des gains disponibles et un compte Stripe Connect configuré.

**Étapes** :
1. Aller sur "Mes Gains"
2. Cliquer sur "Retirer mes gains"
3. Confirmer la demande

**Résultat attendu** :
- ✅ Une entrée est créée dans `withdrawals` avec `status = 'pending'`
- ✅ Le solde de l'utilisateur est débité
- ✅ Notification de confirmation affichée

### Test 4 : Traitement admin des retraits

**Objectif** : Vérifier qu'un admin peut traiter les retraits.

**Étapes** :
1. Se connecter avec un compte admin
2. Aller sur l'écran "Admin Declarations"
3. Dans la section "Retraits à traiter"
4. Cliquer sur "Marquer comme traité"

**Résultat attendu** :
- ✅ Le statut passe à `completed`
- ✅ Un transfert Stripe est créé
- ✅ L'argent arrive sur le compte bancaire du clipper (en mode test)

### Test 5 : Historique des retraits

**Objectif** : Vérifier l'affichage de l'historique.

**Étapes** :
1. Aller sur "Mes Gains"
2. Vérifier la section "Historique des retraits"

**Résultat attendu** :
- ✅ Tous les retraits sont listés
- ✅ Les statuts sont corrects
- ✅ Les montants et dates sont affichés

## 🔧 Tests Techniques

### Test des Edge Functions

```bash
# Test stripe-create-account
curl -X POST https://<project>.supabase.co/functions/v1/stripe-create-account \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Test stripe-onboarding-link
curl -X POST https://<project>.supabase.co/functions/v1/stripe-onboarding-link \
  -H "Content-Type: application/json" \
  -d '{"userId": "test-user-id"}'

# Test stripe-payout
curl -X POST https://<project>.supabase.co/functions/v1/stripe-payout \
  -H "Content-Type: application/json" \
  -d '{"withdrawalId": "test-withdrawal-id"}'
```

### Vérification des données

```sql
-- Vérifier les utilisateurs avec compte Stripe
SELECT id, email, stripe_account_id FROM users WHERE stripe_account_id IS NOT NULL;

-- Vérifier les retraits
SELECT * FROM withdrawals ORDER BY created_at DESC;

-- Vérifier les déclarations
SELECT * FROM declarations WHERE status = 'paid';
```

## 🐛 Dépannage

### Erreur : "User does not have a Stripe Connect account"

**Cause** : L'utilisateur n'a pas de `stripe_account_id` dans la base.

**Solution** :
1. Vérifier que la fonction `stripe-create-account` a bien créé le compte
2. Vérifier que l'ID est bien stocké dans `users.stripe_account_id`

### Erreur : "Onboarding Stripe Connect requis"

**Cause** : L'utilisateur n'a pas complété l'onboarding.

**Solution** :
1. Rediriger vers l'onboarding
2. Vérifier que le deep linking fonctionne

### Erreur : "Failed to process payout"

**Cause** : Problème avec le transfert Stripe.

**Solution** :
1. Vérifier les logs de la fonction `stripe-payout`
2. Vérifier que le compte Stripe Connect est actif
3. Vérifier les permissions de transfert

### Erreur : Deep link ne fonctionne pas

**Cause** : Configuration incorrecte du deep linking.

**Solution** :
1. Vérifier `app.json` avec `"scheme": "klipz"`
2. Vérifier `App.tsx` avec le listener `Linking.addEventListener`
3. Redémarrer l'app après modification

## 📊 Monitoring

### Logs à surveiller

1. **Edge Functions** : Vérifier les logs dans le dashboard Supabase
2. **Stripe Dashboard** : Surveiller les événements de compte et transfert
3. **App mobile** : Vérifier les erreurs dans la console

### Métriques importantes

- Nombre de comptes Stripe Connect créés
- Taux de réussite de l'onboarding
- Nombre de retraits traités
- Temps de traitement des retraits

## 🔒 Sécurité

### Vérifications

- ✅ Les Edge Functions utilisent `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Les permissions RLS sont configurées
- ✅ Les clés Stripe sont sécurisées
- ✅ Les deep links sont validés

### Bonnes pratiques

1. **Test en mode Stripe Test** avant la production
2. **Validation des montants** côté serveur
3. **Logs d'audit** pour tous les transferts
4. **Gestion des erreurs** robuste

## 🎯 Checklist de Validation

- [ ] Edge Functions déployées et accessibles
- [ ] Variables d'environnement configurées
- [ ] Deep linking fonctionnel
- [ ] Création de compte Stripe Connect
- [ ] Onboarding utilisateur
- [ ] Demande de retrait
- [ ] Traitement admin
- [ ] Transfert Stripe
- [ ] Historique des retraits
- [ ] Gestion des erreurs
- [ ] Notifications utilisateur

## 📞 Support

En cas de problème :
1. Vérifier les logs Supabase
2. Vérifier les logs Stripe
3. Tester avec les données de test Stripe
4. Vérifier la configuration des variables d'environnement 