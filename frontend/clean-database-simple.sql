-- Script simple pour nettoyer les données de test
-- ATTENTION: Ce script supprime toutes les données existantes !

-- 1. Supprimer toutes les soumissions
DELETE FROM submissions;

-- 2. Supprimer toutes les campagnes
DELETE FROM campaigns;

-- 3. Supprimer tous les utilisateurs (sauf les comptes admin)
DELETE FROM users WHERE email NOT LIKE '%admin%' AND email NOT LIKE '%test%';

-- 4. Vérifier que tout est vide
SELECT 'Campaigns count:' as table_name, COUNT(*) as count FROM campaigns
UNION ALL
SELECT 'Submissions count:', COUNT(*) FROM submissions
UNION ALL
SELECT 'Users count:', COUNT(*) FROM users; 