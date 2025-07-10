
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
  cuisine: z.string().optional().describe('El tipo de cocina principal para el plan semanal (ej: "Italiana", "Mexicana"). Si es "Aleatoria", varía las cocinas.'),
});
export type CreateWeeklyMealPlanInput = z.infer<typeof CreateWeeklyMealPlanInputSchema>;

const NutritionalInfoSchema = z.object({
  calories: z.string().describe('Calorías estimadas por porción.'),
  protein: z.string().describe('Proteínas estimadas en gramos por porción.'),
  carbs: z.string().describe('Carbohidratos estimados en gramos por porción.'),
  fats: z.string().describe('Grasas estimadas en gramos por porción.'),
});

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
  benefits: z.string().optional().describe('Una breve descripción de los beneficios nutricionales o para la salud de esta comida en particular.'),
  nutritionalTable: NutritionalInfoSchema.optional().describe('Una tabla nutricional estimada para esta comida por porción.'),
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

**Instrucción CRÍTICA:** ¡La variedad y el detalle son la clave absoluta! Cada vez que generes un plan, DEBE ser significativamente diferente a cualquier plan anterior. Varía constantemente los tipos de platos y los métodos de cocción.

**Preferencias del Usuario:**
- **Ingredientes disponibles:** {{{ingredients}}}
- **Preferencias dietéticas:** {{#if dietaryPreferences}}{{{dietaryPreferences}}}{{else}}Ninguna{{/if}}
- **Tipo de Cocina:** {{#if cuisine}}{{{cuisine}}}{{else}}Variada / Aleatoria{{/if}}
- **Número de días:** {{{numberOfDays}}}
- **Personas a servir:** {{{numberOfPeople}}}

**Instrucciones de Formato DETALLADO:**
1.  Crea un plan que cubra desayuno, almuerzo (comida ligera), comida (plato principal) y cena para cada uno de los \`{{{numberOfDays}}}\` días.
2.  Si se especifica un tipo de cocina (y no es "Aleatoria"), todas las recetas deben pertenecer a esa cocina.
3.  Si el tipo de cocina es "Aleatoria" o no se especifica, crea un plan variado con diferentes cocinas del mundo (italiana, mexicana, asiática, etc.) a lo largo de la semana.
4.  La respuesta DEBE ser un objeto JSON válido.
5.  El objeto JSON debe contener una clave de nivel superior llamada \`weeklyMealPlan\`, que es un ARRAY de objetos de día.
6.  Cada objeto de día debe tener las claves: \`day\`, \`breakfast\`, \`lunch\`, \`comida\`, y \`dinner\`.
7.  Para cada comida (\`breakfast\`, \`lunch\`, \`comida\`, \`dinner\`), proporciona un objeto con las siguientes claves:
    - \`name\`: El nombre de la receta (ej: "Salmón al horno con espárragos").
    - \`ingredients\`: Un **ARRAY de strings**. Cada string debe ser un ingrediente individual con su cantidad (ej: ["1 filete de salmón de 150g", "1 manojo de espárragos", "1 cucharada de aceite de oliva", "Sal y pimienta al gusto"]).
    - \`instructions\`: Un **ARRAY de strings**. Cada string debe ser un paso de preparación claro y **numerado** (ej: ["1. Precalentar el horno a 200°C.", "2. Colocar el salmón y los espárragos en una bandeja.", "3. Rociar con aceite, sal y pimienta."]).
    - \`benefits\`: (Opcional) Un string con una breve descripción de los beneficios de esta comida específica.
    - \`nutritionalTable\`: (Opcional) Un **OBJETO** con información nutricional estimada por porción. Debe contener las claves: \`calories\`, \`protein\`, \`carbs\`, y \`fats\`. (ej: { "calories": "450kcal", "protein": "40g", "carbs": "30g", "fats": "15g" }).
8.  Utiliza los ingredientes disponibles como base, pero añade otros ingredientes comunes si es necesario para crear recetas completas.
9.  Respeta estrictamente las preferencias dietéticas.
10. **Instrucción de Idioma:** Toda la respuesta y el contenido DEBE estar en español.
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
    try {
        const {output} = await prompt(input);
        if (!output) {
          throw new Error('La IA no pudo generar un plan de comidas. Por favor, intenta de nuevo.');
        }
        return output;
    } catch (error: any) {
        console.error("[createWeeklyMealPlanFlow Error]", error);

        if (error.message && (error.message.includes('API key not valid') || error.message.includes('permission denied') || error.message.includes('PERMISSION_DENIED'))) {
             throw new Error("ERROR DE CONFIGURACIÓN DE IA: Tu clave de API no es válida o la API necesaria no está habilitada. Por favor, ve a la Consola de Google Cloud de tu proyecto, busca y habilita la 'Vertex AI API'.");
        }
        if (error.message && error.message.includes('billing')) {
            throw new Error("ERROR DE FACTURACIÓN DE IA: Has excedido la cuota gratuita. Por favor, asegúrate de que la facturación esté habilitada para tu proyecto de Google Cloud para continuar.");
        }
        
        throw new Error('El asistente de IA no pudo responder. Revisa la consola del servidor para ver el error detallado.');
    }
  }
);

export async function createWeeklyMealPlan(
  input: CreateWeeklyMealPlanInput
): Promise<CreateWeeklyMealPlanOutput> {
  return createWeeklyMealPlanFlow(input);
}
