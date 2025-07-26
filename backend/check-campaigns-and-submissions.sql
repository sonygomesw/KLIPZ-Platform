-- Vérifier toutes les campagnes
SELECT 
  id,
  title,
  description,
  budget,
  cpm,
  status,
  created_at,
  streamer_id
FROM campaigns 
ORDER BY created_at DESC;

-- Vérifier toutes les soumissions
SELECT 
  id,
  campaign_id,
  clipper_id,
  tiktok_url,
  status,
  created_at
FROM submissions 
ORDER BY created_at DESC;

-- Vérifier toutes les déclarations
SELECT 
  id,
  clipper_id,
  submission_id,
  tiktok_url,
  declared_views,
  earnings,
  status,
  created_at
FROM declarations 
ORDER BY created_at DESC;

-- Statistiques complètes
SELECT 
  'Campagnes' as type,
  COUNT(*) as nombre
FROM campaigns
UNION ALL
SELECT 
  'Soumissions' as type,
  COUNT(*) as nombre
FROM submissions
UNION ALL
SELECT 
  'Déclarations' as type,
  COUNT(*) as nombre
FROM declarations;

-- Voir les soumissions par campagne
SELECT 
  c.title as campagne,
  c.id as campaign_id,
  COUNT(s.id) as nombre_soumissions,
  COUNT(d.id) as nombre_declarations
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
LEFT JOIN declarations d ON s.id = d.submission_id
GROUP BY c.id, c.title
ORDER BY c.created_at DESC; 