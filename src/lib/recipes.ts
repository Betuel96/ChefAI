import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Recipe, SavedRecipe } from '@/types';

/**
 * Adds a new recipe to a user's collection in Firestore.
 * @param userId The ID of the user.
 * @param recipe The recipe data to save.
 * @returns The ID of the newly created recipe document.
 */
export async function addRecipe(userId: string, recipe: Recipe): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const recipesCollection = collection(db, 'users', userId, 'recipes');
  const docRef = await addDoc(recipesCollection, {
    ...recipe,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Fetches all recipes for a given user, ordered by creation date.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved recipes.
 */
export async function getRecipes(userId:string): Promise<SavedRecipe[]> {
    if (!db) {
        throw new Error("Firestore is not initialized.");
    }
    const recipesCollection = collection(db, 'users', userId, 'recipes');
    const q = query(recipesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            name: data.name,
            instructions: data.instructions,
            additionalIngredients: data.additionalIngredients,
            equipment: data.equipment,
            // createdAt is not needed in the app UI, so we don't return it
        } as SavedRecipe;
    });
}


/**
 * Deletes a specific recipe from a user's collection.
 * @param userId The ID of the user.
 * @param recipeId The ID of the recipe to delete.
 */
export async function deleteRecipe(userId: string, recipeId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const recipeDoc = doc(db, 'users', userId, 'recipes', recipeId);
  await deleteDoc(recipeDoc);
}
