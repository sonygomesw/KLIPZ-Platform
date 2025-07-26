import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { twitchUrl } = await req.json()
    
    if (!twitchUrl) {
      return new Response(
        JSON.stringify({ error: 'URL Twitch requise' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Extraire le nom d'utilisateur depuis l'URL
    const extractUsername = (url: string): string | null => {
      const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
      return match ? match[1] : null
    }

    const username = extractUsername(twitchUrl)
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'URL Twitch invalide' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Récupérer les variables d'environnement Supabase
    const TWITCH_CLIENT_ID = Deno.env.get('TWITCH_CLIENT_ID')
    const TWITCH_CLIENT_SECRET = Deno.env.get('TWITCH_CLIENT_SECRET')

    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Configuration Twitch manquante' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Obtenir un token d'accès Twitch
    const tokenResponse = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      })
    })

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text()
      console.error('Erreur token Twitch:', errorBody)
      return new Response(
        JSON.stringify({ error: 'Erreur authentification Twitch' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // Récupérer les informations de l'utilisateur
    const userResponse = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!userResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur Twitch introuvable' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userData = await userResponse.json()
    const userId = userData.data?.[0]?.id

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Utilisateur Twitch introuvable' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Récupérer le nombre de followers
    const followersResponse = await fetch(`https://api.twitch.tv/helix/users/follows?to_id=${userId}`, {
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!followersResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Erreur récupération followers' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const followersData = await followersResponse.json()
    const followersCount = followersData.total || 0

    // Retourner les données
    return new Response(
      JSON.stringify({
        username,
        displayName: userData.data[0].display_name,
        followers: followersCount,
        profileImage: userData.data[0].profile_image_url
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Erreur dans get-twitch-followers:', error)
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 