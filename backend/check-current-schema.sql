-- Vérifier la structure actuelle de la table users
-- À exécuter dans l'éditeur SQL de Supabase

-- Afficher toutes les colonnes de la table users
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default,
  ordinal_position
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Afficher les contraintes existantes
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'users'::regclass;

-- Afficher les index existants
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'users';

-- Afficher quelques exemples de données
SELECT 
  id,
  email,
  role,
  twitch_url,
  twitch_display_name,
  twitch_username,
  twitch_followers,
  twitch_profile_image,
  tiktok_username,
  balance,
  created_at
FROM users 
LIMIT 5; 