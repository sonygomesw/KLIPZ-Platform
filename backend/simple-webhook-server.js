// Simple webhook server for Stripe
// Run with: node simple-webhook-server.js

const express = require('express');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = process.env.PORT || 3001;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20'
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middleware to parse raw body for Stripe
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

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

// Webhook endpoint
app.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];
  
  if (!signature) {
    console.error('❌ Missing Stripe signature');
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('❌ Missing STRIPE_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Missing webhook secret' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`✅ Event verified: ${event.id} (${event.type})`);

  try {
    // Process the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        console.log('✅ Payment intent succeeded:', {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          userId: paymentIntent.metadata?.userId
        });
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
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`🚀 Webhook server running on port ${port}`);
  console.log(`📡 Webhook URL: http://localhost:${port}/webhook`);
  console.log(`❤️  Health check: http://localhost:${port}/health`);
}); 