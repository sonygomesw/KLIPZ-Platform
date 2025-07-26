-- Script de configuration de la base de données pour Stripe Connect Express
-- À exécuter dans le dashboard Supabase SQL Editor

-- 1. Ajouter la colonne stripe_account_id à la table users si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'stripe_account_id'
    ) THEN
        ALTER TABLE users ADD COLUMN stripe_account_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_users_stripe_account_id ON users(stripe_account_id);
    END IF;
END $$;

-- 2. Créer la table withdrawals si elle n'existe pas
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
    method VARCHAR(50), -- ex: 'stripe_connect', 'paypal', 'virement', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON withdrawals(created_at);

-- 3. Créer la table declarations si elle n'existe pas
CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clipper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tiktok_url TEXT NOT NULL,
    declared_views INTEGER NOT NULL,
    verification_code TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
    paid_views INTEGER DEFAULT 0,
    earnings FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_declarations_clipper_id ON declarations(clipper_id);
CREATE INDEX IF NOT EXISTS idx_declarations_tiktok_url ON declarations(tiktok_url);
CREATE INDEX IF NOT EXISTS idx_declarations_status ON declarations(status);

-- 4. Configurer les politiques RLS pour withdrawals
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs voient leurs propres retraits
CREATE POLICY "Users can view own withdrawals" ON withdrawals 
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs créent leurs propres retraits
CREATE POLICY "Users can create own withdrawals" ON withdrawals 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour que les admins voient tous les retraits
CREATE POLICY "Admins can view all withdrawals" ON withdrawals 
    FOR SELECT USING (true);

-- Politique pour que les admins mettent à jour tous les retraits
CREATE POLICY "Admins can update all withdrawals" ON withdrawals 
    FOR UPDATE USING (true);

-- 5. Configurer les politiques RLS pour declarations
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;

-- Politique pour que les clippers voient leurs propres déclarations
CREATE POLICY "Clippers can view own declarations" ON declarations 
    FOR SELECT USING (auth.uid() = clipper_id);

-- Politique pour que les clippers créent leurs propres déclarations
CREATE POLICY "Clippers can create own declarations" ON declarations 
    FOR INSERT WITH CHECK (auth.uid() = clipper_id);

-- Politique pour que les admins voient toutes les déclarations
CREATE POLICY "Admins can view all declarations" ON declarations 
    FOR SELECT USING (true);

-- Politique pour que les admins mettent à jour toutes les déclarations
CREATE POLICY "Admins can update all declarations" ON declarations 
    FOR UPDATE USING (true);

-- 6. Vérifier que la colonne balance existe dans users
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'balance'
    ) THEN
        ALTER TABLE users ADD COLUMN balance DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- 7. Créer une fonction pour mettre à jour le solde de manière sécurisée
CREATE OR REPLACE FUNCTION update_user_balance(
    user_uuid UUID,
    amount_change DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    new_balance DECIMAL(10,2);
BEGIN
    UPDATE users 
    SET balance = COALESCE(balance, 0) + amount_change
    WHERE id = user_uuid
    RETURNING balance INTO new_balance;
    
    RETURN COALESCE(new_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer une vue pour les statistiques de retraits
CREATE OR REPLACE VIEW withdrawal_stats AS
SELECT 
    user_id,
    COUNT(*) as total_withdrawals,
    SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_completed,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
    MAX(created_at) as last_withdrawal_date
FROM withdrawals
GROUP BY user_id;

-- 9. Créer une vue pour les statistiques de déclarations
CREATE OR REPLACE VIEW declaration_stats AS
SELECT 
    clipper_id,
    COUNT(*) as total_declarations,
    SUM(declared_views) as total_declared_views,
    SUM(paid_views) as total_paid_views,
    SUM(earnings) as total_earnings,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_declarations
FROM declarations
GROUP BY clipper_id;

-- Message de confirmation
SELECT 'Configuration de la base de données terminée avec succès !' as status; 