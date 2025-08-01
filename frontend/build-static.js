const fs = require('fs');
const path = require('path');

console.log('🚀 Building KLIPZ for production...');

// Créer le dossier web-build
const buildDir = path.join(__dirname, 'web-build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Créer un index.html avec l'application
const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
    <title>KLIPZ - Clip & Earn</title>
    <meta name="description" content="KLIPZ - Plateforme de clips TikTok rémunérés" />
    <link rel="icon" href="/favicon.png" />
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
            background: linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%);
            color: white;
            overflow-x: hidden;
        }
        .container { 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            padding: 20px;
            flex-direction: column;
            text-align: center;
        }
        .logo { 
            font-size: 4rem; 
            font-weight: bold; 
            margin-bottom: 2rem;
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1);
            background-size: 300% 300%;
            animation: gradient 3s ease infinite;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        .subtitle { 
            font-size: 1.5rem; 
            margin-bottom: 3rem; 
            opacity: 0.8;
        }
        .feature-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }
        .feature-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 2rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease;
        }
        .feature-card:hover {
            transform: translateY(-5px);
        }
        .feature-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .feature-title {
            font-size: 1.25rem;
            font-weight: bold;
            margin-bottom: 1rem;
        }
        .feature-desc {
            opacity: 0.8;
            line-height: 1.6;
        }
        .cta-button {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            color: white;
            padding: 15px 40px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            margin-top: 2rem;
            transition: transform 0.3s ease;
        }
        .cta-button:hover {
            transform: scale(1.05);
        }
        .status {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            font-weight: bold;
        }
        @media (max-width: 768px) {
            .logo { font-size: 2.5rem; }
            .subtitle { font-size: 1.2rem; }
            .feature-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="status">✅ Live on Vercel</div>
    <div class="container">
        <h1 class="logo">KLIPZ</h1>
        <p class="subtitle">Créez, Partagez, Gagnez avec vos clips TikTok</p>
        
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">🎥</div>
                <h3 class="feature-title">Créer des Clips</h3>
                <p class="feature-desc">Créez des clips TikTok engageants pour les marques et influenceurs</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">💰</div>
                <h3 class="feature-title">Gagner de l'Argent</h3>
                <p class="feature-desc">Soyez rémunéré pour vos créations selon les vues et engagements</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3 class="feature-title">Analytics Avancés</h3>
                <p class="feature-desc">Suivez vos performances en temps réel avec des métriques détaillées</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">🚀</div>
                <h3 class="feature-title">Croissance Rapide</h3>
                <p class="feature-desc">Profitez de notre réseau pour booster votre audience</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">💳</div>
                <h3 class="feature-title">Paiements Sécurisés</h3>
                <p class="feature-desc">Retraits rapides et sécurisés via Stripe Connect</p>
            </div>
            
            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3 class="feature-title">App Mobile</h3>
                <p class="feature-desc">Interface responsive optimisée mobile et desktop</p>
            </div>
        </div>
        
        <button class="cta-button" onclick="showApp()">
            Accéder à l'Application
        </button>
        
        <div id="app-info" style="margin-top: 2rem; opacity: 0.7; display: none;">
            <p>🔧 L'application complète React Native sera bientôt disponible</p>
            <p>📧 Contact: support@klipz.app</p>
        </div>
    </div>

    <script>
        function showApp() {
            document.getElementById('app-info').style.display = 'block';
            alert('🚀 Bienvenue sur KLIPZ!\\n\\nL\\'application complète est en cours de déploiement.\\nCette version statique démontre les fonctionnalités principales.');
        }
        
        // Animation de chargement
        window.addEventListener('load', () => {
            console.log('🎉 KLIPZ loaded successfully!');
            console.log('🔗 Frontend: React Native Web + Expo');
            console.log('🛠️ Backend: Supabase + Stripe');
            console.log('☁️ Deployed on: Vercel');
        });
    </script>
</body>
</html>`;

// Écrire le fichier
fs.writeFileSync(path.join(buildDir, 'index.html'), indexHtml);

console.log('✅ Static build completed!');
console.log('📁 Files created in: web-build/');
console.log('🌐 Ready for deployment!'); 