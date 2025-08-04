-- Table des notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contenu de la notification
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    
    -- Liens vers d'autres entités
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
    
    -- Statut
    is_read BOOLEAN DEFAULT false,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Fonction pour créer une notification automatiquement quand une soumission est créée
CREATE OR REPLACE FUNCTION notify_new_submission()
RETURNS TRIGGER AS $$
BEGIN
    -- Créer une notification pour le streamer
    INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        campaign_id,
        submission_id
    )
    SELECT 
        c.streamer_id,
        'Nouveau clip soumis',
        'Un nouveau clip a été soumis pour votre campagne "' || c.title || '"',
        'info',
        NEW.campaign_id,
        NEW.id
    FROM campaigns c
    WHERE c.id = NEW.campaign_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour créer automatiquement une notification
DROP TRIGGER IF EXISTS trigger_notify_new_submission ON submissions;
CREATE TRIGGER trigger_notify_new_submission
    AFTER INSERT ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_submission(); 