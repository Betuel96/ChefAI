
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// This configuration uses environment variables.
// The values are securely provided by Firebase App Hosting during the build and deployment process.
// NEVER hardcode API keys or other secrets in your code.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "chefai-cfo4t.firebaseapp.com",
  projectId: "chefai-cfo4t",
  storageBucket: "chefai-cfo4t.appspot.com",
  messagingSenderId: "50145465999",
  appId: "1:50145465999:web:1b842c2e50a4da7f9e02fa"
};


export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let googleProvider: GoogleAuthProvider;

if (isFirebaseConfigured) {
    // Ensures we get or create the instance specifically for this project.
    app = getApps().find(app => app.name === "chefai-cfo4t") || initializeApp(firebaseConfig, "chefai-cfo4t");
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn("Firebase configuration is missing or incomplete. Some features may not work.");
}


export { app, auth, db, storage, googleProvider };
