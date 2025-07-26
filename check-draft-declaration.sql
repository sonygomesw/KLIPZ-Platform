-- Voir le détail de la déclaration en statut 'draft'
SELECT 
  id,
  clipper_id,
  tiktok_url,
  declared_views,
  earnings,
  status,
  verification_code,
  created_at,
  CASE 
    WHEN status = 'draft' THEN '📝 Déclaration en cours (pas encore finalisée)'
    WHEN status = 'pending' THEN '⏳ En attente d''approbation admin'
    WHEN status = 'approved' THEN '✅ Approuvée par admin'
    WHEN status = 'paid' THEN '💰 Payée'
    WHEN status = 'rejected' THEN '❌ Rejetée'
    ELSE '❓ Statut inconnu'
  END as description
FROM declarations 
WHERE status = 'draft'
ORDER BY created_at DESC;

-- Voir tous les statuts possibles
SELECT DISTINCT status FROM declarations ORDER BY status;

-- Statistiques complètes
SELECT 
  status,
  COUNT(*) as nombre,
  SUM(declared_views) as total_vues,
  SUM(earnings) as total_gains,
  AVG(declared_views) as moyenne_vues
FROM declarations 
GROUP BY status
ORDER BY nombre DESC; 