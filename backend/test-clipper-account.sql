-- Nettoyer les anciens comptes de test
DELETE FROM users WHERE email LIKE '%@gmail.clipper%';

-- Vérifier les comptes restants
SELECT 
  id,
  email,
  role,
  tiktok_username,
  twitch_url,
  created_at
FROM users 
ORDER BY created_at DESC 
LIMIT 5; 