require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client admin pour les vérifications
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function testSubmissionDelete() {
  try {
    console.log('🔍 Test de suppression de clips par le clipper...\n');

    // 1. Récupérer un clipper existant
    const { data: clippers, error: clippersError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('role', 'clipper')
      .limit(1);

    if (clippersError || !clippers.length) {
      console.error('❌ Aucun clipper trouvé:', clippersError);
      return;
    }

    const clipper = clippers[0];
    console.log('👤 Clipper testé:', clipper.email);

    // 2. Récupérer une submission de ce clipper
    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('submissions')
      .select('id, clipper_id, tiktok_url, status')
      .eq('clipper_id', clipper.id)
      .limit(1);

    if (submissionsError) {
      console.error('❌ Erreur lors de la récupération des submissions:', submissionsError);
      return;
    }

    if (!submissions.length) {
      console.log('ℹ️  Aucune submission trouvée pour ce clipper');
      console.log('💡 Créez d\'abord un clip depuis l\'interface pour tester la suppression');
      return;
    }

    const submission = submissions[0];
    console.log('📹 Submission à supprimer:', {
      id: submission.id,
      url: submission.tiktok_url,
      status: submission.status
    });

    // 3. Test de suppression
    console.log('\n🗑️  Test de suppression...');
    
    const { error: deleteError } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', submission.id)
      .eq('clipper_id', clipper.id);

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      console.log('\n💡 Solutions possibles:');
      console.log('1. Vérifier les politiques RLS avec: check-submission-policies.sql');
      console.log('2. Exécuter: fix-submission-delete-policies.sql dans Supabase');
      console.log('3. Vérifier que RLS est activé sur la table submissions');
    } else {
      console.log('✅ Suppression réussie !');
      
      // Vérifier que la submission a bien été supprimée
      const { data: checkData } = await supabaseAdmin
        .from('submissions')
        .select('id')
        .eq('id', submission.id);
        
      if (checkData.length === 0) {
        console.log('✅ Confirmation: la submission a été supprimée de la base de données');
      } else {
        console.log('⚠️  La submission existe encore dans la base de données');
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Également tester les politiques RLS
async function checkRLSPolicies() {
  console.log('\n🔍 Vérification des politiques RLS...');
  
  try {
    // Compter les submissions pour vérifier l'accès
    const { data: submissions, error } = await supabaseAdmin
      .from('submissions')
      .select('id, clipper_id, status')
      .limit(5);

    if (error) {
      console.error('❌ Erreur lors de l\'accès aux submissions:', error);
    } else {
      console.log(`✅ Accès aux submissions OK: ${submissions.length} clips trouvés`);
      
      if (submissions.length > 0) {
        console.log('📊 Aperçu des submissions:');
        submissions.forEach((sub, index) => {
          console.log(`  ${index + 1}. ID: ${sub.id}, Clipper: ${sub.clipper_id}, Status: ${sub.status}`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification RLS:', error);
  }
}

async function main() {
  await checkRLSPolicies();
  await testSubmissionDelete();
}

main(); 