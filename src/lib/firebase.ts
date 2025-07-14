import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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

if (isFirebaseConfigured && typeof window !== 'undefined') {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Set session persistence
    setPersistence(auth, browserLocalPersistence)
        .catch((error) => {
            console.error("Error setting auth persistence:", error);
        });
    
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
}

// Fallback for server-side rendering where window is not defined
if (isFirebaseConfigured && typeof window === 'undefined') {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
}


export { app, auth, db, storage, googleProvider };
