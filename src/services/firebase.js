import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || ''
};

// Check if valid Firebase configuration is provided
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('your_api_key_here')
);

let app = null;
let auth = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.info('[VaxSafe] Connected to Firebase Project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[VaxSafe] Failed to initialize live Firebase SDK. Falling back to local operations engine.', error);
  }
} else {
  console.info('[VaxSafe] Operating with built-in Enterprise Operations Engine (Demo / Offline-ready mode). Set VITE_FIREBASE_* in .env to connect to live Firebase.');
}

export { app, auth, db };
export default firebaseConfig;
