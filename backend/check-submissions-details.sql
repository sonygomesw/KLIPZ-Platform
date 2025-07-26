-- Voir le détail des soumissions avec leurs déclarations
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
    WHEN d.status = 'pending' THEN '⏳ En attente'
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

-- Voir toutes les soumissions sans déclarations
SELECT 
  s.id as submission_id,
  s.tiktok_url,
  s.status,
  s.created_at,
  u.email as clipper_email,
  '❌ Pas de déclaration' as etat
FROM submissions s
LEFT JOIN users u ON s.clipper_id = u.id
WHERE s.id NOT IN (
  SELECT DISTINCT submission_id 
  FROM declarations 
  WHERE submission_id IS NOT NULL
)
ORDER BY s.created_at DESC;

-- Statistiques par statut de soumission
SELECT 
  s.status,
  COUNT(s.id) as nombre_soumissions,
  COUNT(d.id) as nombre_declarations,
  ROUND(COUNT(d.id) * 100.0 / COUNT(s.id), 1) as pourcentage_declarations
FROM submissions s
LEFT JOIN declarations d ON s.id = d.submission_id
GROUP BY s.status
ORDER BY nombre_soumissions DESC; 