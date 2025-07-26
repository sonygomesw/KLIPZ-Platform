-- Ajout des colonnes manquantes pour le profil utilisateur
-- À exécuter dans l'éditeur SQL de Supabase

-- ÉTAPE 1: Ajouter la colonne pour le nom personnalisé
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

-- ÉTAPE 2: Ajouter la colonne pour le nom d'utilisateur personnalisé
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS username VARCHAR(50);

-- ÉTAPE 3: Ajouter la colonne pour le numéro de téléphone
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- ÉTAPE 4: Mettre à jour les utilisateurs existants avec des valeurs par défaut
UPDATE users 
SET 
  display_name = COALESCE(twitch_display_name, SPLIT_PART(email, '@', 1))
WHERE display_name IS NULL;

UPDATE users 
SET 
  username = COALESCE(username, SPLIT_PART(email, '@', 1))
WHERE username IS NULL;

-- ÉTAPE 5: Ajouter des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);

-- ÉTAPE 6: Ajouter la contrainte unique pour username (avec gestion d'erreur)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'username_unique' 
        AND conrelid = 'users'::regclass
    ) THEN
        ALTER TABLE users ADD CONSTRAINT username_unique UNIQUE (username);
    END IF;
END $$;

-- VÉRIFICATION: Afficher la structure mise à jour
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position; 