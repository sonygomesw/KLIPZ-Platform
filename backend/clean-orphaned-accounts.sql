-- Script pour nettoyer les comptes orphelins et résoudre les conflits

-- 1. Supprimer les profils utilisateurs qui n'ont pas de compte Auth correspondant
DELETE FROM users 
WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- 2. Supprimer les comptes Auth qui n'ont pas de profil utilisateur
-- (Cette requête doit être exécutée dans Supabase Dashboard car elle touche auth.users)

-- 3. Vérifier les doublons d'email
SELECT email, COUNT(*) as count
FROM users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- 4. Supprimer les doublons d'email (garder le plus récent)
DELETE FROM users 
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
    FROM users
  ) t
  WHERE t.rn > 1
);

-- 5. Vérifier l'état final
SELECT 
  'Total users' as metric,
  COUNT(*) as count
FROM users
UNION ALL
SELECT 
  'Streamers' as metric,
  COUNT(*) as count
FROM users
WHERE role = 'streamer'
UNION ALL
SELECT 
  'Clippers' as metric,
  COUNT(*) as count
FROM users
WHERE role = 'clipper'; 