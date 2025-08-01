-- Création de la table pour stocker les tokens TikTok des utilisateurs
CREATE TABLE IF NOT EXISTS user_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tiktok_access_token TEXT,
  tiktok_refresh_token TEXT,
  tiktok_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_user_tokens_user_id ON user_tokens(user_id);

-- RLS (Row Level Security)
ALTER TABLE user_tokens ENABLE ROW LEVEL SECURITY;

-- Policy pour que les utilisateurs ne voient que leurs propres tokens
CREATE POLICY "Users can only access their own tokens" ON user_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Ajouter colonnes manquantes dans la table submissions pour les métriques détaillées
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metrics_source TEXT DEFAULT 'scraping'; -- 'scraping' ou 'tiktok_api'

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour user_tokens
CREATE TRIGGER update_user_tokens_updated_at 
  BEFORE UPDATE ON user_tokens 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();