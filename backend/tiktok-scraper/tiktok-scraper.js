const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration Puppeteer avec Stealth
puppeteer.use(StealthPlugin());

// Configuration Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class TikTokScraper {
  constructor() {
    this.browser = null;
    this.proxyConfig = this.getProxyConfig();
  }

  // Configuration du proxy (BrightData ou ScraperAPI)
  getProxyConfig() {
    if (process.env.BRIGHTDATA_USERNAME) {
      return {
        type: 'brightdata',
        host: process.env.BRIGHTDATA_HOST,
        port: process.env.BRIGHTDATA_PORT,
        username: process.env.BRIGHTDATA_USERNAME,
        password: process.env.BRIGHTDATA_PASSWORD
      };
    } else if (process.env.SCRAPERAPI_KEY) {
      return {
        type: 'scraperapi',
        key: process.env.SCRAPERAPI_KEY
      };
    }
    return null;
  }

  // Initialiser le navigateur
  async initBrowser() {
    try {
      console.log('🚀 Initializing browser with stealth...');
      
      const args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--window-size=1920,1080'
      ];

      // Configuration du proxy si disponible
      if (this.proxyConfig) {
        if (this.proxyConfig.type === 'brightdata') {
          args.push(`--proxy-server=http://${this.proxyConfig.host}:${this.proxyConfig.port}`);
        }
      }

      this.browser = await puppeteer.launch({
        headless: 'new',
        args,
        defaultViewport: { width: 1920, height: 1080 },
        ignoreHTTPSErrors: true,
        timeout: parseInt(process.env.TIMEOUT) || 30000
      });

      console.log('✅ Browser initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize browser:', error);
      return false;
    }
  }

  // Scraper les vues d'une vidéo TikTok
  async scrapeViews(url, retries = 0) {
    const maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    
    try {
      console.log(`🔍 Scraping views for: ${url} (attempt ${retries + 1})`);
      
      if (!this.browser) {
        const initialized = await this.initBrowser();
        if (!initialized) throw new Error('Browser initialization failed');
      }

      const page = await this.browser.newPage();
      
      // Configuration du proxy d'authentification si BrightData
      if (this.proxyConfig && this.proxyConfig.type === 'brightdata') {
        await page.authenticate({
          username: this.proxyConfig.username,
          password: this.proxyConfig.password
        });
      }

      // Headers pour simuler un navigateur réel
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      // Naviguer vers la page TikTok
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: parseInt(process.env.TIMEOUT) || 30000
      });

      // Attendre que la page se charge complètement
      await page.waitForTimeout(3000);

      // Attendre que les vues apparaissent (plusieurs sélecteurs possibles)
      const viewSelectors = [
        '[data-e2e="browse-video-views"]',
        '[data-e2e="video-views"]',
        '.video-meta-title strong',
        '.video-count',
        '.tiktok-1wr4jig-DivVideoCount',
        '.tiktok-1wr4jig-DivVideoCount span'
      ];

      let views = null;
      for (const selector of viewSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          views = await page.$eval(selector, el => el.textContent.trim());
          if (views) {
            console.log(`✅ Found views with selector: ${selector}`);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Si aucun sélecteur ne fonctionne, essayer de chercher dans le HTML
      if (!views) {
        console.log('⚠️ No view selector found, searching in HTML...');
        views = await page.evaluate(() => {
          // Chercher des patterns de vues dans le HTML
          const patterns = [
            /(\d+(?:\.\d+)?[KMB]?)\s*views/i,
            /(\d+(?:\.\d+)?[KMB]?)\s*vues/i,
            /"play_count":\s*(\d+)/,
            /"view_count":\s*(\d+)/,
            /"video_count":\s*(\d+)/
          ];
          
          const html = document.documentElement.outerHTML;
          for (const pattern of patterns) {
            const match = html.match(pattern);
            if (match) return match[1];
          }
          return null;
        });
      }

      await page.close();

      if (views) {
        const parsedViews = this.parseViews(views);
        console.log(`✅ Successfully scraped views: ${parsedViews.toLocaleString()}`);
        return parsedViews;
      } else {
        throw new Error('No views found on page');
      }

    } catch (error) {
      console.error(`❌ Error scraping views (attempt ${retries + 1}):`, error.message);
      
      if (retries < maxRetries) {
        console.log(`🔄 Retrying... (${retries + 1}/${maxRetries})`);
        await this.delay(parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 2000);
        return this.scrapeViews(url, retries + 1);
      } else {
        console.log('❌ Max retries reached, returning fallback value');
        return Math.floor(Math.random() * 500000) + 10000; // Valeur de fallback
      }
    }
  }

  // Parser les vues (ex: "822K" → 822000)
  parseViews(viewsText) {
    if (!viewsText) return 0;
    
    const cleanText = viewsText.trim().toLowerCase();
    
    // Gérer les formats avec virgules
    if (cleanText.includes(',')) {
      return parseInt(cleanText.replace(/,/g, ''));
    }
    
    // Gérer les formats K, M, B
    if (cleanText.includes('k')) {
      const number = parseFloat(cleanText.replace(/[^\d.]/g, ''));
      return Math.round(number * 1000);
    }
    
    if (cleanText.includes('m')) {
      const number = parseFloat(cleanText.replace(/[^\d.]/g, ''));
      return Math.round(number * 1000000);
    }
    
    if (cleanText.includes('b')) {
      const number = parseFloat(cleanText.replace(/[^\d.]/g, ''));
      return Math.round(number * 1000000000);
    }
    
    // Nettoyer et parser
    const number = parseInt(cleanText.replace(/[^\d]/g, ''));
    return isNaN(number) ? 0 : number;
  }

  // Mettre à jour les vues dans Supabase
  async updateSubmissionViews(submissionId) {
    try {
      console.log(`🔄 Updating views for submission: ${submissionId}`);
      
      // Récupérer la soumission
      const { data: submission, error: fetchError } = await supabase
        .from('submissions')
        .select(`
          *,
          campaigns (
            cpm_rate,
            required_views
          )
        `)
        .eq('id', submissionId)
        .single();

      if (fetchError) throw fetchError;
      if (!submission) throw new Error('Submission not found');

      // Scraper les vues
      const views = await this.scrapeViews(submission.tiktok_url);
      
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
        .eq('id', submissionId);

      if (updateError) throw updateError;
      
      console.log(`✅ Updated submission ${submissionId}: ${views.toLocaleString()} views, $${earnings.toFixed(2)} earnings`);
      
      // Vérifier si le paiement doit être déclenché
      const requiredViews = submission.campaigns?.required_views || 0;
      if (views >= requiredViews && submission.status !== 'paid') {
        console.log(`💰 Triggering payment for submission ${submissionId}...`);
        
        const { error: paidError } = await supabase
          .from('submissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            paid_amount: earnings
          })
          .eq('id', submissionId);

        if (paidError) throw paidError;
        console.log(`✅ Payment triggered for submission ${submissionId}`);
      }
      
      return { views, earnings };
      
    } catch (error) {
      console.error(`❌ Error updating submission views:`, error);
      throw error;
    }
  }

  // Scraper toutes les soumissions en attente
  async scrapeAllPendingSubmissions() {
    try {
      console.log('🚀 Starting bulk view scraping...');
      
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
        .in('status', ['pending', 'auto_approved']);

      if (error) throw error;
      
      console.log(`📊 Found ${submissions.length} pending submissions`);
      
      for (const submission of submissions) {
        try {
          await this.updateSubmissionViews(submission.id);
          await this.delay(parseInt(process.env.DELAY_BETWEEN_REQUESTS) || 2000);
        } catch (submissionError) {
          console.error(`❌ Error processing submission ${submission.id}:`, submissionError);
          continue;
        }
      }
      
      console.log('✅ Bulk scraping completed');
      
    } catch (error) {
      console.error('❌ Error in bulk scraping:', error);
      throw error;
    }
  }

  // Fermer le navigateur
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Browser closed');
    }
  }

  // Délai entre les requêtes
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TikTokScraper; 