-- Script pour nettoyer TOUTES les données de test de Supabase
-- ATTENTION: Ce script supprime toutes les données existantes !

-- 1. Supprimer toutes les soumissions
DELETE FROM submissions;

-- 2. Supprimer toutes les campagnes
DELETE FROM campaigns;

-- 3. Supprimer tous les utilisateurs (sauf les comptes admin si nécessaire)
-- Note: Gardez au moins un compte pour pouvoir vous reconnecter
DELETE FROM users WHERE email NOT LIKE '%admin%' AND email NOT LIKE '%test%';

-- 4. Réinitialiser les séquences d'ID (optionnel - seulement si elles existent)
-- ALTER SEQUENCE campaigns_id_seq RESTART WITH 1;
-- ALTER SEQUENCE submissions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;

-- 5. Vérifier que tout est vide
SELECT 'Campaigns count:' as table_name, COUNT(*) as count FROM campaigns
UNION ALL
SELECT 'Submissions count:', COUNT(*) FROM submissions
UNION ALL
SELECT 'Users count:', COUNT(*) FROM users; 