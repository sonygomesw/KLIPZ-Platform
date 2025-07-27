const SUPABASE_URL = 'https://ajbfgeojhfbtbmouynva.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqYmZnZW9qaGZidGJtb3V5bnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NzI4NzQsImV4cCI6MjA0NzU0ODg3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testScraping() {
  try {
    console.log('🧪 Testing scraping function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-views`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testScraping(); 