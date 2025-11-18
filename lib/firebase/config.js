// ==================== FIREBASE CONFIGURATION ====================
// Firebase configuration and initialization
// This file contains the Firebase app setup and exports

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDNCtXHIk6WL5_Qz23jBKAdOoIkzZAJJWo",
  authDomain: "portalhunter-a94db.firebaseapp.com",
  projectId: "portalhunter-a94db",
  storageBucket: "portalhunter-a94db.firebasestorage.app",
  messagingSenderId: "277622419270",
  appId: "1:277622419270:web:3ca5e216bb55e320323f47",
  measurementId: "G-T7WKK30QSX"
};

// Initialize Firebase (only once)
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance
export default app;
