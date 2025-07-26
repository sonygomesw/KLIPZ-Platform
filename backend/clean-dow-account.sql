-- Supprimer toutes les soumissions du compte dow@gmail.com
DELETE FROM submissions 
WHERE clipper_id = (SELECT id FROM users WHERE email = 'dow@gmail.com');

-- Vérifier que toutes les soumissions ont été supprimées
SELECT 
  'APRÈS SUPPRESSION' as periode,
  COUNT(*) as nombre_soumissions
FROM submissions 
WHERE clipper_id = (SELECT id FROM users WHERE email = 'dow@gmail.com');

-- Vérifier l'état global de la campagne
SELECT 
  c.title as campagne,
  COUNT(s.id) as nombre_soumissions,
  COUNT(d.id) as nombre_declarations,
  SUM(d.declared_views) as total_vues,
  SUM(d.earnings) as total_gains
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
LEFT JOIN declarations d ON s.id = d.submission_id
WHERE c.id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
GROUP BY c.id, c.title;

-- Voir toutes les soumissions restantes (s'il y en a)
SELECT 
  s.id as submission_id,
  s.tiktok_url,
  s.status as submission_status,
  s.created_at as submission_date,
  u.email as clipper_email,
  c.title as campaign_title
FROM submissions s
LEFT JOIN users u ON s.clipper_id = u.id
LEFT JOIN campaigns c ON s.campaign_id = c.id
WHERE s.campaign_id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
ORDER BY s.created_at DESC;

-- Statistiques finales de la campagne
SELECT 
  'FINAL' as periode,
  c.title as campagne,
  COUNT(s.id) as nombre_soumissions,
  COUNT(d.id) as nombre_declarations,
  CASE 
    WHEN COUNT(s.id) = 0 THEN '✅ Campagne vide - prête pour de nouveaux tests'
    ELSE '📝 Campagne avec ' || COUNT(s.id) || ' soumissions'
  END as etat
FROM campaigns c
LEFT JOIN submissions s ON c.id = s.campaign_id
LEFT JOIN declarations d ON s.id = d.submission_id
WHERE c.id = 'd87c9ac2-c1d1-4a4c-ae36-67d116f2ee75'
GROUP BY c.id, c.title; 