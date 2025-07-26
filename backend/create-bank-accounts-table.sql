-- Table pour stocker les informations bancaires des clippers
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    iban TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    bank_name TEXT,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Contrainte pour s'assurer qu'un utilisateur n'a qu'un seul compte principal
    CONSTRAINT unique_primary_account UNIQUE (user_id, is_primary)
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_primary ON bank_accounts(user_id, is_primary);

-- RLS (Row Level Security)
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON bank_accounts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts" ON bank_accounts
    FOR DELETE USING (auth.uid() = user_id);

-- Fonction pour valider l'IBAN (format basique)
CREATE OR REPLACE FUNCTION validate_iban(iban TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Vérification basique du format IBAN (FR76, BE32, etc.)
    RETURN iban ~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{4}[0-9]{7}([A-Z0-9]?){0,16}$';
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_bank_accounts_updated_at
    BEFORE UPDATE ON bank_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Vérifier que la table a été créée
SELECT 'Table bank_accounts créée avec succès' as status; 