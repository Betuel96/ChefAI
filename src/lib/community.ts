
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
  getDoc,
  writeBatch,
  Timestamp,
  updateDoc,
  runTransaction,
  increment,
  deleteDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import type { PublishedPost, ProfileData as ProfileDataType, Comment } from '@/types';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

// Function to create a new post (recipe or text)
export async function createPost(
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  postData: Omit<PublishedPost, 'id' | 'createdAt' | 'publisherId' | 'publisherName' | 'publisherPhotoURL' | 'imageUrl' | 'likesCount' | 'commentsCount'>,
  imageDataUri: string | null
): Promise<string> {
  if (!db || !storage) throw new Error('Firestore or Storage is not initialized.');

  const postsCollection = collection(db, 'published_recipes');
  
  const docRef = await addDoc(postsCollection, {
    ...postData,
    publisherId: userId,
    publisherName: userName,
    publisherPhotoURL: userPhotoURL,
    createdAt: serverTimestamp(),
    imageUrl: null,
    likesCount: 0,
    commentsCount: 0,
  });

  if (imageDataUri) {
    const storageRef = ref(storage, `users/${userId}/posts/${docRef.id}.png`);
    try {
      const snapshot = await uploadString(storageRef, imageDataUri, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      await updateDoc(docRef, { imageUrl: downloadURL });
    } catch (error) {
      console.error('Error uploading post image:', error);
    }
  }

  return docRef.id;
}

// Function to update a post
export async function updatePost(
  postId: string,
  updateData: Partial<PublishedPost>,
  newImageDataUri?: string | null | 'DELETE'
): Promise<void> {
  if (!db || !storage) throw new Error('Firestore or Storage is not initialized.');
  const postRef = doc(db, 'published_recipes', postId);

  // Handle image update first if a new URI is provided or deletion is requested
  if (newImageDataUri !== null && newImageDataUri !== undefined) {
    const postSnap = await getDoc(postRef);
    const postData = postSnap.data();
    if (!postData) throw new Error("Post not found to update image.");

    const userId = postData.publisherId;
    if (!userId) throw new Error('Post is missing publisherId.');

    if (newImageDataUri === 'DELETE') {
      // Delete existing image if it exists
      if (postData.imageUrl) {
        try {
          const oldImageRef = ref(storage, postData.imageUrl);
          await deleteObject(oldImageRef);
        } catch (e: any) {
          if (e.code !== 'storage/object-not-found') {
            console.error('Could not delete old image:', e);
          }
        }
      }
      updateData.imageUrl = null;
    } else {
      // It's a data URI, so upload it.
      const storageRef = ref(storage, `users/${userId}/posts/${postId}.png`);
      const snapshot = await uploadString(storageRef, newImageDataUri, 'data_url');
      const downloadURL = await getDownloadURL(snapshot.ref);
      updateData.imageUrl = downloadURL;
    }
  }

  // Update the Firestore document with the text fields and potentially new imageUrl
  await updateDoc(postRef, updateData as { [x: string]: any });
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
            type: data.type || 'recipe',
            content: data.content || data.name,
            instructions: data.instructions,
            additionalIngredients: data.additionalIngredients,
            equipment: data.equipment,
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
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
            likesCount: data.likesCount || 0,
            commentsCount: data.commentsCount || 0,
        } as PublishedPost;
    });
}

// Function to get a single post by its ID
export async function getPost(postId: string): Promise<PublishedPost | null> {
    if (!db) throw new Error('Firestore is not initialized.');
    const postRef = doc(db, 'published_recipes', postId);
    const docSnap = await getDoc(postRef);

    if (!docSnap.exists()) {
        console.error(`Post with ID ${postId} not found.`);
        return null;
    }
    const data = docSnap.data();
    const createdAtTimestamp = data.createdAt as Timestamp;
    return {
        id: docSnap.id,
        ...data,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        likesCount: data.likesCount || 0,
        commentsCount: data.commentsCount || 0,
    } as PublishedPost;
}

// Function to delete a post and its associated image
export async function deletePost(postId: string): Promise<void> {
    if (!db || !storage) {
        throw new Error('Firebase no está configurado.');
    }
    const postRef = doc(db, 'published_recipes', postId);
    try {
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = postSnap.data();
            if (postData.imageUrl) {
                try {
                    const imageRef = ref(storage, postData.imageUrl);
                    await deleteObject(imageRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.error('Error al eliminar la imagen del post:', storageError);
                    }
                }
            }
        }
        await deleteDoc(postRef);
    } catch (error) {
        console.error('Error al eliminar el post:', error);
        throw new Error('No se pudo eliminar la publicación.');
    }
}


// Function to get comments for a post
export async function getComments(postId: string): Promise<Comment[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const commentsRef = collection(db, 'published_recipes', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc')); // Order ascending to build threads correctly
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: doc.id,
            ...data,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            parentId: data.parentId || null,
            likesCount: data.likesCount || 0,
        } as Comment;
    });
}

// Function to add a comment to a post
export async function addComment(
  postId: string,
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  text: string,
  parentId: string | null = null
): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized.');
    const postRef = doc(db, 'published_recipes', postId);
    const commentsRef = collection(postRef, 'comments');

    const newCommentRef = await addDoc(commentsRef, {
        userId,
        userName,
        userPhotoURL,
        text,
        parentId,
        likesCount: 0,
        createdAt: serverTimestamp(),
    });

    await updateDoc(postRef, {
        commentsCount: increment(1)
    });

    return newCommentRef.id;
}

// Function to check if a post is liked by a user
export async function isPostLiked(postId: string, userId: string): Promise<boolean> {
    if (!db) throw new Error('Firestore is not initialized.');
    if (!userId) return false;
    const likeRef = doc(db, 'published_recipes', postId, 'likes', userId);
    const docSnap = await getDoc(likeRef);
    return docSnap.exists();
}

// Function to toggle a like on a post
export async function toggleLikePost(postId: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized.');
    const postRef = doc(db, 'published_recipes', postId);
    const likeRef = doc(postRef, 'likes', userId);

    await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        if (likeDoc.exists()) {
            transaction.delete(likeRef);
            transaction.update(postRef, { likesCount: increment(-1) });
        } else {
            transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
            transaction.update(postRef, { likesCount: increment(1) });
        }
    });
}

// Function to check if a comment is liked by a user
export async function isCommentLiked(postId: string, commentId: string, userId: string): Promise<boolean> {
    if (!db || !userId) return false;
    const likeRef = doc(db, 'published_recipes', postId, 'comments', commentId, 'likes', userId);
    const docSnap = await getDoc(likeRef);
    return docSnap.exists();
}

// Function to toggle a like on a comment
export async function toggleCommentLike(postId: string, commentId: string, userId: string): Promise<void> {
    if (!db) throw new Error('Firestore is not initialized.');
    const commentRef = doc(db, 'published_recipes', postId, 'comments', commentId);
    const likeRef = doc(commentRef, 'likes', userId);

    await runTransaction(db, async (transaction) => {
        const likeDoc = await transaction.get(likeRef);
        if (likeDoc.exists()) {
            transaction.delete(likeRef);
            transaction.update(commentRef, { likesCount: increment(-1) });
        } else {
            transaction.set(likeRef, { userId, createdAt: serverTimestamp() });
            transaction.update(commentRef, { likesCount: increment(1) });
        }
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

    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    batch.set(followingRef, { timestamp: serverTimestamp() });

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
