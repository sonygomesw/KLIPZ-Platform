import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Debug: Vérifier les variables d'environnement
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log('Stripe Key exists:', !!stripeKey);
    console.log('Stripe Key starts with:', stripeKey?.substring(0, 10) + '...');

    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    const { amount, streamerId } = await req.json();
    console.log('Received data:', { amount, streamerId });

    if (!amount || !streamerId) {
      return new Response(JSON.stringify({ error: "Amount and streamerId are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('Creating Stripe session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { 
            name: 'Budget de campagne KLIPZ',
            description: 'Rechargement de votre solde pour créer des campagnes'
          },
          unit_amount: Math.round(amount * 100), // Stripe utilise les centimes
        },
        quantity: 1,
      }],
      success_url: `${req.headers.get('origin') || 'https://klipz.app'}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin') || 'https://klipz.app'}/cancel`,
      metadata: {
        streamer_id: streamerId,
        type: 'wallet_recharge'
      },
    });

    console.log('Session created successfully:', session.id);
    return new Response(JSON.stringify({ 
      url: session.url,
      sessionId: session.id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Erreur création session checkout:', error);
    return new Response(JSON.stringify({ 
      error: "Erreur serveur",
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}); 