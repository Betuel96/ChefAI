
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
import type { PublishedPost, ProfileData as ProfileDataType, Comment, Mention, ProfileListItem, Notification, UserAccount, Story, StoryGroup, SavedWeeklyPlan, Recipe, DailyMealPlan, SavedRecipe } from '@/types';
import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';

// Helper function to upload a Data URI to Firebase Storage and get the URL
async function uploadMedia(userId: string, path: string, mediaDataUri: string): Promise<string> {
    if (!storage) throw new Error('Storage is not initialized.');
    const storageRef = ref(storage, `users/${userId}/${path}`);
    try {
        const snapshot = await uploadString(storageRef, mediaDataUri, 'data_url');
        return await getDownloadURL(snapshot.ref);
    } catch (error) {
        console.error('Error uploading media:', error);
        throw new Error('La subida del medio falló. Por favor, comprueba tus reglas de Storage.');
    }
}


// Helper function to normalize recipe-like data within a post
const normalizePostData = (doc: any): PublishedPost => {
    const data = doc.data();
    if (!data) return null as any; 
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

    let processedPlan: DailyMealPlan[] | null = null;
    if (data.type === 'menu' && Array.isArray(data.weeklyMealPlan)) {
        processedPlan = data.weeklyMealPlan.map((day: any): DailyMealPlan | null => {
            if (!day) return null;
            return {
                day: day.day || '',
                breakfast: normalizeRecipe(day.breakfast),
                lunch: normalizeRecipe(day.lunch),
                comida: normalizeRecipe(day.comida),
                dinner: normalizeRecipe(day.dinner),
            };
        }).filter((day): day is DailyMealPlan => day !== null);
    }

    return {
        id: doc.id,
        publisherId: data.publisherId,
        publisherName: data.publisherName,
        publisherPhotoURL: data.publisherPhotoURL || null,
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null,
        type: data.type,
        profileType: data.profileType,
        content: data.content,
        instructions: data.type === 'recipe' ? normalizeField(data.instructions) : undefined,
        ingredients: data.type === 'recipe' ? normalizeField(data.ingredients) : undefined,
        equipment: data.type === 'recipe' ? normalizeField(data.equipment) : undefined,
        benefits: data.type === 'recipe' ? data.benefits : undefined,
        nutritionalTable: data.type === 'recipe' ? data.nutritionalTable : undefined,
        weeklyMealPlan: processedPlan ?? undefined,
        likesCount: data.likesCount || 0,
        commentsCount: data.commentsCount || 0,
        mentions: data.mentions || [],
        canMonetize: data.canMonetize || false,
        createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
    } as PublishedPost;
};


// Function to create a new post (recipe or text)
export async function createPost(
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  postData: Omit<PublishedPost, 'id' | 'createdAt' | 'publisherId' | 'publisherName' | 'publisherPhotoURL' | 'mediaUrl' | 'likesCount' | 'commentsCount' | 'profileType'>,
  mediaDataUri: string | null
): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized.');

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        throw new Error('User profile not found.');
    }
    const userData = userSnap.data() as UserAccount;

    const postsCollection = collection(db, 'published_recipes');
    const newPostRef = doc(postsCollection); // Create a reference first to get the ID

    let mediaUrl: string | null = null;
    
    if (mediaDataUri) {
        mediaUrl = await uploadMedia(userId, `posts/${newPostRef.id}`, mediaDataUri);
    }

    let finalPostData: any = {
        ...postData,
        publisherId: userId,
        publisherName: userName,
        publisherPhotoURL: userPhotoURL,
        mediaUrl: mediaUrl,
        profileType: userData.profileType || 'public', // Save the user's privacy setting at time of post
        canMonetize: userData.canMonetize || false, // Save monetization status at time of post
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        mentions: postData.mentions || [],
    };

    try {
        await setDoc(newPostRef, finalPostData);
        
        if (finalPostData.mentions && finalPostData.mentions.length > 0) {
            const fromUser: ProfileListItem = { id: userId, name: userName, username: userData.username, photoURL: userPhotoURL };
            const contentSnippet = (postData.content as string).substring(0, 50);

            for (const mention of finalPostData.mentions) {
                 if (mention.userId === userId) continue;
                const notificationRef = doc(collection(db, 'users', mention.userId, 'notifications'));
                await setDoc(notificationRef, {
                    type: 'mention_post',
                    fromUser,
                    postId: newPostRef.id,
                    contentSnippet,
                    read: false,
                    createdAt: serverTimestamp()
                });
            }
        }

        return newPostRef.id;
    } catch (error) {
        console.error('Error creating post document:', error);
        
        if (mediaUrl && storage) {
            // Attempt to clean up orphaned image if Firestore write fails
            const orphanRef = ref(storage, mediaUrl);
            await deleteObject(orphanRef).catch(e => console.error("Cleanup failed for orphaned media:", e));
        }
        
        throw new Error('La publicación no se pudo crear. Esto puede deberse a las reglas de seguridad de Firestore.');
    }
}

