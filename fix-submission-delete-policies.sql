-- Script pour corriger les politiques RLS de suppression pour la table submissions
-- Permet aux clippers de supprimer leurs propres clips

-- 1. Vérifier d'abord les politiques existantes
DO $$
BEGIN
    RAISE NOTICE 'Vérification des politiques existantes...';
END $$;

-- 2. Supprimer les anciennes politiques DELETE si elles existent
DROP POLICY IF EXISTS "Clippers can delete own submissions" ON submissions;
DROP POLICY IF EXISTS "Users can delete own submissions" ON submissions;

-- 3. Créer la politique DELETE pour permettre aux clippers de supprimer leurs propres clips
CREATE POLICY "Clippers can delete own submissions" 
ON submissions 
FOR DELETE 
TO authenticated 
USING (
    auth.uid() = clipper_id AND 
    (
        -- L'utilisateur doit être le clipper qui a créé le clip
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'clipper'
        )
        -- Ou être un admin
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
);

-- 4. Vérifier que RLS est bien activé
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 5. Afficher les politiques après modification
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'submissions'
ORDER BY cmd, policyname; 