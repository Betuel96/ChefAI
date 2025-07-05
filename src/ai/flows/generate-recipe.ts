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

const NutritionalInfoSchema = z.object({
  calories: z.string().describe('Calorías estimadas por porción.'),
  protein: z.string().describe('Proteínas estimadas en gramos por porción.'),
  carbs: z.string().describe('Carbohidratos estimados en gramos por porción.'),
  fats: z.string().describe('Grasas estimadas en gramos por porción.'),
});

const GenerateRecipeOutputSchema = z.object({
  name: z.string().describe('El nombre de la receta.'),
  instructions: z.array(z.string()).describe('Un array de strings, donde cada string es un paso numerado de la preparación.'),
  ingredients: z
    .array(z.string())
    .describe('Un array de strings, donde cada string es un ingrediente adicional necesario, con cantidades.'),
  equipment: z.array(z.string()).describe('Un array de strings, donde cada string es un utensilio de cocina necesario.'),
  benefits: z.string().describe('Una breve descripción de los beneficios nutricionales o para la salud de esta receta (ej: "Alto en proteínas, ideal para después del gimnasio.").'),
  nutritionalTable: NutritionalInfoSchema.describe('Una tabla nutricional estimada para la receta por porción.'),
});
export type GenerateRecipeOutput = z.infer<typeof GenerateRecipeOutputSchema>;

export async function generateRecipe(input: GenerateRecipeInput): Promise<GenerateRecipeOutput> {
  return generateRecipeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateRecipePrompt',
  input: {schema: GenerateRecipeInputSchema},
  output: {schema: GenerateRecipeOutputSchema},
  prompt: `Eres un chef de talla mundial con una imaginación sin límites. Tu misión es sorprender al usuario con una receta creativa, deliciosa y MUY DETALLADA, usando los ingredientes que te dan.

**Instrucción CRÍTICA:** ¡La creatividad y la variedad son tu sello! Cada vez que recibas esta petición, incluso con los mismos ingredientes, DEBES generar una idea completamente nueva y con mucho detalle. Explora diferentes cocinas, métodos de cocción y tipos de plato.

**Ingredientes Base:** {{{ingredients}}}
**Porciones:** {{{servings}}}

---
**Instrucciones de Formato DETALLADO:**
La respuesta DEBE ser un objeto JSON válido con las siguientes claves:
- \`name\`: El nombre de la receta.
- \`ingredients\`: Un **ARRAY de strings**. Cada string debe ser un ingrediente necesario con su cantidad (ej: ["2 pechugas de pollo", "1 taza de arroz", "2 cucharadas de aceite de oliva"]).
- \`instructions\`: Un **ARRAY de strings**. Cada string debe ser un paso de preparación claro y **numerado** (ej: ["1. Sazonar el pollo con sal y pimienta.", "2. Calentar el aceite en una sartén a fuego medio.", "3. Cocinar el pollo por 6-8 minutos por cada lado."]).
- \`equipment\`: Un **ARRAY de strings**. Cada string es un utensilio necesario (ej: ["sartén", "tabla de cortar", "cuchillo de chef"]).
- \`benefits\`: Un **string** con una breve descripción de los beneficios nutricionales o de salud de la receta (ej: "Alto en proteínas, ideal para la recuperación muscular después del ejercicio.").
- \`nutritionalTable\`: Un **OBJETO** con información nutricional estimada por porción. Debe contener las claves: \`calories\`, \`protein\`, \`carbs\`, y \`fats\`. (ej: { "calories": "450kcal", "protein": "40g", "carbs": "30g", "fats": "15g" }).
**Instrucción de Idioma:** Toda la respuesta y el contenido DEBE estar en español.
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
