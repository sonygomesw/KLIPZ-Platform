-- Ajouter les colonnes TikTok à la table users
-- Ce script ajoute toutes les colonnes nécessaires pour stocker les données TikTok des utilisateurs

-- Colonnes pour l'authentification TikTok
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_open_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_union_id VARCHAR(255);

-- Colonnes pour les informations de profil TikTok
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_bio_description TEXT;

-- Colonnes pour les statistiques TikTok
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_likes_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_video_count INTEGER DEFAULT 0;

-- Colonnes pour les informations supplémentaires TikTok
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_profile_deep_link TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_follower_status INTEGER DEFAULT 0;

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_tiktok_open_id ON users(tiktok_open_id);
CREATE INDEX IF NOT EXISTS idx_users_tiktok_username ON users(tiktok_username);
CREATE INDEX IF NOT EXISTS idx_users_tiktok_follower_count ON users(tiktok_follower_count);

-- Ajouter des contraintes pour assurer l'intégrité des données
-- Note: PostgreSQL ne supporte pas IF NOT EXISTS pour ADD CONSTRAINT
-- Ces contraintes seront ajoutées seulement si elles n'existent pas déjà

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_tiktok_follower_count' 
                   AND table_name = 'users') THEN
        ALTER TABLE users ADD CONSTRAINT check_tiktok_follower_count 
          CHECK (tiktok_follower_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_tiktok_following_count' 
                   AND table_name = 'users') THEN
        ALTER TABLE users ADD CONSTRAINT check_tiktok_following_count 
          CHECK (tiktok_following_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_tiktok_likes_count' 
                   AND table_name = 'users') THEN
        ALTER TABLE users ADD CONSTRAINT check_tiktok_likes_count 
          CHECK (tiktok_likes_count >= 0);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_tiktok_video_count' 
                   AND table_name = 'users') THEN
        ALTER TABLE users ADD CONSTRAINT check_tiktok_video_count 
          CHECK (tiktok_video_count >= 0);
    END IF;
END $$;

-- Commentaires pour documenter les nouvelles colonnes
COMMENT ON COLUMN users.tiktok_open_id IS 'TikTok Open ID unique de l''utilisateur';
COMMENT ON COLUMN users.tiktok_union_id IS 'TikTok Union ID (optionnel)';
COMMENT ON COLUMN users.tiktok_username IS 'Nom d''utilisateur TikTok';
COMMENT ON COLUMN users.tiktok_nickname IS 'Nom d''affichage TikTok';
COMMENT ON COLUMN users.tiktok_avatar_url IS 'URL de l''avatar TikTok';
COMMENT ON COLUMN users.tiktok_bio_description IS 'Description de la bio TikTok';
COMMENT ON COLUMN users.tiktok_follower_count IS 'Nombre d''abonnés TikTok';
COMMENT ON COLUMN users.tiktok_following_count IS 'Nombre de comptes suivis sur TikTok';
COMMENT ON COLUMN users.tiktok_likes_count IS 'Nombre total de likes reçus sur TikTok';
COMMENT ON COLUMN users.tiktok_video_count IS 'Nombre de vidéos publiées sur TikTok';
COMMENT ON COLUMN users.tiktok_profile_deep_link IS 'Lien profond vers le profil TikTok';
COMMENT ON COLUMN users.tiktok_is_verified IS 'Compte TikTok vérifié ou non';
COMMENT ON COLUMN users.tiktok_follower_status IS 'Statut des abonnés TikTok';

-- Vérifier que les colonnes ont été ajoutées
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name LIKE 'tiktok_%'
ORDER BY column_name; 