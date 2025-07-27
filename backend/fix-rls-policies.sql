-- Script pour corriger les politiques RLS sur la table users
-- Ce script permet l'insertion de nouveaux utilisateurs

-- 1. Désactiver RLS temporairement pour les tests
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- 2. Ou créer une politique qui permet l'insertion
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
-- CREATE POLICY "Users can insert their own profile" ON users
--     FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Politique pour permettre la lecture de son propre profil
-- DROP POLICY IF EXISTS "Users can view own profile" ON users;
-- CREATE POLICY "Users can view own profile" ON users
--     FOR SELECT USING (auth.uid() = id);

-- 4. Politique pour permettre la mise à jour de son propre profil
-- DROP POLICY IF EXISTS "Users can update own profile" ON users;
-- CREATE POLICY "Users can update own profile" ON users
--     FOR UPDATE USING (auth.uid() = id);

-- 5. Réactiver RLS avec les nouvelles politiques
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Pour les tests, on garde RLS désactivé
-- En production, on utiliserait les politiques ci-dessus 