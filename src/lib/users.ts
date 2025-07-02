'use server';

import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  signInWithPopup,
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';

/**
 * Creates a user document in Firestore upon signup.
 * @param userId The ID of the user from Firebase Auth.
 * @param name The user's display name.
 * @param email The user's email address.
 * @param photoURL The user's photo URL.
 */
export async function createUserDocument(userId: string, name: string, email: string | null, photoURL: string | null = null): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, {
    name,
    email,
    photoURL,
    isPremium: false,
    createdAt: serverTimestamp(),
  });
}

/**
 * Handles the Google Sign-In process, creating a user document if one doesn't exist.
 */
export async function signInWithGoogle(): Promise<void> {
  if (!auth || !db || !googleProvider) {
    throw new Error('Firebase no está configurado correctamente.');
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document already exists
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    // If not, create a new document for the user
    if (!docSnap.exists()) {
      await createUserDocument(user.uid, user.displayName || 'Usuario de Google', user.email, user.photoURL);
    }
    // If it exists, their data is already in Firestore. No action needed.
  } catch (error: any) {
    console.error("Error durante el inicio de sesión con Google: ", error.code, error.message);
    
    // Provide more specific error messages
    if (error.code === 'auth/popup-closed-by-user') {
      // Don't throw an error, just return. The user intentionally closed the popup.
      return;
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("Ya existe una cuenta con este correo, pero con un método de inicio de sesión diferente.");
    }
    // This is a key error to catch. It means the developer needs to enable Google Sign-In in the Firebase Console.
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Inicio de sesión con Google no habilitado. Revisa la configuración de Firebase.");
    }
    
    throw new Error("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
  }
}
