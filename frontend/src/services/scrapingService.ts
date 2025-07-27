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
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-views`, {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }

      const data = await response.json();
      console.log('✅ Scraped views:', data.views);
      return data;
    } catch (error) {
      console.error('❌ Error scraping URL:', error);
      throw error;
    }
  }

  // Mettre à jour manuellement les vues d'une soumission
  static async updateSubmissionViews(submissionId: string): Promise<void> {
    try {
      console.log('🔍 Updating views for submission:', submissionId);
      
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
      const { views } = await this.scrapeSingleUrl(submission.tiktok_url);
      
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
      
      console.log('✅ Updated submission views:', { views, earnings });
      
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