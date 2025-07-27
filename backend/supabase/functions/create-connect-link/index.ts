import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('Creating Stripe Connect account for:', { userId, email });

    // Créer directement un compte Stripe Connect
    const account = await stripe.accounts.create({
      type: "standard",
      country: "FR", // Pays par défaut
      email: email || 'clipper@klipz.app',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log('Stripe account created:', account.id);

    // Créer le lien d'onboarding
    const link = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get('origin') || 'https://klipz.app'}/connect/retry`,
      return_url: `${req.headers.get('origin') || 'https://klipz.app'}/connect/success`,
      type: 'account_onboarding',
    });

    console.log('Stripe onboarding link created');

    return new Response(JSON.stringify({ 
      url: link.url,
      accountId: account.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur création lien connect:', error);
    return new Response(JSON.stringify({ 
      error: "Erreur serveur",
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}); 