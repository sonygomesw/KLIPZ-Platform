-- Trigger automatique pour synchroniser le solde utilisateur
-- Ce trigger se déclenche quand une déclaration est insérée, mise à jour ou supprimée

-- Fonction pour mettre à jour automatiquement le solde utilisateur
CREATE OR REPLACE FUNCTION update_user_balance_from_declarations()
RETURNS TRIGGER AS $$
BEGIN
  -- Si c'est une insertion ou mise à jour
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Mettre à jour le solde du clipper
    UPDATE users 
    SET balance = (
      SELECT COALESCE(SUM(earnings), 0)
      FROM declarations 
      WHERE clipper_id = NEW.clipper_id
    )
    WHERE id = NEW.clipper_id;
    
    RETURN NEW;
  END IF;
  
  -- Si c'est une suppression
  IF TG_OP = 'DELETE' THEN
    -- Mettre à jour le solde du clipper
    UPDATE users 
    SET balance = (
      SELECT COALESCE(SUM(earnings), 0)
      FROM declarations 
      WHERE clipper_id = OLD.clipper_id
    )
    WHERE id = OLD.clipper_id;
    
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger sur la table declarations
DROP TRIGGER IF EXISTS trigger_update_user_balance ON declarations;

CREATE TRIGGER trigger_update_user_balance
  AFTER INSERT OR UPDATE OR DELETE ON declarations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_balance_from_declarations();

-- Vérifier que le trigger a été créé
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_user_balance'; 