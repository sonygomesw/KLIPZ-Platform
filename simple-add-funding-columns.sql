-- Script simple pour ajouter les colonnes de financement
-- Exécuter ces commandes une par une

-- Ajouter la colonne funding_goal (objectif de financement - optionnel)
ALTER TABLE campaigns ADD COLUMN funding_goal DECIMAL(10,2);

-- Ajouter la colonne current_funding (financement actuel - défaut 0)
ALTER TABLE campaigns ADD COLUMN current_funding DECIMAL(10,2) DEFAULT 0;

-- Vérification que les colonnes ont été ajoutées
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
  AND column_name IN ('funding_goal', 'current_funding')
ORDER BY column_name; 