import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDRFX89l0LE-tXgLOgWGboG1QQx3A8EAI0",
  authDomain: "harsha-9e21c.firebaseapp.com",
  projectId: "harsha-9e21c",
  storageBucket: "harsha-9e21c.firebasestorage.app",
  messagingSenderId: "560241078228",
  appId: "1:560241078228:web:c03b53b016461ec97a7041"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;