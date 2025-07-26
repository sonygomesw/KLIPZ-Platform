-- Schéma de base de données pour KLIPZ
-- Base de données Supabase

-- Table des utilisateurs (streamers et clippers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('streamer', 'clipper')),
    
    -- Informations Twitch (pour les streamers)
    twitch_url VARCHAR(255),
    twitch_username VARCHAR(255),
    twitch_display_name VARCHAR(255),
    twitch_followers INTEGER DEFAULT 0,
    twitch_profile_image TEXT,
    
    -- Informations TikTok (pour les clippers)
    tiktok_username VARCHAR(255),
    
    -- Informations de paiement
    stripe_customer_id VARCHAR(255),
    
    -- Métadonnées
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des campagnes
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    streamer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Critères de la campagne
    criteria JSONB DEFAULT '{}',
    
    -- Budget et tarification
    budget_total DECIMAL(10,2) NOT NULL,
    budget_remaining DECIMAL(10,2) NOT NULL,
    cpm_rate DECIMAL(10,2) NOT NULL,
    
    -- Statut
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des soumissions de clips
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    clipper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informations du clip
    tiktok_url VARCHAR(255) NOT NULL,
    views_count INTEGER DEFAULT 0,
    
    -- Statut et gains
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    earnings DECIMAL(10,2) DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paiements
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Informations du paiement
    amount DECIMAL(10,2) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
    
    -- Intégration Stripe
    stripe_payment_intent_id VARCHAR(255),
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_campaigns_streamer_id ON campaigns(streamer_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_submissions_campaign_id ON submissions(campaign_id);
CREATE INDEX idx_submissions_clipper_id ON submissions(clipper_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_submissions_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour users
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Anyone can create user during signup" ON users FOR INSERT WITH CHECK (true);

-- Politiques RLS pour campaigns
CREATE POLICY "Anyone can view active campaigns" ON campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Streamers can manage own campaigns" ON campaigns FOR ALL USING (auth.uid() = streamer_id);

-- Politiques RLS pour submissions
CREATE POLICY "Users can view own submissions" ON submissions FOR SELECT USING (auth.uid() = clipper_id);
CREATE POLICY "Streamers can view submissions for their campaigns" ON submissions FOR SELECT USING (
    auth.uid() IN (SELECT streamer_id FROM campaigns WHERE id = campaign_id)
);
CREATE POLICY "Clippers can create submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = clipper_id);
CREATE POLICY "Streamers can update submissions for their campaigns" ON submissions FOR UPDATE USING (
    auth.uid() IN (SELECT streamer_id FROM campaigns WHERE id = campaign_id)
);

-- Politiques RLS pour payments
CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own payments" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id); 