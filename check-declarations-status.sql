-- Vérifier les statuts des déclarations
SELECT 
  status,
  COUNT(*) as count,
  SUM(declared_views) as total_views,
  SUM(earnings) as total_earnings
FROM declarations 
GROUP BY status
ORDER BY count DESC;

-- Voir toutes les déclarations avec leurs détails
SELECT 
  id,
  clipper_id,
  tiktok_url,
  declared_views,
  earnings,
  status,
  created_at
FROM declarations 
ORDER BY created_at DESC
LIMIT 10; 