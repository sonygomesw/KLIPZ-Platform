import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, state } = await req.json()
    
    if (!code) {
      return new Response(JSON.stringify({ error: 'Code TikTok manquant' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('🔄 Traitement callback TikTok:', { code, state })

    // Configuration TikTok
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = Deno.env.get('TIKTOK_REDIRECT_URI')

    if (!clientKey || !clientSecret || !redirectUri) {
      return new Response(JSON.stringify({ error: 'Configuration TikTok manquante' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
      },
      body: new URLSearchParams({
        client_key: clientKey,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      })
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ Erreur échange token TikTok:', errorData)
      return new Response(JSON.stringify({ error: 'Erreur échange token TikTok' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const tokenData = await tokenResponse.json()
    console.log('✅ Token TikTok obtenu')

    // Récupérer les informations utilisateur
    const userResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      }
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.text()
      console.error('❌ Erreur récupération infos utilisateur TikTok:', errorData)
      return new Response(JSON.stringify({ error: 'Erreur récupération infos utilisateur TikTok' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userData = await userResponse.json()
    console.log('✅ Données utilisateur TikTok récupérées:', userData)

    // Formater les données utilisateur
    const formattedUserData = {
      open_id: userData.data.user.open_id,
      union_id: userData.data.user.union_id,
      nickname: userData.data.user.nickname,
      avatar_url: userData.data.user.avatar_url,
      follower_count: userData.data.user.follower_count,
      following_count: userData.data.user.following_count,
      likes_count: userData.data.user.likes_count,
      video_count: userData.data.user.video_count,
      bio_description: userData.data.user.bio_description,
      profile_deep_link: userData.data.user.profile_deep_link,
      is_verified: userData.data.user.is_verified,
      follower_status: userData.data.user.follower_status,
      custom_username: userData.data.user.custom_username,
    }

    return new Response(JSON.stringify({
      success: true,
      userData: formattedUserData,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('❌ Erreur callback TikTok:', error)
    return new Response(JSON.stringify({
      error: 'Erreur serveur',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 