
'use server';
/**
 * @fileOverview Generates a detailed recipe from a title and context.
 *
 * - generateDetailedRecipe - A function that generates a detailed recipe.
 * - GenerateDetailedRecipeInput - The input type for the function.
 * - GenerateDetailedRecipeOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const NutritionalInfoSchema = z.object({
  calories: z.string().describe('Estimated calories per serving.'),
  protein: z.string().describe('Estimated protein in grams per serving.'),
  carbs: z.string().describe('Estimated carbohydrates in grams per serving.'),
  fats: z.string().describe('Estimated fats in grams per serving.'),
});

const GenerateDetailedRecipeInputSchema = z.object({
  recipeName: z.string().describe('The name of the recipe to generate.'),
  servings: z.number().int().positive().describe('The number of servings the recipe should yield.'),
  context: z.string().optional().describe('Optional context about user preferences or ingredients on hand.'),
});
export type GenerateDetailedRecipeInput = z.infer<typeof GenerateDetailedRecipeInputSchema>;

const GenerateDetailedRecipeOutputSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  instructions: z.array(z.string()).describe('An array of strings, where each string is a numbered preparation step.'),
  ingredients: z.array(z.string()).describe('An array of strings, where each string is an ingredient with its quantity.'),
  equipment: z.array(z.string()).describe('An array of strings, where each string is a needed piece of kitchen equipment.'),
  benefits: z.string().describe('A brief description of the nutritional or health benefits of this recipe.'),
  nutritionalTable: NutritionalInfoSchema.describe('An estimated nutritional table for the recipe per serving.'),
});
export type GenerateDetailedRecipeOutput = z.infer<typeof GenerateDetailedRecipeOutputSchema>;

export async function generateDetailedRecipe(input: GenerateDetailedRecipeInput): Promise<GenerateDetailedRecipeOutput> {
  return generateDetailedRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDetailedRecipePrompt',
  input: {schema: GenerateDetailedRecipeInputSchema},
  output: {schema: GenerateDetailedRecipeOutputSchema},
  prompt: `You are a world-class chef and nutritionist. A user wants a detailed recipe based on a title they have.
Your mission is to generate a creative, delicious, and VERY DETAILED recipe.

**Recipe to generate:** {{{recipeName}}}
**Servings:** {{{servings}}}
{{#if context}}**User Context (preferences, ingredients on hand, etc.):** {{{context}}}{{/if}}

---
**DETAILED Format Instructions:**
The response MUST be a valid JSON object with the following keys:
- \`name\`: The recipe name. This should be the same as or very similar to the input \`recipeName\`.
- \`ingredients\`: An **ARRAY of strings**. Each string must be a single ingredient with its precise quantity (e.g., ["2 chicken breasts (about 200g each)", "1 cup of rice", "2 tbsp olive oil"]).
- \`instructions\`: An **ARRAY of strings**. Each string must be a clear and **numbered** preparation step (e.g., ["1. Season the chicken with salt and pepper.", "2. Heat oil in a pan over medium heat.", "3. Cook chicken for 6-8 minutes per side."]).
- \`equipment\`: An **ARRAY of strings**. Each string is a necessary piece of equipment (e.g., ["frying pan", "cutting board", "chef's knife"]).
- \`benefits\`: A **string** with a brief description of the nutritional or health benefits (e.g., "High in protein, great for post-workout muscle recovery.").
- \`nutritionalTable\`: An **OBJECT** with estimated nutritional information per serving. It MUST contain the keys: \`calories\`, \`protein\`, \`carbs\`, and \`fats\`. (e.g., { "calories": "450kcal", "protein": "40g", "carbs": "30g", "fats": "15g" }).
**Language Instruction:** All text content MUST be in Spanish.
`,
  config: {
    temperature: 0.8,
  },
});

const generateDetailedRecipeFlow = ai.defineFlow(
  {
    name: 'generateDetailedRecipeFlow',
    inputSchema: GenerateDetailedRecipeInputSchema,
    outputSchema: GenerateDetailedRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
