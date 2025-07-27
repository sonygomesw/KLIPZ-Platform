-- Fonction pour vérifier le solde d'un utilisateur
CREATE OR REPLACE FUNCTION check_user_balance(user_email TEXT)
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    user_balance DECIMAL,
    wallet_balance DECIMAL,
    wallet_created TIMESTAMP,
    wallet_updated TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
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
    WHERE u.email = user_email;
END;
$$;

-- Fonction pour voir tous les utilisateurs avec leurs soldes
CREATE OR REPLACE FUNCTION get_all_users_balance()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    role TEXT,
    user_balance DECIMAL,
    wallet_balance DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.role,
        u.balance as user_balance,
        w.balance as wallet_balance
    FROM users u 
    LEFT JOIN wallets w ON u.id = w.user_id 
    ORDER BY u.created_at DESC;
END;
$$; 