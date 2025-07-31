import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Configuration TikTok API
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

// Interface pour le résultat du paiement Stripe
interface StripePayoutResult {
  success: boolean;
  transferId?: string;
  error?: string;
}

// Fonction pour extraire l'ID vidéo d'une URL TikTok
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    
    // Format: /@username/video/1234567890123456789
    const videoIndex = pathParts.indexOf('video');
    if (videoIndex !== -1 && pathParts[videoIndex + 1]) {
      return pathParts[videoIndex + 1];
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error extraction ID vidéo:', error);
    return null;
  }
}

// Récupérer les métriques d'une vidéo via l'API TikTok officielle
async function getTikTokVideoMetrics(videoUrl: string, accessToken: string): Promise<{
  success: boolean;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  error?: string;
}> {
  try {
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return { success: false, views: 0, likes: 0, comments: 0, shares: 0, error: 'ID vidéo introuvable' };
    }

    console.log('🔍 Récupération métriques TikTok pour vidéo:', videoId);

    const response = await fetch(`${TIKTOK_API_BASE}/video/query/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: {
          video_ids: [videoId]
        },
        fields: ['id', 'like_count', 'comment_count', 'share_count', 'view_count']
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error API TikTok:', errorData);
      return { 
        success: false, 
        views: 0, 
        likes: 0, 
        comments: 0, 
        shares: 0, 
        error: errorData.error?.message || 'Erreur API TikTok' 
      };
    }

    const data = await response.json();
    const videoData = data.data?.videos?.[0];

    if (!videoData) {
      return { 
        success: false, 
        views: 0, 
        likes: 0, 
        comments: 0, 
        shares: 0, 
        error: 'Vidéo non trouvée ou pas accessible' 
      };
    }

    console.log('✅ Métriques TikTok récupérées:', videoData);

    return {
      success: true,
      views: videoData.view_count || 0,
      likes: videoData.like_count || 0,
      comments: videoData.comment_count || 0,
      shares: videoData.share_count || 0
    };

  } catch (error) {
    console.error('❌ Error récupération métriques:', error);
    return { 
      success: false, 
      views: 0, 
      likes: 0, 
      comments: 0, 
      shares: 0, 
      error: error.message 
    };
  }
}

// Déclencher un paiement Stripe Connect
async function triggerStripePayment(userId: string, amount: number, submissionId: string): Promise<StripePayoutResult> {
  try {
    console.log('💰 Déclenchement paiement Stripe Connect:', { userId, amount, submissionId });

    // Appeler la fonction Supabase payout-clipper
    const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/payout-clipper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        clipperId: userId,
        amount: amount,
        submissionId: submissionId,
        source: 'tiktok_api_auto'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error paiement Stripe:', errorData);
      return {
        success: false,
        error: errorData.error || 'Erreur paiement Stripe'
      };
    }

    const data = await response.json();
    console.log('✅ Paiement Stripe réussi:', data);

    return {
      success: true,
      transferId: data.transferId
    };

  } catch (error) {
    console.error('❌ Error déclenchement paiement:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Mettre à jour une soumission avec les vraies métriques TikTok
async function updateSubmissionWithRealMetrics(submissionId: string, userId: string): Promise<{
  success: boolean;
  views?: number;
  earnings?: number;
  paymentTriggered?: boolean;
  error?: string;
}> {
  try {
    console.log('📊 Mise à jour soumission avec vraies métriques:', submissionId);

    // 1. Récupérer les infos de la soumission et le token TikTok de l'utilisateur
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        campaigns (
          cpm_rate,
          required_views
        ),
        users!submissions_user_id_fkey (
          tiktok_open_id
        )
      `)
      .eq('id', submissionId)
      .eq('user_id', userId)
      .single();

    if (submissionError || !submission) {
      return { success: false, error: 'Soumission non trouvée' };
    }

    // 2. Récupérer le token TikTok de l'utilisateur (stocké en session ou DB)
    // Pour l'instant, on va chercher dans la table users ou sessions
    const { data: userToken, error: tokenError } = await supabase
      .from('user_tokens')
      .select('tiktok_access_token')
      .eq('user_id', userId)
      .single();

    if (tokenError || !userToken?.tiktok_access_token) {
      return { success: false, error: 'Token TikTok requis - utilisateur doit se reconnecter' };
    }

    // 3. Récupérer les vraies métriques via l'API TikTok
    const metrics = await getTikTokVideoMetrics(submission.tiktok_url, userToken.tiktok_access_token);
    
    if (!metrics.success) {
      return { success: false, error: metrics.error };
    }

    // 4. Calculer les gains basés sur les vraies vues
    const cpm = submission.campaigns?.cpm_rate || 0.03;
    const earnings = (metrics.views / 1000) * cpm;

    // 5. Mettre à jour la soumission avec les vraies données
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        views: metrics.views,
        like_count: metrics.likes,
        comment_count: metrics.comments,
        share_count: metrics.shares,
        earnings: earnings,
        metrics_source: 'tiktok_api',
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (updateError) {
      return { success: false, error: 'Erreur mise à jour soumission' };
    }

    // 6. Vérifier si le seuil de vues est atteint (information pour l'admin)
    const requiredViews = submission.campaigns?.required_views || 0;
    const meetsRequirement = metrics.views >= requiredViews;

    // Mettre à jour le statut selon les métriques
    let newStatus = submission.status;
    if (meetsRequirement && submission.status === 'approved') {
      newStatus = 'ready_for_payment'; // Nouveau statut pour indiquer que c'est prêt pour validation admin
    }

    // Mettre à jour le statut si nécessaire
    if (newStatus !== submission.status) {
      const { error: statusError } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (statusError) {
        console.error('❌ Error mise à jour statut:', statusError);
      } else {
        console.log('✅ Statut mis à jour:', newStatus);
      }
    }

    console.log('✅ Soumission mise à jour:', {
      submissionId,
      views: metrics.views,
      earnings: earnings.toFixed(2),
      meetsRequirement,
      newStatus
    });

    return {
      success: true,
      views: metrics.views,
      earnings,
      meetsRequirement,
      status: newStatus
    };

  } catch (error) {
    console.error('❌ Error mise à jour soumission:', error);
    return { success: false, error: error.message };
  }
}

// Endpoint principal
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, submissionId, userId, videoUrl, accessToken } = await req.json();

    if (action === 'get-video-metrics') {
      // Récupérer les métriques d'une vidéo spécifique
      if (!videoUrl || !accessToken) {
        return new Response(JSON.stringify({ 
          error: 'videoUrl et accessToken requis' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const metrics = await getTikTokVideoMetrics(videoUrl, accessToken);
      return new Response(JSON.stringify(metrics), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'update-submission') {
      // Mettre à jour une soumission avec les vraies métriques
      if (!submissionId || !userId) {
        return new Response(JSON.stringify({ 
          error: 'submissionId et userId requis' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const result = await updateSubmissionWithRealMetrics(submissionId, userId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Action non supportée' }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Erreur serveur' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});