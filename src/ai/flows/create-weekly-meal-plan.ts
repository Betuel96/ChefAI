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
    .array(z.string())
    .describe('Un array de strings, donde cada string es un ingrediente con su cantidad (ej: "200g de harina").'),
  instructions: z
    .array(z.string())
    .describe(
      'Un array de strings, donde cada string es un paso de la preparación, numerado (ej: "1. Mezclar los ingredientes secos.").'
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

const prompt = ai.definePrompt({
  name: 'createWeeklyMealPlanPrompt',
  input: {schema: CreateWeeklyMealPlanInputSchema},
  output: {schema: CreateWeeklyMealPlanOutputSchema},
  prompt: `Eres un planificador de comidas experto y un genio culinario. Tu tarea es diseñar un plan de comidas semanal que sea emocionante, variado, delicioso y DETALLADO, basándote en las preferencias del usuario.

**Instrucción CRÍTICA:** ¡La variedad y el detalle son la clave absoluta! Cada vez que generes un plan, DEBE ser significativamente diferente a cualquier plan anterior. Varía constantemente los tipos de platos, las cocinas del mundo (italiana, mexicana, asiática, etc.), y los métodos de cocción.

**Preferencias del Usuario:**
- **Ingredientes disponibles:** {{{ingredients}}}
- **Preferencias dietéticas:** {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}Ninguna{{/if}}
- **Número de días:** {{{numberOfDays}}}
- **Personas a servir:** {{{numberOfPeople}}}

**Instrucciones de Formato DETALLADO:**
1.  Crea un plan que cubra desayuno, almuerzo (comida ligera), comida (plato principal) y cena para cada uno de los \`{{{numberOfDays}}}\` días.
2.  La respuesta DEBE ser un objeto JSON válido.
3.  El objeto JSON debe contener una clave de nivel superior llamada \`weeklyMealPlan\`, que es un ARRAY de objetos de día.
4.  Cada objeto de día debe tener las claves: \`day\`, \`breakfast\`, \`lunch\`, \`comida\`, y \`dinner\`.
5.  Para cada comida (\`breakfast\`, \`lunch\`, \`comida\`, \`dinner\`), proporciona un objeto con las siguientes claves:
    - \`name\`: El nombre de la receta (ej: "Salmón al horno con espárragos").
    - \`ingredients\`: Un **ARRAY de strings**. Cada string debe ser un ingrediente individual con su cantidad (ej: ["1 filete de salmón de 150g", "1 manojo de espárragos", "1 cucharada de aceite de oliva", "Sal y pimienta al gusto"]).
    - \`instructions\`: Un **ARRAY de strings**. Cada string debe ser un paso de preparación claro y **numerado** (ej: ["1. Precalentar el horno a 200°C.", "2. Colocar el salmón y los espárragos en una bandeja.", "3. Rociar con aceite, sal y pimienta."]).
6.  Utiliza los ingredientes disponibles como base, pero añade otros ingredientes comunes si es necesario para crear recetas completas.
7.  Respeta estrictamente las preferencias dietéticas.
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

const createWeeklyMealPlanFlow = ai.defineFlow(
  {
    name: 'createWeeklyMealPlanFlow',
    inputSchema: CreateWeeklyMealPlanInputSchema,
    outputSchema: CreateWeeklyMealPlanOutputSchema,
  },
  async input => {
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
