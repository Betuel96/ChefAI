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
 */
export async function createUserDocument(userId: string, name: string, email: string | null): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, {
    name,
    email,
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
      await createUserDocument(user.uid, user.displayName || 'Usuario de Google', user.email);
    }
    // If it exists, their data is already in Firestore. No action needed.
  } catch (error: any) {
    console.error("Error durante el inicio de sesión con Google: ", error);
    // You can customize error messages based on error.code here if needed
    // e.g., 'auth/popup-closed-by-user'
    throw new Error("No se pudo iniciar sesión con Google. Por favor, inténtalo de nuevo.");
  }
}
