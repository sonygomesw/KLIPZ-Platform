// Configuration Stripe pour KLIPZ
// Remplacez ces valeurs par vos vraies clés Stripe

export const STRIPE_CONFIG = {
  // Clés de test (depuis les variables d'environnement)
  publishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here',
  secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here', // Utilisée côté serveur uniquement
  
  // Configuration Apple Pay
  merchantIdentifier: 'merchant.com.klipz.app',
  
  // Configuration Google Pay
  googlePayMerchantId: 'your_google_pay_merchant_id',
  
  // Devises supportées
  supportedCurrencies: ['usd', 'eur', 'cad'],
  
  // Frais Stripe (2.9% + 30 centimes)
  fees: {
    percentage: 0.029,
    fixed: 0.30,
  },
  
  // Montants minimums/maximums
  limits: {
    minAmount: 1.00, // 1$
    maxAmount: 50000.00, // 50,000$ (augmenté de 10,000$)
  },
  
  // Configuration des webhooks (côté serveur)
  webhookSecret: 'whsec_your_webhook_secret_here',
};

// Types de cartes supportées
export const SUPPORTED_CARD_BRANDS = [
  'visa',
  'mastercard',
  'amex',
  'discover',
  'jcb',
  'unionpay',
];

// Messages d'erreur personnalisés
export const STRIPE_ERROR_MESSAGES = {
  card_declined: 'Carte refusée. Veuillez vérifier vos informations.',
  insufficient_funds: 'Fonds insuffisants sur la carte.',
  expired_card: 'Carte expirée. Veuillez utiliser une autre carte.',
  incorrect_cvc: 'Code de sécurité incorrect.',
  processing_error: 'Error de traitement. Veuillez réessayer.',
  invalid_request: 'Requête invalide. Veuillez vérifier vos informations.',
  rate_limit: 'Trop de tentatives. Veuillez attendre avant de réessayer.',
};

// Configuration des méthodes de paiement
export const PAYMENT_METHODS = {
  card: {
    name: 'Carte bancaire',
    icon: 'card-outline',
    supported: true,
  },
  apple_pay: {
    name: 'Apple Pay',
    icon: 'logo-apple',
    supported: true,
  },
  google_pay: {
    name: 'Google Pay',
    icon: 'logo-google',
    supported: true,
  },
  bank_transfer: {
    name: 'Virement bancaire',
    icon: 'business-outline',
    supported: false,
  },
};

// Configuration des transferts
export const TRANSFER_CONFIG = {
  // Délai minimum pour les transferts (en heures)
  minimumDelay: 24,
  
  // Montant minimum pour les transferts
  minimumAmount: 10.00,
  
  // Frais de transfert
  transferFees: {
    percentage: 0.01, // 1%
    fixed: 0.25, // 25 centimes
  },
};

export default STRIPE_CONFIG; 