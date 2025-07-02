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
    .describe('Una lista de ingredientes disponibles separados por comas.'),
  servings: z
    .number()
    .int()
    .positive()
    .describe('El número de porciones que debe tener la receta.'),
});
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeInputSchema>;

const GenerateRecipeOutputSchema = z.object({
  name: z.string().describe('El nombre de la receta.'),
  instructions: z.string().describe('Instrucciones paso a paso para preparar la receta.'),
  additionalIngredients: z
    .string()
    .describe('Una lista de ingredientes adicionales necesarios, con cantidades.'),
  equipment: z.string().describe('Una lista de utensilios de cocina necesarios.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `Eres un chef de talla mundial con una imaginación sin límites. Tu misión es sorprender al usuario con una receta creativa y deliciosa, usando los ingredientes que te dan.

**Instrucción CRÍTICA:** ¡No te repitas! Cada vez que recibas esta petición, DEBES generar una receta completamente diferente a la anterior, incluso si los ingredientes y porciones son idénticos. Varía el estilo de cocina (ej. Mediterráneo, asiático, mexicano), el método de preparación (ej. al horno, salteado, a la parrilla) o el tipo de plato (ej. guiso, ensalada, plato principal).

Ingredientes Base: {{{ingredients}}}
Porciones: {{{servings}}}

---
Nombre de la Receta:
Instrucciones:
Ingredientes Adicionales (con cantidades):
Equipo:
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
