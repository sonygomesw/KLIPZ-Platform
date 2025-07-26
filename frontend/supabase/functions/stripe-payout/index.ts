import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
    })

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { withdrawalId } = await req.json()

    if (!withdrawalId) {
      return new Response(
        JSON.stringify({ success: false, error: 'withdrawalId is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabaseClient
      .from('withdrawals')
      .select(`
        *,
        users:user_id(stripe_account_id, email)
      `)
      .eq('id', withdrawalId)
      .eq('status', 'pending')
      .single()

    if (withdrawalError || !withdrawal) {
      return new Response(
        JSON.stringify({ success: false, error: 'Withdrawal not found or already processed' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const stripeAccountId = withdrawal.users?.stripe_account_id
    if (!stripeAccountId) {
      return new Response(
        JSON.stringify({ success: false, error: 'User does not have a Stripe Connect account' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if the Stripe account is ready for payouts
    const account = await stripe.accounts.retrieve(stripeAccountId)
    if (!account.payouts_enabled) {
      return new Response(
        JSON.stringify({ success: false, error: 'Stripe account is not ready for payouts' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the payout
    const payout = await stripe.transfers.create({
      amount: Math.round(withdrawal.amount * 100), // Convert to cents
      currency: 'eur',
      destination: stripeAccountId,
      description: `Payout for withdrawal ${withdrawalId}`,
    })

    // Update withdrawal status
    const { error: updateError } = await supabaseClient
      .from('withdrawals')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)

    if (updateError) {
      console.error('Failed to update withdrawal status:', updateError)
      // Note: The payout was already sent, so we don't want to return an error here
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        payout_id: payout.id,
        amount: withdrawal.amount,
        recipient: withdrawal.users?.email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing payout:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})