
-- Script pour corriger la contrainte de statut des submissions

-- 1. D'abord, voir quels statuts problématiques existent
SELECT DISTINCT status, COUNT(*) as count 
FROM submissions 
GROUP BY status;

-- 2. Supprimer l'ancienne contrainte
ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_status_check;

-- 3. Corriger les statuts invalides (s'il y en a)
UPDATE submissions 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'approved', 'rejected', 'auto_approved', 'processing');

-- 4. Ajouter la nouvelle contrainte avec tous les statuts valides
ALTER TABLE submissions ADD CONSTRAINT submissions_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved', 'processing'));

-- 5. NETTOYER LES VUES FICTIVES - Remettre à 0 pour un vrai scraping
UPDATE submissions 
SET views = 0, earnings = 0 
WHERE views > 0;

-- 6. Vérifier que tout fonctionne
SELECT id, status, campaign_id, clipper_id, views, earnings, created_at 
FROM submissions 
ORDER BY created_at DESC 
LIMIT 5;

