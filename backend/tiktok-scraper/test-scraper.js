const TikTokScraper = require('./tiktok-scraper');

async function testScraper() {
  const scraper = new TikTokScraper();
  
  try {
    console.log('🧪 Testing TikTok Scraper...');
    
    // Test URL
    const testUrl = 'https://www.tiktok.com/@houseofhustling/video/7304806487388474625';
    
    console.log(`🔍 Testing URL: ${testUrl}`);
    
    // Initialiser le navigateur
    const initialized = await scraper.initBrowser();
    if (!initialized) {
      console.error('❌ Failed to initialize browser');
      return;
    }
    
    // Scraper les vues
    const views = await scraper.scrapeViews(testUrl);
    
    console.log(`✅ Scraped views: ${views.toLocaleString()}`);
    
    if (views >= 800000) {
      console.log('🎉 Excellent! Found realistic view count');
    } else if (views >= 10000) {
      console.log('⚠️ Better, but might need proxy configuration');
    } else {
      console.log('❌ Still getting low view count - TikTok blocking detected');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await scraper.closeBrowser();
  }
}

// Test de l'API si elle est en cours d'exécution
async function testAPI() {
  try {
    console.log('\n🌐 Testing API endpoints...');
    
    const baseUrl = 'http://localhost:3001';
    
    // Test health
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test scrape single
    const scrapeResponse = await fetch(`${baseUrl}/scrape-single`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.API_KEY || 'test'
      },
      body: JSON.stringify({
        url: 'https://www.tiktok.com/@houseofhustling/video/7304806487388474625'
      })
    });
    
    const scrapeData = await scrapeResponse.json();
    console.log('✅ Scrape single:', scrapeData);
    
  } catch (error) {
    console.log('⚠️ API test failed (server might not be running):', error.message);
  }
}

// Exécuter les tests
async function runTests() {
  console.log('🚀 Starting TikTok Scraper tests...\n');
  
  await testScraper();
  await testAPI();
  
  console.log('\n✅ Tests completed');
}

runTests(); 