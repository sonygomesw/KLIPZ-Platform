-- Vérifier si sonygomes.97@gmail.com est configuré comme admin
-- Vérifier tous les utilisateurs et leurs rôles

-- 1. Voir tous les utilisateurs et leurs rôles
SELECT 
  'TOUS LES UTILISATEURS' as info,
  u.id,
  u.email,
  u.role,
  u.balance,
  u.created_at,
  CASE 
    WHEN u.email = 'sonygomes.97@gmail.com' THEN '🎯 UTILISATEUR CIBLE'
    ELSE 'Autre utilisateur'
  END as statut
FROM users u
ORDER BY u.created_at DESC;

-- 2. Vérifier spécifiquement sonygomes.97@gmail.com
SELECT 
  'VÉRIFICATION ADMIN' as info,
  u.id,
  u.email,
  u.role,
  CASE 
    WHEN u.role = 'admin' THEN '✅ ADMIN'
    WHEN u.role = 'streamer' THEN '🎮 STREAMER'
    WHEN u.role = 'clipper' THEN '📱 CLIPPER'
    ELSE '❓ RÔLE INCONNU'
  END as role_lisible,
  u.balance,
  u.created_at
FROM users u
WHERE u.email = 'sonygomes.97@gmail.com';

-- 3. Vérifier les politiques RLS pour les admins
SELECT 
  'POLITIQUES RLS' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'declarations', 'withdrawals', 'payments')
  AND (qual LIKE '%admin%' OR policyname LIKE '%admin%');

-- 4. Vérifier s'il y a des déclarations en attente de validation
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