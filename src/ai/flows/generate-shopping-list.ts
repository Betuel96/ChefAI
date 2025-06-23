'use server';

/**
 * @fileOverview A shopping list generation AI agent.
 *
 * - generateShoppingList - A function that handles the shopping list generation process from a meal plan.
 * - GenerateShoppingListInput - The input type for the generateShoppingList function.
 * - GenerateShoppingListOutput - The return type for the generateShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShoppingListInputSchema = z.object({
  mealPlan: z
    .string()
    .describe('A meal plan, which is a list of meals for each day.'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

const GenerateShoppingListOutputSchema = z.object({
  shoppingList: z
    .string()
    .describe(
      'A shopping list generated from the meal plan, including pantry staples.'
    ),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

export async function generateShoppingList(input: GenerateShoppingListInput): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: {schema: GenerateShoppingListInputSchema},
  output: {schema: GenerateShoppingListOutputSchema},
  prompt: `You are a helpful AI assistant that generates shopping lists from meal plans.

  Given the following meal plan:
  {{mealPlan}}

  Generate a comprehensive shopping list including all necessary ingredients and common pantry staples.
  Format the list clearly and concisely.
  `,
});

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
