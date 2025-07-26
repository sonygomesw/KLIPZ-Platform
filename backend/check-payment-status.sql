-- Vérifier le statut actuel de la déclaration
SELECT 
  id,
  clipper_id,
  declared_views,
  earnings,
  status,
  created_at,
  CASE 
    WHEN status = 'pending' THEN '⏳ En attente'
    WHEN status = 'approved' THEN '✅ Approuvée (en attente de paiement)'
    WHEN status = 'paid' THEN '💰 Payée'
    WHEN status = 'rejected' THEN '❌ Rejetée'
    ELSE '❓ Statut: ' || status
  END as statut_lisible
FROM declarations 
WHERE id = '43c7c870-9a28-433f-a8db-1c2145f70091';

-- Vérifier les transferts Stripe (si on a une table de paiements)
SELECT 
  'Vérification paiements' as info,
  'Table paiements existe ?' as question,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') 
    THEN '✅ Oui'
    ELSE '❌ Non'
  END as reponse;

-- Vérifier le solde du clipper
SELECT 
  u.email as clipper_email,
  u.id as clipper_id,
  'Solde actuel' as info,
  'À vérifier dans Stripe' as note
FROM users u
WHERE u.id = (
  SELECT clipper_id 
  FROM declarations 
  WHERE id = '43c7c870-9a28-433f-a8db-1c2145f70091'
);

-- Voir toutes les déclarations récentes
SELECT 
  id,
  clipper_id,
  declared_views,
  earnings,
  status,
  created_at,
  CASE 
    WHEN status = 'approved' THEN '⚠️ Approuvée mais pas payée'
    WHEN status = 'paid' THEN '✅ Payée'
    ELSE status
  END as action_requise
FROM declarations 
ORDER BY created_at DESC
LIMIT 5; 