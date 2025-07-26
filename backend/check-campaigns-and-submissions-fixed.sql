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

-- Vérifier toutes les déclarations (sans submission_id)
SELECT 
  id,
  clipper_id,
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

-- Voir les soumissions par campagne (sans lien direct avec déclarations)
SELECT 
  c.title as campagne,
  c.id as campaign_id,
  COUNT(s.id) as nombre_soumissions
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
GROUP BY c.id, c.title
ORDER BY c.created_at DESC;

-- Voir les déclarations par clipper
SELECT 
  d.clipper_id,
  COUNT(d.id) as nombre_declarations,
  SUM(d.declared_views) as total_vues,
  SUM(d.earnings) as total_gains
FROM declarations d
GROUP BY d.clipper_id
ORDER BY total_gains DESC; 