/**
 * Publishes a saved recipe as a new post in the community feed.
 */
export async function publishRecipeAsPost(
  userId: string,
  userName: string,
  userPhotoURL: string | null,
  recipe: SavedRecipe
): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized.');

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        throw new Error('User profile not found.');
    }
    const userData = userSnap.data() as UserAccount;

    const postsCollection = collection(db, 'published_recipes');
  
    const newPostData = {
        publisherId: userId,
        publisherName: userName,
        userPhotoURL,
        type: 'recipe' as const,
        profileType: userData.profileType || 'public',
        canMonetize: userData.canMonetize || false,
        content: recipe.name,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        equipment: recipe.equipment,
        benefits: recipe.benefits,
        nutritionalTable: recipe.nutritionalTable,
        mediaUrl: recipe.mediaUrl,
        mediaType: recipe.mediaType,
        likesCount: 0,
        commentsCount: 0,
        mentions: [],
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(postsCollection, newPostData);
    return docRef.id;
}


// Function to update a post
export async function updatePost(
  postId: string,
  currentUserId: string,
  updateData: Partial<PublishedPost>,
  newMediaDataUri?: string | null | 'DELETE'
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

  if (newMediaDataUri !== null && newMediaDataUri !== undefined) {
    if (newMediaDataUri === 'DELETE') {
      if (postData.mediaUrl) {
        try {
          const mediaToDeleteRef = ref(storage, postData.mediaUrl);
          await deleteObject(mediaToDeleteRef);
        } catch (e: any) {
          if (e.code !== 'storage/object-not-found') {
            console.error('Could not delete old media:', e);
          }
        }
      }
      updateData.mediaUrl = null;
      updateData.mediaType = null;
    } else {
      const downloadURL = await uploadMedia(currentUserId, `posts/${postId}`, newMediaDataUri);
      updateData.mediaUrl = downloadURL;
      // mediaType should be included in updateData from the client
    }
  }

  await updateDoc(postRef, updateData as { [x: string]: any });
}


