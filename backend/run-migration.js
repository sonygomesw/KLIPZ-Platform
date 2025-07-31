const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🔄 Début de la migration...');
    
    // Ajouter la colonne platform
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE campaigns 
        ADD COLUMN IF NOT EXISTS platform VARCHAR(20) DEFAULT 'twitch' 
        CHECK (platform IN ('twitch', 'youtube'));
      `
    });
    
    if (alterError) {
      console.error('❌ Erreur lors de l\'ajout de la colonne:', alterError);
      return;
    }
    
    console.log('✅ Colonne platform ajoutée');
    
    // Mettre à jour les campagnes existantes
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ platform: 'twitch' })
      .is('platform', null);
    
    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError);
      return;
    }
    
    console.log('✅ Campagnes existantes mises à jour');
    
    // Vérifier la structure
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'campaigns')
      .order('ordinal_position');
    
    if (checkError) {
      console.error('❌ Erreur lors de la vérification:', checkError);
      return;
    }
    
    console.log('📋 Structure de la table campaigns:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    console.log('✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

runMigration(); 