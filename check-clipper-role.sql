-- Script pour vérifier les rôles des utilisateurs
SELECT 
  id,
  email,
  role,
  tiktok_username,
  twitch_url,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 10; 