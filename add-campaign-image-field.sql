-- Ajouter un champ image_url à la table campaigns pour stocker l'image de la campagne
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS image_url TEXT;
 
-- Commentaire pour documenter le champ
COMMENT ON COLUMN campaigns.image_url IS 'URL de l''image/thumbnail de la campagne créée par le streamer'; 