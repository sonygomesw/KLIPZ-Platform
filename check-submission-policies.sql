-- Vérifier les politiques RLS existantes pour la table submissions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'submissions';

-- Vérifier si RLS est activé sur la table
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'submissions';

-- Afficher la structure de la table pour comprendre les colonnes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'submissions'
ORDER BY ordinal_position; 