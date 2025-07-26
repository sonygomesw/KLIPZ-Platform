# 🗄️ Configuration Supabase pour KLIPZ

Ce guide vous explique comment configurer Supabase pour l'application KLIPZ avec la base de données PostgreSQL et l'authentification.

## 📋 Prérequis

1. **Compte Supabase** (gratuit)
2. **Application mobile** KLIPZ configurée
3. **Connaissances SQL** de base

## 🚀 Étapes de configuration

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Notez l'URL et les clés API

### 2. Récupérer les clés API

```bash
# Dans le dashboard Supabase
Settings > API

# Clés à récupérer :
- Project URL: https://your-project.supabase.co
- anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (côté serveur uniquement)
```

### 3. Configurer l'application

#### **Étape 1 : Mettre à jour la configuration**

Modifiez le fichier `src/config/supabase.ts` :

```typescript
const SUPABASE_CONFIG = {
  url: 'https://your-project.supabase.co',
  anonKey: 'your-anon-key-here',
  serviceRoleKey: 'your-service-role-key-here',
};
```

### 4. Créer les tables de base de données

#### **Table `users`**

```sql
-- Créer la table users
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('streamer', 'clipper')) NOT NULL,
  twitch_url TEXT,
  tiktok_username TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour les utilisateurs
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### **Table `campaigns`**

```sql
-- Créer la table campaigns
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id UUID REFERENCES users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria JSONB NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  cpm DECIMAL(10,4) NOT NULL,
  status TEXT CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
  total_views INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les campagnes
CREATE POLICY "Anyone can view active campaigns" ON campaigns
  FOR SELECT USING (status = 'active');

CREATE POLICY "Streamers can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = streamer_id);

CREATE POLICY "Streamers can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = streamer_id);

CREATE POLICY "Streamers can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = streamer_id);

CREATE POLICY "Streamers can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = streamer_id);
```

#### **Table `submissions`**

```sql
-- Créer la table submissions
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) NOT NULL,
  clipper_id UUID REFERENCES users(id) NOT NULL,
  tiktok_url TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'paid')) DEFAULT 'pending',
  views INTEGER DEFAULT 0,
  earnings DECIMAL(10,2) DEFAULT 0.00,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Activer RLS
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les soumissions
CREATE POLICY "Clippers can view own submissions" ON submissions
  FOR SELECT USING (auth.uid() = clipper_id);

CREATE POLICY "Streamers can view submissions for their campaigns" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = submissions.campaign_id 
      AND campaigns.streamer_id = auth.uid()
    )
  );

CREATE POLICY "Clippers can insert own submissions" ON submissions
  FOR INSERT WITH CHECK (auth.uid() = clipper_id);

CREATE POLICY "Streamers can update submissions for their campaigns" ON submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = submissions.campaign_id 
      AND campaigns.streamer_id = auth.uid()
    )
  );
```

#### **Table `payments`**

```sql
-- Créer la table payments
CREATE TABLE payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'withdrawal', 'transfer')) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les paiements
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Créer les fonctions et triggers

#### **Fonction pour mettre à jour `updated_at`**

```sql
-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour les tables
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at 
  BEFORE UPDATE ON campaigns 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### **Fonction pour calculer les gains**

```sql
-- Fonction pour calculer les gains d'une soumission
CREATE OR REPLACE FUNCTION calculate_earnings(views_count INTEGER, cpm_rate DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (views_count::DECIMAL / 1000) * cpm_rate;
END;
$$ LANGUAGE plpgsql;
```

### 6. Configuration de l'authentification

#### **Activer l'authentification par email**

```bash
# Dans le dashboard Supabase
Authentication > Settings > Auth Providers

# Activer :
- Email provider
- Confirm email (optionnel)
```

#### **Configuration des redirections**

```bash
# Dans le dashboard Supabase
Authentication > Settings > URL Configuration

# Ajouter les URLs de redirection :
- Site URL: https://your-app.com
- Redirect URLs: 
  - klipz://auth/callback
  - exp://localhost:19000/--/auth/callback
```

### 7. Configuration des webhooks

#### **Webhook pour les nouveaux utilisateurs**

```sql
-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, role, balance)
  VALUES (NEW.id, NEW.email, 'streamer', 0.00);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour les nouveaux utilisateurs
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 8. Index pour les performances

```sql
-- Index pour améliorer les performances
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_streamer_id ON campaigns(streamer_id);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

CREATE INDEX idx_submissions_campaign_id ON submissions(campaign_id);
CREATE INDEX idx_submissions_clipper_id ON submissions(clipper_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
```

## 🔒 Sécurité

### **Row Level Security (RLS)**
- ✅ **Activé** sur toutes les tables
- ✅ **Politiques** définies pour chaque table
- ✅ **Utilisateurs** ne peuvent voir que leurs données

### **Variables d'environnement**

```bash
# .env (ne pas commiter)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## 📊 Types de données

### **Structure JSON pour les critères**

```json
{
  "hashtags": ["gaming", "twitch", "viral"],
  "style": "dynamique et énergique",
  "duration": 60
}
```

### **Statuts des campagnes**
- `active` : Campagne en cours
- `paused` : Campagne en pause
- `completed` : Campagne terminée

### **Statuts des soumissions**
- `pending` : En attente d'approbation
- `approved` : Approuvée
- `rejected` : Rejetée
- `paid` : Payée

## 🧪 Tests

### **Données de test**

```sql
-- Insérer des utilisateurs de test
INSERT INTO users (id, email, role, twitch_url, balance) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'streamer@test.com', 'streamer', 'https://twitch.tv/teststreamer', 1000.00),
('550e8400-e29b-41d4-a716-446655440002', 'clipper@test.com', 'clipper', NULL, 0.00);

-- Insérer des campagnes de test
INSERT INTO campaigns (streamer_id, title, description, criteria, budget, cpm) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Test Campaign', 'Description test', '{"hashtags": ["test"], "style": "test", "duration": 60}', 500.00, 0.03);
```

## 📱 Intégration dans l'app

### **Initialisation dans App.tsx**

```typescript
import { supabase } from './src/config/supabase';

// Dans votre composant principal
useEffect(() => {
  // Écouter les changements d'authentification
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Utilisateur connecté
        const user = await authService.getCurrentUser();
        setUser(user);
      } else if (event === 'SIGNED_OUT') {
        // Utilisateur déconnecté
        setUser(null);
      }
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

## 🚨 Dépannage

### **Erreurs communes**

1. **"Invalid API key"**
   - Vérifier que la clé est correcte
   - Vérifier l'URL du projet

2. **"Row Level Security policy violation"**
   - Vérifier les politiques RLS
   - Vérifier que l'utilisateur est authentifié

3. **"Foreign key violation"**
   - Vérifier que les références existent
   - Vérifier les contraintes de clés étrangères

### **Support**

- **Documentation Supabase** : [supabase.com/docs](https://supabase.com/docs)
- **Support Supabase** : [supabase.com/support](https://supabase.com/support)
- **Communauté** : [github.com/supabase/supabase](https://github.com/supabase/supabase)

## ✅ Checklist de configuration

- [ ] Projet Supabase créé
- [ ] Clés API récupérées
- [ ] Configuration mise à jour dans l'app
- [ ] Tables créées avec RLS
- [ ] Fonctions et triggers créés
- [ ] Authentification configurée
- [ ] Webhooks configurés
- [ ] Index créés
- [ ] Tests effectués
- [ ] Variables d'environnement configurées
- [ ] Sécurité vérifiée

---

**KLIPZ** - Configuration Supabase complète pour la base de données et l'authentification 🗄️✨ 