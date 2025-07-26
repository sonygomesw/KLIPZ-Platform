import Stripe from 'stripe';
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR', // Default to France, can be made dynamic
      email: 'user@example.com', // This will be updated with actual user email
      capabilities: {
        transfers: { requested: true },
      },
    })

    // Get user email from database
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()

    if (userError) {
      throw new Error('User not found')
    }

    // Update the account with user's email
    await stripe.accounts.update(account.id, {
      email: user.email,
    })

    // Store the Stripe account ID in the user record
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({ stripe_account_id: account.id })
      .eq('id', userId)

    if (updateError) {
      throw new Error('Failed to update user with Stripe account ID')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        accountId: account.id,
        message: 'Stripe Connect account created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating Stripe account:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}) 