
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
} from 'firebase/firestore';
import { db } from './firebase';
import type { WeeklyPlan, SavedWeeklyPlan } from '@/types';

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
  const menusCollection = collection(db, 'users', userId, 'menus');
  const q = query(menusCollection, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data();
    // The weeklyMealPlan is stored directly in the document
    return {
      id: doc.id,
      weeklyMealPlan: data.weeklyMealPlan,
    } as SavedWeeklyPlan;
  });
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
