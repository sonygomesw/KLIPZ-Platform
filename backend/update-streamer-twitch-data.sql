-- Mettre à jour les données Twitch d'un streamer
-- Remplacez 'streamer_email@example.com' par l'email du streamer

UPDATE users 
SET 
  twitch_profile_image = 'https://static-cdn.jtvnw.net/jtv_user_pictures/asmongold-profile_image-f7ddcbd0332f5d28-300x300.png',
  twitch_display_name = 'Asmongold',
  twitch_username = 'asmongold',
  twitch_followers = 2500000
WHERE email = 'kai@gmail.com' AND role = 'streamer';

-- Vérifier la mise à jour
SELECT 
  id,
  email,
  twitch_profile_image,
  twitch_display_name,
  twitch_username,
  twitch_followers
FROM users 
WHERE email = 'kai@gmail.com' AND role = 'streamer'; 