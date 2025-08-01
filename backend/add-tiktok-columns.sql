-- Ajouter les colonnes TikTok à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_open_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_union_id VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_username VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_nickname VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_follower_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_following_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_likes_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_video_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_bio_description TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_profile_deep_link TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_is_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS tiktok_follower_status INTEGER DEFAULT 0;

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_users_tiktok_open_id ON users(tiktok_open_id);
CREATE INDEX IF NOT EXISTS idx_users_tiktok_username ON users(tiktok_username);

-- Vérifier la structure mise à jour
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name LIKE 'tiktok_%'
ORDER BY ordinal_position; 