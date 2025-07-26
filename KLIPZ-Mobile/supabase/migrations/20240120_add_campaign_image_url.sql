-- Migration pour ajouter le champ image_url à la table campaigns
-- Date: 2024-01-20

-- Ajouter le champ image_url à la table campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Commentaire pour documenter le champ
COMMENT ON COLUMN campaigns.image_url IS 'URL de l''image/thumbnail de la campagne créée par le streamer';

-- Mettre à jour les campagnes existantes avec une image par défaut (optionnel)
-- UPDATE campaigns SET image_url = NULL WHERE image_url IS NULL; 