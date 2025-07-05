
'use server';

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
  setDoc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { WeeklyPlan, SavedWeeklyPlan, PublishedPost, UserAccount, Recipe, DailyMealPlan, NutritionalInfo } from '@/types';

/**
 * Adds a new weekly menu to a user's collection in Firestore.
 * @param userId The ID of the user.
 * @param menu The weekly plan data to save.
 * @returns The ID of the newly created menu document.
 */
export async function addMenu(userId: string, menu: WeeklyPlan): Promise<string> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const menusCollection = collection(db, 'users', userId, 'menus');
  const docRef = await addDoc(menusCollection, {
    ...menu,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Fetches all weekly menus for a given user, ordered by creation date.
 * @param userId The ID of the user.
 * @returns A promise that resolves to an array of saved weekly plans.
 */
export async function getMenus(userId: string): Promise<SavedWeeklyPlan[]> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  try {
    const menusCollection = collection(db, 'users', userId, 'menus');
    const q = query(menusCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const createdAtTimestamp = data.createdAt as Timestamp;

      const normalizeField = (field: any): string[] => {
        if (Array.isArray(field)) return field;
        if (typeof field === 'string') return field.split('\n').filter(line => line.trim() !== '');
        return [];
      };

      const normalizeRecipe = (recipe: any): Recipe => {
        if (!recipe) return { name: '', instructions: [], ingredients: [], equipment: [] };
        return {
          name: recipe.name || '',
          instructions: normalizeField(recipe.instructions),
          ingredients: normalizeField(recipe.ingredients),
          equipment: normalizeField(recipe.equipment || []),
          benefits: recipe.benefits || undefined,
          nutritionalTable: recipe.nutritionalTable || undefined,
        };
      };
      
      const processedPlan = (Array.isArray(data.weeklyMealPlan) ? data.weeklyMealPlan : []).map((day: any) => {
        if (!day) return null;
        return {
          day: day.day || '',
          breakfast: normalizeRecipe(day.breakfast),
          lunch: normalizeRecipe(day.lunch),
          comida: normalizeRecipe(day.comida),
          dinner: normalizeRecipe(day.dinner),
        };
      }).filter((day): day is DailyMealPlan => day !== null);


      return {
        id: doc.id,
        weeklyMealPlan: processedPlan,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        ingredients: data.ingredients || '',
        dietaryPreferences: data.dietaryPreferences || '',
        numberOfDays: data.numberOfDays || 7,
        numberOfPeople: data.numberOfPeople || 2,
      } as SavedWeeklyPlan;
    });
  } catch (error) {
    console.error(`[DEBUG] PERMISSION_ERROR in getMenus. Failed to read 'menus' subcollection for userId: ${userId}. Check Firestore rules.`, error);
    return [];
  }
}

/**
 * Deletes a specific menu from a user's collection.
 * @param userId The ID of the user.
 * @param menuId The ID of the menu to delete.
 */
export async function deleteMenu(userId: string, menuId: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const menuDoc = doc(db, 'users', userId, 'menus', menuId);
  await deleteDoc(menuDoc);
}

/**
 * Updates a specific menu in a user's collection.
 * @param userId The ID of the user.
 * @param menuId The ID of the menu to update.
 * @param weeklyMealPlan The updated weekly meal plan array.
 */
export async function updateMenu(userId: string, menuId: string, weeklyMealPlan: DailyMealPlan[]): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const menuDoc = doc(db, 'users', userId, 'menus', menuId);
  // Just update the field that changed.
  await updateDoc(menuDoc, {
    weeklyMealPlan,
  });
}


/**
 * Publishes a saved weekly menu as a new post in the community feed.
 * @param userId The ID of the user publishing the menu.
 * @param userName The display name of the user.
 * @param userPhotoURL The photo URL of the user.
 * @param caption A caption or title for the post.
 * @param menu The weekly plan to publish.
 * @returns The ID of the newly created post document.
 */
export async function publishMenuAsPost(
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  caption: string,
  menu: WeeklyPlan
): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized.');

  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('User profile not found.');
  }
  const userData = userSnap.data() as UserAccount;

  const postsCollection = collection(db, 'published_recipes');
  
  const newPost: Omit<PublishedPost, 'id' | 'createdAt'> = {
    publisherId: userId,
    publisherName: userName,
    publisherPhotoURL: userPhotoURL,
    type: 'menu',
    profileType: userData.profileType || 'public',
    content: caption,
    weeklyMealPlan: menu.weeklyMealPlan,
    likesCount: 0,
    commentsCount: 0,
    mentions: [],
  };

  const docRef = await addDoc(postsCollection, {
    ...newPost,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
}
