import { supabase } from '../config/supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

export class ScrapingService {
  // Déclencher le scraping de toutes les soumissions
  static async scrapeAllViews(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('🔍 Triggering scraping for all submissions...');
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-views`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          action: 'scrape-all'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to trigger scraping');
      }

      const data = await response.json();
      console.log('✅ Scraping triggered successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error triggering scraping:', error);
      throw error;
    }
  }

  // Scraper les vues d'une URL spécifique
  static async scrapeSingleUrl(url: string): Promise<{ success: boolean; views: number }> {
    try {
      console.log('🔍 Scraping views for URL:', url);
      
      // Pour l'instant, simuler le scraping (car nous n'avons pas d'endpoint pour une URL spécifique)
      // TODO: Ajouter un endpoint pour scraper une URL spécifique
      const mockViews = Math.floor(Math.random() * 1000) + 100;
      
      console.log('✅ Simulated views for URL:', mockViews);
      return { success: true, views: mockViews };
    } catch (error) {
      console.error('❌ Error scraping URL:', error);
      throw error;
    }
  }

  // Mettre à jour manuellement les vues d'une soumission
  static async updateSubmissionViews(submissionId: string): Promise<void> {
    try {
      console.log('🔍 Updating views for submission:', submissionId);
      
      // Utiliser notre serveur backend pour le scraping
      const response = await fetch('http://localhost:8085/api/admin/scrape-views', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          submissionId: submissionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape views');
      }

      const data = await response.json();
      console.log('✅ Scraped views from backend:', data);
      
      // Récupérer la soumission mise à jour
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

      // Calculer les gains avec les nouvelles vues
      const views = data.views;
      const cpm = submission.campaigns?.cpm_rate || 0.03;
      const earnings = (views / 1000) * cpm;
      
      // Mettre à jour les gains dans la base de données
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          earnings: earnings,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) throw updateError;
      
      console.log('✅ Updated submission earnings:', { views, earnings });
      
      // Vérifier si le paiement doit être déclenché
      const requiredViews = submission.campaigns?.required_views || 0;
      if (views >= requiredViews && submission.status !== 'paid') {
        console.log('💰 Triggering payment...');
        
        const { error: paidError } = await supabase
          .from('submissions')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            paid_amount: earnings
          })
          .eq('id', submissionId);

        if (paidError) throw paidError;
        console.log('✅ Payment triggered');
      }
      
    } catch (error) {
      console.error('❌ Error updating submission views:', error);
      throw error;
    }
  }
}

// Export par défaut de la classe pour les méthodes statiques
export default ScrapingService; 