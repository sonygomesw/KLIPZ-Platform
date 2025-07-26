-- Script pour annuler la simulation Stripe
-- Remet l'état initial pour tester à nouveau

-- 1. Remettre le retrait en attente
UPDATE withdrawals 
SET 
  status = 'pending',
  processed_at = NULL
WHERE id = '0fd2ea74-592c-4679-9f95-87262e2bd6c4';

-- 2. Supprimer les logs de simulation
DELETE FROM payments 
WHERE user_id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
  AND stripe_payment_intent_id LIKE 'pi_simulated_%';

-- 3. Vérifier l'état après annulation
SELECT 
  'ÉTAT APRÈS ANNULATION' as info,
  w.id,
  w.user_id,
  w.amount,
  w.status,
  w.method,
  w.created_at,
  w.processed_at,
  CASE 
    WHEN w.status = 'pending' THEN '✅ Retour à l\'état initial'
    ELSE '❌ Annulation échouée'
  END as resultat_annulation
FROM withdrawals w
WHERE w.id = '0fd2ea74-592c-4679-9f95-87262e2bd6c4';

-- 4. Vérifier qu'il n'y a plus de logs de simulation
SELECT 
  'LOGS DE SIMULATION' as info,
  COUNT(*) as nombre_logs_simulation
FROM payments p
WHERE p.user_id = '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20'
  AND p.stripe_payment_intent_id LIKE 'pi_simulated_%'; 