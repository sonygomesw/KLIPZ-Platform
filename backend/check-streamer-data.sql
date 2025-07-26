-- Vérifier les données Twitch des streamers
SELECT 
  id,
  email,
  role,
  twitch_url,
  twitch_profile_image,
  twitch_display_name,
  twitch_followers,
  created_at
FROM users 
WHERE role = 'streamer'
ORDER BY created_at DESC 
LIMIT 5;

-- Vérifier les campagnes avec les données du streamer
SELECT 
  c.id,
  c.title,
  c.streamer_id,
  u.email as streamer_email,
  u.twitch_profile_image,
  u.twitch_display_name,
  u.twitch_followers
FROM campaigns c
JOIN users u ON c.streamer_id = u.id
WHERE c.status = 'active'
ORDER BY c.created_at DESC 
LIMIT 5; 