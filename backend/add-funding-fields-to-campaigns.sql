-- Script pour ajouter les champs de financement aux campagnes
-- Date: 2024-12-01

-- Ajouter funding_goal column (objectif de collecte de fonds - optionnel)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS funding_goal DECIMAL(10,2);

-- Ajouter current_funding column (montant actuellement collecté)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS current_funding DECIMAL(10,2) DEFAULT 0;

-- Contraintes de validation (sans IF NOT EXISTS car non supporté pour CHECK)
DO $$
BEGIN
    -- Contrainte pour current_funding >= 0
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_current_funding_non_negative') THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT check_current_funding_non_negative 
        CHECK (current_funding >= 0);
    END IF;
    
    -- Contrainte pour funding_goal > 0 quand défini
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_funding_goal_positive') THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT check_funding_goal_positive 
        CHECK (funding_goal IS NULL OR funding_goal > 0);
    END IF;
    
    -- Contrainte pour current_funding <= funding_goal
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_current_funding_not_exceed_goal') THEN
        ALTER TABLE campaigns 
        ADD CONSTRAINT check_current_funding_not_exceed_goal 
        CHECK (funding_goal IS NULL OR current_funding <= funding_goal);
    END IF;
END $$;

-- Index pour les requêtes de financement
CREATE INDEX IF NOT EXISTS idx_campaigns_funding_goal 
ON campaigns(funding_goal) WHERE funding_goal IS NOT NULL;

-- Vérification
SELECT 'Colonnes funding_goal et current_funding ajoutées avec succès' AS status; 