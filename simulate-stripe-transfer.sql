-- Script de simulation du virement Stripe
-- Ce script simule le processus complet de virement

-- 1. Vérifier l'état actuel
SELECT 
  'ÉTAT ACTUEL' as info,
  w.id,
  w.user_id,
  w.amount,
  w.status,
  w.method,
  w.created_at,
  w.processed_at
FROM withdrawals w
WHERE w.id = '0fd2ea74-592c-4679-9f95-87262e2bd6c4';

-- 2. Simuler le traitement du virement (changer le statut)
UPDATE withdrawals 
SET 
  status = 'completed',
  processed_at = NOW()
WHERE id = '0fd2ea74-592c-4679-9f95-87262e2bd6c4';

-- 3. Vérifier que le changement a été appliqué
SELECT 
  'APRÈS SIMULATION' as info,
  w.id,
  w.user_id,
  w.amount,
  w.status,
  w.method,
  w.created_at,
  w.processed_at,
  CASE 
    WHEN w.status = 'completed' THEN '✅ Virement simulé avec succès'
    ELSE '❌ Simulation échouée'
  END as resultat_simulation
FROM withdrawals w
WHERE w.id = '0fd2ea74-592c-4679-9f95-87262e2bd6c4';

-- 4. Vérifier l'état du solde utilisateur
SELECT 
  'SOLDE UTILISATEUR' as info,
  u.id,
  u.email,
  u.balance as solde_actuel,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  COALESCE(SUM(w.amount), 0) as retraits_demandes,
  COALESCE(SUM(CASE WHEN w.status = 'completed' THEN w.amount ELSE 0 END), 0) as retraits_effectues,
  CASE 
    WHEN u.balance = 0 AND COALESCE(SUM(CASE WHEN w.status = 'completed' THEN w.amount ELSE 0 END), 0) > 0 
    THEN '✅ Solde correct (virement effectué)'
    ELSE '❌ Problème de synchronisation'
  END as statut_solde
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
LEFT JOIN withdrawals w ON u.id = w.user_id
WHERE u.id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
GROUP BY u.id, u.email, u.balance;

-- 5. Créer un log de simulation
INSERT INTO payments (
  user_id,
  amount,
  type,
  status,
  stripe_payment_intent_id,
  created_at
) VALUES (
  '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20',
  3000.00,
  'withdrawal',
  'completed',
  'pi_simulated_' || gen_random_uuid()::text,
  NOW()
);

-- 6. Vérifier le log de paiement
SELECT 
  'LOG DE PAIEMENT SIMULÉ' as info,
  p.id,
  p.user_id,
  p.amount,
  p.type,
  p.status,
  p.stripe_payment_intent_id,
  p.created_at
FROM payments p
WHERE p.user_id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
  AND p.type = 'withdrawal'
  AND p.stripe_payment_intent_id LIKE 'pi_simulated_%'
ORDER BY p.created_at DESC
LIMIT 1; 