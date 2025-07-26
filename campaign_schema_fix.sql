-- Migration pour corriger le schéma de la table campaigns
-- Ajout des colonnes manquantes

-- Ajouter la colonne budget (alias pour budget_total)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);

-- Ajouter la colonne cpm (alias pour cpm_rate)
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS cpm DECIMAL(10,2);

-- Ajouter la colonne fan_page_cpm
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS fan_page_cpm DECIMAL(10,2);

-- Ajouter la colonne total_views
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- Ajouter la colonne total_spent
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Mettre à jour les valeurs existantes
UPDATE campaigns SET 
    budget = budget_total,
    cpm = cpm_rate
WHERE budget IS NULL OR cpm IS NULL;

-- Créer des triggers pour synchroniser les colonnes
CREATE OR REPLACE FUNCTION sync_campaign_budget()
RETURNS TRIGGER AS $$
BEGIN
    -- Synchroniser budget avec budget_total
    IF NEW.budget IS NOT NULL THEN
        NEW.budget_total = NEW.budget;
        NEW.budget_remaining = NEW.budget;
    END IF;
    
    -- Synchroniser cpm avec cpm_rate
    IF NEW.cpm IS NOT NULL THEN
        NEW.cpm_rate = NEW.cpm;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS sync_campaign_budget_trigger ON campaigns;
CREATE TRIGGER sync_campaign_budget_trigger 
    BEFORE INSERT OR UPDATE ON campaigns 
    FOR EACH ROW EXECUTE FUNCTION sync_campaign_budget(); 