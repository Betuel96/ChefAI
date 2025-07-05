'use server';
/**
 * @fileOverview A conversational cooking assistant AI agent.
 *
 * This file defines a Genkit flow that acts as a conversational cooking assistant.
 * It takes the recipe context and conversation history, and returns a helpful text response.
 *
 * @exports getCookingResponse - The main function to get a text response from the assistant.
 * @exports CookingAssistantInput - The input type for the getCookingResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Zod schemas to define the structure for the AI.
const NutritionalInfoSchema = z.object({
  calories: z.string(),
  protein: z.string(),
  carbs: z.string(),
  fats: z.string(),
});

const RecipeSchema = z.object({
  name: z.string(),
  instructions: z.array(z.string()),
  ingredients: z.array(z.string()),
  equipment: z.array(z.string()),
  benefits: z.string().optional(),
  nutritionalTable: NutritionalInfoSchema.optional(),
});

const HistoryMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const CookingAssistantInputSchema = z.object({
  recipe: RecipeSchema.describe('La receta completa que el usuario está cocinando.'),
  history: z.array(HistoryMessageSchema).describe('El historial de la conversación hasta ahora. El último mensaje es la consulta actual del usuario.'),
});
export type CookingAssistantInput = z.infer<typeof CookingAssistantInputSchema>;


const getCookingResponseFlow = ai.defineFlow(
  {
    name: 'getCookingResponseFlow',
    inputSchema: CookingAssistantInputSchema,
    outputSchema: z.string(),
  },
  async (input) => {
    // --- DEBUGGING STEP ---
    // Removed all cooking-specific context to test for a more fundamental issue.
    const systemPrompt = `Eres un asistente de ayuda. Responde a las preguntas del usuario. Responde ÚNICAMENTE en español.`;
    
    // Convert our client-side conversation history to the format Genkit expects
    const historyForModel = input.history.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }],
    }));

    // The last message from the user is the main prompt
    const currentPromptContent = historyForModel.pop()?.content || [];

    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash-latest',
      system: systemPrompt,
      history: historyForModel,
      prompt: currentPromptContent,
      config: {
        temperature: 0.7,
        // Using the most permissive safety settings for this diagnostic test.
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        ],
      },
      output: {
          schema: z.string().nullable()
      }
    });

    if (!output) {
      return 'Lo siento, no he podido procesar esa pregunta. ¿Podrías intentarlo de nuevo de otra manera?';
    }

    return output;
  }
);

// Exported wrapper function for client-side use.
export async function getCookingResponse(input: CookingAssistantInput): Promise<string> {
  return getCookingResponseFlow(input);
}
