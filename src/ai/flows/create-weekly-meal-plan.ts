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
 * @exports DailyMealPlan - The type for a single day's meal plan.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CreateWeeklyMealPlanInputSchema = z.object({
  ingredients: z
    .string()
    .describe('Una lista de ingredientes separados por comas que el usuario quiere usar.'),
  dietaryPreferences: z
    .string()
    .optional()
    .describe(
      'Las preferencias dietéticas del usuario, como vegetariano, vegano, sin gluten, etc.'
    ),
  numberOfDays: z
    .number()
    .min(1)
    .max(7)
    .describe('El número de días para los que se generará el plan de comidas.'),
  numberOfPeople: z
    .number()
    .min(1)
    .describe('El número de personas para las que debe servir el plan de comidas.'),
});
export type CreateWeeklyMealPlanInput = z.infer<typeof CreateWeeklyMealPlanInputSchema>;

const MealSchema = z.object({
  name: z.string().describe('El nombre de la comida.'),
  ingredients: z
    .string()
    .describe('Una lista de ingredientes para la receta, separados por saltos de línea.'),
  instructions: z
    .string()
    .describe(
      'Las instrucciones paso a paso para la receta, numeradas y separadas por saltos de línea.'
    ),
});

const DailyMealPlanSchema = z.object({
  day: z.string().describe('El día de la semana (p. ej., "Día 1").'),
  breakfast: MealSchema.describe('La receta de desayuno del día.'),
  lunch: MealSchema.describe('La receta de almuerzo (comida ligera) del día.'),
  comida: MealSchema.describe('La receta de la comida (plato principal) del día.'),
  dinner: MealSchema.describe('La receta de cena del día.'),
});
export type DailyMealPlan = z.infer<typeof DailyMealPlanSchema>;

const CreateWeeklyMealPlanOutputSchema = z.object({
  weeklyMealPlan: z
    .array(DailyMealPlanSchema)
    .describe(
      'Un plan de comidas semanal que consiste en un array de recetas de desayuno, almuerzo, comida y cena para cada día.'
    ),
});

export type CreateWeeklyMealPlanOutput = z.infer<typeof CreateWeeklyMealPlanOutputSchema>;

const createWeeklyMealPlanFlow = ai.defineFlow(
  {
    name: 'createWeeklyMealPlanFlow',
    inputSchema: CreateWeeklyMealPlanInputSchema,
    outputSchema: CreateWeeklyMealPlanOutputSchema,
  },
  async input => {
    const prompt = ai.definePrompt({
      name: 'createWeeklyMealPlanPrompt',
      input: {schema: CreateWeeklyMealPlanInputSchema},
      output: {schema: CreateWeeklyMealPlanOutputSchema},
      prompt: `Eres un planificador de comidas experto. Tu tarea es crear un plan de comidas semanal basado en las siguientes preferencias del usuario.

**Preferencias del Usuario:**
- **Ingredientes disponibles:** {{{ingredients}}}
- **Preferencias dietéticas:** {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}Ninguna{{/if}}
- **Número de días:** {{{numberOfDays}}}
- **Personas a servir:** {{{numberOfPeople}}}

**Instrucciones:**
1.  Crea un plan que cubra desayuno, almuerzo (comida ligera), comida (plato principal) y cena para cada uno de los \`{{{numberOfDays}}}\` días.
2.  La respuesta DEBE ser un objeto JSON válido. La clave de nivel superior debe ser \`weeklyMealPlan\`.
3.  El valor de \`weeklyMealPlan\` DEBE ser un ARRAY de objetos.
4.  Cada objeto en el array representa un día y debe contener las siguientes claves: \`day\`, \`breakfast\`, \`lunch\`, \`comida\`, y \`dinner\`.
5.  Para cada comida (\`breakfast\`, \`lunch\`, \`comida\`, \`dinner\`), proporciona un objeto con las siguientes claves:
    - \`name\`: El nombre de la receta.
    - \`ingredients\`: Una lista de ingredientes necesarios, cada uno en una nueva línea (separados por \\n).
    - \`instructions\`: Los pasos de la preparación, **numerados**, y cada paso en una nueva línea (separados por \\n).
6.  Utiliza los ingredientes disponibles como base principal para las recetas.
7.  Respeta estrictamente las preferencias dietéticas.
8.  Asegúrate de que el plan sea variado y minimice el desperdicio de alimentos.
`,
      config: {
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

    const {output} = await prompt(input);
    if (!output) {
      throw new Error('La IA no pudo generar un plan de comidas. Por favor, intenta de nuevo.');
    }
    return output;
  }
);

export async function createWeeklyMealPlan(
  input: CreateWeeklyMealPlanInput
): Promise<CreateWeeklyMealPlanOutput> {
  return createWeeklyMealPlanFlow(input);
}
