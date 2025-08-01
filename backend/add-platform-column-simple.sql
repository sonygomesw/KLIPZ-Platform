-- Ajouter la colonne platform à la table campaigns
ALTER TABLE campaigns ADD COLUMN platform VARCHAR(20) DEFAULT 'twitch';

-- Ajouter la contrainte CHECK après avoir ajouté la colonne
ALTER TABLE campaigns ADD CONSTRAINT campaigns_platform_check CHECK (platform IN ('twitch', 'youtube'));

-- Mettre à jour les campagnes existantes
UPDATE campaigns SET platform = 'twitch' WHERE platform IS NULL;

-- Créer un index pour les performances
CREATE INDEX idx_campaigns_platform ON campaigns(platform); 