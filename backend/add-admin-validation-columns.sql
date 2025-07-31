-- Ajouter les colonnes pour la validation admin dans la table submissions
ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS admin_validated_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT;

-- Mettre à jour les statuts possibles (ajouter 'ready_for_payment')
-- Note: Si vous utilisez un ENUM pour status, il faudrait le modifier
-- Pour l'instant on peut utiliser une contrainte CHECK

-- Ajouter un index pour les requêtes admin
CREATE INDEX IF NOT EXISTS idx_submissions_admin_validation 
ON submissions(status, admin_validated_by, created_at);

-- Vérifier la structure mise à jour
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('admin_validated_by', 'admin_notes', 'stripe_transfer_id');