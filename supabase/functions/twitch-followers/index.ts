// Supabase Edge Function — Twitch followers
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { twitchUsername } = await req.json();

    if (!twitchUsername) {
      return new Response(JSON.stringify({ error: "Username Twitch requis" }), { 
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const client_id = Deno.env.get("TWITCH_CLIENT_ID");
    const client_secret = Deno.env.get("TWITCH_CLIENT_SECRET");

    if (!client_id || !client_secret) {
      return new Response(JSON.stringify({ error: "Configuration Twitch manquante" }), { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get Access Token
    const tokenRes = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`,
      { method: "POST" }
    );

    if (!tokenRes.ok) {
      return new Response(JSON.stringify({ error: "Invalid Twitch credentials" }), { 
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { access_token } = await tokenRes.json();

    // Get user data
    const userRes = await fetch(
      `https://api.twitch.tv/helix/users?login=${twitchUsername}`,
      {
        headers: {
          "Client-ID": client_id,
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const userData = await userRes.json();

    if (!userData?.data?.length) {
      return new Response(JSON.stringify({ error: "User not found" }), { 
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Get channel data
    const channelRes = await fetch(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${userData.data[0].id}`,
      {
        headers: {
          "Client-ID": client_id,
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const channelData = await channelRes.json();
    
    // Try to get followers count - this might not work due to API limitations
    let followersCount = 0;
    try {
      const followersRes = await fetch(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userData.data[0].id}&first=1`,
        {
          headers: {
            "Client-ID": client_id,
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (followersRes.ok) {
        const followersData = await followersRes.json();
        followersCount = followersData.total || 0;
      }
    } catch (error) {
      console.log('Followers count not available due to API limitations');
    }

    return new Response(JSON.stringify({
      username: twitchUsername,
      followers: followersCount,
      displayName: userData.data[0].display_name,
      profileImage: userData.data[0].profile_image_url
    }), { 
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error('Erreur dans twitch-followers:', error);
    return new Response(JSON.stringify({ error: "Erreur serveur" }), { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
