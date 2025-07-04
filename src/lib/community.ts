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
  limit,
  setDoc,
} from 'firebase/firestore';
import { db, storage } from './firebase';
import type { PublishedPost, ProfileData as ProfileDataType, Comment, Mention, ProfileListItem, Notification, UserAccount } from '@/types';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

// Function to create a new post (recipe or text)
export async function createPost(
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  postData: Omit<PublishedPost, 'id' | 'createdAt' | 'publisherId' | 'publisherName' | 'publisherPhotoURL' | 'imageUrl' | 'likesCount' | 'commentsCount' | 'profileType'>,
  imageDataUri: string | null
): Promise<string> {
    if (!db || !storage) throw new Error('Firestore or Storage is not initialized.');

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        throw new Error('User profile not found.');
    }
    const userData = userSnap.data() as UserAccount;

    const postsCollection = collection(db, 'published_recipes');
    const docRef = doc(postsCollection); // Create a reference first to get the ID

    let imageUrl: string | null = null;
    let finalPostData: any = {
        ...postData,
        publisherId: userId,
        publisherName: userName,
        publisherPhotoURL: userPhotoURL,
        profileType: userData.profileType || 'public', // Save the user's privacy setting at time of post
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        mentions: postData.mentions || [],
    };

    try {
        if (imageDataUri) {
            const storageRef = ref(storage, `users/${userId}/posts/${docRef.id}.png`);
            const snapshot = await uploadString(storageRef, imageDataUri, 'data_url');
            imageUrl = await getDownloadURL(snapshot.ref);
            finalPostData.imageUrl = imageUrl;
        }

        // Set the document data, including the final imageUrl if available
        await setDoc(docRef, finalPostData);
        
        // Add notifications for mentions
        if (finalPostData.mentions && finalPostData.mentions.length > 0) {
            const fromUser: ProfileListItem = { id: userId, name: userName, username: userData.username, photoURL: userPhotoURL };
            const contentSnippet = (postData.content as string).substring(0, 50);

            for (const mention of finalPostData.mentions) {
                 if (mention.userId === userId) continue; // Don't notify self
                const notificationRef = doc(collection(db, 'users', mention.userId, 'notifications'));
                await setDoc(notificationRef, {
                    type: 'mention_post',
                    fromUser,
                    postId: docRef.id,
                    contentSnippet,
                    read: false,
                    createdAt: serverTimestamp()
                });
            }
        }

        return docRef.id;
    } catch (error) {
        console.error('Error creating post:', error);
        
        // If image upload fails after the document was potentially created (or vice versa), clean up.
        if (docRef.id) {
            try {
                await deleteDoc(docRef);
            } catch (delErr) {
                console.error("Cleanup failed: could not delete post doc.", delErr)
            }
        }
        
        throw new Error('La publicación no se pudo crear. Esto puede deberse a las reglas de seguridad de Firebase Storage. Asegúrate de que los usuarios autenticados tengan permiso de escritura.');
    }
}


// Function to update a post
export async function updatePost(
  postId: string,
  currentUserId: string,
  updateData: Partial<PublishedPost>,
  newImageDataUri?: string | null | 'DELETE'
): Promise<void> {
  if (!db || !storage) throw new Error('Firestore or Storage is not initialized.');
  const postRef = doc(db, 'published_recipes', postId);
  
  const postSnap = await getDoc(postRef);
  if (!postSnap.exists()) {
      throw new Error("La publicación no existe.");
  }
  const postData = postSnap.data();

  if (postData.publisherId !== currentUserId) {
    throw new Error("No tienes permiso para editar esta publicación.");
  }

  // Handle image update first if a new URI is provided or deletion is requested
  if (newImageDataUri !== null && newImageDataUri !== undefined) {
    const imagePath = `users/${currentUserId}/posts/${postId}.png`;
    const storageRef = ref(storage, imagePath);

    if (newImageDataUri === 'DELETE') {
      // Delete existing image if it exists
      if (postData.imageUrl) {
        try {
          await deleteObject(storageRef);
        } catch (e: any) {
          if (e.code !== 'storage/object-not-found') {
            console.error('Could not delete old image:', e);
          }
        }
      }
      updateData.imageUrl = null; // Set to null in Firestore
    } else {
      try {
        const snapshot = await uploadString(storageRef, newImageDataUri, 'data_url');
        const downloadURL = await getDownloadURL(snapshot.ref);
        updateData.imageUrl = downloadURL;
      } catch (error) {
        console.error("Error al subir la imagen:", error);
        throw new Error("No se pudo subir la imagen. Comprueba tu conexión o los permisos de almacenamiento.");
      }
    }
  }

  await updateDoc(postRef, updateData as { [x: string]: any });
}


