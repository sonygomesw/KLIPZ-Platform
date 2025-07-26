-- Forcer le rechargement en ajoutant un timestamp de mise à jour
UPDATE declarations 
SET updated_at = NOW()
WHERE id = '43c7c870-9a28-433f-a8db-1c2145f70091';

-- Vérifier que la déclaration est bien en statut approved
SELECT 
  id,
  status,
  earnings,
  '✅ Prête pour paiement' as etat
FROM declarations 
WHERE id = '43c7c870-9a28-433f-a8db-1c2145f70091';

-- Voir toutes les déclarations avec leurs statuts
SELECT 
  id,
  declared_views,
  earnings,
  status,
  CASE 
    WHEN status = 'pending' THEN '⏳ En attente d''approbation'
    WHEN status = 'approved' THEN '✅ Approuvée - Cliquer sur Payer'
    WHEN status = 'paid' THEN '💰 Payée'
    WHEN status = 'rejected' THEN '❌ Rejetée'
    ELSE '❓ Statut: ' || status
  END as action_requise
FROM declarations 
ORDER BY created_at DESC; 