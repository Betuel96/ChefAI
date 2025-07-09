import type { User } from 'firebase/auth';
import type { i18n } from '@/i18n.config';

// The core recipe structure from AI
export interface NutritionalInfo {
    calories: string;
    protein: string;
    carbs: string;
    fats: string;
}

export type Locale = (typeof i18n)['locales'][number];

export interface Recipe {
    name: string;
    instructions: string[];
    ingredients: string[];
    equipment: string[];
    benefits?: string;
    nutritionalTable?: NutritionalInfo;
}
// A recipe saved to a user's private collection
export type SavedRecipe = Recipe & { 
    id: string; 
    mediaUrl?: string | null; 
    mediaType?: 'image' | 'video' | null;
    createdAt: string; 
};

export interface DailyMealPlan {
    day: string;
    breakfast: Recipe;
    lunch: Recipe;
    comida: Recipe;
    dinner: Recipe;
}

export interface WeeklyPlan {
    weeklyMealPlan: DailyMealPlan[];
    ingredients?: string;
    dietaryPreferences?: string;
    numberOfDays?: number;
    numberOfPeople?: number;
}

export type SavedWeeklyPlan = WeeklyPlan & { id:string; createdAt: string; };

export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface ShoppingListCategory {
  category: string;
  items: ShoppingListItem[];
}

export interface UserAccount {
    id: string; // Firebase UID
    name:string;
    username?: string;
    email: string | null;
    photoURL: string | null;
    isPremium: boolean;
    subscriptionTier?: 'pro' | 'voice+' | 'lifetime';
    createdAt: string; 
    profileType: 'public' | 'private';
    isVerified?: boolean;
    badges?: string[];
    notificationSettings?: {
        publicFeed: boolean;
        followingFeed: boolean;
    };
    lastVisitedFeeds?: {
        public: string;
        following: string;
    };
    // Monetization fields
    stripeConnectAccountId?: string | null;
    canMonetize?: boolean;
    verificationRequestStatus?: 'pending' | null;
}

export type AppUser = (User & Partial<UserAccount>) | null;

export type Mention = { displayName: string; userId: string; };

export interface Comment {
    id: string;
    userId: string;
    userName: string;
    userPhotoURL?: string | null;
    text: string;
    createdAt: string;
    parentId: string | null; // For nested comments
    likesCount: number; // For comment likes
    mentions?: Mention[];
}

export interface Like {
    userId: string;
    createdAt: string;
}

// This will represent any post in the community feed.
export interface PublishedPost {
    id: string;
    publisherId: string;
    publisherName: string;
    publisherPhotoURL?: string | null;
    createdAt: string; 
    
    mediaUrl?: string | null;
    mediaType?: 'image' | 'video' | null;
    
    type: 'recipe' | 'text' | 'menu'; // To distinguish between post types
    profileType: 'public' | 'private';
    
    // For text posts, this is the status content.
    // For recipe/menu posts, this is the title/caption.
    content: string; 
    
    // These are only present if type is 'recipe'
    instructions?: string[];
    ingredients?: string[];
    equipment?: string[];
    benefits?: string;
    nutritionalTable?: NutritionalInfo;
    
    // This is only present if type is 'menu'
    weeklyMealPlan?: DailyMealPlan[];

    // Social counts
    likesCount?: number;
    commentsCount?: number;

    // Mentions
    mentions?: Mention[];

    // Monetization
    canMonetize?: boolean;
}

export interface SavedPostReference {
    postId: string;
    savedAt: string;
}

export interface ProfileData extends Omit<UserAccount, 'createdAt' | 'email'> {
    id: string;
    createdAt: string;
    followersCount: number;
    followingCount: number;
}

export interface ProfileListItem {
    id: string;
    name: string;
    username?: string;
    photoURL?: string | null;
}

export type FollowStatus = 'not-following' | 'following' | 'requested';

export interface Notification {
    id: string;
    type: 'mention_post' | 'mention_comment' | 'follow_request';
    fromUser: ProfileListItem;
    postId?: string;
    commentId?: string;
    contentSnippet?: string;
    read: boolean;
    createdAt: string;
}

export interface Story {
    id: string;
    publisherId: string;
    publisherName: string;
    publisherPhotoURL: string | null;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    createdAt: string; // ISO String
}

export interface StoryGroup {
    publisherId: string;
    publisherName: string;
    publisherPhotoURL: string | null;
    stories: Story[];
}

export interface VerificationRequest {
    id: string; // doc id
    userId: string;
    userName: string;
    userEmail: string | null;
    reason: string;
    link: string;
    status: 'pending';
    createdAt: string;
}
