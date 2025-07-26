# 🎵 Configuration TikTok Login Kit

## 📋 Prérequis

1. **Compte TikTok Developer** : https://developers.tiktok.com
2. **Application mobile** : Expo/React Native
3. **Backend** : Supabase

## 🚀 Étapes de configuration

### **1. Créer une application TikTok**

1. Allez sur https://developers.tiktok.com
2. Connectez-vous avec votre compte TikTok
3. Cliquez sur "Create App"
4. Remplissez les informations :
   - **App Name** : KLIPZ
   - **App Description** : Application de clips pour streamers
   - **Platform** : Mobile App
   - **Category** : Entertainment

### **2. Configurer OAuth**

1. Dans votre app, allez dans "Manage App"
2. Section "Login Kit" → "Configure"
3. Ajoutez votre **Redirect URI** :
   ```
   klipz://tiktok-auth
   ```
4. Sélectionnez les **Scopes** :
   - ✅ `user.info.basic`
   - ✅ `user.info.profile`
   - ✅ `user.info.stats` (si disponible)

### **3. Obtenir vos clés**

1. Dans "Manage App" → "App Info"
2. Copiez :
   - **Client Key**
   - **Client Secret**

### **4. Variables d'environnement**

Créez un fichier `.env` dans `KLIPZ-Mobile/` :

```bash
# TikTok Login Kit
EXPO_PUBLIC_TIKTOK_CLIENT_KEY=your_client_key_here
EXPO_PUBLIC_TIKTOK_CLIENT_SECRET=your_client_secret_here
```

### **5. Configuration Expo**

Dans `app.json`, ajoutez le scheme :

```json
{
  "expo": {
    "scheme": "klipz",
    "ios": {
      "bundleIdentifier": "com.klipz.app"
    },
    "android": {
      "package": "com.klipz.app"
    }
  }
}
```

### **6. Mise à jour de la base de données**

Exécutez le script SQL dans Supabase :

```sql
-- Ajouter les colonnes TikTok
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tiktok_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_profile_image TEXT,
ADD COLUMN IF NOT EXISTS tiktok_open_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER DEFAULT 0;
```

## 🔧 Installation des dépendances

```bash
cd KLIPZ-Mobile
npm install expo-web-browser expo-linking
```

## 🧪 Test de l'intégration

### **Test local**

1. Démarrez l'app :
   ```bash
   npm start
   ```

2. Testez l'authentification TikTok :
   - Allez sur l'écran d'inscription
   - Cliquez sur "Se connecter avec TikTok"
   - Vérifiez que l'authentification fonctionne

### **Test en production**

1. Déployez sur Expo :
   ```bash
   eas build --platform all
   ```

2. Testez sur un appareil réel

## 🔒 Sécurité

### **Bonnes pratiques**

1. **Ne jamais exposer** `CLIENT_SECRET` côté client
2. **Utiliser HTTPS** en production
3. **Valider les tokens** côté serveur
4. **Gérer les erreurs** d'authentification

### **Gestion des erreurs**

```typescript
// Erreurs communes
const TIKTOK_ERRORS = {
  INVALID_CLIENT: 'Client key invalide',
  INVALID_SCOPE: 'Scope non autorisé',
  ACCESS_DENIED: 'Accès refusé par l\'utilisateur',
  INVALID_CODE: 'Code d\'autorisation invalide'
};
```

## 📱 Utilisation dans l'app

### **Authentification**

```typescript
import tiktokAuthService from '../services/tiktokAuthService';

// Authentification TikTok
const tiktokUserInfo = await tiktokAuthService.authenticateWithTikTok();

// Sauvegarder les infos
await tiktokAuthService.saveTikTokInfo(userId, tiktokUserInfo);
```

### **Validation d'URL**

```typescript
// Valider une URL TikTok
const isValid = tiktokAuthService.validateTikTokUrl(url);

// Extraire l'ID vidéo
const videoId = tiktokAuthService.extractVideoId(url);
```

## 🚨 Dépannage

### **Erreurs communes**

1. **"Invalid client key"**
   - Vérifiez votre `CLIENT_KEY` dans `.env`
   - Assurez-vous que l'app est approuvée par TikTok

2. **"Redirect URI mismatch"**
   - Vérifiez que l'URI dans TikTok Developer Console correspond à `klipz://tiktok-auth`

3. **"Scope not authorized"**
   - Vérifiez les scopes dans votre app TikTok
   - Assurez-vous qu'ils sont activés

4. **"Network error"**
   - Vérifiez votre connexion internet
   - Vérifiez que les endpoints TikTok sont accessibles

### **Logs de débogage**

Activez les logs détaillés :

```typescript
// Dans tiktokAuthService.ts
console.log('🔵 TikTok Auth - URL:', authUrl);
console.log('🔵 TikTok Auth - Response:', result);
```

## 📈 Prochaines étapes

1. **Validation automatique** des URLs TikTok
2. **Récupération des statistiques** (si API disponible)
3. **Système de réputation** basé sur l'authentification
4. **Notifications** pour les nouvelles soumissions

## 🔗 Ressources

- [TikTok Developer Documentation](https://developers.tiktok.com/doc/login-kit-web)
- [OAuth 2.0 Guide](https://oauth.net/2/)
- [Expo WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Linking](https://docs.expo.dev/versions/latest/sdk/linking/) 