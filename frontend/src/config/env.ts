// Configuration des variables d'environnement
export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
};

// Debug des variables d'environnement avec plus de détails
console.log('🔍 Debug ENV Config:');
console.log('SUPABASE_URL:', ENV.SUPABASE_URL ? `✅ Définie (${ENV.SUPABASE_URL.length} chars)` : '❌ Manquante');
console.log('SUPABASE_ANON_KEY:', ENV.SUPABASE_ANON_KEY ? `✅ Définie (${ENV.SUPABASE_ANON_KEY.length} chars)` : '❌ Manquante');
console.log('STRIPE_PUBLISHABLE_KEY:', ENV.STRIPE_PUBLISHABLE_KEY ? `✅ Définie (${ENV.STRIPE_PUBLISHABLE_KEY.length} chars)` : '❌ Manquante');

// Vérification de la validité des clés
const isValidSupabaseUrl = ENV.SUPABASE_URL && ENV.SUPABASE_URL.startsWith('https://') && ENV.SUPABASE_URL.includes('.supabase.co');
const isValidSupabaseKey = ENV.SUPABASE_ANON_KEY && ENV.SUPABASE_ANON_KEY.startsWith('eyJ') && ENV.SUPABASE_ANON_KEY.length > 100;

console.log('🔍 Validation des clés:');
console.log('SUPABASE_URL valide:', isValidSupabaseUrl ? '✅' : '❌');
console.log('SUPABASE_ANON_KEY valide:', isValidSupabaseKey ? '✅' : '❌');

export default ENV; 