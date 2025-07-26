-- Vérifier la structure de la table declarations
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'declarations' 
ORDER BY ordinal_position;

-- Vérifier les contraintes de la table
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'declarations'::regclass; 