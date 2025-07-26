-- Vérifier le statut réel de la déclaration
SELECT 
  id,
  clipper_id,
  tiktok_url,
  declared_views,
  earnings,
  status,
  created_at,
  CASE 
    WHEN status = 'pending' THEN '⏳ En attente'
    WHEN status = 'approved' THEN '✅ Approuvée'
    WHEN status = 'paid' THEN '💰 Payée'
    WHEN status = 'rejected' THEN '❌ Rejetée'
    WHEN status = 'draft' THEN '📝 Brouillon'
    ELSE '❓ Statut inconnu: ' || status
  END as statut_lisible
FROM declarations 
ORDER BY created_at DESC
LIMIT 5;

-- Voir les logs de modification (si on a des colonnes de timestamp)
SELECT 
  id,
  status,
  created_at,
  -- Si on a des colonnes de modification
  CASE 
    WHEN status = 'approved' THEN '✅ Dernièrement approuvée'
    WHEN status = 'pending' THEN '⏳ Toujours en attente'
    ELSE '❓ Statut: ' || status
  END as etat
FROM declarations 
WHERE status IN ('pending', 'approved')
ORDER BY created_at DESC; 