# Ajouter la colonne submission_id à la table declarations

## Problème
L'erreur `PGRST204: Could not find the 'submission_id' column of 'declarations'` indique que la colonne `submission_id` n'existe pas dans la table `declarations`.

## Solution temporaire
Le service `viewsDeclarationService.ts` a été modifié pour gérer automatiquement cette erreur et retry sans la colonne `submission_id`.

## Solution permanente
Exécuter le script SQL suivant dans l'interface Supabase :

```sql
-- Ajouter la colonne submission_id à la table declarations
ALTER TABLE declarations 
ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;

-- Ajouter un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_declarations_submission_id 
ON declarations(submission_id);

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'declarations' 
AND column_name = 'submission_id';
```

## Comment exécuter
1. Aller dans l'interface Supabase
2. Aller dans l'onglet "SQL Editor"
3. Coller le script ci-dessus
4. Cliquer sur "Run"

## Avantages de la colonne submission_id
- Lien direct entre déclarations et soumissions
- Meilleure traçabilité
- Requêtes plus efficaces
- Intégrité des données

## Statut actuel
✅ Service compatible avec l'ancienne structure
✅ Gestion d'erreur automatique
⏳ Colonne à ajouter pour une fonctionnalité complète 