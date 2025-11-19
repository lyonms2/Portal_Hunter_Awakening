// ==================== FIREBASE CONFIGURATION ====================
// Firebase configuration and initialization
// This file contains the Firebase app setup and exports

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Verificar se as variáveis estão configuradas
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ ERRO: Variáveis de ambiente do Firebase não configuradas!');
  console.error('Variáveis necessárias:');
  console.error('- NEXT_PUBLIC_FIREBASE_API_KEY:', firebaseConfig.apiKey ? '✅' : '❌ FALTANDO');
  console.error('- NEXT_PUBLIC_FIREBASE_PROJECT_ID:', firebaseConfig.projectId ? '✅' : '❌ FALTANDO');
  console.error('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:', firebaseConfig.authDomain ? '✅' : '❌ FALTANDO');
}

// Initialize Firebase (only once)
let app;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error.message);
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance
export default app;
