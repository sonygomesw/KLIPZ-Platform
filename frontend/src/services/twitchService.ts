// twitchService.ts - Version sécurisée avec Supabase Edge Function

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Extraire le nom d'utilisateur depuis une URL Twitch
const extractUsername = (url: string): string | null => {
  const match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/);
  return match ? match[1] : null;
};

export interface TwitchData {
  username: string;
  followers: number;
  displayName: string;
  profileImage: string;
}

export const getTwitchDataFromUrl = async (twitchUrl: string): Promise<TwitchData | null> => {
  try {
    console.log("🔵 Récupération des données Twitch via Supabase Edge Function...");
    
    // Extraire le nom d'utilisateur de l'URL
    const twitchUsername = extractUsername(twitchUrl);
    if (!twitchUsername) {
      throw new Error("URL Twitch invalide");
    }

    console.log("🔵 Username extrait:", twitchUsername);
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/twitch-followers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ twitchUsername })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Error Edge Function:', errorData);
      throw new Error(errorData.error || 'Error récupération données Twitch');
    }

    const data = await response.json();
    console.log("✅ Données Twitch récupérées:", data);
    
    return {
      username: data.username,
      followers: data.followers,
      displayName: data.displayName,
      profileImage: data.profileImage
    };

  } catch (error) {
    console.error("❌ Error complète récupération Twitch:", error);
    throw error;
  }
};

// Fonction de compatibilité pour ne pas casser l'existant
export const getFollowersFromTwitchUrl = async (twitchUrl: string): Promise<number | null> => {
  try {
    const twitchData = await getTwitchDataFromUrl(twitchUrl);
    return twitchData ? twitchData.followers : null;
  } catch (error) {
    console.error("❌ Error récupération followers:", error);
    return null;
  }
};

// Fonction de validation pour compatibilité avec authService
export const validateTwitchUrl = (url: string): boolean => {
  const twitchUrlPattern = /^https?:\/\/(www\.)?twitch\.tv\/[a-zA-Z0-9_]{4,25}$/;
  return twitchUrlPattern.test(url);
};

// Export par défaut pour compatibilité
const twitchService = {
  getFollowersFromTwitchUrl,
  validateTwitchUrl,
};

export default twitchService; 