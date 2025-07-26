-- Vérifier l'état du wallet du clipper
SELECT 
  u.email as clipper_email,
  w.balance as wallet_balance,
  w.user_id
FROM users u
LEFT JOIN wallets w ON u.id = w.user_id
WHERE u.email = 'dow@gmail.com';

-- Vérifier les déclarations et leurs statuts
SELECT 
  d.id,
  d.declared_views,
  d.earnings,
  d.status,
  CASE 
    WHEN d.status = 'approved' THEN '✅ Approuvée - Admin doit payer'
    WHEN d.status = 'paid' THEN '💰 Payée - Clipper peut retirer'
    WHEN d.status = 'pending' THEN '⏳ En attente d''approbation'
    ELSE '❓ Statut: ' || d.status
  END as action_requise
FROM declarations d
JOIN users u ON d.clipper_id = u.id
WHERE u.email = 'dow@gmail.com'
ORDER BY d.created_at DESC;

-- Vérifier les transferts Stripe
SELECT 
  'Transferts Stripe' as info,
  'À vérifier dans Stripe Dashboard' as note,
  'https://dashboard.stripe.com/transfers' as lien; 