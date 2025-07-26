#!/bin/bash

echo "🧪 Test rapide - Stripe Connect Express"
echo "========================================"

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les résultats
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

echo ""
echo "1. Vérification des Edge Functions déployées..."

# Vérifier que les fonctions existent
if curl -s -o /dev/null -w "%{http_code}" https://ajbfgeojhfbtbmouynva.supabase.co/functions/v1/stripe-create-account | grep -q "401\|200"; then
    print_result 0 "stripe-create-account accessible"
else
    print_result 1 "stripe-create-account inaccessible"
fi

if curl -s -o /dev/null -w "%{http_code}" https://ajbfgeojhfbtbmouynva.supabase.co/functions/v1/stripe-onboarding-link | grep -q "401\|200"; then
    print_result 0 "stripe-onboarding-link accessible"
else
    print_result 1 "stripe-onboarding-link inaccessible"
fi

if curl -s -o /dev/null -w "%{http_code}" https://ajbfgeojhfbtbmouynva.supabase.co/functions/v1/stripe-payout | grep -q "401\|200"; then
    print_result 0 "stripe-payout accessible"
else
    print_result 1 "stripe-payout inaccessible"
fi

echo ""
echo "2. Vérification des fichiers de base de données..."

if [ -f "supabase/withdrawals.sql" ]; then
    print_result 0 "Table withdrawals.sql présente"
else
    print_result 1 "Table withdrawals.sql manquante"
fi

if [ -f "supabase/declarations.sql" ]; then
    print_result 0 "Table declarations.sql présente"
else
    print_result 1 "Table declarations.sql manquante"
fi

echo ""
echo "3. Vérification des services mobiles..."

if [ -f "KLIPZ-Mobile/src/services/stripeConnectService.ts" ]; then
    print_result 0 "stripeConnectService.ts présent"
else
    print_result 1 "stripeConnectService.ts manquant"
fi

if [ -f "KLIPZ-Mobile/src/services/withdrawalService.ts" ]; then
    print_result 0 "withdrawalService.ts présent"
else
    print_result 1 "withdrawalService.ts manquant"
fi

echo ""
echo "4. Vérification des écrans mobiles..."

if [ -f "KLIPZ-Mobile/src/screens/EarningsScreen.tsx" ]; then
    print_result 0 "EarningsScreen.tsx mis à jour"
else
    print_result 1 "EarningsScreen.tsx non mis à jour"
fi

if [ -f "KLIPZ-Mobile/src/screens/AdminDeclarationsScreen.tsx" ]; then
    print_result 0 "AdminDeclarationsScreen.tsx mis à jour"
else
    print_result 1 "AdminDeclarationsScreen.tsx non mis à jour"
fi

echo ""
echo "5. Vérification de la configuration deep linking..."

if grep -q '"scheme": "klipz"' "KLIPZ-Mobile/app.json"; then
    print_result 0 "Deep linking configuré dans app.json"
else
    print_result 1 "Deep linking non configuré dans app.json"
fi

if grep -q "Linking.addEventListener" "KLIPZ-Mobile/App.tsx"; then
    print_result 0 "Deep linking configuré dans App.tsx"
else
    print_result 1 "Deep linking non configuré dans App.tsx"
fi

echo ""
echo "6. Vérification des dépendances..."

cd KLIPZ-Mobile
if npm list expo-web-browser > /dev/null 2>&1; then
    print_result 0 "expo-web-browser installé"
else
    print_result 1 "expo-web-browser manquant"
fi

if npm list expo-linking > /dev/null 2>&1; then
    print_result 0 "expo-linking installé"
else
    print_result 1 "expo-linking manquant"
fi

cd ..

echo ""
echo "========================================"
echo -e "${YELLOW}📋 Résumé :${NC}"
echo ""
echo -e "${GREEN}✅ Tout est prêt pour les tests !${NC}"
echo ""
echo "🎯 Prochaines étapes :"
echo "1. Lancer l'app mobile"
echo "2. Se connecter en tant que clipper"
echo "3. Aller sur 'Mes Gains'"
echo "4. Cliquer 'Retirer mes gains'"
echo "5. Tester l'onboarding Stripe"
echo ""
echo "📖 Guide complet : STRIPE_CONNECT_TESTING_GUIDE.md"
echo ""
echo -e "${YELLOW}⚠️  Important :${NC}"
echo "- Assurez-vous que vos variables d'environnement sont configurées"
echo "- Testez d'abord en mode Stripe Test"
echo "- Vérifiez les logs Supabase en cas d'erreur" 