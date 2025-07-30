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
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Scraper une soumission spécifique
  async scrapeSingleSubmission(submissionId: string): Promise<ScrapingResult> {
    try {
      console.log('🔍 Scraping de la soumission:', submissionId);
      
      const { data, error } = await supabase.functions.invoke('auto-scraping', {
        body: { 
          action: 'scrape-single',
          submissionId: submissionId
        }
      });
      
      if (error) {
        console.error('❌ Erreur scraping unique:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Scraping unique terminé:', data);
      return { success: true, ...data };
      
    } catch (error) {
      console.error('❌ Erreur appel scraping unique:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }

  // Obtenir le statut du scraping
  async getScrapingStatus(): Promise<ScrapingResult> {
    try {
      console.log('📊 Vérification du statut du scraping...');
      
      const { data, error } = await supabase.functions.invoke('auto-scraping', {
        body: { action: 'status' }
      });
      
      if (error) {
        console.error('❌ Erreur statut scraping:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ Statut scraping:', data);
      return { success: true, ...data };
      
    } catch (error) {
      console.error('❌ Erreur appel statut scraping:', error);
      return { success: false, error: 'Erreur réseau' };
    }
  }
}

export const autoScrapingService = new AutoScrapingService(); 