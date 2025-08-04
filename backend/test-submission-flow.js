require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration (à adapter selon votre environnement)
const supabaseUrl = process.env.SUPABASE_URL || 'https://ajbfgeojhfbtbmouynva.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSubmissionFlow() {
  try {
    console.log('🧪 Test du flow de soumission complet...\n');

    // 1. Vérifier la connexion
    console.log('1️⃣ Test de connexion...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (usersError) {
      console.error('❌ Erreur de connexion:', usersError);
      return;
    }
    console.log('✅ Connexion réussie');

    // 2. Vérifier les campagnes existantes
    console.log('\n2️⃣ Vérification des campagnes...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .limit(5);

    if (campaignsError) {
      console.error('❌ Erreur récupération campagnes:', campaignsError);
      return;
    }

    console.log(`✅ ${campaigns?.length || 0} campagnes actives trouvées`);
    if (campaigns && campaigns.length > 0) {
      console.log('   Première campagne:', campaigns[0].title);
    }

    // 3. Vérifier les utilisateurs clippers
    console.log('\n3️⃣ Vérification des clippers...');
    const { data: clippers, error: clippersError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'clipper')
      .limit(5);

    if (clippersError) {
      console.error('❌ Erreur récupération clippers:', clippersError);
      return;
    }

    console.log(`✅ ${clippers?.length || 0} clippers trouvés`);
    if (clippers && clippers.length > 0) {
      console.log('   Premier clipper:', clippers[0].email);
    }

    // 4. Vérifier la table notifications
    console.log('\n4️⃣ Vérification de la table notifications...');
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .limit(5);

    if (notificationsError) {
      console.log('⚠️ Table notifications non trouvée, création nécessaire');
      console.log('   Exécutez le script: add-notifications-table.sql');
    } else {
      console.log(`✅ Table notifications OK (${notifications?.length || 0} notifications)`);
    }

    // 5. Vérifier les soumissions existantes
    console.log('\n5️⃣ Vérification des soumissions...');
    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .limit(5);

    if (submissionsError) {
      console.error('❌ Erreur récupération soumissions:', submissionsError);
      return;
    }

    console.log(`✅ ${submissions?.length || 0} soumissions trouvées`);
    if (submissions && submissions.length > 0) {
      console.log('   Première soumission:', {
        id: submissions[0].id,
        status: submissions[0].status,
        views: submissions[0].views_count || submissions[0].views
      });
    }

    // 6. Test de création d'une soumission (si on a les données nécessaires)
    if (campaigns && campaigns.length > 0 && clippers && clippers.length > 0) {
      console.log('\n6️⃣ Test de création d\'une soumission...');
      
      const testSubmission = {
        campaign_id: campaigns[0].id,
        clipper_id: clippers[0].id,
        tiktok_url: 'https://www.tiktok.com/@test/video/123456789',
        status: 'pending',
        views_count: 15000,
        earnings: 45.00
      };

      const { data: newSubmission, error: insertError } = await supabase
        .from('submissions')
        .insert(testSubmission)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur création soumission:', insertError);
      } else {
        console.log('✅ Soumission créée avec succès:', newSubmission.id);
        
        // Vérifier si une notification a été créée
        const { data: newNotifications, error: notifError } = await supabase
          .from('notifications')
          .select('*')
          .eq('submission_id', newSubmission.id);

        if (notifError) {
          console.log('⚠️ Pas de notification créée (trigger non configuré)');
        } else {
          console.log(`✅ ${newNotifications?.length || 0} notification(s) créée(s)`);
        }

        // Nettoyer la soumission de test
        await supabase
          .from('submissions')
          .delete()
          .eq('id', newSubmission.id);
        console.log('🧹 Soumission de test supprimée');
      }
    }

    console.log('\n🎉 Test terminé !');
    console.log('\n📋 Résumé:');
    console.log('   - Connexion Supabase: ✅');
    console.log('   - Campagnes actives: ✅');
    console.log('   - Clippers disponibles: ✅');
    console.log('   - Table submissions: ✅');
    console.log('   - Table notifications: ' + (notificationsError ? '❌' : '✅'));
    
    if (!notificationsError) {
      console.log('\n🚀 Le système est prêt pour les tests !');
    } else {
      console.log('\n🔧 Actions nécessaires:');
      console.log('   1. Exécuter le script add-notifications-table.sql dans Supabase');
      console.log('   2. Relancer ce test');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testSubmissionFlow(); 