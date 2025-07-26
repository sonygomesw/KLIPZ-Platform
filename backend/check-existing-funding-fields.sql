-- Vérifier si les colonnes funding_goal et current_funding existent déjà
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
  AND column_name IN ('funding_goal', 'current_funding')
ORDER BY column_name;

-- Vérifier les contraintes existantes
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'campaigns'
  AND conname LIKE '%funding%';

-- Vérifier les index existants
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'campaigns' 
  AND indexname LIKE '%funding%'; 