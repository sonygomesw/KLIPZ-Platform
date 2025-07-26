-- Vérifier toutes les tâches admin en attente
-- Pour l'admin sonygomes.97@gmail.com

-- 1. Déclarations en attente de validation
SELECT 
  'DÉCLARATIONS EN ATTENTE' as info,
  d.id,
  d.clipper_id,
  u.email as clipper_email,
  d.tiktok_url,
  d.declared_views,
  d.earnings,
  d.status,
  d.created_at,
  CASE 
    WHEN d.status = 'pending' THEN '⏳ En attente de validation admin'
    WHEN d.status = 'approved' THEN '✅ Validée par admin'
    WHEN d.status = 'rejected' THEN '❌ Rejetée par admin'
    WHEN d.status = 'paid' THEN '💰 Payée'
    ELSE d.status
  END as statut_lisible
FROM declarations d
JOIN users u ON d.clipper_id = u.id
WHERE d.status = 'pending'
ORDER BY d.created_at DESC;

-- 2. Retraits en attente de traitement
SELECT 
  'RETRAITS EN ATTENTE' as info,
  w.id,
  w.user_id,
  u.email as user_email,
  w.amount,
  w.status,
  w.method,
  w.created_at,
  w.processed_at,
  CASE 
    WHEN w.status = 'pending' THEN '⏳ En attente de traitement admin'
    WHEN w.status = 'processing' THEN '🔄 En cours de traitement'
    WHEN w.status = 'completed' THEN '✅ Traité'
    WHEN w.status = 'failed' THEN '❌ Échoué'
    ELSE w.status
  END as statut_lisible
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.status IN ('pending', 'processing')
ORDER BY w.created_at DESC;

-- 3. Comptes bancaires configurés pour les retraits
SELECT 
  'COMPTES BANCAIRES' as info,
  ba.id,
  ba.user_id,
  u.email as user_email,
  ba.account_holder_name,
  ba.iban,
  ba.bank_name,
  ba.is_primary,
  ba.is_verified,
  ba.created_at
FROM bank_accounts ba
JOIN users u ON ba.user_id = u.id
ORDER BY ba.created_at DESC;

-- 4. Résumé des actions admin nécessaires
SELECT 
  'RÉSUMÉ ADMIN' as info,
  (SELECT COUNT(*) FROM declarations WHERE status = 'pending') as declarations_en_attente,
  (SELECT COUNT(*) FROM withdrawals WHERE status IN ('pending', 'processing')) as retraits_en_attente,
  (SELECT COUNT(*) FROM bank_accounts) as comptes_bancaires_configures,
  (SELECT COUNT(*) FROM users WHERE role = 'clipper') as total_clippers,
  (SELECT COUNT(*) FROM users WHERE role = 'streamer') as total_streamers; 