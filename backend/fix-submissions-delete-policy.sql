-- Fix pour le problème du bouton supprimer sur la page My Clips
-- Ajoute la politique RLS manquante pour permettre aux clippers de supprimer leurs propres soumissions

-- Politique DELETE pour permettre aux clippers de supprimer leurs propres soumissions
CREATE POLICY "Clippers can delete own submissions" 
ON submissions 
FOR DELETE 
USING (auth.uid() = clipper_id);

-- Optionnel: Politique pour permettre aux streamers de supprimer les soumissions de leurs campagnes
CREATE POLICY "Streamers can delete submissions for their campaigns" 
ON submissions 
FOR DELETE 
USING (
    auth.uid() IN (SELECT streamer_id FROM campaigns WHERE id = campaign_id)
);