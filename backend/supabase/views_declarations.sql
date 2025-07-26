-- Table des déclarations de vues pour chaque soumission de clip
CREATE TABLE IF NOT EXISTS views_declarations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    clipper_id UUID REFERENCES users(id) ON DELETE CASCADE,
    declared_views INTEGER NOT NULL,
    screenshot_url TEXT,
    is_final BOOLEAN DEFAULT false, -- true si c'est la déclaration finale (screenshot obligatoire)
    declared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour accélérer les requêtes
CREATE INDEX IF NOT EXISTS idx_views_declarations_submission_id ON views_declarations(submission_id);
CREATE INDEX IF NOT EXISTS idx_views_declarations_clipper_id ON views_declarations(clipper_id);

-- RLS (Row Level Security)
ALTER TABLE views_declarations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS
-- Le clippeur peut voir et ajouter ses propres déclarations
CREATE POLICY "Clipper can insert own views declaration" ON views_declarations FOR INSERT WITH CHECK (auth.uid() = clipper_id);
CREATE POLICY "Clipper can view own views declarations" ON views_declarations FOR SELECT USING (auth.uid() = clipper_id);
-- Le streamer peut voir les déclarations liées à ses campagnes
CREATE POLICY "Streamer can view declarations for their campaigns" ON views_declarations FOR SELECT USING (
  auth.uid() IN (SELECT streamer_id FROM campaigns WHERE id = (SELECT campaign_id FROM submissions WHERE id = submission_id))
); 