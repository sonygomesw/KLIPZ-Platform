# 🚀 Guide de Démarrage Rapide - KLIPZ

## ⚡ Configuration en 5 minutes

### 1. **Cloner et installer**
```bash
git clone <repository-url>
cd KLIPZ-Mobile
npm install
```

### 2. **Configurer Supabase**
1. Allez sur [supabase.com](https://supabase.com) et créez un projet
2. Dans votre projet Supabase, allez dans **Settings > API**
3. Copiez l'URL et la clé anon
4. Créez le fichier `.env` :
   ```bash
   cp env.example .env
   ```
5. Remplissez dans `.env` :
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
   ```

### 3. **Créer la base de données**
1. Dans Supabase, allez dans **SQL Editor**
2. Copiez tout le contenu du fichier `supabase_schema.sql`
3. Cliquez sur **"Run"** pour exécuter le script

### 4. **Configurer l'authentification**
1. Dans Supabase, allez dans **Authentication > Settings**
2. Activez **"Enable email confirmations"**
3. Désactivez **"Enable phone confirmations"** (optionnel)

### 5. **Lancer l'application**
```bash
npm start
```

Scannez le QR code avec **Expo Go** sur votre téléphone !

## 🎯 Test rapide

### **Créer un compte Streamer**
1. Ouvrez l'app et cliquez sur **"Sign Up"**
2. Choisissez **"Streamer"**
3. Entrez votre email et une URL Twitch
4. Confirmez votre email

### **Créer une campagne**
1. Connectez-vous en tant que streamer
2. Allez dans l'onglet **"Boosts"**
3. Cliquez sur **"Create Campaign"**
4. Remplissez les détails et créez

### **Créer un compte Clipper**
1. Créez un nouveau compte avec le rôle **"Clipper"**
2. Entrez votre nom d'utilisateur TikTok
3. Parcourez les campagnes disponibles

## 🔧 Configuration Stripe (optionnel)

Si vous voulez tester les paiements :

1. Créez un compte sur [stripe.com](https://stripe.com)
2. Récupérez vos clés dans **Developers > API keys**
3. Ajoutez dans `.env` :
   ```
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

## 🚨 Problèmes courants

### **"Invalid API key"**
- Vérifiez que vos clés Supabase sont correctes dans `.env`
- Assurez-vous que l'URL du projet est complète

### **"Table doesn't exist"**
- Vérifiez que vous avez bien exécuté le script SQL dans Supabase
- Vérifiez que les tables sont créées dans **Table Editor**

### **"Authentication error"**
- Vérifiez que l'authentification par email est activée dans Supabase
- Vérifiez que vous avez confirmé votre email

## 📱 Fonctionnalités à tester

### **Pour les Streamers**
- ✅ Création de campagne
- ✅ Gestion des soumissions
- ✅ Suivi du budget

### **Pour les Clippers**
- ✅ Parcours des campagnes
- ✅ Soumission de clips
- ✅ Suivi des gains

### **Général**
- ✅ Navigation fluide
- ✅ Interface responsive
- ✅ Authentification sécurisée

## 🎉 Félicitations !

Votre application KLIPZ est maintenant configurée et prête à être utilisée ! 

**Prochaines étapes :**
- Personnaliser l'interface
- Ajouter des fonctionnalités avancées
- Configurer les webhooks Stripe
- Intégrer l'API TikTok pour la vérification automatique 