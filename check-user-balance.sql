-- Vérifier le solde de l'utilisateur speed@gmail.com
SELECT 
    u.id,
    u.email,
    u.role,
    u.balance as user_balance,
    w.balance as wallet_balance,
    w.created_at as wallet_created,
    w.updated_at as wallet_updated
FROM users u 
LEFT JOIN wallets w ON u.id = w.user_id 
WHERE u.email = 'speed@gmail.com';

-- Vérifier tous les utilisateurs avec leurs soldes
SELECT 
    u.id,
    u.email,
    u.role,
    u.balance as user_balance,
    w.balance as wallet_balance
FROM users u 
LEFT JOIN wallets w ON u.id = w.user_id 
ORDER BY u.created_at DESC;

-- Vérifier les transactions de paiement Stripe
SELECT 
    id,
    user_id,
    amount,
    status,
    created_at,
    updated_at
FROM stripe_payments 
ORDER BY created_at DESC 
LIMIT 10; 