// Function to get all public posts for the community feed
export async function getPublishedPosts(): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    // Only fetch posts from public profiles
    const q = query(recipesCollection, where('profileType', '==', 'public'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: doc.id,
            ...data,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            mentions: data.mentions || [],
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
            ...data,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            mentions: data.mentions || [],
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
        mentions: data.mentions || [],
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
            if (postData.imageUrl && postData.publisherId) {
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
            mentions: data.mentions || [],
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
  parentId: string | null = null,
  mentions: Mention[] = []
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
        mentions,
        likesCount: 0,
        createdAt: serverTimestamp(),
    });

    await updateDoc(postRef, {
        commentsCount: increment(1)
    });

    // Add notifications for mentions
    if (mentions && mentions.length > 0) {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        const fromUser: ProfileListItem = { id: userId, name: userName, username: userData?.username, photoURL: userPhotoURL };
        const contentSnippet = text.substring(0, 50);

        for (const mention of mentions) {
            // Don't notify user if they mention themselves
            if (mention.userId === userId) continue;

            const notificationRef = doc(collection(db, 'users', mention.userId, 'notifications'));
            await setDoc(notificationRef, {
                type: 'mention_comment',
                fromUser,
                postId: postId,
                commentId: newCommentRef.id,
                contentSnippet,
                read: false,
                createdAt: serverTimestamp()
            });
        }
    }

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
        profileType: data.profileType || 'public',
        notificationSettings: data.notificationSettings || { publicFeed: true, followingFeed: true },
        lastVisitedFeeds: data.lastVisitedFeeds || null,
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

export async function getFollowingStatus(currentUserId: string, targetUserId: string): Promise<FollowStatus> {
    if (!db) throw new Error("Firestore not initialized.");
    
    // Check if already following
    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const followingSnap = await getDoc(followingRef);
    if (followingSnap.exists()) {
        return 'following';
    }

    // Check if a request has been sent
    const requestRef = doc(db, 'users', targetUserId, 'notifications', currentUserId);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists() && requestSnap.data().type === 'follow_request') {
        return 'requested';
    }

    return 'not-following';
}

export async function sendFollowRequest(currentUserId: string, currentUserProfile: ProfileListItem, targetUserId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    // Use requester's ID as the document ID for easy lookup/deletion
    const notificationRef = doc(db, 'users', targetUserId, 'notifications', currentUserId);
    await setDoc(notificationRef, {
        type: 'follow_request',
        fromUser: currentUserProfile,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function acceptFollowRequest(currentUserId: string, requestingUserId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    // This is the same as a normal follow
    await followUser(requestingUserId, currentUserId);
    // Delete the request notification
    const notificationRef = doc(db, 'users', currentUserId, 'notifications', requestingUserId);
    await deleteDoc(notificationRef);
}

export async function declineFollowRequest(currentUserId: string, requestingUserId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    // Just delete the request notification
    const notificationRef = doc(db, 'users', currentUserId, 'notifications', requestingUserId);
    await deleteDoc(notificationRef);
}

export async function getNotifications(userId: string): Promise<Notification[]> {
    if (!db) throw new Error("Firestore not initialized.");
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;
        return {
            id: doc.id,
            ...data,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        } as Notification;
    });
}

export async function removeFollower(currentUserId: string, followerId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    // This is the same as the follower unfollowing the current user.
    await unfollowUser(followerId, currentUserId);
}


/**
 * Searches for users by name or username.
 * @param searchQuery The partial name or username to search for.
 * @returns A promise that resolves to an array of user objects.
 */
export async function searchUsers(searchQuery: string): Promise<ProfileListItem[]> {
    if (!db || searchQuery.trim() === '') return [];
    
    const usersCollection = collection(db, 'users');
    const nameQuery = query(
        usersCollection, 
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff'),
        limit(5)
    );
    const usernameQuery = query(
        usersCollection,
        where('username', '>=', searchQuery),
        where('username', '<=', searchQuery + '\uf8ff'),
        limit(5)
    );

    const [nameSnapshot, usernameSnapshot] = await Promise.all([
        getDocs(nameQuery),
        getDocs(usernameQuery),
    ]);

    const usersMap = new Map<string, ProfileListItem>();

    const processSnapshot = (snapshot: typeof nameSnapshot) => {
        snapshot.docs.forEach(doc => {
            if (!usersMap.has(doc.id)) {
                const data = doc.data();
                usersMap.set(doc.id, {
                    id: doc.id,
                    name: data.name,
                    username: data.username,
                    photoURL: data.photoURL || null,
                });
            }
        });
    };

    processSnapshot(nameSnapshot);
    processSnapshot(usernameSnapshot);

    return Array.from(usersMap.values());
}

// Helper function to get multiple user profiles from a list of IDs
async function getProfilesFromIds(userIds: string[]): Promise<ProfileListItem[]> {
    if (!db || userIds.length === 0) return [];

    const profilePromises = userIds.map(id => getDoc(doc(db, 'users', id)));
    const profileSnapshots = await Promise.all(profilePromises);

    return profileSnapshots
        .filter(snap => snap.exists())
        .map(snap => {
            const data = snap.data() as any;
            return {
                id: snap.id,
                name: data.name,
                username: data.username,
                photoURL: data.photoURL || null,
            };
        });
}

// Function to get the list of users a specific user is following
export async function getFollowingList(userId: string): Promise<ProfileListItem[]> {
    if (!db) throw new Error("Firestore not initialized.");
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);
    
    return getProfilesFromIds(followingIds);
}

