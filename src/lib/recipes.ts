import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, storage } from './firebase';
import type { Recipe, SavedRecipe } from '@/types';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

async function uploadRecipeMedia(userId: string, recipeId: string, mediaDataUri: string): Promise<string> {
    if (!storage) throw new Error('Storage is not initialized.');
    const storageRef = ref(storage, `users/${userId}/recipes/${recipeId}`);
    try {
        const snapshot = await uploadString(storageRef, mediaDataUri, 'data_url');
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error('Error uploading media for new recipe:', error);
        throw new Error('No se pudo subir la imagen. Comprueba las reglas de Storage y la conexión.');
    }
}

/**
 * Adds a new recipe to a user's collection in Firestore, optionally uploading an image.
 * @param userId The ID of the user.
 * @param recipe The recipe data to save.
 * @param mediaDataUri The base64 data URI of the media to upload.
 * @param mediaType The type of media being uploaded ('image' or 'video').
 * @returns The ID of the newly created recipe document.
 */
export async function addRecipe(
  userId: string,
  recipe: Recipe,
  mediaDataUri: string | null,
  mediaType: 'image' | 'video' | null
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  
  const newRecipeDocRef = doc(collection(db, 'users', userId, 'recipes')); 
  
  let mediaUrl: string | null = null;
  if (mediaDataUri) {
      mediaUrl = await uploadRecipeMedia(userId, newRecipeDocRef.id, mediaDataUri);
  }

  await setDoc(newRecipeDocRef, {
    ...recipe,
    mediaUrl: mediaUrl,
    mediaType: mediaType,
    createdAt: serverTimestamp(),
  });

  return newRecipeDocRef.id;
}

/**
 * Fetches all recipes for a given user, ordered by creation date.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved recipes.
 */
export async function getRecipes(userId: string): Promise<SavedRecipe[]> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const recipesCollection = collection(db, 'users', userId, 'recipes');
    const q = query(recipesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    const normalizeField = (field: any): string[] => {
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') return field.split('\n').filter(line => line.trim() !== '');
        return [];
    };

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        name: data.name,
        instructions: normalizeField(data.instructions),
        ingredients: normalizeField(data.ingredients),
        equipment: normalizeField(data.equipment),
        benefits: data.benefits || undefined,
        nutritionalTable: data.nutritionalTable || undefined,
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
      } as SavedRecipe;
    });
  } catch (error) {
    console.error(`[DEBUG] PERMISSION_ERROR in getRecipes. Failed to read 'recipes' subcollection for userId: ${userId}. Check Firestore rules.`, error);
    return [];
  }
}

/**
 * Deletes a specific recipe and its associated media from a user's collection.
 * @param userId The ID of the user.
 * @param recipeId The ID of the recipe to delete.
 */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  if (!db || !storage) {
    throw new Error('Firebase services are not initialized.');
  }
  
  const recipeDocRef = doc(db, 'users', userId, 'recipes', recipeId);
  
  // Get the doc to check for a mediaUrl before deleting
  const docSnap = await getDoc(recipeDocRef);
  if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.mediaUrl) {
        // Delete the associated media from Storage
        const storageRef = ref(storage, data.mediaUrl);
        try {
            await deleteObject(storageRef);
        } catch (error: any) {
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting recipe media:", error);
            }
        }
      }
  }

  // Delete the Firestore document
  await deleteDoc(recipeDocRef);
}
