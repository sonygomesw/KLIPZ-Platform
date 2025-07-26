#!/bin/bash

echo "🚀 Déploiement des Edge Functions Stripe Connect..."

# Vérifier que nous sommes dans le bon répertoire
if [ ! -d "supabase" ]; then
    echo "❌ Erreur: Répertoire 'supabase' non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

# Aller dans le répertoire supabase
cd supabase

echo "📦 Déploiement de stripe-create-account..."
supabase functions deploy stripe-create-account

echo "📦 Déploiement de stripe-onboarding-link..."
supabase functions deploy stripe-onboarding-link

echo "📦 Déploiement de stripe-payout..."
supabase functions deploy stripe-payout

echo "✅ Déploiement terminé !"
echo ""
echo "🔗 URLs des fonctions déployées :"
echo "- stripe-create-account: https://$(supabase status --output json | jq -r '.project_ref').supabase.co/functions/v1/stripe-create-account"
echo "- stripe-onboarding-link: https://$(supabase status --output json | jq -r '.project_ref').supabase.co/functions/v1/stripe-onboarding-link"
echo "- stripe-payout: https://$(supabase status --output json | jq -r '.project_ref').supabase.co/functions/v1/stripe-payout"
echo ""
echo "⚠️  Assurez-vous que vos variables d'environnement sont configurées :"
echo "- STRIPE_SECRET_KEY"
echo "- SUPABASE_URL"
echo "- SUPABASE_SERVICE_ROLE_KEY" 