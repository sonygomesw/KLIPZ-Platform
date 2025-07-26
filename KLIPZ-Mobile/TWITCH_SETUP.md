# Configuration Twitch pour KLIPZ

## 🔧 Configuration requise

### 1. Créer une application Twitch

1. **Aller sur [Twitch Developer Console](https://dev.twitch.tv/console)**
2. **Se connecter avec votre compte Twitch**
3. **Cliquer sur "Register Your Application"**
4. **Remplir les informations :**
   - **Name** : `KLIPZ App`
   - **OAuth Redirect URLs** : `http://localhost:3000`
   - **Category** : `Application Integration`
5. **Cliquer sur "Create"**
6. **Noter le `Client ID` et le `Client Secret`**

### 2. Configurer Supabase

#### Variables d'environnement Supabase

Dans votre projet Supabase, allez dans **Settings > Environment Variables** et ajoutez :

```bash
TWITCH_CLIENT_ID=votre_client_id_ici
TWITCH_CLIENT_SECRET=votre_client_secret_ici
```

#### Déployer l'Edge Function

```bash
# Dans le dossier supabase/functions/twitch-followers
supabase functions deploy twitch-followers
```

### 3. Tester l'intégration

L'Edge Function est accessible via :
```
POST https://votre-projet.supabase.co/functions/v1/twitch-followers
```

Avec le body :
```json
{
  "twitchUsername": "nom_du_streamer"
}
```

## 🎯 Fonctionnalités

### ✅ Ce qui fonctionne

- **Récupération des followers** : Nombre réel de followers Twitch
- **Données du profil** : Nom d'affichage, image de profil
- **Mise à jour manuelle** : Bouton de rafraîchissement dans le dashboard
- **Stockage en base** : Données sauvegardées dans Supabase

### 🔄 Mise à jour automatique

Pour une mise à jour automatique des followers, vous pouvez :

1. **Créer un cron job** qui appelle l'Edge Function
2. **Utiliser Supabase Edge Functions** avec des triggers
3. **Intégrer dans le workflow** de création de campagne

## 🚨 Limitations Twitch API

- **Rate limiting** : 800 requêtes par minute
- **Authentification** : Nécessite un compte développeur Twitch
- **Données publiques** : Seules les données publiques sont accessibles

## 🔍 Debugging

### Vérifier les logs

```bash
# Logs de l'Edge Function
supabase functions logs twitch-followers
```

### Tester manuellement

```bash
curl -X POST https://votre-projet.supabase.co/functions/v1/twitch-followers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer votre_anon_key" \
  -d '{"twitchUsername": "test_user"}'
```

## 📱 Utilisation dans l'app

Les streamers peuvent maintenant :

1. **Voir leurs vrais followers** dans le dashboard
2. **Rafraîchir manuellement** avec le bouton 🔄
3. **Avoir des données à jour** lors de l'inscription

Le système est maintenant prêt pour afficher les vrais followers Twitch ! 🎉 