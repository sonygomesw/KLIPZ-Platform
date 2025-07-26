// Polyfills pour React Native - Appliqués immédiatement et agressivement
import 'core-js/stable';
import structuredClone from '@ungap/structured-clone';

// Patch immédiat et agressif pour structuredClone
const applyStructuredClonePatch = () => {
  const contexts = [
    globalThis,
    global,
    typeof window !== 'undefined' ? window : null,
    typeof self !== 'undefined' ? self : null,
  ].filter(Boolean);

  contexts.forEach(context => {
    if (context && !context.structuredClone) {
      Object.defineProperty(context, 'structuredClone', {
        value: structuredClone,
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
  });
};

// Appliquer immédiatement
applyStructuredClonePatch();

// Réappliquer après un court délai pour s'assurer que ça fonctionne
setTimeout(applyStructuredClonePatch, 0);
setTimeout(applyStructuredClonePatch, 10);
setTimeout(applyStructuredClonePatch, 100);

// Polyfill pour crypto.randomUUID
const applyCryptoPatch = () => {
  const contexts = [
    globalThis,
    global,
    typeof window !== 'undefined' ? window : null,
    typeof self !== 'undefined' ? self : null,
  ].filter(Boolean);

  contexts.forEach(context => {
    if (context) {
      if (!context.crypto) {
        context.crypto = {} as any;
      }
      if (!context.crypto.randomUUID) {
        context.crypto.randomUUID = () => {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        };
      }
    }
  });
};

applyCryptoPatch();

// Vérification et logs
const checkPolyfills = () => {
  const results = {
    globalThis_structuredClone: typeof globalThis.structuredClone !== 'undefined',
    global_structuredClone: typeof (global as any).structuredClone !== 'undefined',
    crypto: typeof globalThis.crypto !== 'undefined',
    randomUUID: typeof globalThis.crypto?.randomUUID !== 'undefined'
  };
  
  console.log('✅ Polyfills status:', results);
  
  if (!results.globalThis_structuredClone || !results.global_structuredClone) {
    console.warn('⚠️  structuredClone polyfill might not be working properly');
    // Réessayer
    applyStructuredClonePatch();
  }
  
  return results;
};

// Vérifier immédiatement et après un délai
checkPolyfills();
setTimeout(checkPolyfills, 1000);

export {}; 