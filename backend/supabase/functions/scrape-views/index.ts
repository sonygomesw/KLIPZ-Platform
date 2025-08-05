import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Fonction pour extraire les vues d'une URL TikTok (version propre - pas de vues fictives)
async function scrapeTikTokViews(url: string): Promise<number> {
  try {
    console.log('🔍 Scraping TikTok views for:', url);
    
    // Pour l'instant, on retourne 0 car on va implémenter un vrai scraping
    // Plus de vues fictives/aléatoires !
    console.log('⚠️ Real scraping not implemented yet, returning 0 views');
    return 0;
    
    // TODO: Implémenter le vrai scraping TikTok ici
    // Options possibles :
    // 1. API TikTok officielle
    // 2. Service tiers (RapidAPI, etc.)
    // 3. Headless browser service
    
  } catch (error) {
    console.error('❌ Error scraping TikTok views:', error);
    return 0; // Retourner 0 au lieu de vues fictives
  }
}

// Fonction pour extraire les vues du HTML (approche améliorée)
function extractViewsFromHTML(html: string): number {
  try {
    // Patterns spécifiques à TikTok (plus complets)
    const patterns = [
      // Patterns JSON dans le HTML
      /"videoCount":\s*(\d+)/,
      /"viewCount":\s*(\d+)/,
      /"views":\s*(\d+)/,
      /"play_count":\s*(\d+)/,
      /"playCount":\s*(\d+)/,
      
      // Patterns dans les meta tags
      /"og:video:views":\s*"(\d+)"/,
      /"video:views":\s*"(\d+)"/,
      
      // Patterns dans le texte visible
      /(\d+(?:\.\d+)?[KMB]?)\s*views/i,
      /(\d+(?:\.\d+)?[KMB]?)\s*vues/i,
      /(\d+(?:\.\d+)?[KMB]?)\s*visualizações/i,
      
      // Patterns TikTok spécifiques
      /"statistics":\s*{[^}]*"play_count":\s*(\d+)/,
      /"stats":\s*{[^}]*"playCount":\s*(\d+)/,
      
      // Patterns pour les nombres avec virgules
      /(\d{1,3}(?:,\d{3})*)\s*views/i,
      /(\d{1,3}(?:,\d{3})*)\s*vues/i,
    ];
    
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const value = match[1];
        const parsed = parseViewsText(value);
        if (parsed > 0) {
          console.log('✅ Found views with pattern:', pattern.source, 'Value:', value, 'Parsed:', parsed);
          return parsed;
        }
      }
    }
    
    // Si aucun pattern trouvé, retourner 0 (pas de vues fictives)
    console.log('⚠️ No views pattern found in HTML, returning 0');
    return 0;
    
  } catch (error) {
    console.error('❌ Error extracting views from HTML:', error);
    return 0; // Retourner 0 au lieu de vues fictives
  }
}

// Parser le texte des vues (ex: "1.2M" → 1200000)
function parseViewsText(viewsText: string): number {
  if (!viewsText) return 0;
  
  const cleanText = viewsText.trim().toLowerCase();
  
  // Gérer les formats avec virgules (ex: "822,000")
  if (cleanText.includes(',')) {
    const number = parseInt(cleanText.replace(/,/g, ''));
    return isNaN(number) ? 0 : number;
  }
  
  // Gérer les formats avec points (ex: "822.5K")
  if (cleanText.includes('m')) {
    const number = parseFloat(cleanText.replace(/[^\d.]/g, ''));
    return Math.round(number * 1000000);
  }
  
  if (cleanText.includes('k')) {
    const number = parseFloat(cleanText.replace(/[^\d.]/g, ''));
    return Math.round(number * 1000);
  }
  
  if (cleanText.includes('b')) {
    const number = parseFloat(cleanText.replace(/[^\d.]/g, ''));
    return Math.round(number * 1000000000);
  }
  
  // Nettoyer les caractères non-numériques et parser
  const number = parseInt(cleanText.replace(/[^\d]/g, ''));
  return isNaN(number) ? 0 : number;
}

// Fonction principale pour scraper et mettre à jour les vues
async function scrapeAndUpdateViews() {
  try {
    console.log('🚀 Starting view scraping job...');
    
    // Récupérer toutes les soumissions en attente
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        campaigns (
          cpm_rate,
          required_views
        )
      `)
      .eq('status', 'approved')
      .is('paid_at', null);
    
    if (error) throw error;
    
    console.log(`📊 Found ${submissions?.length || 0} submissions to check`);
    
    for (const submission of submissions || []) {
      try {
        console.log(`🔍 Processing submission ${submission.id}...`);
        
        // Scraper les vues
        const views = await scrapeTikTokViews(submission.tiktok_url);
        
        // Calculer les gains
        const cpm = submission.campaigns?.cpm_rate || 0.03;
        const earnings = (views / 1000) * cpm;
        
        // Mettre à jour la soumission
        const { error: updateError } = await supabase
          .from('submissions')
          .update({
            views: views,
            earnings: earnings,
            updated_at: new Date().toISOString()
          })
          .eq('id', submission.id);
        
        if (updateError) throw updateError;
        
        console.log(`✅ Updated submission ${submission.id}: ${views} views, $${earnings.toFixed(2)} earnings`);
        
        // Vérifier si le seuil de vues est atteint pour le paiement
        const requiredViews = submission.campaigns?.required_views || 0;
        if (views >= requiredViews && submission.status !== 'paid') {
          console.log(`💰 Triggering payment for submission ${submission.id}...`);
          
          // Marquer comme payé
          const { error: paidError } = await supabase
            .from('submissions')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
              paid_amount: earnings
            })
            .eq('id', submission.id);
          
          if (paidError) throw paidError;
          
          console.log(`✅ Payment triggered for submission ${submission.id}`);
        }
        
        // Attendre entre chaque requête pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (submissionError) {
        console.error(`❌ Error processing submission ${submission.id}:`, submissionError);
        // Continuer avec les autres soumissions
      }
    }
    
    console.log('✅ View scraping job completed');
    
  } catch (error) {
    console.error('❌ Error in scraping job:', error);
    throw error;
  }
}

// Endpoint principal
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Bypass authentication for this function
  console.log('🔓 Scraping function called - bypassing authentication');

  try {
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { action } = body;
    
    if (action === 'scrape-all') {
      await scrapeAndUpdateViews();
      return new Response(JSON.stringify({ success: true, message: 'Scraping completed' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    if (action === 'scrape-single') {
      const { url } = body;
      if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      const views = await scrapeTikTokViews(url);
      return new Response(JSON.stringify({ success: true, views }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}); 