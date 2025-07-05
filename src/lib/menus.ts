
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
} from 'firebase/firestore';
import { db } from './firebase';
import type { WeeklyPlan, SavedWeeklyPlan, PublishedPost, UserAccount } from '@/types';

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
      // The weeklyMealPlan is stored directly in the document
      const createdAtTimestamp = data.createdAt as Timestamp;
      return {
        id: doc.id,
        weeklyMealPlan: data.weeklyMealPlan,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
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
