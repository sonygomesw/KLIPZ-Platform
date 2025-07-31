const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPlatformSimple() {
  try {
    console.log('🔍 Test simple de la colonne platform...');
    
    // 1. Vérifier les données existantes
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('id, title, platform, status')
      .limit(5);
    
    if (campaignsError) {
      console.error('❌ Erreur lors de la récupération des campagnes:', campaignsError);
      return;
    }
    
    console.log('📊 Campagnes existantes:');
    campaigns.forEach(campaign => {
      console.log(`  - ${campaign.title}: platform=${campaign.platform}, status=${campaign.status}`);
    });
    
    // 2. Tester l'insertion d'une campagne de test
    const testCampaign = {
      streamer_id: '00000000-0000-0000-0000-000000000000', // ID de test
      title: 'Test Campaign Platform',
      description: 'Test description',
      platform: 'twitch',
      budget_total: 1000,
      budget_remaining: 1000,
      cpm_rate: 0.3,
      status: 'active'
    };
    
    console.log('🔄 Tentative d\'insertion de test...');
    const { data: newCampaign, error: insertError } = await supabase
      .from('campaigns')
      .insert(testCampaign)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion de test:', insertError);
      console.error('Détails:', insertError.message);
      return;
    }
    
    console.log('✅ Insertion de test réussie:', newCampaign);
    
    // 3. Nettoyer la campagne de test
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', newCampaign.id);
    
    if (deleteError) {
      console.error('⚠️ Erreur lors du nettoyage:', deleteError);
    } else {
      console.log('✅ Nettoyage réussi');
    }
    
    console.log('✅ Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testPlatformSimple(); 