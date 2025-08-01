import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface TikTokUserData {
  open_id: string;
  union_id?: string;
  custom_username: string;
  nickname: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  bio_description?: string;
  profile_deep_link?: string;
  is_verified: boolean;
  follower_status: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, state } = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization code is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // TikTok OAuth configuration
    const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY')
    const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET')
    const redirectUri = Deno.env.get('TIKTOK_REDIRECT_URI')

    if (!clientKey || !clientSecret || !redirectUri) {
      console.error('Missing TikTok environment variables')
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Exchange authorization code for access token
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
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('TikTok token exchange failed:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to exchange authorization code' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const tokenData = await tokenResponse.json()
    const { access_token, open_id, union_id } = tokenData

    if (!access_token || !open_id) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token response from TikTok' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get user info from TikTok
    const userInfoResponse = await fetch('https://open.tiktokapis.com/v2/user/info/', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!userInfoResponse.ok) {
      const errorData = await userInfoResponse.text()
      console.error('TikTok user info failed:', errorData)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to get user info from TikTok' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const userInfoData = await userInfoResponse.json()
    const userInfo = userInfoData.data.user

    // Format user data
    const formattedUserData: TikTokUserData = {
      open_id: open_id,
      union_id: union_id,
      custom_username: userInfo.username || userInfo.display_name,
      nickname: userInfo.display_name,
      avatar_url: userInfo.avatar_url || '',
      follower_count: userInfo.follower_count || 0,
      following_count: userInfo.following_count || 0,
      likes_count: userInfo.likes_count || 0,
      video_count: userInfo.video_count || 0,
      bio_description: userInfo.bio_description,
      profile_deep_link: userInfo.profile_deep_link,
      is_verified: userInfo.is_verified || false,
      follower_status: userInfo.follower_status || 0,
    }

    return new Response(
      JSON.stringify({
        success: true,
        userData: formattedUserData,
        access_token: access_token,
        open_id: open_id,
        union_id: union_id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('TikTok auth callback error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 