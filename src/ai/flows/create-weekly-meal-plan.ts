// src/ai/flows/create-weekly-meal-plan.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for creating a weekly meal plan.
 *
 * The flow takes input parameters such as ingredients, dietary preferences,
 * number of days, and number of people, and generates a complete weekly
 * meal plan including breakfast, lunch, and dinner recipes for each day.
 *
 * @exports createWeeklyMealPlan - The main function to trigger the meal plan creation flow.
 * @exports CreateWeeklyMealPlanInput - The input type for the createWeeklyMealPlan function.
 * @exports CreateWeeklyMealPlanOutput - The output type for the createWeeklyMealPlan function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateWeeklyMealPlanInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients the user wants to use.'),
  dietaryPreferences: z
    .string()
    .optional()
    .describe(
      'The dietary preferences of the user, such as vegetarian, vegan, gluten-free, etc.'
    ),
  numberOfDays: z
    .number()
    .min(1)
    .max(7)
    .describe('The number of days for which to generate the meal plan.'),
  numberOfPeople: z
    .number()
    .min(1)
    .describe('The number of people the meal plan should serve.'),
});
export type CreateWeeklyMealPlanInput = z.infer<typeof CreateWeeklyMealPlanInputSchema>;

const MealSchema = z.object({
  name: z.string().describe('The name of the meal.'),
  ingredients: z.string().describe('The ingredients required for the meal.'),
  instructions: z.string().describe('The instructions to prepare the meal.'),
});

const DailyMealPlanSchema = z.object({
  breakfast: MealSchema.describe('The breakfast for the day.'),
  lunch: MealSchema.describe('The lunch for the day.'),
  dinner: MealSchema.describe('The dinner for the day.'),
});

const WeeklyMealPlanSchema = z.record(
  z.string().regex(/^Day [1-7]$/), // Key: "Day 1", "Day 2", etc.
  DailyMealPlanSchema
);

const CreateWeeklyMealPlanOutputSchema = z.object({
  weeklyMealPlan: WeeklyMealPlanSchema.describe(
    'A weekly meal plan consisting of breakfast, lunch, and dinner recipes for each day.'
  ),
});

export type CreateWeeklyMealPlanOutput = z.infer<typeof CreateWeeklyMealPlanOutputSchema>;

export async function createWeeklyMealPlan(
  input: CreateWeeklyMealPlanInput
): Promise<CreateWeeklyMealPlanOutput> {
  return createWeeklyMealPlanFlow(input);
}

const prompt = ai.definePrompt({
  name: 'createWeeklyMealPlanPrompt',
  input: {schema: CreateWeeklyMealPlanInputSchema},
  output: {schema: CreateWeeklyMealPlanOutputSchema},
  prompt: `You are a meal planning assistant. Generate a weekly meal plan based on the provided ingredients, dietary preferences, number of days, and number of people.

Ingredients: {{{ingredients}}}
Dietary Preferences: {{{dietaryPreferences}}}
Number of Days: {{{numberOfDays}}}
Number of People: {{{numberOfPeople}}}

Generate a meal plan with breakfast, lunch, and dinner for each day. The meal plan should include the name of each meal, a list of ingredients, and instructions on how to prepare the meal. Adhere to the specified dietary preferences, make sure ingredients are in reasonable quantities for the number of people specified, and create a diverse and appealing meal plan that minimizes ingredient overlap and food waste.

Return the meal plan in the following JSON format:

{{output}}
`,
});

const createWeeklyMealPlanFlow = ai.defineFlow(
  {
    name: 'createWeeklyMealPlanFlow',
    inputSchema: CreateWeeklyMealPlanInputSchema,
    outputSchema: CreateWeeklyMealPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

