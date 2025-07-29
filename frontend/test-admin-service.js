const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test du service admin avec vraies données
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAdminService() {
  console.log('🧪 Test du service admin avec vraies données...\n');
  
  try {
    // Test récupération submissions
    console.log('📋 Test récupération submissions...');
    const { data: submissions, error: subError } = await supabaseAdmin
      .from('submissions')
      .select(`
        id,
        clipper_id,
        campaign_id,
        tiktok_url,
        views,
        earnings,
        status,
        created_at,
        users!inner(email, username)
      `)
      .order('created_at', { ascending: false });

    if (subError) {
      console.error('❌ Erreur submissions:', subError);
    } else {
      console.log(`✅ ${submissions.length} submissions trouvées`);
      submissions.forEach(sub => {
        console.log(`  📱 ${sub.users.email}: ${sub.tiktok_url} (${sub.views || 0} vues, €${sub.earnings || 0})`);
      });
    }

    console.log('\n📋 Test récupération declarations...');
    const { data: declarations, error: declError } = await supabaseAdmin
      .from('declarations')
      .select(`
        id,
        clipper_id,
        tiktok_url,
        declared_views,
        earnings,
        status,
        created_at,
        users!inner(email, username)
      `)
      .order('created_at', { ascending: false });

    if (declError) {
      console.error('❌ Erreur declarations:', declError);
    } else {
      console.log(`✅ ${declarations.length} declarations trouvées`);
      declarations.forEach(decl => {
        console.log(`  📱 ${decl.users.email}: ${decl.tiktok_url} (${decl.declared_views || 0} vues, €${decl.earnings || 0})`);
      });
    }

    // Combiner et grouper comme le fait le service
    console.log('\n🔄 Test groupement par clipper...');
    const allData = [];

    if (submissions) {
      submissions.forEach(sub => {
        allData.push({
          id: sub.id,
          clipper_id: sub.clipper_id,
          tiktok_url: sub.tiktok_url,
          views: sub.views || 0,
          earnings: sub.earnings || 0,
          status: sub.status,
          created_at: sub.created_at,
          clipperEmail: sub.users.email,
          source: 'submissions'
        });
      });
    }

    if (declarations) {
      declarations.forEach(decl => {
        allData.push({
          id: decl.id,
          clipper_id: decl.clipper_id,
          tiktok_url: decl.tiktok_url,
          views: decl.declared_views || 0,
          earnings: decl.earnings || 0,
          status: decl.status,
          created_at: decl.created_at,
          clipperEmail: decl.users.email,
          source: 'declarations'
        });
      });
    }

    console.log(`✅ Total ${allData.length} clips combinés`);
    
    // Grouper par clipper
    const groupedByClipper = new Map();

    allData.forEach(item => {
      const clipperId = item.clipper_id;
      if (!groupedByClipper.has(clipperId)) {
        groupedByClipper.set(clipperId, {
          clipperId,
          clipperEmail: item.clipperEmail,
          clips: [],
          totalViews: 0,
          totalEarnings: 0,
        });
      }
      const group = groupedByClipper.get(clipperId);
      group.clips.push(item);
      group.totalViews += item.views;
      group.totalEarnings += item.earnings;
    });

    const result = Array.from(groupedByClipper.values());
    console.log(`✅ ${result.length} groupes de clippers créés`);
    
    result.forEach(group => {
      console.log(`\n👤 ${group.clipperEmail}:`);
      console.log(`   📊 ${group.clips.length} clips, ${group.totalViews} vues, €${group.totalEarnings.toFixed(2)}`);
      group.clips.forEach(clip => {
        console.log(`   📱 ${clip.tiktok_url} (${clip.views} vues, €${clip.earnings}, ${clip.status})`);
      });
    });

  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testAdminService();