# 🛡️ FICHIERS CRITIQUES - À PROTÉGER

## ⚠️ ATTENTION : Ces fichiers contiennent les améliorations RapidAPI
**NE PAS REMPLACER** ces fichiers lors du redesign frontend !

## 📁 Fichiers Frontend Critiques :

### 1. **AdminDeclarationsScreen.tsx**
- ✅ Indicateur de chargement "RapidAPI..."
- ✅ Mise à jour automatique des vues
- ✅ Gestion d'erreurs améliorée
- ✅ Affichage des vues TikTok en temps réel

### 2. **adminService.ts**
- ✅ Logique de récupération des données admin
- ✅ Intégration avec Edge Functions
- ✅ Gestion des soumissions et stats

### 3. **autoScrapingService.ts**
- ✅ Service de scraping TikTok
- ✅ Appels vers RapidAPI
- ✅ Gestion des erreurs de scraping

### 4. **env.ts**
- ✅ Configuration des variables d'environnement
- ✅ Gestion des clés API

### 5. **supabase.ts**
- ✅ Configuration client Supabase
- ✅ Gestion des erreurs de connexion

## 🔄 Instructions pour le redesign :

### ✅ À FAIRE :
- Modifier le design/UI de ces fichiers
- Améliorer l'interface utilisateur
- Changer les couleurs/styles

### ❌ À NE PAS FAIRE :
- Supprimer la logique RapidAPI
- Remplacer complètement ces fichiers
- Casser l'intégration avec l'API

## 📝 Notes :
- Les améliorations RapidAPI sont dans `backend/supabase/functions/auto-scraping/`
- La clé RapidAPI est configurée dans les variables d'environnement
- Tester après le redesign pour s'assurer que RapidAPI fonctionne toujours

---
**Dernière mise à jour :** $(date)
**Auteur :** Sony Jr 