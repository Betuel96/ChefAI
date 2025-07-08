
// src/ai/flows/generate-recipe.ts
'use server';
/**
 * @fileOverview Generates a recipe based on a list of ingredients and the number of servings.
 *
 * - generateRecipe - A function that generates a recipe.
 * - GenerateRecipeInput - The input type for the generateRecipe function.
 * - GenerateRecipeOutput - The return type for the generateRecipe function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRecipeInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of available ingredients.'),
  servings: z
    .number()
    .int()
    .positive()
    .describe('The number of servings the recipe should yield.'),
  language: z.string().describe('The language for the output, e.g., "Spanish", "English".'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const NutritionalInfoSchema = z.object({
  calories: z.string().describe('Estimated calories per serving.'),
  protein: z.string().describe('Estimated protein in grams per serving.'),
  carbs: z.string().describe('Estimated carbohydrates in grams per serving.'),
  fats: z.string().describe('Estimated fats in grams per serving.'),
});

const GenerateRecipeOutputSchema = z.object({
  name: z.string().describe('The name of the recipe.'),
  instructions: z.array(z.string()).describe('An array of strings, where each string is a numbered preparation step.'),
  ingredients: z
    .array(z.string())
    .describe('An array of strings, where each string is a required ingredient with its quantity.'),
  equipment: z.array(z.string()).describe('An array of strings, where each string is a needed piece of kitchen equipment.'),
  benefits: z.string().describe('A brief description of the nutritional or health benefits of this recipe (e.g., "High in protein, great for post-workout muscle recovery.").'),
  nutritionalTable: NutritionalInfoSchema.describe('An estimated nutritional table for the recipe per serving.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `You are a world-class chef with limitless imagination. Your mission is to surprise the user with a creative, delicious, and VERY DETAILED recipe, using the ingredients provided.

**CRITICAL Instruction:** Creativity and variety are your signature! Every time you receive this request, even with the same ingredients, you MUST generate a completely new and detailed idea. Explore different cuisines, cooking methods, and dish types.

**Base Ingredients:** {{{ingredients}}}
**Servings:** {{{servings}}}

---
**DETAILED Formatting Instructions:**
The response MUST be a valid JSON object with the following keys:
- \`name\`: The recipe name.
- \`ingredients\`: An **ARRAY of strings**. Each string must be a single ingredient with its quantity (e.g., ["2 chicken breasts", "1 cup of rice", "2 tbsp olive oil"]).
- \`instructions\`: An **ARRAY of strings**. Each string must be a clear and **numbered** preparation step (e.g., ["1. Season the chicken with salt and pepper.", "2. Heat oil in a pan over medium heat.", "3. Cook chicken for 6-8 minutes per side."]).
- \`equipment\`: An **ARRAY of strings**. Each string is a necessary piece of equipment (e.g., ["frying pan", "cutting board", "chef's knife"]).
- \`benefits\`: A **string** with a brief description of the nutritional or health benefits of the recipe (e.g., "High in protein, great for post-workout muscle recovery.").
- \`nutritionalTable\`: An **OBJECT** with estimated nutritional information per serving. It MUST contain the keys: \`calories\`, \`protein\`, \`carbs\`, and \`fats\`. (e.g., { "calories": "450kcal", "protein": "40g", "carbs": "30g", "fats": "15g" }).
**Language Instruction:** The entire response and all its content MUST be in {{{language}}}.
`,
  config: {
    temperature: 1.0,
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const generateRecipeFlow = ai.defineFlow(
  {
    name: 'generateRecipeFlow',
    inputSchema: GenerateRecipeInputSchema,
    outputSchema: GenerateRecipeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
