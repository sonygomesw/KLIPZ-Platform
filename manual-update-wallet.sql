-- Script pour mettre à jour manuellement le wallet de speed@gmail.com
-- Remplacez 'AMOUNT' par le montant que vous avez payé

-- 1. Trouver l'utilisateur
SELECT id, email, role, balance FROM users WHERE email = 'speed@gmail.com';

-- 2. Mettre à jour le wallet (remplacez AMOUNT par le montant réel, par exemple 10.00)
UPDATE wallets 
SET balance = balance + 10.00, 
    updated_at = NOW() 
WHERE user_id = (
    SELECT id FROM users WHERE email = 'speed@gmail.com'
);

-- 3. Mettre à jour la balance utilisateur
UPDATE users 
SET balance = balance + 10.00 
WHERE email = 'speed@gmail.com';

-- 4. Vérifier le résultat
SELECT 
    u.id,
    u.email,
    u.role,
    u.balance as user_balance,
    w.balance as wallet_balance,
    w.updated_at
FROM users u 
LEFT JOIN wallets w ON u.id = w.user_id 
WHERE u.email = 'speed@gmail.com'; 