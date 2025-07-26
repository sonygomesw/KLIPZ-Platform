-- Table des déclarations de vues par TikTok (une ligne par vidéo déclarée)
CREATE TABLE IF NOT EXISTS declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clipper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tiktok_url TEXT NOT NULL,
    declared_views INTEGER NOT NULL,
    verification_code TEXT,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected, paid
    paid_views INTEGER DEFAULT 0,
    earnings FLOAT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_declarations_clipper_id ON declarations(clipper_id);
CREATE INDEX IF NOT EXISTS idx_declarations_tiktok_url ON declarations(tiktok_url);

-- RLS (Row Level Security)
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Le clippeur peut voir et ajouter ses propres déclarations
CREATE POLICY "Clipper can insert own declaration" ON declarations FOR INSERT WITH CHECK (auth.uid() = clipper_id);
CREATE POLICY "Clipper can view own declarations" ON declarations FOR SELECT USING (auth.uid() = clipper_id);
-- Le streamer/admin peut voir toutes les déclarations (à adapter selon besoin)
CREATE POLICY "Admin can view all declarations" ON declarations FOR SELECT USING (true); 