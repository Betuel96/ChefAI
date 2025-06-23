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
} from 'firebase/firestore';
import { db, storage } from './firebase';
import type { Recipe, SavedRecipe } from '@/types';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

/**
 * Adds a new recipe to a user's collection in Firestore, optionally uploading an image.
 * @param userId The ID of the user.
 * @param recipe The recipe data to save.
 * @param imageDataUri The base64 data URI of the image to upload.
 * @returns The ID of the newly created recipe document.
 */
export async function addRecipe(
  userId: string,
  recipe: Recipe,
  imageDataUri: string | null
): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const recipesCollection = collection(db, 'users', userId, 'recipes');
  // Add recipe without imageUrl first to get the ID
  const docRef = await addDoc(recipesCollection, {
    ...recipe,
    createdAt: serverTimestamp(),
    imageUrl: null, // Start with null
  });

  if (imageDataUri && storage) {
    const storageRef = ref(storage, `users/${userId}/recipes/${docRef.id}.png`);
    try {
      // Upload the base64 string
      const snapshot = await uploadString(storageRef, imageDataUri, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update the recipe document with the image URL
      await updateDoc(docRef, {
        imageUrl: downloadURL,
      });
    } catch (error) {
      console.error('Error uploading image and updating recipe:', error);
      // Optionally, you could delete the Firestore doc here if image upload is critical
    }
  }

  return docRef.id;
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
  const recipesCollection = collection(db, 'users', userId, 'recipes');
  const q = query(recipesCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      instructions: data.instructions,
      additionalIngredients: data.additionalIngredients,
      equipment: data.equipment,
      imageUrl: data.imageUrl || null,
    } as SavedRecipe;
  });
}

/**
 * Deletes a specific recipe and its associated image from a user's collection.
 * @param userId The ID of the user.
 * @param recipeId The ID of the recipe to delete.
 */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  if (!db || !storage) {
    throw new Error('Firebase services are not initialized.');
  }
  
  // Delete the Firestore document
  const recipeDoc = doc(db, 'users', userId, 'recipes', recipeId);
  await deleteDoc(recipeDoc);

  // Delete the associated image from Storage
  const storageRef = ref(storage, `users/${userId}/recipes/${recipeId}.png`);
  try {
    await deleteObject(storageRef);
  } catch (error: any) {
    // It's okay if the image doesn't exist (e.g., old recipes without images)
    if (error.code !== 'storage/object-not-found') {
      console.error("Error deleting recipe image:", error);
    }
  }
}
