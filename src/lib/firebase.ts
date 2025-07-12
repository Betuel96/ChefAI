import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: "AIzaSyCcQfmMqyXJbke-kfDIwFdI25jRGa6PItw",
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
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  googleProvider = new GoogleAuthProvider();

  if (typeof window !== 'undefined') {
    // This token is for local development only.
    // It should be generated in the browser console on first run and added here.
    (self as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    
    // The reCAPTCHA v3 site key for your project.
    const reCaptchaSiteKey = "6LfxcH8rAAAAANML0gfeakQctNe98reY_Cl_UjMl";

    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(reCaptchaSiteKey),
      isTokenAutoRefreshEnabled: true
    });
  }
}

export { app, auth, db, storage, googleProvider };
