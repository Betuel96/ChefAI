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
    .describe('Un plan de comidas, que es una lista de comidas para cada día.'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

const GenerateShoppingListOutputSchema = z.object({
  shoppingList: z
    .string()
    .describe(
      'Una lista de compras generada a partir del plan de comidas, incluyendo productos básicos de despensa.'
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
  prompt: `Eres un asistente de IA útil que genera listas de compras a partir de planes de comidas.

  Dado el siguiente plan de comidas:
  {{mealPlan}}

  Genera una lista de compras completa que incluya todos los ingredientes necesarios y productos básicos de despensa comunes.
  Formatea la lista de manera clara y concisa.
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
