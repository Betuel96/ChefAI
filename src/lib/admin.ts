// src/lib/admin.ts
'use server';

import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
  query,
  orderBy,
  where,
  writeBatch,
  deleteDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import type { UserAccount, PublishedPost } from '@/types';
import { ref, deleteObject } from 'firebase/storage';

// En un entorno de producción, esta lista estaría vacía y la verificación se haría
// únicamente contra la colección 'admins' en Firestore para máxima seguridad.
// Para fines de demostración, puedes añadir tu UID de Firebase aquí para acceder al panel.
const HARDCODED_ADMIN_UIDS: string[] = []; // Ejemplo: ['YOUR_FIREBASE_UID']

/**
 * Checks if a user is an administrator.
 * @param userId The ID of the user to check.
 * @returns A promise that resolves to true if the user is an admin, false otherwise.
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  // Primero, comprueba si el UID está en la lista de administradores codificada.
  if (HARDCODED_ADMIN_UIDS.includes(userId)) {
    return true;
  }
  
  // Si no está en la lista codificada, comprueba la colección 'admins' en Firestore.
  const adminDocRef = doc(db, 'admins', userId);
  try {
    const docSnap = await getDoc(adminDocRef);
    // El usuario es un administrador si el documento existe.
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Fetches all user accounts from Firestore.
 * @returns A promise that resolves to an array of user accounts.
 */
export async function getAllUsers(): Promise<UserAccount[]> {
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    const usersCollection = collection(db, 'users');
    const snapshot = await getDocs(usersCollection);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: doc.id,
            ...data,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        } as UserAccount;
    });
}

/**
 * Updates a user's subscription tier.
 * @param userId The ID of the user to update.
 * @param tier The new subscription tier ('pro', 'voice+', 'lifetime', or null for free).
 */
export async function updateUserSubscription(userId: string, tier: string | null): Promise<void> {
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    const userDocRef = doc(db, 'users', userId);
    
    const isPremium = tier === 'pro' || tier === 'voice+' || tier === 'lifetime';
    
    await updateDoc(userDocRef, {
        isPremium: isPremium,
        subscriptionTier: tier,
    });
}


/**
 * Fetches all published content from the platform.
 * @returns A promise that resolves to an array of all published posts.
 */
export async function getAllPublishedContent(): Promise<PublishedPost[]> {
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    const contentCollection = collection(db, 'published_recipes');
    const q = query(contentCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        // Basic normalization, detailed content is not needed for the table view
        return {
            id: doc.id,
            publisherId: data.publisherId,
            publisherName: data.publisherName,
            publisherPhotoURL: data.publisherPhotoURL || null,
            type: data.type,
            content: data.content,
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        } as PublishedPost;
    });
}


/**
 * Deletes a user's account data from Firestore and their content from Storage.
 * This is a destructive action and does NOT delete the Firebase Auth user.
 * @param userId The ID of the user to delete.
 */
export async function deleteUserAndContent(userId: string): Promise<void> {
    if (!db) {
        throw new Error('Firestore no está inicializado.');
    }

    const batch = writeBatch(db);
    const deleteMediaPromises: Promise<void>[] = [];

    // 1. Get user data to find username
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        // If user doc doesn't exist, they are already "deleted" from our app's POV.
        // We can still try to clean up content if any is orphaned.
        console.warn(`El documento del usuario ${userId} no fue encontrado. Se procederá a eliminar su contenido si existe.`);
    }
    const userData = userSnap.data();

    // 2. Delete user's published content and associated media
    const postsCollection = collection(db, 'published_recipes');
    const postsQuery = query(postsCollection, where('publisherId', '==', userId));
    const postsSnapshot = await getDocs(postsQuery);

    postsSnapshot.forEach(postDoc => {
        const postData = postDoc.data();
        if (postData.mediaUrl && storage) {
            try {
                // IMPORTANT: This assumes mediaUrl is the full gs:// or https:// URL.
                // We must use the full URL to create the ref.
                const mediaRef = ref(storage, postData.mediaUrl);
                deleteMediaPromises.push(deleteObject(mediaRef).catch(err => {
                    if (err.code !== 'storage/object-not-found') {
                        console.error(`No se pudo eliminar el medio para el post ${postDoc.id}:`, err);
                    }
                }));
            } catch (e) {
                 console.error(`URL de medio inválida para el post ${postDoc.id}:`, e);
            }
        }
        batch.delete(postDoc.ref);
    });
    
    // Note: A more robust solution would also delete stories, comments, likes, etc.
    // This is a complex cascading delete problem best handled by a Cloud Function for production.
    // For this prototype, deleting the user profile and their main posts is a strong moderation action.

    // 3. Delete user document from /users
    if (userSnap.exists()) {
        batch.delete(userRef);
    }

    // 4. Delete username document from /usernames to free it up
    if (userData && userData.username) {
        const usernameRef = doc(db, 'usernames', userData.username);
        batch.delete(usernameRef);
    }
    
    // 5. Execute all batched writes and media deletions
    try {
        await Promise.all(deleteMediaPromises);
        await batch.commit();
    } catch (error) {
        console.error("Error durante el proceso de eliminación del usuario:", error);
        throw new Error("No se pudo eliminar completamente al usuario y su contenido.");
    }
}