// Function to get the list of users who are following a specific user
export async function getFollowersList(userId: string): Promise<ProfileListItem[]> {
    if (!db) throw new Error("Firestore not initialized.");
    const followersRef = collection(db, 'users', userId, 'followers');
    const followersSnap = await getDocs(followersRef);
    const followerIds = followersSnap.docs.map(doc => doc.id);

    return getProfilesFromIds(followerIds);
}

// Function to get posts from users the current user is following
export async function getFollowingPosts(userId: string): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    
    // 1. Get the list of users the current user is following
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);

    if (followingIds.length === 0) {
        return []; // Return early if the user isn't following anyone
    }

    // 2. Fetch posts from the followed users, handling Firestore's 30-item limit for 'in' queries
    const postsCollection = collection(db, 'published_recipes');
    const posts: PublishedPost[] = [];
    
    // Split followingIds into chunks of 30
    const chunks: string[][] = [];
    for (let i = 0; i < followingIds.length; i += 30) {
        chunks.push(followingIds.slice(i, i + 30));
    }

    // Execute a query for each chunk
    const queryPromises = chunks.map(chunk => {
        const q = query(
            postsCollection,
            where('publisherId', 'in', chunk)
        );
        return getDocs(q);
    });
    
    const querySnapshots = await Promise.all(queryPromises);

    querySnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const createdAtTimestamp = data.createdAt as Timestamp;
            posts.push({
                id: doc.id,
                ...data,
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
                mentions: data.mentions || [],
            } as PublishedPost);
        });
    });
    
    // 3. Sort all the collected posts by date client-side, as Firestore doesn't allow ordering on a different field than the 'in' query.
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return posts;
}

/**
 * Gets a list of user suggestions for the current user to follow.
 * It fetches the latest registered users and filters out the current user and anyone they already follow.
 * @param currentUserId The ID of the user for whom to generate suggestions.
 * @returns A promise that resolves to an array of user profile suggestions.
 */
export async function getFriendSuggestions(currentUserId: string): Promise<ProfileListItem[]> {
  if (!db) throw new Error("Firestore not initialized.");

  // Get the list of users the current user is already following
  const followingRef = collection(db, 'users', currentUserId, 'following');
  const followingSnap = await getDocs(followingRef);
  const followingIds = new Set(followingSnap.docs.map(doc => doc.id));
  followingIds.add(currentUserId); // Also exclude the user themselves

  // Fetch the 10 most recently created users
  const usersCollection = collection(db, 'users');
  const q = query(usersCollection, orderBy('createdAt', 'desc'), limit(10));
  const snapshot = await getDocs(q);

  const suggestions: ProfileListItem[] = [];
  snapshot.forEach(doc => {
    // If the user is not already followed and is not the current user, add to suggestions
    if (!followingIds.has(doc.id)) {
      const data = doc.data();
      suggestions.push({
        id: doc.id,
        name: data.name,
        username: data.username,
        photoURL: data.photoURL || null,
      });
    }
  });
  
  // Return up to 5 suggestions
  return suggestions.slice(0, 5);
}

// Function to get the latest post timestamp for a given feed
export async function getLatestPostTimestamp(
  forFeed: 'public' | 'following',
  userId?: string
): Promise<Timestamp | null> {
  if (!db) throw new Error('Firestore is not initialized.');
  
  const postsCollection = collection(db, 'published_recipes');
  let q;

  if (forFeed === 'public') {
    q = query(postsCollection, where('profileType', '==', 'public'), orderBy('createdAt', 'desc'), limit(1));
  } else {
    if (!userId) return null;
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);
    if (followingIds.length === 0) return null;
    
    // Note: This won't work with more than 30 followed users due to 'in' query limitations combined with orderBy.
    // For a production app, a different data model (e.g., a "timeline" subcollection) would be better.
    // For this app's scale, we query the latest post from each followed user and find the most recent. This is inefficient but works for small numbers.
    const latestPostPromises = followingIds.map(id => 
        getDocs(query(postsCollection, where('publisherId', '==', id), orderBy('createdAt', 'desc'), limit(1)))
    );
    const snapshots = await Promise.all(latestPostPromises);
    const latestTimestamps = snapshots
        .map(snap => !snap.empty ? snap.docs[0].data().createdAt as Timestamp : null)
        .filter(ts => ts !== null) as Timestamp[];

    if (latestTimestamps.length === 0) return null;

    // Find the most recent timestamp among all latest posts
    return latestTimestamps.reduce((latest, current) => current.seconds > latest.seconds ? current : latest);
  }
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return snapshot.docs[0].data().createdAt as Timestamp;
}

// Function to mark all unread notifications as read
export async function markNotificationsAsRead(userId: string): Promise<void> {
  if (!db) throw new Error('Firestore is not initialized.');
  const notificationsRef = collection(db, 'users', userId, 'notifications');
  const q = query(notificationsRef, where('read', '==', false));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
}
