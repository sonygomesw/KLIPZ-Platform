# 🎮 KLIPZ - Plateforme de Clips Viraux

KLIPZ est une application mobile React Native/Expo qui connecte les streamers Twitch avec les clippers TikTok pour créer du contenu viral monétisé.

## 🚀 Fonctionnalités

### **Pour les Streamers**
- ✅ Création de campagnes avec budget et critères
- ✅ Gestion des soumissions de clips
- ✅ Suivi des performances et dépenses
- ✅ Paiements sécurisés via Stripe

### **Pour les Clippers**
- ✅ Découverte de campagnes actives
- ✅ Soumission de clips TikTok
- ✅ Suivi des gains et paiements
- ✅ Validation automatique des vues

### **Technique**
- ✅ Authentification Supabase
- ✅ Base de données PostgreSQL
- ✅ Paiements Stripe intégrés
- ✅ Interface moderne et intuitive

## 📱 Installation

### **Prérequis**
- Node.js 18+
- Expo CLI
- Compte Supabase (gratuit)
- Compte Stripe (pour les paiements)

### **1. Cloner le projet**
```bash
git clone <repository-url>
cd KLIPZ-Mobile
```

### **2. Installer les dépendances**
```bash
npm install
```

### **3. Configuration Supabase**
1. Créez un projet sur [supabase.com](https://supabase.com)
2. Récupérez vos clés API dans Settings > API
3. Copiez `env.example` vers `.env` et remplissez vos clés :
   ```bash
   cp env.example .env
   ```
4. Dans Supabase SQL Editor, exécutez le script `supabase_schema.sql`
5. Activez l'authentification par email dans Authentication > Settings

### **4. Configuration Stripe** (optionnel)
1. Créez un compte sur [stripe.com](https://stripe.com)
2. Récupérez vos clés API
3. Modifiez `src/config/stripe.ts` avec vos clés
4. Suivez le guide `STRIPE_SETUP.md`

### **5. Lancer l'application**
```bash
npm start
```

Scannez le QR code avec Expo Go sur votre téléphone.

## 🗄️ Configuration Supabase

### **Tables créées**
- `users` - Profils utilisateurs (streamers/clippers)
- `campaigns` - Campagnes de clips
- `submissions` - Soumissions de clips
- `payments` - Historique des paiements

### **Sécurité**
- ✅ Row Level Security (RLS) activé
- ✅ Politiques d'accès définies
- ✅ Authentification par email
- ✅ Validation des données

### **Fonctions automatiques**
- ✅ Mise à jour des timestamps
- ✅ Calcul automatique des gains
- ✅ Création de profils utilisateurs

## 💳 Intégration Stripe

### **Fonctionnalités**
- ✅ Paiements par carte
- ✅ Apple Pay / Google Pay
- ✅ Gestion des comptes utilisateurs
- ✅ Webhooks pour les notifications

### **Sécurité**
- ✅ Clés API sécurisées
- ✅ Validation côté serveur
- ✅ Gestion des erreurs
- ✅ Conformité PCI

## 🏗️ Architecture

### **Structure des dossiers**
```
src/
├── components/          # Composants réutilisables
├── config/             # Configuration (Supabase, Stripe)
├── constants/          # Constantes (couleurs, tailles)
├── navigation/         # Navigation React Navigation
├── screens/            # Écrans de l'application
├── services/           # Services (auth, campaigns, payments)
└── types/              # Types TypeScript
```

### **Services principaux**
- `authService` - Authentification Supabase
- `campaignService` - Gestion des campagnes
- `stripeService` - Paiements Stripe

## 🎨 Interface Utilisateur

### **Design System**
- **Couleurs** : Palette moderne et accessible
- **Typographie** : Police système optimisée
- **Espacement** : Grille cohérente
- **Composants** : Boutons, cartes, inputs

### **Écrans principaux**
1. **Authentification** - Connexion/Inscription
2. **Dashboard** - Vue d'ensemble et actions
3. **Boosts** - Campagnes boostées
4. **Profile** - Gestion du compte

## 🔧 Développement

### **Scripts disponibles**
```bash
npm start          # Lancer l'application
npm run android    # Lancer sur Android
npm run ios        # Lancer sur iOS
npm run web        # Lancer en mode web
```

### **Variables d'environnement**
```bash
# .env (ne pas commiter)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### **Tests**
```bash
npm test           # Lancer les tests
npm run test:watch # Tests en mode watch
```

## 📊 Base de données

### **Schéma principal**
```sql
-- Utilisateurs
users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('streamer', 'clipper')),
  twitch_url TEXT,
  tiktok_username TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00
)

-- Campagnes
campaigns (
  id UUID PRIMARY KEY,
  streamer_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  cpm DECIMAL(10,4) NOT NULL,
  status TEXT DEFAULT 'active'
)

-- Soumissions
submissions (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id),
  clipper_id UUID REFERENCES users(id),
  tiktok_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  views INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) DEFAULT 0.00
)
```

## 🚨 Dépannage

### **Erreurs communes**

1. **"Invalid API key"**
   - Vérifiez vos clés Supabase dans `src/config/supabase.ts`
   - Assurez-vous que l'URL du projet est correcte

2. **"Row Level Security policy violation"**
   - Vérifiez que l'utilisateur est authentifié
   - Vérifiez les politiques RLS dans Supabase

3. **"Network request failed"**
   - Vérifiez votre connexion internet
   - Vérifiez que Supabase est accessible

### **Logs de débogage**
```bash
# Activer les logs détaillés
export EXPO_DEBUG=true
npm start
```

## 📈 Roadmap

### **Fonctionnalités à venir**
- 🔄 Notifications push
- 🔄 Mode hors ligne
- 🔄 Analytics avancées
- 🔄 Intégration YouTube
- 🔄 API publique
- 🔄 Application web

### **Améliorations techniques**
- 🔄 Tests automatisés
- 🔄 CI/CD pipeline
- 🔄 Monitoring et alertes
- 🔄 Optimisation des performances

## 🤝 Contribution

### **Comment contribuer**
1. Fork le projet
2. Créez une branche feature
3. Committez vos changements
4. Ouvrez une Pull Request

### **Standards de code**
- TypeScript strict
- ESLint + Prettier
- Tests unitaires
- Documentation des APIs

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Support

- **Documentation** : [docs.klipz.com](https://docs.klipz.com)
- **Support** : [support@klipz.com](mailto:support@klipz.com)
- **Discord** : [discord.gg/klipz](https://discord.gg/klipz)

---

**KLIPZ** - Connecter les créateurs, monétiser le contenu viral 🎮✨ 