import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Vérifier si l'utilisateur est admin
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === 'admin';
  } catch (error) {
    console.error('❌ Error vérification admin:', error);
    return false;
  }
}

// Valider une soumission et déclencher le paiement
async function validateAndPay(adminId: string, submissionId: string, approved: boolean, adminNotes?: string): Promise<{
  success: boolean;
  paymentTriggered?: boolean;
  amount?: number;
  error?: string;
}> {
  try {
    console.log('🔍 Validation admin:', { adminId, submissionId, approved });

    // 1. Vérifier que l'utilisateur est admin
    const adminCheck = await isAdmin(adminId);
    if (!adminCheck) {
      return { success: false, error: 'Accès refusé - droits admin requis' };
    }

    // 2. Récupérer les détails de la soumission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        campaigns (
          cpm_rate,
          required_views,
          title
        ),
        users!submissions_user_id_fkey (
          id,
          username,
          stripe_account_id
        )
      `)
      .eq('id', submissionId)
      .single();

    if (submissionError || !submission) {
      return { success: false, error: 'Soumission non trouvée' };
    }

    // 3. Vérifier l'état de la soumission
    if (submission.status === 'paid') {
      return { success: false, error: 'Soumission déjà payée' };
    }

    if (submission.status === 'rejected') {
      return { success: false, error: 'Soumission déjà rejetée' };
    }

    let paymentTriggered = false;
    let paidAmount = 0;

    if (approved) {
      // 4. Calculer le montant à payer
      const views = submission.views || 0;
      const cpmRate = submission.campaigns?.cpm_rate || 0.03;
      const earnings = (views / 1000) * cpmRate;

      console.log('💰 Calcul paiement:', {
        views,
        cpmRate,
        earnings: earnings.toFixed(2)
      });

      // 5. Vérifier que le clipper a un compte Stripe Connect
      if (!submission.users?.stripe_account_id) {
        return { 
          success: false, 
          error: 'Le clipper doit configurer son compte Stripe Connect avant le paiement' 
        };
      }

      // 6. Déclencher le paiement Stripe Connect
      if (earnings >= 1) { // Minimum 1€ pour paiement
        try {
          const paymentResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/payout-clipper`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              clipperId: submission.user_id,
              amount: earnings,
              submissionId: submissionId,
              source: 'admin_validation'
            }),
          });

          if (paymentResponse.ok) {
            const paymentData = await paymentResponse.json();
            paymentTriggered = true;
            paidAmount = earnings;
            console.log('✅ Paiement Stripe réussi:', paymentData);
          } else {
            const paymentError = await paymentResponse.json();
            console.error('❌ Échec paiement Stripe:', paymentError);
            return { success: false, error: `Échec paiement: ${paymentError.error}` };
          }
        } catch (paymentError) {
          console.error('❌ Error paiement:', paymentError);
          return { success: false, error: 'Erreur lors du paiement Stripe' };
        }
      }

      // 7. Mettre à jour la soumission comme payée
      const { error: updateError } = await supabase
        .from('submissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          paid_amount: paidAmount,
          admin_validated_by: adminId,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (updateError) {
        console.error('❌ Error mise à jour soumission:', updateError);
        return { success: false, error: 'Erreur mise à jour base de données' };
      }

    } else {
      // Rejeter la soumission
      const { error: rejectError } = await supabase
        .from('submissions')
        .update({
          status: 'rejected',
          admin_validated_by: adminId,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (rejectError) {
        console.error('❌ Error rejet soumission:', rejectError);
        return { success: false, error: 'Erreur mise à jour base de données' };
      }
    }

    console.log('✅ Validation admin terminée:', {
      submissionId,
      approved,
      paymentTriggered,
      amount: paidAmount
    });

    return {
      success: true,
      paymentTriggered,
      amount: paidAmount
    };

  } catch (error) {
    console.error('❌ Error validation admin:', error);
    return { success: false, error: error.message };
  }
}

// Récupérer les soumissions en attente de validation admin
async function getPendingSubmissions(adminId: string): Promise<{
  success: boolean;
  submissions?: any[];
  error?: string;
}> {
  try {
    // Vérifier que l'utilisateur est admin
    const adminCheck = await isAdmin(adminId);
    if (!adminCheck) {
      return { success: false, error: 'Accès refusé - droits admin requis' };
    }

    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        campaigns (
          title,
          cpm_rate,
          required_views
        ),
        users!submissions_user_id_fkey (
          username,
          tiktok_username,
          stripe_account_id
        )
      `)
      .in('status', ['ready_for_payment', 'approved'])
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    // Calculer les gains potentiels pour chaque soumission
    const enrichedSubmissions = submissions?.map(sub => {
      const earnings = ((sub.views || 0) / 1000) * (sub.campaigns?.cpm_rate || 0.03);
      const meetsRequirement = (sub.views || 0) >= (sub.campaigns?.required_views || 0);
      
      return {
        ...sub,
        potential_earnings: earnings,
        meets_requirement: meetsRequirement,
        has_stripe_account: !!sub.users?.stripe_account_id
      };
    });

    return {
      success: true,
      submissions: enrichedSubmissions
    };

  } catch (error) {
    console.error('❌ Error récupération soumissions:', error);
    return { success: false, error: error.message };
  }
}

// Endpoint principal
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, adminId, submissionId, approved, adminNotes } = await req.json();

    if (action === 'validate-payment') {
      if (!adminId || !submissionId || approved === undefined) {
        return new Response(JSON.stringify({ 
          error: 'adminId, submissionId et approved requis' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const result = await validateAndPay(adminId, submissionId, approved, adminNotes);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === 'get-pending-submissions') {
      if (!adminId) {
        return new Response(JSON.stringify({ 
          error: 'adminId requis' 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const result = await getPendingSubmissions(adminId);
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