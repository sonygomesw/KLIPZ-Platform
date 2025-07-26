# 🏦 Configuration Stripe pour KLIPZ

Ce guide vous explique comment configurer Stripe pour gérer les paiements dans l'application KLIPZ.

## 📋 Prérequis

1. **Compte Stripe** (gratuit)
2. **Application mobile** KLIPZ configurée
3. **Serveur backend** (pour les webhooks)

## 🚀 Étapes de configuration

### 1. Créer un compte Stripe

1. Allez sur [stripe.com](https://stripe.com)
2. Créez un compte gratuit
3. Activez votre compte (vérification d'identité)

### 2. Récupérer les clés API

#### **Clés de test (développement)**
```bash
# Dans le dashboard Stripe
Dashboard > Developers > API keys

# Clés à récupérer :
- Publishable key (pk_test_...)
- Secret key (sk_test_...)
```

#### **Clés de production (lancé)**
```bash
# Basculer en mode "Live" dans le dashboard
- Publishable key (pk_live_...)
- Secret key (sk_live_...)
```

### 3. Configurer l'application

#### **Étape 1 : Mettre à jour la configuration**

Modifiez le fichier `src/config/stripe.ts` :

```typescript
export const STRIPE_CONFIG = {
  // Remplacez par vos vraies clés
  publishableKey: 'pk_test_votre_cle_publique',
  secretKey: 'sk_test_votre_cle_secrete', // Côté serveur uniquement
  
  // Configuration Apple Pay
  merchantIdentifier: 'merchant.com.klipz.app',
  
  // Configuration Google Pay
  googlePayMerchantId: 'votre_merchant_id',
};
```

#### **Étape 2 : Initialiser Stripe dans l'app**

Dans `App.tsx` ou votre composant principal :

```typescript
import { StripeProvider } from '@stripe/stripe-react-native';
import { STRIPE_CONFIG } from './src/config/stripe';

export default function App() {
  return (
    <StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
      {/* Votre app */}
    </StripeProvider>
  );
}
```

### 4. Configuration côté serveur

#### **Webhooks Stripe**

1. **Créer un endpoint webhook** sur votre serveur
2. **Configurer dans Stripe Dashboard** :
   ```
   Dashboard > Developers > Webhooks
   URL: https://votre-api.com/webhooks/stripe
   Events: payment_intent.succeeded, transfer.created, etc.
   ```

#### **Exemple de webhook (Node.js/Express)**

```javascript
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/webhooks/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Mettre à jour le solde de l'utilisateur
      break;
    case 'transfer.created':
      const transfer = event.data.object;
      // Notifier le clipper du transfert
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});
```

### 5. Configuration Apple Pay (iOS)

#### **Étape 1 : Certificat Apple Pay**

1. **Apple Developer Account** requis
2. **Créer un certificat Apple Pay** dans Apple Developer
3. **Configurer dans Stripe Dashboard** :
   ```
   Dashboard > Settings > Payment methods > Apple Pay
   ```

#### **Étape 2 : Configuration dans l'app**

```typescript
// Dans votre composant de paiement
import { useApplePay } from '@stripe/stripe-react-native';

const { presentApplePay } = useApplePay({
  merchantIdentifier: STRIPE_CONFIG.merchantIdentifier,
  merchantDisplayName: 'KLIPZ',
});
```

### 6. Configuration Google Pay (Android)

#### **Étape 1 : Merchant ID**

1. **Google Pay API Console**
2. **Créer un Merchant ID**
3. **Configurer dans Stripe Dashboard**

#### **Étape 2 : Configuration dans l'app**

```typescript
// Dans votre composant de paiement
import { useGooglePay } from '@stripe/stripe-react-native';

const { presentGooglePay } = useGooglePay({
  merchantDisplayName: 'KLIPZ',
  merchantIdentifier: STRIPE_CONFIG.googlePayMerchantId,
});
```

## 🔒 Sécurité

### **Clés sensibles**
- ❌ **Ne jamais** commiter les clés secrètes dans Git
- ✅ **Utiliser** des variables d'environnement
- ✅ **Utiliser** des clés de test pour le développement

### **Variables d'environnement**

```bash
# .env (ne pas commiter)
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### **Validation côté serveur**
- ✅ **Toujours** valider les paiements côté serveur
- ✅ **Vérifier** les signatures des webhooks
- ✅ **Utiliser** HTTPS en production

## 💰 Frais Stripe

### **Frais standard**
- **2.9% + 30 centimes** par transaction
- **Pas de frais mensuels** (compte gratuit)

### **Frais de transfert**
- **1%** pour les transferts vers les clippers
- **25 centimes** par transfert

### **Calcul des frais**

```typescript
const calculateFees = (amount: number) => {
  return (amount * 0.029) + 0.30;
};

const calculateTransferFees = (amount: number) => {
  return (amount * 0.01) + 0.25;
};
```

## 🧪 Tests

### **Cartes de test Stripe**

```bash
# Carte qui fonctionne
4242 4242 4242 4242

# Carte qui échoue
4000 0000 0000 0002

# Carte qui nécessite une authentification
4000 0025 0000 3155
```

### **Tester les webhooks**

```bash
# Utiliser Stripe CLI
stripe listen --forward-to localhost:3000/webhooks/stripe
```

## 📱 Intégration dans KLIPZ

### **Flux de paiement**

1. **Streamer** recharge son compte
2. **Paiement** traité par Stripe
3. **Solde** mis à jour automatiquement
4. **Transferts** automatiques vers les clippers

### **Flux de transfert**

1. **Clipper** soumet un clip
2. **Streamer** approuve le clip
3. **Vues** comptabilisées automatiquement
4. **Transfert** automatique vers le clipper

## 🚨 Dépannage

### **Erreurs communes**

1. **"Invalid API key"**
   - Vérifier que la clé est correcte
   - Vérifier le mode (test/live)

2. **"Card declined"**
   - Utiliser les cartes de test Stripe
   - Vérifier les informations de la carte

3. **"Webhook signature verification failed"**
   - Vérifier le webhook secret
   - Vérifier l'URL du webhook

### **Support**

- **Documentation Stripe** : [stripe.com/docs](https://stripe.com/docs)
- **Support Stripe** : [support.stripe.com](https://support.stripe.com)
- **Communauté** : [github.com/stripe/stripe-react-native](https://github.com/stripe/stripe-react-native)

## ✅ Checklist de configuration

- [ ] Compte Stripe créé
- [ ] Clés API récupérées
- [ ] Configuration mise à jour dans l'app
- [ ] Webhooks configurés
- [ ] Apple Pay configuré (iOS)
- [ ] Google Pay configuré (Android)
- [ ] Tests effectués
- [ ] Variables d'environnement configurées
- [ ] Sécurité vérifiée

---

**KLIPZ** - Configuration Stripe complète pour les paiements sécurisés 💳✨ 