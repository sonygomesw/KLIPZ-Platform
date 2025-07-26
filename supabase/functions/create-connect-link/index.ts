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
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Vérifier si l'utilisateur a déjà un compte Stripe Connect
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('stripe_account_id, email')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Erreur récupération utilisateur:', userError);
      return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    let accountId = user.stripe_account_id;

    // Si pas de compte Stripe, en créer un
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "standard",
        country: "FR", // Pays par défaut
        email: user.email || 'clipper@klipz.app',
        capabilities: {
          transfers: { requested: true },
        },
      });

      accountId = account.id;

      // Sauvegarder l'ID du compte dans la base de données
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_account_id: accountId })
        .eq('id', userId);

      if (updateError) {
        console.error('Erreur sauvegarde stripe_account_id:', updateError);
      }
    }

    // Créer le lien d'onboarding
    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${req.headers.get('origin') || 'https://klipz.app'}/connect/retry`,
      return_url: `${req.headers.get('origin') || 'https://klipz.app'}/connect/success`,
      type: 'account_onboarding',
    });

    return new Response(JSON.stringify({ 
      url: link.url,
      accountId: accountId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur création lien connect:', error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}); 