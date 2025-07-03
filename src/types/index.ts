
import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { CreateWeeklyMealPlanOutput, DailyMealPlan as DailyMealPlanType } from '@/ai/flows/create-weekly-meal-plan';
import type { User } from 'firebase/auth';

// The core recipe structure from AI
export type Recipe = GenerateRecipeOutput;
// A recipe saved to a user's private collection
export type SavedRecipe = Recipe & { id: string; imageUrl?: string | null; createdAt: string; };

export type WeeklyPlan = CreateWeeklyMealPlanOutput;
export type DailyMealPlan = DailyMealPlanType;
export type SavedWeeklyPlan = WeeklyPlan & { id: string; createdAt: string; };

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
    name:string;
    email: string | null;
    photoURL: string | null;
    isPremium: boolean;
    createdAt: string; 
}

export type AppUser = (User & UserAccount) | null;

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
    imageUrl?: string | null;
    
    type: 'recipe' | 'text'; // To distinguish between post types
    
    // For text posts, this is the status content.
    // For recipe posts, this is the recipe name.
    content: string; 
    
    // These are only present if type is 'recipe'
    instructions?: string;
    additionalIngredients?: string;
    equipment?: string;

    // Social counts
    likesCount?: number;
    commentsCount?: number;
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
    photoURL?: string | null;
}
