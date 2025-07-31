import Stripe from 'stripe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Limites Stripe (en centimes)
const STRIPE_LIMITS = {
  MIN_AMOUNT: 100, // 1 EUR minimum
  MAX_AMOUNT: 99999999, // 999,999.99 EUR maximum (limite Stripe)
  RECOMMENDED_MAX: 1000000, // 10,000 EUR recommandé
};

function validateAmount(amount: number): { isValid: boolean; error?: string } {
  const amountInCents = Math.round(amount * 100);
  
  if (amountInCents < STRIPE_LIMITS.MIN_AMOUNT) {
    return { 
      isValid: false, 
      error: `Le montant minimum est ${STRIPE_LIMITS.MIN_AMOUNT / 100} EUR` 
    };
  }
  
  if (amountInCents > STRIPE_LIMITS.MAX_AMOUNT) {
    return { 
      isValid: false, 
      error: `Le montant maximum est ${STRIPE_LIMITS.MAX_AMOUNT / 100} EUR` 
    };
  }
  
  if (amountInCents > STRIPE_LIMITS.RECOMMENDED_MAX) {
    console.warn(`⚠️ Montant élevé détecté: ${amount} EUR`);
  }
  
  return { isValid: true };
}

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

    // Valider le montant
    const validation = validateAmount(amount);
    if (!validation.isValid) {
      return new Response(JSON.stringify({ error: validation.error }), {
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