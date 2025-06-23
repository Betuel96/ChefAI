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
  ingredients: z.string().describe('Los ingredientes necesarios para la comida.'),
  instructions: z.string().describe('Las instrucciones para preparar la comida.'),
});

const DailyMealPlanSchema = z.object({
  breakfast: MealSchema.describe('El desayuno del día.'),
  lunch: MealSchema.describe('El almuerzo del día.'),
  dinner: MealSchema.describe('La cena del día.'),
});

const WeeklyMealPlanSchema = z.record(
  z.string(), // Key: "Día 1", "Día 2", etc.
  DailyMealPlanSchema
);

const CreateWeeklyMealPlanOutputSchema = z.object({
  weeklyMealPlan: WeeklyMealPlanSchema.describe(
    'Un plan de comidas semanal que consiste en recetas de desayuno, almuerzo y cena para cada día.'
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
  prompt: `Eres un planificador de comidas experto. Tu tarea es crear un plan de comidas semanal basado en las siguientes preferencias del usuario.

**Preferencias del Usuario:**
- **Ingredientes disponibles:** {{{ingredients}}}
- **Preferencias dietéticas:** {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}Ninguna{{/if}}
- **Número de días:** {{{numberOfDays}}}
- **Personas a servir:** {{{numberOfPeople}}}

**Instrucciones:**
1.  Crea un plan que cubra desayuno, almuerzo y cena para cada uno de los \`{{{numberOfDays}}}\` días.
2.  Para cada comida, proporciona el nombre, los ingredientes necesarios y las instrucciones de preparación.
3.  Utiliza los ingredientes disponibles como base principal para las recetas.
4.  Respeta estrictamente las preferencias dietéticas.
5.  Asegúrate de que el plan sea variado y minimice el desperdicio de alimentos.
6.  Organiza la respuesta usando "Día 1", "Día 2", etc., como claves para cada día del plan.
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
