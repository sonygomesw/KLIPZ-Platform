-- Vérifier les détails des 2 retraits en attente
-- Pour traitement admin

-- 1. Détails des retraits en attente
SELECT 
  'DÉTAILS RETRAITS EN ATTENTE' as info,
  w.id,
  w.user_id,
  u.email as user_email,
  u.role as user_role,
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

-- 2. Compte bancaire associé aux retraits
SELECT 
  'COMPTE BANCAIRE POUR RETRAITS' as info,
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
WHERE ba.user_id IN (
  SELECT DISTINCT user_id 
  FROM withdrawals 
  WHERE status IN ('pending', 'processing')
);

-- 3. Solde actuel des utilisateurs avec retraits en attente
SELECT 
  'SOLDE UTILISATEURS' as info,
  u.id,
  u.email,
  u.role,
  u.balance as solde_actuel,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  COALESCE(SUM(w.amount), 0) as retraits_demandes,
  COALESCE(SUM(CASE WHEN w.status = 'completed' THEN w.amount ELSE 0 END), 0) as retraits_effectues
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
LEFT JOIN withdrawals w ON u.id = w.user_id
WHERE u.id IN (
  SELECT DISTINCT user_id 
  FROM withdrawals 
  WHERE status IN ('pending', 'processing')
)
GROUP BY u.id, u.email, u.role, u.balance; 