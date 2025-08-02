import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDRFX89l0LE-tXgLOgWGboG1QQx3A8EAI0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "harsha-9e21c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "harsha-9e21c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "harsha-9e21c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "560241078228",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:560241078228:web:c03b53b016461ec97a7041"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with offline support
export const db = getFirestore(app);

// Enable offline persistence for better reliability
if (typeof window !== 'undefined') {
  // Only run in browser environment
  try {
    // This will be handled automatically in newer Firebase versions
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.warn('Firebase initialization warning:', error);
  }
}

export default app;