// Function to get all public posts for the community feed
export async function getPublishedPosts(): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    const q = query(recipesCollection, where('profileType', '==', 'public'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(normalizePostData);
}

// Function to get posts published by a specific user
export async function getUserPublishedPosts(userId: string): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    const recipesCollection = collection(db, 'published_recipes');
    const q = query(recipesCollection, where('publisherId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(normalizePostData);
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
    return normalizePostData(docSnap);
}

// Function to delete a post and its associated media
export async function deletePost(postId: string): Promise<void> {
    if (!db || !storage) {
        throw new Error('Firebase no está configurado.');
    }
    const postRef = doc(db, 'published_recipes', postId);
    try {
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = postSnap.data();
            if (postData.mediaUrl) {
                try {
                    const mediaRef = ref(storage, postData.mediaUrl);
                    await deleteObject(mediaRef);
                } catch (storageError: any) {
                    if (storageError.code !== 'storage/object-not-found') {
                        console.error('Error al eliminar el medio del post:', storageError);
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
            userId: data.userId,
            userName: data.userName,
            userPhotoURL: data.userPhotoURL || null,
            text: data.text,
            parentId: data.parentId || null,
            likesCount: data.likesCount || 0,
            mentions: data.mentions || [],
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
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
    
    try {
        const userDocRef = doc(db, 'users', userId);
        const followersRef = collection(db, 'users', userId, 'followers');
        const followingRef = collection(db, 'users', userId, 'following');

        const [userDoc, followersSnap, followingSnap] = await Promise.all([
            getDoc(userDocRef),
            getDocs(followersRef),
            getDocs(followingRef)
        ]);

        if (!userDoc.exists()) {
            console.warn(`Profile not found for userId: ${userId}`);
            return null;
        }
        
        const data = userDoc.data();
        const createdAtTimestamp = data.createdAt as Timestamp;

        return {
            id: userDoc.id,
            name: data.name,
            username: data.username,
            photoURL: data.photoURL,
            isPremium: data.isPremium,
            subscriptionTier: data.subscriptionTier,
            isVerified: data.isVerified || false,
            badges: data.badges || [],
            profileType: data.profileType || 'public',
            notificationSettings: data.notificationSettings || { publicFeed: true, followingFeed: true },
            lastVisitedFeeds: data.lastVisitedFeeds || null,
            canMonetize: data.canMonetize || false,
            stripeConnectAccountId: data.stripeConnectAccountId || null,
            followersCount: followersSnap.size,
            followingCount: followingSnap.size,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        } as ProfileDataType;
    } catch (error) {
        console.error("Error fetching profile data for user:", userId, error);
        return null;
    }
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
    
    const followingRef = doc(db, 'users', currentUserId, 'following', targetUserId);
    const followingSnap = await getDoc(followingRef);
    if (followingSnap.exists()) {
        return 'following';
    }

    // Check if a follow request exists from the current user to the target user
    const notificationsRef = collection(db, 'users', targetUserId, 'notifications');
    const q = query(
        notificationsRef, 
        where('type', '==', 'follow_request'),
        where('fromUser.id', '==', currentUserId)
    );

    const requestSnap = await getDocs(q);
    if (!requestSnap.empty) {
        return 'requested';
    }

    return 'not-following';
}

export async function sendFollowRequest(currentUserId: string, currentUserProfile: ProfileListItem, targetUserId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    const notificationRef = doc(collection(db, 'users', targetUserId, 'notifications'));
    await setDoc(notificationRef, {
        type: 'follow_request',
        fromUser: currentUserProfile,
        read: false,
        createdAt: serverTimestamp(),
    });
}

export async function acceptFollowRequest(currentUserId: string, requestingUserId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    await followUser(requestingUserId, currentUserId);
    const notificationRef = doc(db, 'users', currentUserId, 'notifications', requestingUserId);
    await deleteDoc(notificationRef);
}

export async function declineFollowRequest(currentUserId: string, requestingUserId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
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
            type: data.type,
            fromUser: data.fromUser,
            postId: data.postId,
            commentId: data.commentId,
            contentSnippet: data.contentSnippet,
            read: data.read,
            createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
        } as Notification;
    });
}

export async function removeFollower(currentUserId: string, followerId: string): Promise<void> {
    if (!db) throw new Error("Firestore not initialized.");
    await unfollowUser(followerId, currentUserId);
}


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

export async function getFollowingList(userId: string): Promise<ProfileListItem[]> {
    if (!db) throw new Error("Firestore not initialized.");
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);
    
    return getProfilesFromIds(followingIds);
}

export async function getFollowersList(userId: string): Promise<ProfileListItem[]> {
    if (!db) throw new Error("Firestore not initialized.");
    const followersRef = collection(db, 'users', userId, 'followers');
    const followersSnap = await getDocs(followersRef);
    const followerIds = followersSnap.docs.map(doc => doc.id);

    return getProfilesFromIds(followerIds);
}

export async function getFriendSuggestions(userId: string): Promise<ProfileListItem[]> {
    if (!db) throw new Error("Firestore not initialized.");

    // 1. Get IDs of users the current user is already following
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);
    const usersToExclude = [userId, ...followingIds];

    // 2. Fetch a sample of public users
    // This is a simplified suggestion logic. A real-world app would use a more complex algorithm.
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profileType', '==', 'public'), limit(30)); // Get up to 30 public users

    const querySnapshot = await getDocs(q);
    const potentialSuggestions: ProfileListItem[] = [];
    querySnapshot.forEach(doc => {
        const data = doc.data();
        potentialSuggestions.push({
            id: doc.id,
            name: data.name,
            username: data.username,
            photoURL: data.photoURL || null
        });
    });

    // 3. Filter out users the current user already follows or is the current user
    const suggestions = potentialSuggestions.filter(
        suggestion => !usersToExclude.includes(suggestion.id)
    );

    // 4. Return a small, shuffled list
    return suggestions.sort(() => 0.5 - Math.random()).slice(0, 5);
}

export async function getFollowingPosts(userId: string): Promise<PublishedPost[]> {
    if (!db) throw new Error('Firestore is not initialized.');
    
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);

    if (followingIds.length === 0) {
        return [];
    }

    const postsCollection = collection(db, 'published_recipes');
    const posts: PublishedPost[] = [];
    
    const chunks: string[][] = [];
    for (let i = 0; i < followingIds.length; i += 30) {
        chunks.push(followingIds.slice(i, i + 30));
    }

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
            posts.push(normalizePostData(doc));
        });
    });
    
    posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return posts;
}

