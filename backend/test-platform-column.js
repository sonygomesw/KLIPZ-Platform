const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPlatformColumn() {
  try {
    console.log('🔍 Test de la colonne platform...');
    
    // 1. Vérifier la structure de la table
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'campaigns')
      .order('ordinal_position');
    
    if (columnsError) {
      console.error('❌ Erreur lors de la vérification des colonnes:', columnsError);
      return;
    }
    
    console.log('📋 Colonnes de la table campaigns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // 2. Vérifier les données existantes
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
    
    // 3. Tester l'insertion d'une campagne de test
    const testCampaign = {
      streamer_id: '00000000-0000-0000-0000-000000000000', // ID de test
      title: 'Test Campaign',
      description: 'Test description',
      platform: 'twitch',
      budget_total: 1000,
      budget_remaining: 1000,
      cpm_rate: 0.3,
      status: 'active'
    };
    
    const { data: newCampaign, error: insertError } = await supabase
      .from('campaigns')
      .insert(testCampaign)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Erreur lors de l\'insertion de test:', insertError);
      return;
    }
    
    console.log('✅ Insertion de test réussie:', newCampaign);
    
    // 4. Nettoyer la campagne de test
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

testPlatformColumn(); 