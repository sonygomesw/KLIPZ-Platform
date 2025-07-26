-- Script pour vérifier les transferts Stripe
-- Vérifier si des virements ont été effectués via Stripe

-- 1. Vérifier les demandes de retrait
SELECT 
  'DEMANDES DE RETRAIT' as info,
  w.id,
  w.user_id,
  u.email,
  w.amount,
  w.status,
  w.method,
  w.created_at,
  w.processed_at
FROM withdrawals w
JOIN users u ON w.user_id = u.id
WHERE w.user_id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
ORDER BY w.created_at DESC;

-- 2. Vérifier les paiements Stripe
SELECT 
  'PAIEMENTS STRIPE' as info,
  p.id,
  p.user_id,
  u.email,
  p.amount,
  p.type,
  p.status,
  p.stripe_payment_intent_id,
  p.created_at
FROM payments p
JOIN users u ON p.user_id = u.id
WHERE p.user_id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
  AND p.type = 'withdrawal'
ORDER BY p.created_at DESC;

-- 3. Vérifier les comptes bancaires configurés
SELECT 
  'COMPTES BANCAIRES' as info,
  ba.id,
  ba.user_id,
  u.email,
  ba.account_holder_name,
  ba.iban,
  ba.bank_name,
  ba.is_primary,
  ba.is_verified,
  ba.created_at
FROM bank_accounts ba
JOIN users u ON ba.user_id = u.id
WHERE ba.user_id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
ORDER BY ba.created_at DESC;

-- 4. Vérifier l'historique des soldes
SELECT 
  'HISTORIQUE DES SOLDES' as info,
  u.id,
  u.email,
  u.balance as solde_actuel,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  COALESCE(SUM(w.amount), 0) as retraits_demandes,
  COALESCE(SUM(CASE WHEN w.status = 'completed' THEN w.amount ELSE 0 END), 0) as retraits_effectues
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
LEFT JOIN withdrawals w ON u.id = w.user_id
WHERE u.id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
GROUP BY u.id, u.email, u.balance; 