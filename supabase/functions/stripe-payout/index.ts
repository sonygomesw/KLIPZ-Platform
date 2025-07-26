import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { withdrawalId } = await req.json()

    if (!withdrawalId) {
      throw new Error('withdrawalId is required')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Initialize Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabaseClient
      .from('withdrawals')
      .select('*, users!inner(stripe_account_id)')
      .eq('id', withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      throw new Error('Withdrawal not found')
    }

    if (withdrawal.status !== 'pending') {
      throw new Error('Withdrawal is not pending')
    }

    if (!withdrawal.users.stripe_account_id) {
      throw new Error('User does not have a Stripe Connect account')
    }

    // Create transfer to the clipper's Stripe Connect account
    const transfer = await stripe.transfers.create({
      amount: Math.round(withdrawal.amount * 100), // Convert to cents
      currency: 'eur',
      destination: withdrawal.users.stripe_account_id,
      description: `Payout for withdrawal ${withdrawalId}`,
    })

    // Update withdrawal status to completed
    const { error: updateError } = await supabaseClient
      .from('withdrawals')
      .update({ 
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)

    if (updateError) {
      throw new Error('Failed to update withdrawal status')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transferId: transfer.id,
        message: 'Payout processed successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error processing payout:', error)
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