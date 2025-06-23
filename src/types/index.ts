import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { CreateWeeklyMealPlanOutput, DailyMealPlan as DailyMealPlanType } from '@/ai/flows/create-weekly-meal-plan';
import type { User } from 'firebase/auth';

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
    email: string;
    isPremium: boolean;
    createdAt: any; // Firestore timestamp
}

export type AppUser = (User & UserAccount) | null;