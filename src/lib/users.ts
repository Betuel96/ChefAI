import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import {
  signInWithPopup,
  sendEmailVerification,
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
    if (error.code === 'auth/unauthorized-domain') {
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'tu-dominio.com';
      throw new Error(`Dominio no autorizado. Por favor, ve a tu Consola de Firebase -> Authentication -> Settings -> Authorized domains y añade el siguiente dominio: ${domain}`);
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

/**
 * Resends the verification email to the currently signed-in user.
 */
export async function resendVerificationEmail(): Promise<{ success: boolean; message: string }> {
    if (!auth || !auth.currentUser) {
        return { success: false, message: 'Debes iniciar sesión para reenviar el correo.' };
    }

    try {
        await sendEmailVerification(auth.currentUser);
        return { success: true, message: 'Correo de verificación reenviado. Revisa tu bandeja de entrada.' };
    } catch (error: any) {
        console.error("Error resending verification email:", error);
        if (error.code === 'auth/too-many-requests') {
            return { success: false, message: 'Has solicitado esto demasiadas veces. Inténtalo más tarde.' };
        }
        return { success: false, message: 'No se pudo reenviar el correo de verificación.' };
    }
}
