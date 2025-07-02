import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { CreateWeeklyMealPlanOutput, DailyMealPlan as DailyMealPlanType } from '@/ai/flows/create-weekly-meal-plan';
import type { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export type Recipe = GenerateRecipeOutput & { imageUrl?: string | null };
export type SavedRecipe = Recipe & { id: string };

export type WeeklyPlan = CreateWeeklyMealPlanOutput;
export type DailyMealPlan = DailyMealPlanType;
export type SavedWeeklyPlan = WeeklyPlan & { id: string };

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
    name: string;
    email: string | null;
    photoURL: string | null;
    isPremium: boolean;
    createdAt: any; // Firestore timestamp
}

export type AppUser = (User & UserAccount) | null;

export interface PublishedRecipe extends Recipe {
    id: string;
    publisherId: string;
    publisherName: string;
    publisherPhotoURL?: string | null;
    createdAt: Timestamp;
}

export interface ProfileData extends Omit<UserAccount, 'createdAt' | 'email'> {
    id: string;
    createdAt: Timestamp;
    followersCount: number;
    followingCount: number;
}