export async function getLatestPostTimestamp(
  forFeed: 'public' | 'following',
  userId?: string
): Promise<string | null> {
  if (!db) throw new Error('Firestore is not initialized.');
  
  const postsCollection = collection(db, 'published_recipes');
  let q;

  if (forFeed === 'public') {
    q = query(postsCollection, where('profileType', '==', 'public'), orderBy('createdAt', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return null;
    }
    const timestamp = snapshot.docs[0].data().createdAt as Timestamp;
    return timestamp ? timestamp.toDate().toISOString() : null;
  } else {
    if (!userId) return null;
    const followingRef = collection(db, 'users', userId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);
    if (followingIds.length === 0) return null;
    
    // Firestore IN query limited to 30 values. We must chunk.
    const chunks: string[][] = [];
    for (let i = 0; i < followingIds.length; i += 30) {
        chunks.push(followingIds.slice(i, i + 30));
    }
    
    let latestTimestamp: Timestamp | null = null;

    for (const chunk of chunks) {
         const q = query(postsCollection, where('publisherId', 'in', chunk), orderBy('createdAt', 'desc'), limit(1));
         const snapshot = await getDocs(q);
         if (!snapshot.empty) {
            const currentLatest = snapshot.docs[0].data().createdAt as Timestamp;
            if (!latestTimestamp || currentLatest.seconds > latestTimestamp.seconds) {
                latestTimestamp = currentLatest;
            }
         }
    }

    return latestTimestamp ? latestTimestamp.toDate().toISOString() : null;
  }
}

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

// --- STORIES ---

export async function createStory(userId: string, mediaDataUri: string, mediaType: 'image' | 'video'): Promise<string> {
    if (!db) throw new Error('Firestore is not initialized.');

    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        throw new Error('User profile not found.');
    }
    const userData = userSnap.data() as UserAccount;

    const storiesCollection = collection(db, 'stories');
    const docRef = doc(storiesCollection); // Create a reference first to get the ID
    const mediaUrl = await uploadMedia(userId, `stories/${docRef.id}`, mediaDataUri);

    try {
        await setDoc(docRef, {
            publisherId: userId,
            publisherName: userData.name,
            publisherPhotoURL: userData.photoURL || null,
            mediaUrl,
            mediaType,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
         console.error('Error creating story:', error);
        if (mediaUrl && storage) {
            const orphanRef = ref(storage, mediaUrl);
            await deleteObject(orphanRef).catch(e => console.error("Cleanup failed for orphaned story media:", e));
        }
        throw new Error('No se pudo crear la historia.');
    }
}

export async function getStoriesForFeed(currentUserId: string): Promise<StoryGroup[]> {
    if (!db) throw new Error('Firestore is not initialized.');

    // 1. Get the list of users the current user is following
    const followingRef = collection(db, 'users', currentUserId, 'following');
    const followingSnap = await getDocs(followingRef);
    const followingIds = followingSnap.docs.map(doc => doc.id);
    
    // 2. Always include the current user's own stories
    const allUserIds = Array.from(new Set([currentUserId, ...followingIds]));

    if (allUserIds.length === 0) {
        return [];
    }

    // 3. Fetch stories from the last 24 hours for these users
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const storiesCollection = collection(db, 'stories');
    const stories: Story[] = [];

    // Firestore 'in' query is limited to 30 items per query
    const chunks: string[][] = [];
    for (let i = 0; i < allUserIds.length; i += 30) {
        chunks.push(allUserIds.slice(i, i + 30));
    }

    const queryPromises = chunks.map(chunk => {
        const q = query(
            storiesCollection,
            where('publisherId', 'in', chunk),
            where('createdAt', '>=', twentyFourHoursAgo),
            orderBy('createdAt', 'desc')
        );
        return getDocs(q);
    });

    const querySnapshots = await Promise.all(queryPromises);

    querySnapshots.forEach(snapshot => {
        snapshot.forEach(doc => {
            const data = doc.data();
            const createdAtTimestamp = data.createdAt as Timestamp;
            stories.push({
                id: doc.id,
                publisherId: data.publisherId,
                publisherName: data.publisherName,
                publisherPhotoURL: data.publisherPhotoURL || null,
                mediaUrl: data.mediaUrl,
                mediaType: data.mediaType,
                createdAt: createdAtTimestamp ? createdAtTimestamp.toDate().toISOString() : new Date().toISOString(),
            } as Story);
        });
    });

    // 4. Group stories by publisher
    const groups: { [key: string]: StoryGroup } = {};
    for (const story of stories) {
        if (!groups[story.publisherId]) {
            groups[story.publisherId] = {
                publisherId: story.publisherId,
                publisherName: story.publisherName,
                publisherPhotoURL: story.publisherPhotoURL,
                stories: [],
            };
        }
        // Add stories in chronological order
        groups[story.publisherId].stories.unshift(story);
    }
    
    const groupedStories = Object.values(groups);

    // 5. Sort groups to show current user first, then others by most recent story
    groupedStories.sort((a, b) => {
        if (a.publisherId === currentUserId) return -1;
        if (b.publisherId === currentUserId) return 1;
        const aLastStoryTime = new Date(a.stories[a.stories.length - 1].createdAt).getTime();
        const bLastStoryTime = new Date(b.stories[b.stories.length - 1].createdAt).getTime();
        return bLastStoryTime - aLastStoryTime;
    });

    return groupedStories;
}

// --- SAVED POSTS ---
export async function savePost(userId: string, postId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized.");
  const saveRef = doc(db, 'users', userId, 'savedPosts', postId);
  await setDoc(saveRef, { savedAt: serverTimestamp() });
}

export async function unsavePost(userId: string, postId: string): Promise<void> {
  if (!db) throw new Error("Firestore not initialized.");
  const saveRef = doc(db, 'users', userId, 'savedPosts', postId);
  await deleteDoc(saveRef);
}

export async function isPostSaved(userId: string, postId: string): Promise<boolean> {
  if (!db || !userId) return false;
  const saveRef = doc(db, 'users', userId, 'savedPosts', postId);
  const docSnap = await getDoc(saveRef);
  return docSnap.exists();
}

export async function getSavedPosts(userId: string): Promise<PublishedPost[]> {
  if (!db) throw new Error("Firestore not initialized.");
  const savedPostsRef = collection(db, 'users', userId, 'savedPosts');
  const q = query(savedPostsRef, orderBy('savedAt', 'desc'));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return [];
  }

  const postIds = snapshot.docs.map(doc => doc.id);
  
  // Firestore 'in' query can take up to 30 items
  const postPromises = [];
  for (let i = 0; i < postIds.length; i += 30) {
      const chunk = postIds.slice(i, i + 30);
      const postsQuery = query(collection(db, 'published_recipes'), where('__name__', 'in', chunk));
      postPromises.push(getDocs(postsQuery));
  }
  
  const postSnapshots = await Promise.all(postPromises);
  const postDocs: any[] = [];
  postSnapshots.forEach(snap => {
      snap.forEach(doc => {
          postDocs.push(doc);
      });
  });

  const resolvedPosts = postDocs.map(normalizePostData);
  
  const postsMap = new Map(resolvedPosts.map(p => [p.id, p]));
  const sortedPosts = postIds.map(id => postsMap.get(id)).filter(p => p) as PublishedPost[];

  return sortedPosts;
}
