# Guide de Migration - Ajouter submission_id à declarations

## 🎯 Objectif
Ajouter la colonne `submission_id` à la table `declarations` pour créer un lien direct entre les déclarations et les soumissions.

## 📋 Prérequis
- Accès à l'interface Supabase
- Droits d'administration sur la base de données

## 🚀 Étapes de migration

### Étape 1: Accéder à Supabase
1. Aller sur [supabase.com](https://supabase.com)
2. Se connecter à ton compte
3. Sélectionner le projet KLIPZ

### Étape 2: Ouvrir l'éditeur SQL
1. Dans le menu de gauche, cliquer sur "SQL Editor"
2. Cliquer sur "New query"

### Étape 3: Exécuter la migration
1. Copier tout le contenu du fichier `apply-submission-id-migration.sql`
2. Coller dans l'éditeur SQL
3. Cliquer sur "Run"

### Étape 4: Vérifier le résultat
Tu devrais voir :
```
✅ Migration réussie: colonne submission_id ajoutée à la table declarations
✅ Index de performance créés
✅ Contrainte de clé étrangère ajoutée
```

Et la structure de la table avec la nouvelle colonne.

## 🔍 Vérification post-migration

### Vérifier que la colonne existe
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'declarations' 
AND column_name = 'submission_id';
```

### Vérifier les index
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'declarations' 
AND indexname LIKE '%submission%';
```

### Vérifier les contraintes
```sql
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'declarations'::regclass;
```

## ✅ Avantages de cette migration

### 1. Intégrité des données
- Lien direct entre déclarations et soumissions
- Contrainte de clé étrangère automatique
- Suppression en cascade

### 2. Performance
- Index sur `submission_id`
- Index composite sur `(clipper_id, submission_id)`
- Requêtes plus rapides

### 3. Fonctionnalités
- Traçabilité complète
- Requêtes plus simples
- Meilleure organisation des données

## 🛡️ Sécurité
- Transaction avec rollback automatique
- Vérifications multiples
- Messages d'erreur clairs

## 🔄 Rollback (si nécessaire)
```sql
-- Supprimer les index
DROP INDEX IF EXISTS idx_declarations_submission_id;
DROP INDEX IF EXISTS idx_declarations_clipper_submission;

-- Supprimer la colonne
ALTER TABLE declarations DROP COLUMN IF EXISTS submission_id;
```

## 📞 Support
Si tu rencontres des problèmes :
1. Vérifier les messages d'erreur
2. S'assurer que les tables existent
3. Vérifier les droits d'accès

**La migration est sécurisée et peut être exécutée sans risque !** 🎬 