-- Ajouter la colonne submission_id à la table declarations
ALTER TABLE declarations 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_declarations_submission_id 
ON declarations(submission_id);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'declarations' 
AND column_name = 'submission_id'; 