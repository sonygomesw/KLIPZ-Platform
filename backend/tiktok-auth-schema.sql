-- Ajout des colonnes TikTok pour l'authentification OAuth
-- À exécuter dans Supabase SQL Editor

-- Ajouter les colonnes TikTok à la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tiktok_username VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_display_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_profile_image TEXT,
ADD COLUMN IF NOT EXISTS tiktok_open_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS tiktok_followers INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS tiktok_access_token TEXT,
ADD COLUMN IF NOT EXISTS tiktok_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS tiktok_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Créer des index pour optimiser les requêtes TikTok
CREATE INDEX IF NOT EXISTS idx_users_tiktok_username ON users(tiktok_username);
CREATE INDEX IF NOT EXISTS idx_users_tiktok_open_id ON users(tiktok_open_id);

-- Ajouter une contrainte unique sur tiktok_open_id
ALTER TABLE users 
ADD CONSTRAINT unique_tiktok_open_id UNIQUE (tiktok_open_id);

-- Fonction pour mettre à jour les infos TikTok
CREATE OR REPLACE FUNCTION update_tiktok_info(
  user_id UUID,
  tiktok_username VARCHAR(255),
  tiktok_display_name VARCHAR(255),
  tiktok_profile_image TEXT,
  tiktok_open_id VARCHAR(255),
  tiktok_followers INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET 
    tiktok_username = update_tiktok_info.tiktok_username,
    tiktok_display_name = update_tiktok_info.tiktok_display_name,
    tiktok_profile_image = update_tiktok_info.tiktok_profile_image,
    tiktok_open_id = update_tiktok_info.tiktok_open_id,
    tiktok_followers = update_tiktok_info.tiktok_followers,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Politique RLS pour les infos TikTok
CREATE POLICY "Users can update own TikTok info" ON users 
FOR UPDATE USING (auth.uid() = id);

-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'tiktok_%'
ORDER BY column_name; 