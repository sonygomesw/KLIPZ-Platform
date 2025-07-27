// Script pour tester le solde de l'utilisateur
const SUPABASE_URL = 'https://ajbfgeojhfbtbmouynva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYmZnZW9qaGZidGJtb3V5bnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODYxMTYsImV4cCI6MjA2ODE2MjExNn0.qAmwnMgKCg8vY_LKcYrJHaAp7rCvmro9cwpXrFS574A';

async function testUserBalance() {
  console.log('🔍 Test du solde utilisateur...');
  
  try {
    // Test 1: Vérifier l'utilisateur
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?email=eq.speed@gmail.com&select=id,email,role,balance`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const users = await userResponse.json();
    console.log('👤 Utilisateurs trouvés:', users);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('✅ Utilisateur trouvé:', {
        id: user.id,
        email: user.email,
        role: user.role,
        balance: user.balance
      });
      
      // Test 2: Vérifier le wallet
      const walletResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallets?user_id=eq.${user.id}&select=balance,created_at,updated_at`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      const wallets = await walletResponse.json();
      console.log('💰 Wallets trouvés:', wallets);
      
      if (wallets.length > 0) {
        const wallet = wallets[0];
        console.log('✅ Wallet trouvé:', {
          balance: wallet.balance,
          created_at: wallet.created_at,
          updated_at: wallet.updated_at
        });
      } else {
        console.log('❌ Aucun wallet trouvé pour cet utilisateur');
      }
    } else {
      console.log('❌ Aucun utilisateur trouvé avec cet email');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le test
testUserBalance(); 