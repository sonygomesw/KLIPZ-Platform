-- Lier les déclarations existantes aux soumissions via tiktok_url
UPDATE declarations 
SET submission_id = s.id
FROM submissions s
WHERE declarations.tiktok_url = s.tiktok_url
AND declarations.submission_id IS NULL;

-- Vérifier les liens créés
SELECT 
  d.id as declaration_id,
  d.tiktok_url,
  d.submission_id,
  s.id as submission_id_check,
  s.campaign_id,
  c.title as campaign_title
FROM declarations d
LEFT JOIN submissions s ON d.submission_id = s.id
LEFT JOIN campaigns c ON s.campaign_id = c.id
ORDER BY d.created_at DESC;

-- Statistiques après liaison
SELECT 
  'Déclarations liées' as type,
  COUNT(*) as nombre
FROM declarations 
WHERE submission_id IS NOT NULL
UNION ALL
SELECT 
  'Déclarations non liées' as type,
  COUNT(*) as nombre
FROM declarations 
WHERE submission_id IS NULL;

-- Voir les campagnes avec leurs soumissions et déclarations
SELECT 
  c.title as campagne,
  c.id as campaign_id,
  COUNT(DISTINCT s.id) as nombre_soumissions,
  COUNT(DISTINCT d.id) as nombre_declarations,
  SUM(d.declared_views) as total_vues,
  SUM(d.earnings) as total_gains
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
LEFT JOIN declarations d ON s.id = d.submission_id
GROUP BY c.id, c.title
ORDER BY c.created_at DESC; 