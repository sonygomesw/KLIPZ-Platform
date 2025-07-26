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
    const { userId } = await req.json()

    if (!userId) {
      throw new Error('userId is required')
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

    // Get user's Stripe account ID
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .select('stripe_account_id')
      .eq('id', userId)
      .single()

    if (userError || !user.stripe_account_id) {
      throw new Error('User does not have a Stripe Connect account')
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-onboarding-link?refresh=true`,
      return_url: 'klipz://stripe-onboarding-success',
      type: 'account_onboarding',
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        url: accountLink.url,
        message: 'Onboarding link created successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error creating onboarding link:', error)
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