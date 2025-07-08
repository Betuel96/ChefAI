import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let googleProvider: GoogleAuthProvider | null = null;

const isKeyConfigured = (key: string | undefined): boolean => {
  // A key is considered configured if it exists and is not a placeholder.
  return !!key && !key.includes('AQUÍ');
};


// Check if all necessary environment variables are set and are not placeholders
export const isFirebaseConfigured =
  isKeyConfigured(firebaseConfig.apiKey) &&
  isKeyConfigured(firebaseConfig.authDomain) &&
  isKeyConfigured(firebaseConfig.projectId) &&
  isKeyConfigured(firebaseConfig.storageBucket) &&
  isKeyConfigured(firebaseConfig.messagingSenderId) &&
  isKeyConfigured(firebaseConfig.appId);

if (isFirebaseConfigured) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
  } catch (e) {
    console.error('Failed to initialize Firebase', e);
  }
}

export { app, auth, db, storage, googleProvider };
