# 🔐 Guide de Configuration des Variables d'Environnement

## 📋 **Variables nécessaires pour votre frère :**

Votre frère a besoin de ces clés pour que l'application fonctionne :

### **1. Créer le fichier .env**
```bash
cd frontend
cp .env.example .env
```

### **2. Remplir le fichier .env avec les vraies clés :**

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Stripe Configuration
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Twitch Configuration
EXPO_PUBLIC_TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# TikTok Configuration
EXPO_PUBLIC_TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## 🔒 **Partage sécurisé des clés :**

### **Option 1 : Discord/Slack privé**
- Envoyer les clés en message privé
- **NE PAS** les poster dans un canal public

### **Option 2 : Email privé**
- Envoyer par email personnel
- **NE PAS** utiliser l'email professionnel

### **Option 3 : Note partagée sécurisée**
- Google Keep, Notion, ou autre outil privé
- **NE PAS** utiliser de notes publiques

## ⚠️ **IMPORTANT : Sécurité**

### **✅ À faire :**
- Partager uniquement les clés de **test** (pas production)
- Utiliser des canaux privés
- Demander de ne pas partager les clés

### **❌ À éviter :**
- Poster les clés publiquement
- Commiter le fichier .env
- Partager les clés de production

## 🚀 **Instructions pour votre frère :**

1. **Recevoir les clés** par Discord/Slack privé
2. **Créer le fichier .env** dans le dossier frontend
3. **Remplir avec les vraies clés**
4. **Tester l'application** : `npx expo start`
5. **NE JAMAIS commiter le fichier .env**

## 📱 **Test de l'application :**

Une fois les clés configurées :
```bash
cd frontend
npx expo start
# Scanner le QR code avec Expo Go
```

**Les clés sont nécessaires pour que l'application se connecte à Supabase et Stripe !** 🔐 