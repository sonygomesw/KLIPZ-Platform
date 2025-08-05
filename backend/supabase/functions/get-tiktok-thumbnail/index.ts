import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tiktokUrl } = await req.json()
    
    console.log('🎯 Récupération thumbnail pour:', tiktokUrl)
    
    // Méthode 1: Essayer de récupérer via l'API oEmbed de TikTok
    try {
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(tiktokUrl)}`
      const oembedResponse = await fetch(oembedUrl)
      
      if (oembedResponse.ok) {
        const oembedData = await oembedResponse.json()
        console.log('✅ Données oEmbed récupérées:', oembedData)
        
        if (oembedData.thumbnail_url) {
          return new Response(
            JSON.stringify({ 
              success: true, 
              thumbnailUrl: oembedData.thumbnail_url,
              method: 'oembed'
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200 
            }
          )
        }
      }
    } catch (e) {
      console.log('❌ Erreur oEmbed:', e)
    }

    // Méthode 2: Extraire l'ID et essayer les CDN
    const regex = /\/video\/(\d+)/
    const match = tiktokUrl.match(regex)
    
    if (match && match[1]) {
      const videoId = match[1]
      console.log('🎯 ID vidéo extrait:', videoId)
      
      // Essayer différents formats CDN
      const cdnUrls = [
        `https://p16-sign-sg.tiktokcdn.com/aweme/100x100/${videoId}.jpeg`,
        `https://p16-va.tiktokcdn.com/img/tos-useast2a-v-2774/${videoId}~tplv-resize:100:100.jpeg`,
        `https://www.tiktok.com/api/img/?itemId=${videoId}`
      ]
      
      // Tester chaque URL
      for (const url of cdnUrls) {
        try {
          const response = await fetch(url, { method: 'HEAD' })
          if (response.ok) {
            console.log('✅ CDN URL trouvée:', url)
            return new Response(
              JSON.stringify({ 
                success: true, 
                thumbnailUrl: url,
                method: 'cdn'
              }),
              { 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200 
              }
            )
          }
        } catch (e) {
          console.log('❌ Erreur CDN URL:', url, e)
        }
      }
    }

    // Si aucune méthode ne fonctionne
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Impossible de récupérer le thumbnail',
        thumbnailUrl: null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404 
      }
    )

  } catch (error) {
    console.error('❌ Erreur serveur:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
}) 