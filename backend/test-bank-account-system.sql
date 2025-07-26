-- Script de test pour le système de comptes bancaires
-- À exécuter après avoir créé la table bank_accounts

-- 1. Vérifier que la table existe
SELECT 
  'Table bank_accounts' as info,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'bank_accounts'
  ) as table_exists;

-- 2. Vérifier les politiques RLS
SELECT 
  'Politiques RLS' as info,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'bank_accounts';

-- 3. Insérer un compte bancaire de test (remplacez l'user_id par un vrai ID)
-- INSERT INTO bank_accounts (user_id, iban, account_holder_name, bank_name, is_primary)
-- VALUES (
--   '176e5de1-c4d9-4b5d-9f0c-b37a17e90f20', -- Remplacez par votre user_id
--   'FR7630006000011234567890189',
--   'Jean Dupont',
--   'Crédit Agricole',
--   true
-- );

-- 4. Voir les comptes bancaires existants
SELECT 
  'Comptes bancaires existants' as info,
  ba.id,
  ba.user_id,
  u.email,
  ba.account_holder_name,
  ba.iban,
  ba.bank_name,
  ba.is_primary,
  ba.is_verified,
  ba.created_at
FROM bank_accounts ba
JOIN users u ON ba.user_id = u.id
ORDER BY ba.created_at DESC;

-- 5. Vérifier la fonction de validation IBAN
SELECT 
  'Test validation IBAN' as info,
  'FR7630006000011234567890189' as iban,
  validate_iban('FR7630006000011234567890189') as is_valid;

-- 6. Voir les utilisateurs clippers sans compte bancaire
SELECT 
  'Clippers sans compte bancaire' as info,
  u.id,
  u.email,
  u.balance
FROM users u
WHERE u.role = 'clipper'
  AND NOT EXISTS (
    SELECT 1 FROM bank_accounts ba WHERE ba.user_id = u.id
  ); 