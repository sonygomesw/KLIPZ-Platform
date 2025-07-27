const express = require('express');
const cors = require('cors');
const TikTokScraper = require('./tiktok-scraper');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Instance du scraper
const scraper = new TikTokScraper();

// Middleware d'authentification API
const authenticateAPI = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!process.env.API_KEY) {
    console.warn('⚠️ No API_KEY configured, skipping authentication');
    return next();
  }
  
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'TikTok Scraper API'
  });
});

// Scraper une URL spécifique
app.post('/scrape-single', authenticateAPI, async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`🔍 Scraping single URL: ${url}`);
    
    const views = await scraper.scrapeViews(url);
    
    res.json({
      success: true,
      url,
      views,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in scrape-single:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Scraper toutes les soumissions en attente
app.post('/scrape-all', authenticateAPI, async (req, res) => {
  try {
    console.log('🚀 Starting bulk scraping...');
    
    await scraper.scrapeAllPendingSubmissions();
    
    res.json({
      success: true,
      message: 'Bulk scraping completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in scrape-all:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Mettre à jour une soumission spécifique
app.post('/update-submission', authenticateAPI, async (req, res) => {
  try {
    const { submissionId } = req.body;
    
    if (!submissionId) {
      return res.status(400).json({ error: 'submissionId is required' });
    }
    
    console.log(`🔄 Updating submission: ${submissionId}`);
    
    const result = await scraper.updateSubmissionViews(submissionId);
    
    res.json({
      success: true,
      submissionId,
      views: result.views,
      earnings: result.earnings,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in update-submission:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Statistiques du service
app.get('/stats', authenticateAPI, async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Récupérer les statistiques
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('status, views, earnings');
    
    if (error) throw error;
    
    const stats = {
      total: submissions.length,
      pending: submissions.filter(s => s.status === 'pending').length,
      auto_approved: submissions.filter(s => s.status === 'auto_approved').length,
      paid: submissions.filter(s => s.status === 'paid').length,
      totalViews: submissions.reduce((sum, s) => sum + (s.views || 0), 0),
      totalEarnings: submissions.reduce((sum, s) => sum + (s.earnings || 0), 0),
      averageViews: submissions.length > 0 ? 
        submissions.reduce((sum, s) => sum + (s.views || 0), 0) / submissions.length : 0
    };
    
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in stats:', error);
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Gestion des erreurs
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Gestion des routes non trouvées
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'POST /scrape-single',
      'POST /scrape-all',
      'POST /update-submission',
      'GET /stats'
    ],
    timestamp: new Date().toISOString()
  });
});

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await scraper.closeBrowser();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await scraper.closeBrowser();
  process.exit(0);
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`🚀 TikTok Scraper API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
}); 