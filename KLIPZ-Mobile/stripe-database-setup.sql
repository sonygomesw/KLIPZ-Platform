-- Configuration Stripe pour KLIPZ
-- Tables et colonnes nécessaires pour le système de paiement

-- 1. Ajouter la colonne stripe_account_id à la table users existante
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

-- 2. Ajouter la colonne balance à la table users si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- 3. Créer la table wallets pour gérer les soldes
CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Créer des politiques RLS pour la table wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leur propre wallet
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leur propre wallet
CREATE POLICY "Users can update their own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leur propre wallet
CREATE POLICY "Users can insert their own wallet" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Créer une fonction pour obtenir ou créer un wallet
CREATE OR REPLACE FUNCTION get_or_create_wallet(user_uuid UUID)
RETURNS wallets AS $$
DECLARE
    wallet_record wallets;
BEGIN
    -- Essayer de récupérer le wallet existant
    SELECT * INTO wallet_record FROM wallets WHERE user_id = user_uuid;
    
    -- Si pas de wallet, en créer un
    IF NOT FOUND THEN
        INSERT INTO wallets (user_id, balance) 
        VALUES (user_uuid, 0.00)
        RETURNING * INTO wallet_record;
    END IF;
    
    RETURN wallet_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Créer une fonction pour ajouter du solde (synchronise les deux tables)
CREATE OR REPLACE FUNCTION add_balance(user_uuid UUID, amount DECIMAL(10,2))
RETURNS wallets AS $$
DECLARE
    wallet_record wallets;
    current_balance DECIMAL(10,2);
BEGIN
    -- Obtenir ou créer le wallet
    SELECT * INTO wallet_record FROM get_or_create_wallet(user_uuid);
    
    -- Mettre à jour le solde dans la table wallets
    UPDATE wallets 
    SET balance = balance + amount 
    WHERE user_id = user_uuid
    RETURNING * INTO wallet_record;
    
    -- Synchroniser avec la table users
    UPDATE users 
    SET balance = wallet_record.balance 
    WHERE id = user_uuid;
    
    RETURN wallet_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Créer une fonction pour déduire du solde (synchronise les deux tables)
CREATE OR REPLACE FUNCTION deduct_balance(user_uuid UUID, amount DECIMAL(10,2))
RETURNS wallets AS $$
DECLARE
    wallet_record wallets;
BEGIN
    -- Vérifier que l'utilisateur a assez de solde
    SELECT * INTO wallet_record FROM wallets WHERE user_id = user_uuid;
    
    IF NOT FOUND OR wallet_record.balance < amount THEN
        RAISE EXCEPTION 'Solde insuffisant';
    END IF;
    
    -- Déduire le montant dans la table wallets
    UPDATE wallets 
    SET balance = balance - amount 
    WHERE user_id = user_uuid
    RETURNING * INTO wallet_record;
    
    -- Synchroniser avec la table users
    UPDATE users 
    SET balance = wallet_record.balance 
    WHERE id = user_uuid;
    
    RETURN wallet_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 

-- 9. Créer une fonction pour synchroniser les soldes existants
CREATE OR REPLACE FUNCTION sync_existing_balances()
RETURNS void AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Pour chaque utilisateur, créer un wallet s'il n'existe pas
    FOR user_record IN SELECT id, balance FROM users LOOP
        -- Insérer ou mettre à jour le wallet
        INSERT INTO wallets (user_id, balance) 
        VALUES (user_record.id, user_record.balance)
        ON CONFLICT (user_id) 
        DO UPDATE SET balance = user_record.balance;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Exécuter la synchronisation initiale
SELECT sync_existing_balances();

-- 11. Créer un trigger pour synchroniser automatiquement les soldes
CREATE OR REPLACE FUNCTION sync_balance_on_wallet_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour le solde dans la table users quand le wallet change
    UPDATE users 
    SET balance = NEW.balance 
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_balance_trigger
    AFTER UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION sync_balance_on_wallet_update(); 