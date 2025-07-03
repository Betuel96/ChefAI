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
  updateDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import type { PublishedPost, ProfileData as ProfileDataType } from '@/types';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

// Function to create a new post (recipe or text)
export async function createPost(
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  postData: Omit<PublishedPost, 'id' | 'createdAt' | 'publisherId' | 'publisherName' | 'publisherPhotoURL' | 'imageUrl'>,
  imageDataUri: string | null
): Promise<string> {
  if (!db || !storage) throw new Error('Firestore or Storage is not initialized.');

  // The collection is named `published_recipes` for legacy reasons, but stores all post types.
  const postsCollection = collection(db, 'published_recipes');
  
  const docRef = await addDoc(postsCollection, {
    ...postData,
    publisherId: userId,
    publisherName: userName,
    publisherPhotoURL: userPhotoURL,
    createdAt: serverTimestamp(),
    imageUrl: null, // Start with null, update after upload
  });

  if (imageDataUri) {
    const storageRef = ref(storage, `users/${userId}/posts/${docRef.id}.png`);
    try {
      const snapshot = await uploadString(storageRef, imageDataUri, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      await updateDoc(docRef, { imageUrl: downloadURL });
    } catch (error) {
      console.error('Error uploading post image:', error);
      // Don't delete the doc, let the post exist without an image
    }
  }

  return docRef.id;
}


// Function to get all published posts
export async function getPublishedPosts(): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    const q = query(recipesCollection, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: doc.id,
            publisherId: data.publisherId,
            publisherName: data.publisherName,
            publisherPhotoURL: data.publisherPhotoURL || null,
            imageUrl: data.imageUrl || null,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            type: data.type || 'recipe', // Default to recipe for old data
            content: data.content || data.name, // Handle old data where name was used
            instructions: data.instructions,
            additionalIngredients: data.additionalIngredients,
            equipment: data.equipment,
        } as PublishedPost;
    });
}

// Function to get posts published by a specific user
export async function getUserPublishedPosts(userId: string): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    const q = query(recipesCollection, where('publisherId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: doc.id,
            publisherId: data.publisherId,
            publisherName: data.publisherName,
            publisherPhotoURL: data.publisherPhotoURL || null,
            imageUrl: data.imageUrl || null,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            type: data.type || 'recipe',
            content: data.content || data.name,
            instructions: data.instructions,
            additionalIngredients: data.additionalIngredients,
            equipment: data.equipment,
        } as PublishedPost;
    });
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
    
    const data = userDoc.data();
    const createdAtTimestamp = data.createdAt as Timestamp;

    return {
        id: userDoc.id,
        ...data,
        followersCount: followersSnap.size,
        followingCount: followingSnap.size,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
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
