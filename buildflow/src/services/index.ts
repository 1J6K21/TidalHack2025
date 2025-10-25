// ============================================================================
// BUILDFLOW SERVICES INDEX
// ============================================================================

// Firebase Services
export * from './firebase';
export * from './firebaseStorage';

// AI Services  
export * from './gemini';
export * from './manualGeneration';

// Service utilities and helpers
export { STORAGE_PATHS } from './firebaseStorage';

// Re-export commonly used functions with cleaner names
export {
  uploadManual as saveManual,
  getManual as loadManual,
  getManualsList as loadManualsList,
  uploadImage as saveImage,
  getImageURL as loadImageURL,
  deleteManual as removeManual
} from './firebaseStorage';

export {
  generateManual as createManual,
  generateManualWithRetry as createManualWithRetry,
  validateProductIdea,
  estimateGenerationTime,
  getGenerationStatusMessage
} from './manualGeneration';

// Service configuration and constants
export const SERVICE_CONFIG = {
  FIREBASE: {
    STORAGE_PATHS: {
      DEMO_MANUALS: 'manuals/demo',
      GENERATED_MANUALS: 'manuals/generated',
      DEMO_IMAGES: 'images/demo',
      GENERATED_IMAGES: 'images/generated',
      THUMBNAILS: 'images/thumbnails',
      STEPS: 'images/steps',
      MATERIALS: 'images/materials'
    }
  },
  GEMINI: {
    MODEL: 'gemini-pro',
    MAX_RETRIES: 2,
    TIMEOUT: 30000,
    MAX_TOKENS: 4096
  }
} as const;

// Error handling utilities
export { 
  validateManualStructure,
  validateStepsStructure,
  validateMaterialsStructure
} from './firebaseStorage';