# 🔍 Debug Guide - Problème de Soumissions

## Problème identifié
Quand un clipper soumet un clip via "Submit Clip", le clip n'apparaît pas dans :
- My Clips (SubmissionsScreen)
- AdminPanel (clips section)
- Campagne du streamer

## Tests effectués
✅ Backend fonctionne (test-clip-submission.js)
✅ Fonction submitClip fonctionne
❌ Interface ne se synchronise pas

## Actions de debug à faire :

### 1. Vérifier l'utilisateur connecté
```javascript
// Dans AvailableMissionsScreen.handleSubmitClip, ajouter :
console.log('🔍 USER DEBUG:', {
  userId: user.id,
  email: user.email,
  role: user.role
});
```

### 2. Vérifier l'appel API
```javascript
// Dans AvailableMissionsScreen.handleSubmitClip, avant l'appel :
console.log('🔍 SUBMISSION DEBUG:', {
  clipperId: user.id,
  campaignId: selectedMission.id,
  url: clipUrl.trim()
});
```

### 3. Vérifier la réponse
```javascript
// Après l'appel submitClip :
console.log('🔍 SUBMISSION RESULT:', submission);
```

### 4. Vérifier dans My Clips
- Aller dans l'onglet My Clips
- Regarder les logs de `loadSubmissions()`
- Vérifier si les données arrivent

### 5. Test manuel simple
1. Connectez-vous avec un compte clipper
2. Soumettez un clip
3. Allez dans My Clips
4. Refreshez manuellement (pull to refresh)
5. Vérifiez dans AdminPanel

## Solution probable
Le problème est probablement :
1. **L'utilisateur connecté n'est pas un clipper**
2. **L'ID utilisateur n'est pas correct**
3. **Il faut rafraîchir manuellement l'écran**

## Solution rapide
Ajouter un `loadSubmissions()` dans un useEffect qui écoute les changements de route ou un bouton de refresh manuel. 