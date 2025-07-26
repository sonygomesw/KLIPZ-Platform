-- Mise à jour du schéma KLIPZ pour supporter les nouvelles fonctionnalités du dashboard

-- Ajouter les colonnes manquantes à la table campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Ajouter les colonnes manquantes à la table submissions  
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter une colonne balance à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

-- Mettre à jour les noms de colonnes pour correspondre au service
-- Renommer views_count en views dans submissions si nécessaire
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'submissions' AND column_name = 'views_count') THEN
        ALTER TABLE submissions RENAME COLUMN views_count TO views;
    END IF;
END $$;

-- Ajouter des index pour optimiser les requêtes du dashboard
CREATE INDEX IF NOT EXISTS idx_campaigns_total_views ON campaigns(total_views);
CREATE INDEX IF NOT EXISTS idx_campaigns_total_spent ON campaigns(total_spent);
CREATE INDEX IF NOT EXISTS idx_submissions_views ON submissions(views);
CREATE INDEX IF NOT EXISTS idx_submissions_earnings ON submissions(earnings);
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance);

-- Trigger pour mettre à jour submitted_at automatiquement
CREATE TRIGGER IF NOT EXISTS update_submissions_submitted_at 
    BEFORE INSERT ON submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement total_spent quand une soumission est approuvée
CREATE OR REPLACE FUNCTION update_campaign_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Mettre à jour total_spent et total_views de la campagne
    UPDATE campaigns 
    SET 
        total_spent = (
            SELECT COALESCE(SUM(earnings), 0) 
            FROM submissions 
            WHERE campaign_id = NEW.campaign_id AND status = 'approved'
        ),
        total_views = (
            SELECT COALESCE(SUM(views), 0) 
            FROM submissions 
            WHERE campaign_id = NEW.campaign_id AND status = 'approved'
        )
    WHERE id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour les stats de campagne automatiquement
DROP TRIGGER IF EXISTS update_campaign_stats_trigger ON submissions;
CREATE TRIGGER update_campaign_stats_trigger 
    AFTER INSERT OR UPDATE ON submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_campaign_stats();

-- Insérer quelques données de test pour le dashboard
INSERT INTO campaigns (streamer_id, title, description, budget_total, budget_remaining, cpm_rate, total_views, total_spent, status)
SELECT 
    id as streamer_id,
    'Clips Gaming Viral' as title,
    'Créez des clips gaming viraux pour ma chaîne Twitch' as description,
    100.00 as budget_total,
    85.00 as budget_remaining,
    0.05 as cpm_rate,
    150000 as total_views,
    15.00 as total_spent,
    'active' as status
FROM users 
WHERE role = 'streamer' 
AND NOT EXISTS (SELECT 1 FROM campaigns WHERE streamer_id = users.id)
LIMIT 1;

INSERT INTO campaigns (streamer_id, title, description, budget_total, budget_remaining, cpm_rate, total_views, total_spent, status)
SELECT 
    id as streamer_id,
    'Moments Épiques' as title,
    'Capturez les moments les plus épiques de mes streams' as description,
    75.00 as budget_total,
    60.00 as budget_remaining,
    0.04 as cpm_rate,
    80000 as total_views,
    15.00 as total_spent,
    'active' as status
FROM users 
WHERE role = 'streamer' 
AND EXISTS (SELECT 1 FROM campaigns WHERE streamer_id = users.id)
LIMIT 1;

-- Ajouter quelques soumissions de test
INSERT INTO submissions (campaign_id, clipper_id, tiktok_url, views, status, earnings, submitted_at)
SELECT 
    c.id as campaign_id,
    u.id as clipper_id,
    'https://tiktok.com/@user/video/123' as tiktok_url,
    25000 as views,
    'approved' as status,
    1.25 as earnings,
    NOW() - INTERVAL '2 days' as submitted_at
FROM campaigns c
CROSS JOIN users u
WHERE c.title = 'Clips Gaming Viral' 
AND u.role = 'clipper'
AND NOT EXISTS (SELECT 1 FROM submissions WHERE campaign_id = c.id AND clipper_id = u.id)
LIMIT 1;

INSERT INTO submissions (campaign_id, clipper_id, tiktok_url, views, status, earnings, submitted_at)
SELECT 
    c.id as campaign_id,
    u.id as clipper_id,
    'https://tiktok.com/@user/video/456' as tiktok_url,
    12000 as views,
    'pending' as status,
    0.00 as earnings,
    NOW() - INTERVAL '1 day' as submitted_at
FROM campaigns c
CROSS JOIN users u
WHERE c.title = 'Moments Épiques' 
AND u.role = 'clipper'
AND NOT EXISTS (SELECT 1 FROM submissions WHERE campaign_id = c.id AND clipper_id = u.id)
LIMIT 1; 