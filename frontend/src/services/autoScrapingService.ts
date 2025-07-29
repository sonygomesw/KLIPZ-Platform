import { supabase } from '../config/supabase';

export interface ScrapingResult {
  success: boolean;
  successCount?: number;
  errorCount?: number;
  error?: string;
}

class AutoScrapingService {
  // Déclencher le scraping automatique de toutes les soumissions en attente
  async triggerAutoScraping(): Promise<ScrapingResult> {
    try {
      console.log('🔄 Déclenchement du scraping automatique...');
      
      const { data, error } = await supabase.functions.invoke('auto-scraping', {
        body: { action: 'scrape-all' }
      });
      
      if (error) {
        console.error('❌ Erreur scraping automatique:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Scraping automatique terminé:', data);
      return { success: true, ...data };
      
    } catch (error) {
      console.error('❌ Erreur appel scraping automatique:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  // Scraper une soumission spécifique
  async scrapeSingleSubmission(submissionId: string): Promise<ScrapingResult> {
    try {
      console.log(`🔍 Scraping soumission ${submissionId}...`);
      
      const { data, error } = await supabase.functions.invoke('auto-scraping', {
        body: { 
          action: 'scrape-single',
          submissionId: submissionId
        }
      });
      
      if (error) {
        console.error('❌ Erreur scraping soumission:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Scraping soumission terminé:', data);
      return { success: true, ...data };
      
    } catch (error) {
      console.error('❌ Erreur appel scraping soumission:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  // Vérifier le statut de l'API TikTok
  async checkAPIHealth(): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('auto-scraping', {
        body: { action: 'check-health' }
      });
      
      if (error) {
        console.error('❌ Erreur vérification API:', error);
        return false;
      }
      
      return data?.healthy || false;
      
    } catch (error) {
      console.error('❌ Erreur vérification santé API:', error);
      return false;
    }
  }

  // Obtenir les statistiques de scraping
  async getScrapingStats(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('auto-scraping', {
        body: { action: 'get-stats' }
      });
      
      if (error) {
        console.error('❌ Erreur récupération stats:', error);
        return null;
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Erreur récupération statistiques:', error);
      return null;
    }
  }
}

export default new AutoScrapingService(); 