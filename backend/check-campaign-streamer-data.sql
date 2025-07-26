-- Vérifier les campagnes récentes avec les données du streamer
SELECT 
  c.id as campaign_id,
  c.title,
  c.created_at as campaign_created,
  c.streamer_id,
  u.email as streamer_email,
  u.role as streamer_role,
  u.twitch_url,
  u.twitch_profile_image,
  u.twitch_display_name,
  u.twitch_username,
  u.twitch_followers
FROM campaigns c
JOIN users u ON c.streamer_id = u.id
WHERE c.status = 'active'
ORDER BY c.created_at DESC 
LIMIT 5;

-- Vérifier tous les streamers et leurs données Twitch
SELECT 
  id,
  email,
  role,
  twitch_url,
  twitch_profile_image,
  twitch_display_name,
  twitch_username,
  twitch_followers,
  created_at
FROM users 
WHERE role = 'streamer'
ORDER BY created_at DESC 
LIMIT 10; 