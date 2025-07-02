'use server';

import {
  collection,
  getDocs,
  addDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  where,
  setDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Recipe, UserAccount, PublishedRecipe as PublishedRecipeType, ProfileData as ProfileDataType } from '@/types';


// Function to publish a recipe
export async function publishRecipe(userId: string, recipe: Recipe, imageUrl: string | null): Promise<string> {
  if (!db) throw new Error('Firestore is not initialized.');
  
  const userDocRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    throw new Error('User does not exist.');
  }

  const userData = userDoc.data();
  
  const publishedRecipesCollection = collection(db, 'published_recipes');
  const docRef = await addDoc(publishedRecipesCollection, {
    ...recipe,
    imageUrl,
    publisherId: userId,
    publisherName: userData.name,
    publisherPhotoURL: userData.photoURL || null,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

// Function to get all published recipes
export async function getPublishedRecipes(): Promise<PublishedRecipeType[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    const q = query(recipesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PublishedRecipeType));
}

// Function to get recipes published by a specific user
export async function getUserPublishedRecipes(userId: string): Promise<PublishedRecipeType[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    const q = query(recipesCollection, where('publisherId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PublishedRecipeType));
}

// Function to get public profile data
export async function getProfileData(userId: string): Promise<ProfileDataType | null> {
    if (!db) throw new Error("Firestore not initialized.");
    
    const userDocRef = doc(db, 'users', userId);
    const followersRef = collection(db, 'users', userId, 'followers');
    const followingRef = collection(db, 'users', userId, 'following');

    const [userDoc, followersSnap, followingSnap] = await Promise.all([
        getDoc(userDocRef),
        getDocs(followersRef),
        getDocs(followingRef)
    ]);

    if (!userDoc.exists()) {
        return null;
    }

    return {
        id: userDoc.id,
        ...userDoc.data(),
        followersCount: followersSnap.size,
        followingCount: followingSnap.size,
    } as ProfileDataType;
}


// Follow/Unfollow logic
export async function followUser(currentUserId: string, targetUserId: string) {
    if (!db) throw new Error("Firestore not initialized.");
    const batch = writeBatch(db);

    // Add target to current user's "following" list
    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.set(followingRef, { timestamp: serverTimestamp() });

    // Add current user to target user's "followers" list
    const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
    batch.set(followerRef, { timestamp: serverTimestamp() });

    await batch.commit();
}

export async function unfollowUser(currentUserId: string, targetUserId:string) {
    if (!db) throw new Error("Firestore not initialized.");
    const batch = writeBatch(db);

    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.delete(followingRef);

    const followerRef = doc(db, 'users', targetUserId, 'followers', currentUserId);
    batch.delete(followerRef);
    
    await batch.commit();
}

export async function getFollowingStatus(currentUserId: string, targetUserId: string): Promise<boolean> {
    if (!db) throw new Error("Firestore not initialized.");
    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const docSnap = await getDoc(followingRef);
    return docSnap.exists();
}
