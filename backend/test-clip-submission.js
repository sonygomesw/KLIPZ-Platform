require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variables d\'environnement manquantes');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testClipSubmission() {
  console.log('🔍 Test du flow de soumission de clips...\n');

  try {
    // 1. Vérifier les utilisateurs existants
    console.log('1. 📋 Vérification des utilisateurs...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('❌ Erreur users:', usersError);
      return;
    }

    console.log(`✅ ${users.length} utilisateurs trouvés:`);
    users.forEach(user => console.log(`   - ${user.email} (${user.role})`));

    const clipper = users.find(u => u.role === 'clipper');
    if (!clipper) {
      console.log('❌ Aucun clipper trouvé');
      return;
    }

    console.log(`📌 Clipper de test: ${clipper.email}\n`);

    // 2. Vérifier les campagnes actives
    console.log('2. 📋 Vérification des campagnes actives...');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select(`
        id, 
        title, 
        status, 
        cpm_rate,
        criteria,
        users!campaigns_streamer_id_fkey (email)
      `)
      .eq('status', 'active')
      .limit(3);

    if (campaignsError) {
      console.error('❌ Erreur campaigns:', campaignsError);
      return;
    }

    console.log(`✅ ${campaigns.length} campagnes actives trouvées:`);
    campaigns.forEach(campaign => {
      console.log(`   - ${campaign.title} (CPM: $${campaign.cpm_rate}) - ${campaign.users?.email}`);
    });

    if (campaigns.length === 0) {
      console.log('❌ Aucune campagne active trouvée');
      return;
    }

    const testCampaign = campaigns[0];
    console.log(`📌 Campagne de test: ${testCampaign.title}\n`);

    // 3. Vérifier les soumissions existantes
    console.log('3. 📋 Vérification des soumissions existantes...');
    const { data: existingSubmissions, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id, 
        tiktok_url, 
        status, 
        views, 
        earnings,
        submitted_at,
        campaigns (title),
        users!submissions_clipper_id_fkey (email)
      `)
      .order('submitted_at', { ascending: false })
      .limit(5);

    if (submissionsError) {
      console.error('❌ Erreur submissions:', submissionsError);
      return;
    }

    console.log(`✅ ${existingSubmissions.length} soumissions trouvées:`);
    existingSubmissions.forEach(sub => {
      console.log(`   - ${sub.campaigns?.title} par ${sub.users?.email} (${sub.status}) - ${sub.views} vues`);
    });

    // 4. Créer une soumission de test
    console.log('\n4. 🚀 Création d\'une soumission de test...');
    const testUrl = `https://www.tiktok.com/@test/video/test-${Date.now()}`;
    
    const submissionData = {
      campaign_id: testCampaign.id,
      clipper_id: clipper.id,
      tiktok_url: testUrl,
      status: 'pending',
      views: Math.floor(Math.random() * 50000) + 10000, // Vues aléatoires
      earnings: 0, // Sera calculé
      submitted_at: new Date().toISOString(),
    };

    // Calculer les gains
    submissionData.earnings = (submissionData.views / 1000) * testCampaign.cpm_rate;

    console.log('📝 Données de soumission:');
    console.log(`   - URL: ${submissionData.tiktok_url}`);
    console.log(`   - Vues: ${submissionData.views.toLocaleString()}`);
    console.log(`   - Gains: $${submissionData.earnings.toFixed(2)}`);

    const { data: newSubmission, error: insertError } = await supabase
      .from('submissions')
      .insert(submissionData)
      .select(`
        *,
        campaigns (title, cpm_rate),
        users!submissions_clipper_id_fkey (email)
      `)
      .single();

    if (insertError) {
      console.error('❌ Erreur insertion:', insertError);
      return;
    }

    console.log('✅ Soumission créée avec succès!');
    console.log(`   - ID: ${newSubmission.id}`);
    console.log(`   - Statut: ${newSubmission.status}`);
    console.log(`   - Gains: $${newSubmission.earnings.toFixed(2)}\n`);

    // 5. Vérifier les notifications
    console.log('5. 📋 Vérification des notifications...');
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    if (notifError) {
      console.warn('⚠️ Erreur notifications (table peut ne pas exister):', notifError.message);
    } else {
      console.log(`✅ ${notifications.length} notifications trouvées`);
      notifications.forEach(notif => {
        console.log(`   - ${notif.message} (${notif.type})`);
      });
    }

    // 6. Nettoyer (supprimer la soumission de test)
    console.log('\n6. 🧹 Nettoyage de la soumission de test...');
    const { error: deleteError } = await supabase
      .from('submissions')
      .delete()
      .eq('id', newSubmission.id);

    if (deleteError) {
      console.warn('⚠️ Erreur lors du nettoyage:', deleteError);
    } else {
      console.log('✅ Soumission de test supprimée');
    }

    console.log('\n🎉 Test du flow de soumission terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testClipSubmission(); 