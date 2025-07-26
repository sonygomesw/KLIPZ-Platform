-- Script pour vérifier et corriger le problème de solde immédiatement
-- À exécuter dans Supabase SQL Editor

-- 1. Voir l'état actuel du problème
SELECT 
  'PROBLÈME IDENTIFIÉ' as info,
  u.id,
  u.email,
  u.balance as solde_actuel,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  COALESCE(SUM(d.earnings), 0) - u.balance as difference
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
WHERE u.role = 'clipper'
GROUP BY u.id, u.email, u.balance
HAVING COALESCE(SUM(d.earnings), 0) > u.balance
ORDER BY difference DESC;

-- 2. Corriger le solde pour tous les clippers
UPDATE users 
SET balance = (
  SELECT COALESCE(SUM(earnings), 0)
  FROM declarations 
  WHERE clipper_id = users.id
)
WHERE role = 'clipper';

-- 3. Vérifier que la correction a fonctionné
SELECT 
  'CORRECTION APPLIQUÉE' as info,
  u.id,
  u.email,
  u.balance as nouveau_solde,
  COALESCE(SUM(d.earnings), 0) as gains_declares,
  CASE 
    WHEN u.balance = COALESCE(SUM(d.earnings), 0) THEN '✅ SYNCHRONISÉ'
    ELSE '❌ PROBLÈME PERSISTE'
  END as statut
FROM users u
LEFT JOIN declarations d ON u.id = d.clipper_id
WHERE u.role = 'clipper'
GROUP BY u.id, u.email, u.balance
ORDER BY u.balance DESC;

-- 4. Voir les déclarations qui ont généré ces gains
SELECT 
  'DÉTAIL DES GAINS' as info,
  d.clipper_id,
  u.email,
  d.tiktok_url,
  d.declared_views,
  d.earnings,
  d.status,
  d.created_at
FROM declarations d
JOIN users u ON d.clipper_id = u.id
WHERE d.earnings > 0
ORDER BY d.earnings DESC
LIMIT 10; 