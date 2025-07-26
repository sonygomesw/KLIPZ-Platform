const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Active le hot reload
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Force le rechargement pour les changements
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return middleware(req, res, next);
    };
  },
};

// Platform configuration
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configuration pour SVG
config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

// Web-specific configurations  
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/utils/webStubs.js'),
  'react-native/Libraries/TurboModule/TurboModuleRegistry': path.resolve(__dirname, 'src/utils/webStubs.js'),
  '@stripe/stripe-react-native': path.resolve(__dirname, 'src/services/stripeWebService.ts'),
};

module.exports = config; 