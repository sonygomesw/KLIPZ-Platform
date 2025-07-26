import Stripe from 'stripe';
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { clipperId, amount, submissionId } = await req.json();

    if (!clipperId || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: "clipperId and amount > 0 are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Récupérer les informations du clipper
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_account_id, email')
      .eq('id', clipperId)
      .single();

    if (userError || !user) {
      console.error('Erreur récupération clipper:', userError);
      return new Response(JSON.stringify({ error: "Clipper non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!user.stripe_account_id) {
      return new Response(JSON.stringify({ error: "Clipper non connecté à Stripe" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Vérifier le solde du clipper
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', clipperId)
      .single();

    if (walletError || !wallet) {
      console.error('Erreur récupération wallet:', walletError);
      return new Response(JSON.stringify({ error: "Wallet non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Créer le transfert Stripe
    const transfer = await stripe.transfers.create({
      amount: Math.round(amount * 100), // Stripe utilise les centimes
      currency: 'eur',
      destination: user.stripe_account_id,
      description: `Paiement KLIPZ - Soumission ${submissionId || 'N/A'}`,
      metadata: {
        clipper_id: clipperId,
        submission_id: submissionId || 'N/A',
        type: 'clipper_payout'
      },
    });

    // Déduire le montant du wallet du clipper
    const { data: updatedWallet, error: deductError } = await supabase.rpc('deduct_balance', {
      user_uuid: clipperId,
      amount: amount
    });

    if (deductError) {
      console.error('Erreur déduction solde:', deductError);
      // Annuler le transfert Stripe si la déduction échoue
      await stripe.transfers.createReversal(transfer.id, {
        reason: 'requested_by_customer'
      });
      
      return new Response(JSON.stringify({ error: "Erreur déduction solde" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Mettre à jour le statut de la soumission si submissionId fourni
    if (submissionId) {
      await supabase
        .from('submissions')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString(),
          payout_amount: amount
        })
        .eq('id', submissionId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      transferId: transfer.id,
      amount: amount,
      newBalance: updatedWallet.balance
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur payout clipper:', error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}); 