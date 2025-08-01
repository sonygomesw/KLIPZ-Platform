# 🎯 Guide d'Intégration TikTok API pour KLIPZ

## 📋 Vue d'ensemble

Cette intégration remplace le système de scraping TikTok par l'API officielle TikTok Business pour récupérer les vraies métriques et déclencher des paiements automatiques précis.

## 🔧 Configuration Requise

### 1. TikTok Business Account
1. Créer un compte sur [TikTok for Developers](https://developers.tiktok.com/)
2. Créer une nouvelle app Business
3. Récupérer `Client Key` et `Client Secret`
4. Configurer les scopes: `user.info.basic`, `user.info.profile`, `video.list`, `video.insights`

### 2. Variables d'environnement
```bash
# TikTok API
EXPO_PUBLIC_TIKTOK_CLIENT_KEY=your_client_key
EXPO_PUBLIC_TIKTOK_CLIENT_SECRET=your_client_secret

# Supabase (déjà configuré)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🗄️ Migration Base de Données

Exécuter le script SQL :
```bash
psql -h your-db-host -U postgres -d postgres -f backend/create-user-tokens-table.sql
```

Ou via Supabase Dashboard → SQL Editor → Coller le contenu du fichier

## 🚀 Déploiement

### 1. Déployer la fonction Supabase
```bash
cd backend
supabase functions deploy get-tiktok-metrics
```

### 2. Vérifier les permissions
```bash
# Vérifier que la fonction peut appeler payout-clipper
supabase functions list
```

### 3. Tester l'intégration
```bash
node test-tiktok-integration.js
```

## 🔄 Workflow Utilisateur

### Pour les Clippers :

1. **Connexion TikTok** (première fois)
   ```typescript
   import TikTokMetricsService from './services/tiktokMetricsService';
   
   // Connecter l'utilisateur à TikTok
   const result = await TikTokMetricsService.connectUserToTikTok(userId);
   ```

2. **Soumission de vidéo** (normal)
   - Le clipper soumet son URL TikTok comme d'habitude
   - Le système utilise automatiquement l'API TikTok pour les métriques

3. **Mise à jour automatique**
   ```typescript
   // Déclenché automatiquement ou manuellement
   const result = await TikTokMetricsService.updateSubmissionMetrics(submissionId, userId);
   
   if (result.paymentTriggered) {
     console.log(`💰 Paiement de $${result.earnings} déclenché !`);
   }
   ```

### Pour les Entreprises :

1. **Création de campagne** (inchangé)
   - Définir CPM et seuil de vues minimum
   - Le système calculera automatiquement les paiements

2. **Suivi temps réel**
   - Les métriques sont mises à jour via l'API officielle
   - Paiements déclenchés automatiquement quand le seuil est atteint

## 🎛️ Interface Utilisateur

### Bouton "Connecter TikTok" (nouveau)
```typescript
// Dans ProfileScreen ou SettingsScreen
const handleConnectTikTok = async () => {
  setLoading(true);
  try {
    const result = await TikTokMetricsService.connectUserToTikTok(user.id);
    if (result.success) {
      Alert.alert('✅ Succès', 'TikTok connecté avec succès !');
      setTikTokConnected(true);
    } else {
      Alert.alert('❌ Erreur', result.error);
    }
  } catch (error) {
    Alert.alert('❌ Erreur', 'Connexion TikTok échouée');
  } finally {
    setLoading(false);
  }
};
```

### Bouton "Actualiser Métriques" (nouveau)
```typescript
// Dans SubmissionsScreen
const handleRefreshMetrics = async (submissionId: string) => {
  const result = await TikTokMetricsService.updateSubmissionMetrics(submissionId, user.id);
  
  if (result.success) {
    setSubmissions(prev => prev.map(sub => 
      sub.id === submissionId 
        ? { ...sub, views: result.views, earnings: result.earnings }
        : sub
    ));
    
    if (result.paymentTriggered) {
      Alert.alert('💰 Paiement déclenché !', `Vous avez reçu $${result.earnings}`);
    }
  }
};
```

## 📊 Avantages de cette approche

### ✅ Précision
- **Données officielles** TikTok au lieu de scraping approximatif
- **Métriques détaillées** : vues, likes, commentaires, partages
- **Paiements justes** basés sur les vraies performances

### ✅ Fiabilité  
- **API stable** - pas de cassure par changements d'interface
- **Rate limits gérés** par TikTok
- **Respect des TOS** TikTok

### ✅ Évolutivité
- **Volume illimité** de requêtes API
- **Performance optimisée**
- **Monitoring intégré**

## 🔧 Maintenance

### Logs à surveiller
```typescript
// Dans les fonctions Supabase
console.log('🔍 Récupération métriques TikTok pour vidéo:', videoId);
console.log('✅ Métriques TikTok récupérées:', videoData);
console.log('💰 Déclenchement paiement automatique:', { views, amount });
```

### Tokens TikTok
- Les tokens expirent (vérifier `tiktok_expires_at`)
- Prévoir un refresh automatique ou notification utilisateur
- Stocker les refresh tokens pour renouvellement

### Monitoring
```sql
-- Vérifier les soumissions avec nouvelles métriques
SELECT id, views, like_count, metrics_source, paid_at 
FROM submissions 
WHERE metrics_source = 'tiktok_api' 
ORDER BY created_at DESC LIMIT 10;

-- Vérifier les tokens actifs
SELECT user_id, tiktok_expires_at 
FROM user_tokens 
WHERE tiktok_access_token IS NOT NULL;
```

## 🐛 Dépannage

### Erreur "Token TikTok requis"
→ L'utilisateur doit se reconnecter à TikTok

### Erreur "Vidéo non trouvée"  
→ Vérifier que la vidéo est publique et l'URL correcte

### Paiement non déclenché
→ Vérifier le seuil de vues et le statut Stripe Connect

### API Rate Limit
→ TikTok gère automatiquement, mais surveiller les logs

## 🎯 Prochaines Étapes

1. **Déployer** cette intégration
2. **Tester** avec quelques clippers bêta
3. **Monitorer** les paiements automatiques
4. **Optimiser** les performances si nécessaire
5. **Étendre** à d'autres plateformes (YouTube, Instagram)

## 📞 Support

Pour toute question sur cette intégration :
1. Vérifier les logs Supabase Functions
2. Tester avec `test-tiktok-integration.js`
3. Consulter la documentation TikTok Business API