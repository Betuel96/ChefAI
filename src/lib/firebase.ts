
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "chefai-cfo4t.firebaseapp.com",
  projectId: "chefai-cfo4t",
  storageBucket: "chefai-cfo4t.appspot.com",
  messagingSenderId: "929391221066",
  appId: "1:929391221066:web:f0f0f8d24e428c1b22c9b3"
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

if (isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig, "chefai-cfo4t") : getApp("chefai-cfo4t");
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn("Firebase configuration is missing or incomplete. Some features may not work.");
}


export { app, auth, db, storage, googleProvider };
