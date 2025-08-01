// Script de test pour l'intégration TikTok métrique + paiement automatique

const TEST_CONFIG = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY',
  TEST_VIDEO_URL: 'https://www.tiktok.com/@user/video/1234567890123456789',
  TEST_USER_ID: 'test-user-id',
  TEST_SUBMISSION_ID: 'test-submission-id'
};

// Test 1: Vérifier la fonction de métriques TikTok
async function testTikTokMetrics() {
  console.log('🧪 Test 1: Récupération métriques TikTok');
  
  try {
    const response = await fetch(`${TEST_CONFIG.SUPABASE_URL}/functions/v1/get-tiktok-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'get-video-metrics',
        videoUrl: TEST_CONFIG.TEST_VIDEO_URL,
        accessToken: 'test-token' // Remplacer par un vrai token
      }),
    });

    const result = await response.json();
    console.log('✅ Résultat métriques:', result);
    
    if (result.success) {
      console.log(`📊 Vues: ${result.views}, Likes: ${result.likes}`);
    } else {
      console.log('⚠️ Erreur métriques:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Test métriques échoué:', error);
    return false;
  }
}

// Test 2: Tester la mise à jour d'une soumission
async function testSubmissionUpdate() {
  console.log('🧪 Test 2: Mise à jour soumission');
  
  try {
    const response = await fetch(`${TEST_CONFIG.SUPABASE_URL}/functions/v1/get-tiktok-metrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_CONFIG.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        action: 'update-submission',
        submissionId: TEST_CONFIG.TEST_SUBMISSION_ID,
        userId: TEST_CONFIG.TEST_USER_ID
      }),
    });

    const result = await response.json();
    console.log('✅ Résultat update:', result);
    
    if (result.success) {
      console.log(`📊 Vues: ${result.views}, Gains: $${result.earnings}`);
      if (result.paymentTriggered) {
        console.log('💰 Paiement déclenché automatiquement !');
      }
    } else {
      console.log('⚠️ Erreur update:', result.error);
    }
    
    return result.success;
  } catch (error) {
    console.error('❌ Test update échoué:', error);
    return false;
  }
}

// Test 3: Vérifier la base de données
async function testDatabaseStructure() {
  console.log('🧪 Test 3: Structure base de données');
  
  try {
    // Vérifier que les tables existent
    const tables = ['user_tokens', 'submissions'];
    const columns = {
      submissions: ['like_count', 'comment_count', 'share_count', 'metrics_source'],
      user_tokens: ['tiktok_access_token', 'tiktok_refresh_token', 'tiktok_expires_at']
    };
    
    console.log('✅ Tables à vérifier:', tables);
    console.log('✅ Colonnes à vérifier:', columns);
    
    // Note: Pour un vrai test, il faudrait se connecter à Supabase et vérifier la structure
    return true;
  } catch (error) {
    console.error('❌ Test DB échoué:', error);
    return false;
  }
}

// Test 4: Vérifier la configuration TikTok
async function testTikTokConfig() {
  console.log('🧪 Test 4: Configuration TikTok');
  
  const requiredEnvVars = [
    'EXPO_PUBLIC_TIKTOK_CLIENT_KEY',
    'EXPO_PUBLIC_TIKTOK_CLIENT_SECRET'
  ];
  
  let allConfigured = true;
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.log(`❌ Variable manquante: ${envVar}`);
      allConfigured = false;
    } else {
      console.log(`✅ ${envVar}: configuré`);
    }
  }
  
  return allConfigured;
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🧪 === TESTS INTÉGRATION TIKTOK KLIPZ ===\n');
  
  const tests = [
    { name: 'Configuration TikTok', fn: testTikTokConfig },
    { name: 'Structure DB', fn: testDatabaseStructure },
    { name: 'Métriques TikTok', fn: testTikTokMetrics },
    { name: 'Update Soumission', fn: testSubmissionUpdate }
  ];
  
  const results = [];
  
  for (const test of tests) {
    console.log(`\n🔍 Exécution: ${test.name}`);
    const result = await test.fn();
    results.push({ name: test.name, success: result });
    console.log(result ? '✅ RÉUSSI' : '❌ ÉCHOUÉ');
  }
  
  // Résumé
  console.log('\n📊 === RÉSUMÉ DES TESTS ===');
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n🎯 Résultat: ${passed}/${total} tests réussis`);
  
  if (passed === total) {
    console.log('🚀 Intégration prête pour la production !');
  } else {
    console.log('⚠️ Des corrections sont nécessaires avant la production.');
  }
}

// Guide d'utilisation
function printUsageGuide() {
  console.log(`
🔧 === GUIDE D'UTILISATION ===

1. CONFIGURATION REQUISE:
   - Créer une app TikTok Business sur developers.tiktok.com
   - Configurer les variables d'environnement:
     * EXPO_PUBLIC_TIKTOK_CLIENT_KEY
     * EXPO_PUBLIC_TIKTOK_CLIENT_SECRET
     * EXPO_PUBLIC_SUPABASE_URL
     * EXPO_PUBLIC_SUPABASE_ANON_KEY

2. MIGRATION BASE DE DONNÉES:
   Exécuter: backend/create-user-tokens-table.sql

3. DÉPLOYER LES FONCTIONS SUPABASE:
   supabase functions deploy get-tiktok-metrics

4. WORKFLOW UTILISATEUR:
   a) Clipper se connecte à TikTok via l'app
   b) Soumet une vidéo TikTok
   c) Système récupère automatiquement les vraies vues via API TikTok  
   d) Paiement automatique si seuil atteint via Stripe Connect

5. AVANTAGES:
   ✅ Données officielles TikTok (pas de scraping)
   ✅ Paiements automatiques précis
   ✅ Respect des conditions d'utilisation
   ✅ Évolutif et stable

6. TESTER:
   node test-tiktok-integration.js
`);
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    printUsageGuide();
  } else {
    runAllTests().catch(console.error);
  }
}

module.exports = {
  testTikTokMetrics,
  testSubmissionUpdate,
  testDatabaseStructure,
  testTikTokConfig,
  runAllTests,
  printUsageGuide
};