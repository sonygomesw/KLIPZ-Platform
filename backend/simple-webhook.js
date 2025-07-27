// Simple webhook handler for Stripe
// Can be deployed on Vercel, Netlify, or any serverless platform

const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20'
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Handle wallet recharge
const handleWalletRecharge = async (paymentIntent) => {
  const amount = paymentIntent.amount / 100; // Convert from cents to dollars
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
const handleCheckoutSessionCompleted = async (session) => {
  const amount = session.amount_total / 100; // Convert from cents to dollars
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

// Main webhook handler
module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'stripe-signature, content-type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const signature = req.headers['stripe-signature'];
    
    if (!signature) {
      console.error('❌ Missing Stripe signature');
      res.status(400).json({ error: 'Missing Stripe signature' });
      return;
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('❌ Missing STRIPE_WEBHOOK_SECRET');
      res.status(500).json({ error: 'Missing webhook secret' });
      return;
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    console.log(`✅ Event verified: ${event.id} (${event.type})`);

    // Process the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handleWalletRecharge(paymentIntent);
        break;
      }
      
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
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

    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      event_id: event.id,
      event_type: event.type
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ 
      error: "Webhook processing failed",
      details: error.message 
    });
  }
}; 