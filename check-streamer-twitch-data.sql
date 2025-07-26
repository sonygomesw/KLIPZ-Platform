-- Vérifier les données Twitch du streamer qui a créé la campagne
SELECT 
  c.id as campaign_id,
  c.title,
  c.streamer_id,
  u.email,
  u.twitch_username,
  u.twitch_display_name,
  u.twitch_profile_image,
  u.twitch_followers,
  u.role
FROM campaigns c
JOIN users u ON c.streamer_id = u.id
WHERE c.id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'; 