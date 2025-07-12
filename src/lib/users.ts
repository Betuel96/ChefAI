
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
  type UserCredential,
  signInWithRedirect,
  getRedirectResult,
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
    profileType: 'public', // Default to public profile
    isVerified: false,
    badges: [],
    createdAt: serverTimestamp(),
    notificationSettings: {
        publicFeed: true,
        followingFeed: true,
    },
    lastVisitedFeeds: {
        public: new Date().toISOString(),
        following: new Date().toISOString(),
    },
    stripeConnectAccountId: null,
    canMonetize: false,
    verificationRequestStatus: null,
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
 * This function should be called from the client after a successful popup sign-in.
 * @param userCredential The user credential from the sign-in result.
 */
export async function onSignInSuccess(userCredential: UserCredential): Promise<void> {
  if (!db) {
    throw new Error('Firebase no está configurado correctamente.');
  }
  
  const user = userCredential.user;

  try {
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
      const sanitizedEmail = (user.email?.split('@')[0] || 'user').replace(/[^a-zA-Z0-9]/g, '');
      const defaultUsername = `${sanitizedEmail}${Math.floor(1000 + Math.random() * 9000)}`;
      await createUserDocument(user.uid, user.displayName || 'Usuario de Google', defaultUsername, user.email, user.photoURL);
    }
  } catch (error: any) {
    console.error(`[users.ts > onSignInSuccess] Error creating/checking user document. Código: "${error.code}". Mensaje: "${error.message}"`);
    if (error.code === 'unavailable' || (error.message && error.message.toLowerCase().includes('offline'))) {
      throw new Error("Error de permisos de Firestore. No se pudo leer el perfil de usuario después de iniciar sesión. Por favor, revisa que tus reglas de Firestore (`firestore.rules`) permitan la lectura del documento del usuario (ej: /users/{userId}).");
    }
    throw new Error("No se pudo configurar tu cuenta. Inténtalo de nuevo.");
  }
}

/**
 * Initiates the Google Sign-In popup flow.
 * @returns A promise that resolves with the UserCredential on success.
 */
export async function signInWithGooglePopup(): Promise<UserCredential> {
    if (!auth || !googleProvider) {
        throw new Error('Firebase Auth no está configurado.');
    }
    return signInWithPopup(auth, googleProvider);
}

/**
 * Initiates the Google Sign-In redirect flow.
 */
export async function signInWithGoogleRedirect(): Promise<void> {
    if (!auth || !googleProvider) {
        throw new Error('Firebase Auth no está configurado.');
    }
    await signInWithRedirect(auth, googleProvider);
}

/**
 * Checks for a redirect result from Google Sign-In.
 * To be called on app initialization.
 */
export async function checkRedirectResult(): Promise<UserCredential | null> {
    if (!auth) {
        return null;
    }
    try {
        const result = await getRedirectResult(auth);
        return result;
    } catch (error) {
        console.error("Error getting redirect result:", error);
        return null;
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

/**
 * Updates a user's profile settings, e.g., public/private status.
 * This also updates all of the user's existing posts to reflect the new privacy setting.
 * @param userId The ID of the user.
 * @param settings The settings to update.
 */
export async function updateProfileSettings(userId: string, settings: { profileType: 'public' | 'private' }): Promise<void> {
  if (!db || !auth?.currentUser || auth.currentUser.uid !== userId) {
    throw new Error('No autorizado para realizar esta acción.');
  }

  const batch = writeBatch(db);

  // 1. Update the user's main profile document
  const userDocRef = doc(db, 'users', userId);
  batch.update(userDocRef, settings);

  // 2. Find all posts by this user and update their profileType to match
  const postsCollection = collection(db, 'published_recipes');
  const userPostsQuery = query(postsCollection, where('publisherId', '==', userId));
  
  try {
    const userPostsSnapshot = await getDocs(userPostsQuery);
    userPostsSnapshot.forEach(postDoc => {
        const postRef = doc(db, 'published_recipes', postDoc.id);
        batch.update(postRef, { profileType: settings.profileType });
    });

    // 3. Commit all updates to the user profile and all their posts at once
    await batch.commit();

  } catch (error) {
      console.error("Error updating user posts' privacy settings:", error);
      throw new Error("No se pudieron actualizar los ajustes de privacidad en todas las publicaciones. Es posible que necesites crear un índice de Firestore para esta operación.");
  }
}

/**
 * Updates a user's notification preferences in Firestore.
 * @param userId The user's ID.
 * @param preferences The notification preferences to set.
 */
export async function updateNotificationPreferences(
    userId: string,
    preferences: { publicFeed?: boolean; followingFeed?: boolean }
): Promise<void> {
    if (!db || !auth?.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('No autorizado.');
    }
    const userDocRef = doc(db, 'users', userId);
    
    // Use dot notation for updating nested objects
    const updateData: { [key: string]: boolean } = {};
    if (preferences.publicFeed !== undefined) {
        updateData['notificationSettings.publicFeed'] = preferences.publicFeed;
    }
    if (preferences.followingFeed !== undefined) {
        updateData['notificationSettings.followingFeed'] = preferences.followingFeed;
    }

    if (Object.keys(updateData).length > 0) {
        await updateDoc(userDocRef, updateData);
    }
}

/**
 * Updates the "last visited" timestamp for a specific feed for a user.
 * @param userId The user's ID.
 * @param feedType The type of feed being visited.
 */
export async function updateLastVisitedTimestamp(
    userId: string,
    feedType: 'public' | 'following'
): Promise<void> {
    if (!db || !auth?.currentUser || auth.currentUser.uid !== userId) {
        return; // Fail silently, not a critical error
    }
    const userDocRef = doc(db, 'users', userId);
    try {
        await updateDoc(userDocRef, {
            [`lastVisitedFeeds.${feedType}`]: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Failed to update last visited timestamp:", error);
    }
}


/**
 * Submits a verification request for a user.
 * @param userId The ID of the user requesting verification.
 * @param data The verification request data.
 */
export async function submitVerificationRequest(userId: string, data: { reason: string; link: string }): Promise<void> {
    if (!db || !auth?.currentUser || auth.currentUser.uid !== userId) {
        throw new Error('No autorizado.');
    }

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists() || userSnap.data().verificationRequestStatus === 'pending') {
        throw new Error('Ya tienes una solicitud de verificación pendiente.');
    }
    
    if (userSnap.data().isVerified) {
        throw new Error('Tu cuenta ya está verificada.');
    }

    const requestRef = doc(collection(db, 'verification_requests'));
    const batch = writeBatch(db);

    batch.set(requestRef, {
        userId,
        userName: auth.currentUser.displayName,
        userEmail: auth.currentUser.email,
        reason: data.reason,
        link: data.link,
        status: 'pending',
        createdAt: serverTimestamp(),
    });

    batch.update(userRef, { verificationRequestStatus: 'pending' });
    
    await batch.commit();
}
