import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { CreateWeeklyMealPlanOutput } from '@/ai/flows/create-weekly-meal-plan';

export type Recipe = GenerateRecipeOutput;
export type WeeklyPlan = CreateWeeklyMealPlanOutput;

export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
}
