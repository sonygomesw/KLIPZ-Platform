-- Supprimer toutes les déclarations existantes
DELETE FROM declarations;

-- Vérifier que toutes les déclarations ont été supprimées
SELECT 
  'APRÈS SUPPRESSION' as periode,
  COUNT(*) as nombre_declarations
FROM declarations;

-- Vérifier l'état des soumissions (elles doivent rester)
SELECT 
  'Soumissions restantes' as type,
  COUNT(*) as nombre
FROM submissions
WHERE campaign_id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
UNION ALL
SELECT 
  'Campagnes' as type,
  COUNT(*) as nombre
FROM campaigns;

-- Voir les soumissions disponibles pour de nouvelles déclarations
SELECT 
  s.id as submission_id,
  s.tiktok_url,
  s.status as submission_status,
  s.created_at as submission_date,
  u.email as clipper_email,
  c.title as campaign_title
FROM submissions s
LEFT JOIN users u ON s.clipper_id = u.id
LEFT JOIN campaigns c ON s.campaign_id = c.id
WHERE s.campaign_id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
ORDER BY s.created_at DESC;

-- Statistiques finales
SELECT 
  c.title as campagne,
  COUNT(s.id) as nombre_soumissions,
  0 as nombre_declarations,
  0 as total_vues,
  0 as total_gains
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
WHERE c.id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
GROUP BY c.id, c.title; 