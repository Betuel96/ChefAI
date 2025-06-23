'use server';

import {
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

/**
 * Creates a user document in Firestore upon signup.
 * @param userId The ID of the user from Firebase Auth.
 * @param name The user's display name.
 * @param email The user's email address.
 */
export async function createUserDocument(userId: string, name: string, email: string): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }
  const userDocRef = doc(db, 'users', userId);
  await setDoc(userDocRef, {
    name,
    email,
    isPremium: false,
    createdAt: serverTimestamp(),
  });
}