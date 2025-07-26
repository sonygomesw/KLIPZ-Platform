import Stripe from 'https://esm.sh/stripe@14?target=denonext';
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-11-20'
});

// This is needed in order to use the Web Crypto API in Deno.
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Webhook event types
const WebhookEvents = {
  payment_intent_succeeded: 'payment_intent.succeeded',
  checkout_session_completed: 'checkout.session.completed',
  payment_intent_payment_failed: 'payment_intent.payment_failed'
};

// Handle wallet recharge
const handleWalletRecharge = async (paymentIntent: Stripe.PaymentIntent) => {
  const amount = paymentIntent.amount / 100; // Convert from cents to euros
  const userId = paymentIntent.metadata?.userId;
  const type = paymentIntent.metadata?.type;

  console.log('💰 Processing wallet recharge:', { userId, amount, type });

  if (!userId || amount <= 0 || type !== 'wallet_recharge') {
    console.log('❌ Invalid payment data for wallet recharge');
    return;
  }

  try {
    // 1. Add balance to wallet
    const { data: wallet, error: walletError } = await supabase.rpc('add_balance', {
      user_uuid: userId,
      amount: amount
    });

    if (walletError) {
      console.error('❌ Error adding balance to wallet:', walletError);
      throw walletError;
    }

    // 2. Update user balance
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user profile:', userError);
      throw userError;
    }

    const newBalance = (userProfile.balance || 0) + amount;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', userId);

    if (updateError) {
      console.error('❌ Error updating user balance:', updateError);
      throw updateError;
    }

    console.log('✅ Wallet recharge successful:', { 
      userId, 
      amount, 
      newBalance,
      wallet 
    });

  } catch (error) {
    console.error('❌ Wallet recharge failed:', error);
    throw error;
  }
};

// Handle checkout session completion
const handleCheckoutSessionCompleted = async (session: Stripe.Checkout.Session) => {
  const amount = session.amount_total! / 100; // Convert from cents to euros
  const streamerId = session.metadata?.streamer_id;

  console.log('🛒 Processing checkout session:', { streamerId, amount });

  if (!streamerId || amount <= 0) {
    console.log('❌ Invalid checkout session data');
    return;
  }

  try {
    // 1. Add balance to wallet
    const { data: wallet, error: walletError } = await supabase.rpc('add_balance', {
            user_uuid: streamerId,
            amount: amount
          });

    if (walletError) {
      console.error('❌ Error adding balance to wallet:', walletError);
      throw walletError;
    }

    // 2. Update user balance
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', streamerId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user profile:', userError);
      throw userError;
    }

    const newBalance = (userProfile.balance || 0) + amount;
    
    const { error: updateError } = await supabase
      .from('users')
      .update({ balance: newBalance })
      .eq('id', streamerId);

    if (updateError) {
      console.error('❌ Error updating user balance:', updateError);
      throw updateError;
    }

    console.log('✅ Checkout session completed successfully:', { 
      streamerId, 
      amount, 
      newBalance,
      wallet 
          });

  } catch (error) {
    console.error('❌ Checkout session processing failed:', error);
    throw error;
  }
};

// Main webhook event handler
export const WebhookEventHandler = async (event: Stripe.Event) => {
  console.log(`🔔 Processing event: ${event.type}`);

  switch (event.type) {
    case WebhookEvents.payment_intent_succeeded: {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await handleWalletRecharge(paymentIntent);
      break;
    }
    
    case WebhookEvents.checkout_session_completed: {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutSessionCompleted(session);
      break;
    }
    
    case WebhookEvents.payment_intent_payment_failed: {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.log('❌ Payment failed:', {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        userId: paymentIntent.metadata?.userId
      });
        break;
    }

      default:
      console.log(`⚠️ Unhandled event type: ${event.type}`);
  }
};

// Main handler
Deno.serve(async (request) => {
  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'stripe-signature, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      }
    });
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signature = request.headers.get('stripe-signature');
    
    // Check for Stripe signature
    if (!signature) {
      console.error('❌ Missing Stripe signature');
      return new Response('Missing Stripe signature', { status: 400 });
    }
    
    // Get the raw body for signature verification
    const body = await request.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
        undefined,
        cryptoProvider
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`✅ Event verified: ${event.id} (${event.type})`);

    // Process the event
    await WebhookEventHandler(event);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Webhook processed successfully',
      event_id: event.id,
      event_type: event.type
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return new Response(JSON.stringify({ 
      error: "Webhook processing failed",
      details: error.message 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 