-- Migration: Ajouter la colonne submission_id à la table declarations
-- Date: 2024-07-22
-- Description: Ajoute une référence vers la table submissions pour lier les déclarations aux soumissions

-- Ajouter la colonne submission_id
ALTER TABLE declarations 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;

-- Ajouter un index pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS idx_declarations_submission_id 
ON declarations(submission_id);

-- Ajouter un index composite pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_declarations_clipper_submission 
ON declarations(clipper_id, submission_id);

-- Vérifier que la migration s'est bien passée
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
    
    RAISE NOTICE 'Migration réussie: colonne submission_id ajoutée à la table declarations';
END $$; 