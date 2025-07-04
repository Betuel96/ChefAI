
import {
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
  writeBatch,
  query,
  collection,
  where,
  getDocs,
  updateDoc
} from 'firebase/firestore';
import {
  signInWithPopup,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';
import { db, auth, googleProvider, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { UserAccount } from '@/types';

/**
 * Creates a user document in Firestore upon signup.
 * @param userId The ID of the user from Firebase Auth.
 * @param name The user's display name.
 * @param username The user's unique username.
 * @param email The user's email address.
 * @param photoURL The user's photo URL.
 */
export async function createUserDocument(userId: string, name: string, username: string, email: string | null, photoURL: string | null = null): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const userDocRef = doc(db, 'users', userId);
  const usernameDocRef = doc(db, 'usernames', username);
  
  const batch = writeBatch(db);

  // TODO: Add Firestore rule to ensure usernames collection documents can't be overwritten.
  // This client-side check is a good first step.
  const usernameSnap = await getDoc(usernameDocRef);
  if (usernameSnap.exists()) {
    throw new Error('Este nombre de usuario ya está en uso.');
  }

  batch.set(userDocRef, {
    name,
    username,
    email,
    photoURL,
    isPremium: false,
    createdAt: serverTimestamp(),
  });

  batch.set(usernameDocRef, { userId });

  await batch.commit();
}


/**
 * Updates a user's profile information in Auth, Firestore, and optionally Storage.
 * @param userId The ID of the user to update.
 * @param data The new profile data (name, username).
 * @param newImageFile The new image file to upload.
 */
export async function updateUserProfile(
    userId: string,
    data: { name: string; username: string },
    newImageFile?: File | null
): Promise<{ updatedData: Partial<UserAccount> }> {
    if (!auth || !db) throw new Error('Firebase no está inicializado.');
    if (auth.currentUser?.uid !== userId) throw new Error('No autorizado.');

    const userDocRef = doc(db, 'users', userId);
    const currentUser = auth.currentUser;
    const userSnap = await getDoc(userDocRef);
    if (!userSnap.exists()) throw new Error('El perfil de usuario no existe.');
    const oldUserData = userSnap.data();

    const batch = writeBatch(db);
    let finalPhotoURL = oldUserData.photoURL;
    const updatedData: Partial<UserAccount> = { name: data.name };

    // Handle username change with uniqueness check
    if (data.username && data.username !== oldUserData.username) {
        const newUsernameRef = doc(db, 'usernames', data.username);
        
        const newUsernameSnap = await getDoc(newUsernameRef);
        if (newUsernameSnap.exists()) {
            throw new Error('Este nombre de usuario ya está en uso. Por favor, elige otro.');
        }

        // If there was an old username, delete its document.
        if (oldUserData.username) {
            const oldUsernameRef = doc(db, 'usernames', oldUserData.username);
            batch.delete(oldUsernameRef);
        }

        // Create the new username document and update the user's profile.
        batch.set(newUsernameRef, { userId });
        batch.update(userDocRef, { username: data.username });
        updatedData.username = data.username;
    }

    // Handle image upload
    if (newImageFile && storage) {
        const imageRef = ref(storage, `users/${userId}/profile.png`);
        await uploadBytes(imageRef, newImageFile);
        finalPhotoURL = await getDownloadURL(imageRef);
    }

    // Update Auth profile
    await updateProfile(currentUser, {
        displayName: data.name,
        photoURL: finalPhotoURL,
    });

    // Update Firestore document
    batch.update(userDocRef, { name: data.name, photoURL: finalPhotoURL });
    updatedData.name = data.name;
    updatedData.photoURL = finalPhotoURL;

    await batch.commit();
    
    return { updatedData };
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
      // Generate a default username from email, sanitized, with random numbers for uniqueness
      const sanitizedEmail = (user.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '');
      const defaultUsername = `${sanitizedEmail}${Math.floor(1000 + Math.random() * 9000)}`;

      await createUserDocument(user.uid, user.displayName || 'Usuario de Google', defaultUsername, user.email, user.photoURL);
    }
    // If it exists, their data is already in Firestore. No action needed.
  } catch (error: any) {
    // Handle the specific case where the user closes the popup.
    // This is a user action, not a technical error, so we log it for info and stop.
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('[users.ts > signInWithGoogle] El usuario cerró la ventana de inicio de sesión de Google.');
      return;
    }
    
    // For all other errors, log them as critical errors and throw a helpful message.
    console.error(`[users.ts > signInWithGoogle] Error durante el inicio de sesión con Google. Código: "${error.code}". Mensaje: "${error.message}"`);
    
    if (error.code === 'auth/unauthorized-domain') {
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'tu-dominio.com';
      throw new Error(`Dominio no autorizado. Por favor, ve a tu Consola de Firebase -> Authentication -> Settings -> Authorized domains y añade el siguiente dominio: ${domain}`);
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error("Ya existe una cuenta con este correo, pero con un método de inicio de sesión diferente.");
    }
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error("Inicio de sesión con Google no habilitado. Ve a tu Consola de Firebase -> Authentication -> Sign-in method y habilítalo.");
    }
     if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
       throw new Error("Error de permisos de Firestore. No se pudo leer el perfil de usuario después de iniciar sesión. Por favor, revisa que tus reglas de Firestore (`firestore.rules`) permitan la lectura del documento del usuario (ej: /users/{userId}).");
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
