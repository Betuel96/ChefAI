'use server';
/**
 * @fileOverview A conversational cooking assistant AI agent.
 *
 * This file defines a Genkit flow that acts as a conversational cooking assistant.
 * It takes the recipe context, conversation history, and a user's query,
 * and returns a helpful text response along with the corresponding audio.
 *
 * @exports cookingAssistant - The main function to interact with the cooking assistant.
 * @exports CookingAssistantInput - The input type for the cookingAssistant function.
 * @exports CookingAssistantOutput - The return type for the cookingAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

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

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const CookingAssistantInputSchema = z.object({
  recipe: RecipeSchema.describe('La receta completa que el usuario está cocinando.'),
  history: z.array(MessageSchema).describe('El historial de la conversación hasta ahora.'),
  userQuery: z.string().describe('La última pregunta o comando del usuario.'),
});
export type CookingAssistantInput = z.infer<typeof CookingAssistantInputSchema>;

const CookingAssistantOutputSchema = z.object({
  responseText: z.string().describe("La respuesta de texto del asistente al usuario."),
  audioDataUri: z.string().describe("El audio generado de la responseText, como un data URI. Formato esperado: 'data:audio/wav;base64,<encoded_data>'."),
});
export type CookingAssistantOutput = z.infer<typeof CookingAssistantOutputSchema>;

// Helper function to convert raw PCM audio data from the AI into a standard WAV format.
async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    const bufs: any[] = [];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}

// The main prompt that defines the AI's personality and task.
const prompt = ai.definePrompt({
  name: 'cookingAssistantPrompt',
  input: { schema: CookingAssistantInputSchema },
  // The direct output of this prompt is just text. The flow handles TTS.
  output: { schema: z.string() },
  prompt: `Eres ChefAI, un asistente de cocina amigable y experto. Estás guiando a un usuario a través de una receta, paso a paso, por voz.

Tu personalidad: Alentador, claro y conciso. Eres un profesor paciente.

**Tu Tarea:**
Responde a la última consulta del usuario basándote en la receta proporcionada y el historial de la conversación.

**Contexto de la Receta:**
Nombre de la Receta: {{{recipe.name}}}

Ingredientes:
{{#each recipe.ingredients}}
- {{{this}}}
{{/each}}

Instrucciones:
{{#each recipe.instructions}}
- {{{this}}}
{{/each}}

**Historial de la Conversación:**
{{#each history}}
{{#if (eq this.role 'user')}}Usuario: {{else}}ChefAI: {{/if}}{{{this.content}}}
{{/each}}

**Última Consulta del Usuario:**
"{{{userQuery}}}"

**Instrucciones para tu respuesta:**
1.  **Responde directamente a la consulta del usuario.** Si piden los ingredientes, lístalos. Si piden una sustitución, proporciona una sugerencia útil. Si dicen que están listos para el siguiente paso, proporciona la siguiente instrucción. Si el usuario te pregunta por el paso anterior, dáselo.
2.  **Sé conciso.** Tus respuestas serán habladas en voz alta. Mantenlas cortas y al grano.
3.  **Mantén el contexto.** Usa el historial de la conversación para entender en qué parte del proceso de cocción se encuentran.
4.  **No repitas la consulta del usuario** en tu respuesta. Solo proporciona la respuesta.
5.  **Idioma:** Responde ÚNICAMENTE en español.

Tu respuesta:
`,
  config: {
    temperature: 0.5,
  },
});

const cookingAssistantFlow = ai.defineFlow(
  {
    name: 'cookingAssistantFlow',
    inputSchema: CookingAssistantInputSchema,
    outputSchema: CookingAssistantOutputSchema,
  },
  async (input) => {
    // 1. Generate the text response based on the conversation.
    const { output: responseText } = await prompt(input);
    if (!responseText) {
        throw new Error('La IA no pudo generar una respuesta.');
    }

    // 2. Convert the generated text response to speech.
    const { media } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
            responseModalities: ['AUDIO'],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Algenib' },
                },
            },
        },
        prompt: responseText,
    });
    if (!media) {
      throw new Error('No se pudo generar el audio.');
    }
    
    // 3. Convert the raw PCM audio to a browser-friendly WAV format.
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);
    const audioDataUri = 'data:audio/wav;base64,' + wavBase64;

    return {
      responseText,
      audioDataUri,
    };
  }
);

// Exported wrapper function for client-side use.
export async function cookingAssistant(input: CookingAssistantInput): Promise<CookingAssistantOutput> {
  return cookingAssistantFlow(input);
}
