const SUPABASE_URL = 'https://ajbfgeojhfbtbmouynva.supabase.co';

async function testScrapingImproved() {
  try {
    console.log('🧪 Testing improved scraping function...');
    
    // Test sans header d'autorisation (puisque nous avons désactivé l'auth)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'scrape-single',
        url: 'https://www.tiktok.com/@houseofhustling/video/7304806487388474625'
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Scraping result:', data);
    
    if (data.views) {
      console.log(`🎯 Views found: ${data.views.toLocaleString()}`);
      
      if (data.views >= 800000) {
        console.log('✅ Excellent! Found realistic view count');
      } else if (data.views >= 10000) {
        console.log('⚠️ Better, but still might not be accurate');
      } else {
        console.log('❌ Still getting low view count - TikTok blocking us');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testScrapingImproved(); 