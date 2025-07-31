-- Ajouter la colonne platform à la table campaigns
-- Cette colonne permettra aux streamers de choisir entre Twitch et YouTube

ALTER TABLE campaigns 
ADD COLUMN platform VARCHAR(20) DEFAULT 'twitch' 
CHECK (platform IN ('twitch', 'youtube'));

-- Mettre à jour les campagnes existantes pour qu'elles aient une valeur par défaut
UPDATE campaigns 
SET platform = 'twitch' 
WHERE platform IS NULL;

-- Créer un index pour optimiser les requêtes par plateforme
CREATE INDEX idx_campaigns_platform ON campaigns(platform);

-- Afficher la structure mise à jour
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
ORDER BY ordinal_position; 