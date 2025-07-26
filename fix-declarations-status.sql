-- Corriger les statuts des déclarations existantes
-- Mettre toutes les déclarations non-payées en statut 'pending'

UPDATE declarations 
SET status = 'pending' 
WHERE status = 'approved' 
AND paid_views = 0;

-- Vérifier les statuts après correction
SELECT 
  status,
  COUNT(*) as count,
  SUM(declared_views) as total_views,
  SUM(earnings) as total_earnings
FROM declarations 
GROUP BY status
ORDER BY count DESC;

-- Voir les déclarations récentes
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
LIMIT 5; 