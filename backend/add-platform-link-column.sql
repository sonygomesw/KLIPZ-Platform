-- Ajouter la colonne platform_link à la table campaigns
ALTER TABLE campaigns ADD COLUMN platform_link VARCHAR(500);

-- Vérifier la structure mise à jour
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
AND column_name IN ('platform', 'platform_link')
ORDER BY ordinal_position; 