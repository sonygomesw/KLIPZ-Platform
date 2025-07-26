-- Migration pour supporter les données réelles du dashboard

-- Ajouter les colonnes manquantes à la table campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10,2) DEFAULT 0;

-- Ajouter les colonnes manquantes à la table submissions  
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Ajouter une colonne balance à la table users
ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0;

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
AND NOT EXISTS (SELECT 1 FROM campaigns WHERE streamer_id = users.id AND title = 'Clips Gaming Viral')
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
AND NOT EXISTS (SELECT 1 FROM campaigns WHERE streamer_id = users.id AND title = 'Moments Épiques')
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