-- Mettre à jour le nombre de followers du streamer KaiCenat
UPDATE users 
SET twitch_followers = 8500000
WHERE email = 'kai@gmail.com' AND role = 'streamer';

-- Vérifier la mise à jour
SELECT 
  email,
  twitch_display_name,
  twitch_followers,
  twitch_profile_image
FROM users 
WHERE email = 'kai@gmail.com' AND role = 'streamer'; 