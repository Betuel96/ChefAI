import type { GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import type { CreateWeeklyMealPlanOutput, DailyMealPlan as DailyMealPlanType } from '@/ai/flows/create-weekly-meal-plan';

export type Recipe = GenerateRecipeOutput;
export type WeeklyPlan = CreateWeeklyMealPlanOutput;
export type DailyMealPlan = DailyMealPlanType;

export interface ShoppingListItem {
  id: string;
  name: string;
  checked: boolean;
}
