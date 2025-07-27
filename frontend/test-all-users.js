// Script pour voir tous les utilisateurs
const SUPABASE_URL = 'https://ajbfgeojhfbtbmouynva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYmZnZW9qaGZidGJtb3V5bnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODYxMTYsImV4cCI6MjA2ODE2MjExNn0.qAmwnMgKCg8vY_LKcYrJHaAp7rCvmro9cwpXrFS574A';

async function testAllUsers() {
  console.log('🔍 Test de tous les utilisateurs...');
  
  try {
    // Test 1: Voir tous les utilisateurs
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,email,role,balance,created_at&limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const users = await userResponse.json();
    console.log('👤 Tous les utilisateurs:', users);
    
    // Test 2: Voir tous les wallets
    const walletResponse = await fetch(`${SUPABASE_URL}/rest/v1/wallets?select=user_id,balance,created_at,updated_at&limit=10`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    const wallets = await walletResponse.json();
    console.log('💰 Tous les wallets:', wallets);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Exécuter le test
testAllUsers(); 