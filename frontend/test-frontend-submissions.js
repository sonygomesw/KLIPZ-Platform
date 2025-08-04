// Script de test pour vérifier le problème frontend
console.log('🔍 Test Frontend - Soumissions');

// Simuler un environnement de test
global.process = { env: {
  EXPO_PUBLIC_SUPABASE_URL: 'https://ajbfgeojhfbtbmouynva.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYmZnZW9qaGZidGJtb3V5bnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODYxMTYsImV4cCI6MjA2ODE2MjExNn0.qAmwnMgKCg8vY_LKcYrJH_aAp7rCvmro9cwpXrFS574A'
}};

// Simuler React Native
global.Alert = {
  alert: (title, message) => console.log(`Alert: ${title} - ${message}`)
};

// Importation des services (simplified)
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testFrontendSubmissions() {
  console.log('\n📋 Test des soumissions côté frontend...\n');

  try {
    // 1. Récupérer un clipper
    const { data: users } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('role', 'clipper')
      .limit(1);

    if (!users || users.length === 0) {
      console.log('❌ Aucun clipper trouvé');
      console.log('Users data:', users);
      return;
    }

    const clipper = users[0];
    console.log(`📌 Test avec clipper: ${clipper.email} (${clipper.id})`);

    // 2. Récupérer ses soumissions via la même méthode que le frontend
    console.log('\n🔍 Récupération des soumissions...');
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        users!submissions_clipper_id_fkey (
          email
        )
      `)
      .eq('clipper_id', clipper.id)
      .order('submitted_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur Supabase:', error);
      return;
    }

    console.log(`✅ ${submissions.length} soumissions trouvées:`);
    submissions.forEach((sub, index) => {
      console.log(`   ${index + 1}. ID: ${sub.id}`);
      console.log(`      URL: ${sub.tiktok_url}`);
      console.log(`      Status: ${sub.status}`);
      console.log(`      Views: ${sub.views}`);
      console.log(`      Earnings: $${sub.earnings}`);
      console.log(`      Campaign ID: ${sub.campaign_id}`);
      console.log(`      Submitted: ${sub.submitted_at}`);
      console.log('');
    });

    // 3. Tester avec une campagne active
    console.log('🔍 Récupération d\'une campagne active...');
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, title, status, cpm_rate')
      .eq('status', 'active')
      .limit(1);

    if (campaigns.length === 0) {
      console.log('❌ Aucune campagne active trouvée');
      return;
    }

    const campaign = campaigns[0];
    console.log(`✅ Campagne active trouvée: ${campaign.title} (${campaign.id})`);

    // 4. Simuler une soumission
    console.log('\n🚀 Simulation d\'une soumission...');
    const testSubmission = {
      campaign_id: campaign.id,
      clipper_id: clipper.id,
      tiktok_url: `https://www.tiktok.com/@test/video/frontend-test-${Date.now()}`,
      status: 'pending',
      views: Math.floor(Math.random() * 50000) + 10000,
      earnings: 0,
      submitted_at: new Date().toISOString(),
    };

    testSubmission.earnings = (testSubmission.views / 1000) * campaign.cpm_rate;

    console.log('📝 Données de test:');
    console.log(`   URL: ${testSubmission.tiktok_url}`);
    console.log(`   Views: ${testSubmission.views.toLocaleString()}`);
    console.log(`   Earnings: $${testSubmission.earnings.toFixed(2)}`);

    const { data: newSub, error: insertError } = await supabase
      .from('submissions')
      .insert(testSubmission)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError);
      return;
    }

    console.log('✅ Soumission créée avec ID:', newSub.id);

    // 5. Vérifier qu'elle apparaît bien dans la liste
    console.log('\n🔍 Vérification de la nouvelle soumission...');
    const { data: updatedSubmissions } = await supabase
      .from('submissions')
      .select('id, tiktok_url, status, views, earnings')
      .eq('clipper_id', clipper.id)
      .order('submitted_at', { ascending: false });

    console.log(`✅ ${updatedSubmissions.length} soumissions (incluant la nouvelle):`);
    updatedSubmissions.slice(0, 3).forEach((sub, index) => {
      const isNew = sub.id === newSub.id;
      console.log(`   ${index + 1}. ${isNew ? '🆕 ' : ''}${sub.tiktok_url.substring(0, 50)}... (${sub.status})`);
    });

    // 6. Nettoyer
    console.log('\n🧹 Nettoyage...');
    await supabase.from('submissions').delete().eq('id', newSub.id);
    console.log('✅ Soumission de test supprimée');

    console.log('\n🎉 Test frontend terminé avec succès!');
    console.log('\n💡 Recommandations:');
    console.log('   1. Vérifiez que l\'écran My Clips se rafraîchit après soumission');
    console.log('   2. Ajoutez des logs dans AvailableMissionsScreen.handleSubmitClip');
    console.log('   3. Vérifiez que l\'ID utilisateur est correct lors de la soumission');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testFrontendSubmissions(); 