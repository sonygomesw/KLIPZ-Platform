# Fix : Bouton Supprimer "My Clips" ne fonctionne pas

## Problème
Le bouton supprimer sur la page "My Clips" côté clipper ne fonctionne pas. Les utilisateurs clippers ne peuvent pas supprimer leurs propres clips.

## Cause
Il manquait les politiques RLS (Row Level Security) dans Supabase pour permettre les opérations DELETE sur la table `submissions`. Les politiques existantes permettaient seulement SELECT, INSERT et UPDATE, mais pas DELETE.

## Solution

### 1. Appliquer les politiques manquantes
Exécutez le script SQL suivant dans votre console Supabase :

```sql
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
```

### 2. Vérification
- Le script `fix-submissions-delete-policy.sql` a été créé dans `/backend/`
- Le schéma principal `supabase_schema.sql` a été mis à jour avec les politiques manquantes

### 3. Test
1. Connectez-vous en tant que clipper
2. Allez sur la page "My Clips" 
3. Essayez de supprimer un clip
4. La suppression devrait maintenant fonctionner correctement

## Politiques RLS ajoutées

### Pour les clippers
- Permet de supprimer leurs propres soumissions (WHERE clipper_id = auth.uid())

### Pour les streamers  
- Permet de supprimer les soumissions liées à leurs campagnes (WHERE streamer_id = auth.uid())

## Code Frontend
Le code frontend dans `SubmissionsScreen.tsx` était déjà correct :

```typescript
const handleDeleteSubmission = async (submission: Submission) => {
  // ... code de confirmation ...
  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', submission.id);
  // ... gestion d'erreur ...
};
```

Le problème était uniquement côté base de données avec les politiques RLS manquantes.