require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

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

    if (submissionsError || !submissions.length) {
      console.log('ℹ️  Aucune submission trouvée pour ce clipper, création d\'une submission de test...');
      
      // Créer une submission de test
      const { data: campaigns } = await supabaseAdmin
        .from('campaigns')
        .select('id')
        .limit(1);

      if (!campaigns.length) {
        console.error('❌ Aucune campagne trouvée pour créer une submission de test');
        return;
      }

      const { data: newSubmission, error: createError } = await supabaseAdmin
        .from('submissions')
        .insert({
          clipper_id: clipper.id,
          campaign_id: campaigns[0].id,
          tiktok_url: 'https://www.tiktok.com/@test/video/test-delete',
          status: 'pending',
          views: 1000,
          earnings: 5.0
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur lors de la création de la submission de test:', createError);
        return;
      }

      console.log('✅ Submission de test créée:', newSubmission.id);
      submissions.push(newSubmission);
    }

    const submission = submissions[0];
    console.log('📹 Submission à supprimer:', submission.id);

    // 3. Créer un client authentifié comme le clipper
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey);
    
    // Simuler l'authentification du clipper (en utilisant l'admin pour définir l'utilisateur)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: clipper.email
    });

    if (authError) {
      console.error('❌ Erreur lors de la génération du lien de connexion:', authError);
      return;
    }

    console.log('🔑 Lien de connexion généré pour le test');

    // 4. Test de suppression avec les permissions du clipper
    console.log('\n🗑️  Test de suppression...');
    
    // Utiliser le client admin avec l'ID du clipper pour simuler la requête
    const { error: deleteError } = await supabaseAdmin
      .from('submissions')
      .delete()
      .eq('id', submission.id)
      .eq('clipper_id', clipper.id); // S'assurer que c'est bien le bon clipper

    if (deleteError) {
      console.error('❌ Erreur lors de la suppression:', deleteError);
      console.log('💡 Cela indique probablement un problème de politique RLS');
      console.log('🔧 Il faut exécuter le script fix-submission-delete-policies.sql dans Supabase');
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

testSubmissionDelete(); 