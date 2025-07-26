-- Script de correction pour la synchronisation des soldes KLIPZ
-- À exécuter dans Supabase SQL Editor

-- 1. Ajouter la colonne balance à la table users si elle n'existe pas
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- 2. Créer la table wallets si elle n'existe pas
CREATE TABLE IF NOT EXISTS wallets (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00 NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer des politiques RLS pour la table wallets
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Users can view their own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallets;
DROP POLICY IF EXISTS "Users can insert their own wallet" ON wallets;

-- Créer les nouvelles politiques
CREATE POLICY "Users can view their own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Créer une fonction pour obtenir ou créer un wallet
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

-- 5. Créer une fonction pour ajouter du solde (synchronise les deux tables)
CREATE OR REPLACE FUNCTION add_balance(user_uuid UUID, amount DECIMAL(10,2))
RETURNS wallets AS $$
DECLARE
    wallet_record wallets;
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

-- 6. Créer une fonction pour déduire du solde (synchronise les deux tables)
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

-- 7. Créer une fonction pour synchroniser les soldes existants
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

-- 8. Exécuter la synchronisation initiale
SELECT sync_existing_balances();

-- 9. Créer un trigger pour synchroniser automatiquement les soldes
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

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS sync_balance_trigger ON wallets;

-- Créer le nouveau trigger
CREATE TRIGGER sync_balance_trigger
    AFTER UPDATE ON wallets
    FOR EACH ROW
    EXECUTE FUNCTION sync_balance_on_wallet_update();

-- 10. Vérifier la synchronisation
SELECT 
    u.id,
    u.email,
    u.balance as user_balance,
    w.balance as wallet_balance,
    CASE 
        WHEN u.balance = w.balance THEN '✅ Synchronisé'
        ELSE '❌ Non synchronisé'
    END as status
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
ORDER BY u.created_at DESC; 

-- Script pour synchroniser le solde utilisateur avec les gains des déclarations
-- Ce script résout le problème "Solde insuffisant" lors des retraits

-- 1. Voir l'état actuel des soldes vs gains déclarés
SELECT 
  u.id,
  u.email,
  u.balance as solde_actuel,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  COALESCE(SUM(d.earnings), 0) - u.balance as difference
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
WHERE u.role = 'clipper'
GROUP BY u.id, u.email, u.balance
ORDER BY difference DESC;

-- 2. Mettre à jour le solde utilisateur avec les gains des déclarations
UPDATE users 
SET balance = (
  SELECT COALESCE(SUM(earnings), 0)
  FROM declarations 
  WHERE clipper_id = users.id
)
WHERE role = 'clipper';

-- 3. Vérifier que la synchronisation a fonctionné
SELECT 
  u.id,
  u.email,
  u.balance as nouveau_solde,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  u.balance - COALESCE(SUM(d.earnings), 0) as difference
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
WHERE u.role = 'clipper'
GROUP BY u.id, u.email, u.balance
ORDER BY u.balance DESC;

-- 4. Voir les déclarations qui contribuent aux gains
SELECT 
  d.clipper_id,
  u.email,
  d.tiktok_url,
  d.declared_views,
  d.earnings,
  d.status,
  d.created_at
FROM declarations d
JOIN users u ON d.clipper_id = u.id
WHERE d.earnings > 0
ORDER BY d.earnings DESC; 