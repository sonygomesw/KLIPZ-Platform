-- 1. Nettoyer les soumissions dupliquées (garder la plus récente)
DELETE FROM submissions 
WHERE id = 'fd354ace-a26a-4cf8-b685-f67ef99cfb3f';

-- 2. Finaliser la déclaration (changer draft à pending)
UPDATE declarations 
SET status = 'pending' 
WHERE id = '18a03703-d0ff-4597-aac2-e328c4fa72c5';

-- 3. Vérifier les résultats après nettoyage
SELECT 
  'APRÈS NETTOYAGE' as periode,
  'Soumissions' as type,
  COUNT(*) as nombre
FROM submissions
WHERE campaign_id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
UNION ALL
SELECT 
  'APRÈS NETTOYAGE' as periode,
  'Déclarations' as type,
  COUNT(*) as nombre
FROM declarations d
JOIN submissions s ON d.submission_id = s.id
WHERE s.campaign_id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75';

-- 4. Voir l'état final des soumissions
SELECT 
  s.id as submission_id,
  s.tiktok_url,
  s.status as submission_status,
  s.created_at as submission_date,
  u.email as clipper_email,
  d.id as declaration_id,
  d.declared_views,
  d.earnings,
  d.status as declaration_status,
  CASE 
    WHEN d.id IS NULL THEN '❌ Pas de déclaration'
    WHEN d.status = 'pending' THEN '⏳ En attente d''approbation'
    WHEN d.status = 'approved' THEN '✅ Approuvée'
    WHEN d.status = 'paid' THEN '💰 Payée'
    WHEN d.status = 'rejected' THEN '❌ Rejetée'
    WHEN d.status = 'draft' THEN '📝 Brouillon'
    ELSE '❓ Statut inconnu'
  END as etat
FROM submissions s
LEFT JOIN users u ON s.clipper_id = u.id
LEFT JOIN declarations d ON s.id = d.submission_id
WHERE s.campaign_id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
ORDER BY s.created_at DESC;

-- 5. Statistiques finales de la campagne
SELECT 
  c.title as campagne,
  COUNT(DISTINCT s.id) as nombre_soumissions,
  COUNT(DISTINCT d.id) as nombre_declarations,
  SUM(d.declared_views) as total_vues,
  SUM(d.earnings) as total_gains,
  COUNT(CASE WHEN d.status = 'pending' THEN 1 END) as en_attente,
  COUNT(CASE WHEN d.status = 'approved' THEN 1 END) as approuvees,
  COUNT(CASE WHEN d.status = 'paid' THEN 1 END) as payees
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
LEFT JOIN declarations d ON s.id = d.submission_id
WHERE c.id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
GROUP BY c.id, c.title; 