import { supabase } from '../config/supabase';

// Configuration du service de scraping TikTok
const TIKTOK_SCRAPER_URL = process.env.EXPO_PUBLIC_TIKTOK_SCRAPER_URL || 'http://localhost:3001';
const API_KEY = process.env.EXPO_PUBLIC_TIKTOK_SCRAPER_API_KEY || '';

export class TikTokScraperService {
  // Scraper une URL TikTok spécifique
  static async scrapeSingleUrl(url: string): Promise<{ success: boolean; views: number; error?: string }> {
    try {
      console.log('🔍 Scraping TikTok views for URL:', url);
      
      const response = await fetch(`${TIKTOK_SCRAPER_URL}/scrape-single`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }

      const data = await response.json();
      console.log('✅ Scraped views:', data.views);
      return { success: true, views: data.views };
      
    } catch (error) {
      console.error('❌ Error scraping TikTok URL:', error);
      return { success: false, views: 0, error: error.message };
    }
  }

  // Scraper toutes les soumissions en attente
  static async scrapeAllPendingSubmissions(): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      console.log('🚀 Starting bulk scraping...');
      
      const response = await fetch(`${TIKTOK_SCRAPER_URL}/scrape-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start bulk scraping');
      }

      const data = await response.json();
      console.log('✅ Bulk scraping completed');
      return { success: true, message: data.message };
      
    } catch (error) {
      console.error('❌ Error in bulk scraping:', error);
      return { success: false, message: 'Failed', error: error.message };
    }
  }

  // Mettre à jour une soumission spécifique
  static async updateSubmissionViews(submissionId: string): Promise<{ success: boolean; views?: number; earnings?: number; error?: string }> {
    try {
      console.log('🔄 Updating submission views:', submissionId);
      
      const response = await fetch(`${TIKTOK_SCRAPER_URL}/update-submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ submissionId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update submission');
      }

      const data = await response.json();
      console.log('✅ Updated submission:', data);
      return { 
        success: true, 
        views: data.views, 
        earnings: data.earnings 
      };
      
    } catch (error) {
      console.error('❌ Error updating submission:', error);
      return { success: false, error: error.message };
    }
  }

  // Obtenir les statistiques du service
  static async getStats(): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      console.log('📊 Getting scraper stats...');
      
      const response = await fetch(`${TIKTOK_SCRAPER_URL}/stats`, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get stats');
      }

      const data = await response.json();
      console.log('✅ Scraper stats:', data.stats);
      return { success: true, stats: data.stats };
      
    } catch (error) {
      console.error('❌ Error getting stats:', error);
      return { success: false, error: error.message };
    }
  }

  // Vérifier la santé du service
  static async checkHealth(): Promise<{ success: boolean; status?: string; error?: string }> {
    try {
      const response = await fetch(`${TIKTOK_SCRAPER_URL}/health`);
      
      if (!response.ok) {
        throw new Error('Service not healthy');
      }

      const data = await response.json();
      return { success: true, status: data.status };
      
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Méthode de fallback utilisant l'ancien système Supabase
  static async fallbackScrape(url: string): Promise<{ success: boolean; views: number; error?: string }> {
    try {
      console.log('🔄 Using fallback scraping method...');
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/scrape-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'scrape-single',
          url: url
        }),
      });

      if (!response.ok) {
        throw new Error('Fallback scraping failed');
      }

      const data = await response.json();
      return { success: true, views: data.views };
      
    } catch (error) {
      console.error('❌ Fallback scraping failed:', error);
      return { success: false, views: 0, error: error.message };
    }
  }
}

// Export par défaut pour compatibilité
export default TikTokScraperService; 