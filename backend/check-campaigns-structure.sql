-- Vérifier la structure de la table campaigns
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%campaigns%';

-- Vérifier les données existantes
SELECT 
    id,
    title,
    platform,
    status,
    created_at
FROM campaigns 
LIMIT 5; 