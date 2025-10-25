export const config = {
  app: {
    env: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
  },
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
  gemini: {
    apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  },
} as const;

export const isDevelopment = config.app.env === 'development';
export const isProduction = config.app.env === 'production';
export const isDemoMode = config.app.demoMode;