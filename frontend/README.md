# 🎨 Frontend KLIPZ

## 📁 Structure

```
frontend/
├── src/
│   ├── components/   # Composants réutilisables
│   ├── screens/      # Écrans de l'application
│   ├── services/     # Services API
│   ├── navigation/   # Navigation et routes
│   ├── constants/    # Couleurs, tailles, etc.
│   └── types/        # Types TypeScript
├── assets/           # Images et ressources
└── docs/            # Documentation frontend
```

## 🚀 Démarrage

### 1. Installation
```bash
npm install
```

### 2. Configuration
```bash
cp .env.example .env
# Remplir les clés dans .env
```

### 3. Lancer l'application
```bash
npm start
```

## 🎯 Fonctionnalités

### Écrans principaux
- `AuthScreen` - Inscription/Connexion
- `DashboardScreen` - Dashboard principal
- `CreateCampaignScreen` - Création de campagnes
- `CampaignsListScreen` - Liste des campagnes
- `PaymentScreen` - Gestion wallet
- `ProfileScreen` - Profil utilisateur

### Composants
- `CampaignCard` - Carte de campagne
- `Button` - Boutons réutilisables
- `ResponsiveLayout` - Layout responsive
- `AddFundsModal` - Modal de recharge

## 🎨 Design

### Thème
- **Couleurs** : Définies dans `src/constants/index.ts`
- **Responsive** : Mobile et desktop
- **Animations** : Transitions fluides

### Priorités design
1. **DashboardScreen** - Améliorer les stats
2. **PaymentScreen** - UX du wallet
3. **Composants** - Créer des composants réutilisables
4. **Animations** - Ajouter des transitions

## 🔄 Workflow

### Branches
- `feature/frontend-*` - Fonctionnalités frontend

### Bonnes pratiques
- Composants réutilisables
- Responsive design
- Performance optimisée
- Code review mutuelle

## 📚 Documentation

- [Components](./docs/COMPONENTS.md) - Documentation des composants
- [Screens](./docs/SCREENS.md) - Documentation des écrans
- [Styling](./docs/STYLING.md) - Guide de style 