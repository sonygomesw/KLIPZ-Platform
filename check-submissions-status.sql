-- Vérifier les statuts des soumissions
SELECT 
  s.id,
  s.campaign_id,
  s.clipper_id,
  s.tiktok_url,
  s.status,
  s.views,
  s.earnings,
  s.submitted_at,
  s.approved_at,
  c.title as campaign_title
FROM submissions s
LEFT JOIN campaigns c ON s.campaign_id = c.id
ORDER BY s.submitted_at DESC
LIMIT 10;

-- Compter les soumissions par statut
SELECT 
  status,
  COUNT(*) as count
FROM submissions
GROUP BY status
ORDER BY count DESC; 