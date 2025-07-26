-- Script complet pour ajouter la colonne submission_id à la table declarations
-- À exécuter dans l'interface Supabase SQL Editor

BEGIN;

-- 1. Vérifier que la table declarations existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'declarations'
    ) THEN
        RAISE EXCEPTION 'La table declarations n''existe pas';
    END IF;
END $$;

-- 2. Vérifier que la table submissions existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'submissions'
    ) THEN
        RAISE EXCEPTION 'La table submissions n''existe pas';
    END IF;
END $$;

-- 3. Ajouter la colonne submission_id
ALTER TABLE declarations 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;

-- 4. Ajouter les index pour les performances
CREATE INDEX IF NOT EXISTS idx_declarations_submission_id 
ON declarations(submission_id);

CREATE INDEX IF NOT EXISTS idx_declarations_clipper_submission 
ON declarations(clipper_id, submission_id);

-- 5. Vérifier que tout s'est bien passé
DO $$
BEGIN
    -- Vérifier que la colonne existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'declarations' 
        AND column_name = 'submission_id'
    ) THEN
        RAISE EXCEPTION 'La colonne submission_id n''a pas été ajoutée correctement';
    END IF;
    
    -- Vérifier que les index existent
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_declarations_submission_id'
    ) THEN
        RAISE EXCEPTION 'L''index idx_declarations_submission_id n''a pas été créé';
    END IF;
    
    RAISE NOTICE '✅ Migration réussie: colonne submission_id ajoutée à la table declarations';
    RAISE NOTICE '✅ Index de performance créés';
    RAISE NOTICE '✅ Contrainte de clé étrangère ajoutée';
END $$;

-- 6. Afficher la nouvelle structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'declarations' 
ORDER BY ordinal_position;

COMMIT; 