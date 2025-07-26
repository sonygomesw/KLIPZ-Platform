-- Vérifier l'état actuel des déclarations
SELECT 
  status,
  COUNT(*) as nombre_declarations,
  SUM(declared_views) as total_vues,
  SUM(earnings) as total_gains
FROM declarations 
GROUP BY status
ORDER BY nombre_declarations DESC;

-- Voir toutes les déclarations avec leurs détails
SELECT 
  id,
  clipper_id,
  tiktok_url,
  declared_views,
  earnings,
  status,
  created_at,
  CASE 
    WHEN status = 'approved' THEN '⚠️ INCORRECT - Doit être pending'
    WHEN status = 'pending' THEN '✅ CORRECT'
    WHEN status = 'paid' THEN '💰 Déjà payé'
    WHEN status = 'rejected' THEN '❌ Rejeté'
    ELSE '❓ Statut inconnu'
  END as commentaire
FROM declarations 
ORDER BY created_at DESC;

-- Corriger toutes les déclarations non-payées en 'pending'
UPDATE declarations 
SET status = 'pending' 
WHERE status = 'approved' 
AND (paid_views = 0 OR paid_views IS NULL);

-- Vérifier après correction
SELECT 
  'APRÈS CORRECTION' as periode,
  status,
  COUNT(*) as nombre_declarations
FROM declarations 
GROUP BY status
ORDER BY nombre_declarations DESC; 