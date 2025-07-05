
'use server';

/**
 * @fileOverview A shopping list generation AI agent.
 *
 * - generateShoppingList - A function that handles the shopping list generation process from a meal plan.
 * - GenerateShoppingListInput - The input type for the generateShoppingList function.
 * - GenerateShoppingListOutput - The return type for the generateShoppingList function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateShoppingListInputSchema = z.object({
  allIngredients: z
    .string()
    .describe('Una lista completa de todos los ingredientes necesarios, separados por saltos de línea.'),
});
export type GenerateShoppingListInput = z.infer<typeof GenerateShoppingListInputSchema>;

const ShoppingListCategorySchema = z.object({
  category: z
    .string()
    .describe('El nombre de la categoría de la tienda (p. ej., "Frutas y Verduras", "Carnes").'),
  items: z.array(z.string()).describe('Una lista de los ingredientes que pertenecen a esta categoría.'),
});

const GenerateShoppingListOutputSchema = z.object({
  shoppingList: z
    .array(ShoppingListCategorySchema)
    .describe('Una lista de compras categorizada generada a partir de los ingredientes proporcionados.'),
});
export type GenerateShoppingListOutput = z.infer<typeof GenerateShoppingListOutputSchema>;

export async function generateShoppingList(
  input: GenerateShoppingListInput
): Promise<GenerateShoppingListOutput> {
  return generateShoppingListFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateShoppingListPrompt',
  input: {schema: GenerateShoppingListInputSchema},
  output: {schema: GenerateShoppingListOutputSchema},
  prompt: `Eres un asistente de compras experto. Tu tarea es crear una lista de compras categorizada a partir de una lista de ingredientes.

**Instrucciones:**
1.  Analiza la siguiente lista de ingredientes:
    {{{allIngredients}}}
2.  Agrega y consolida todos los ingredientes duplicados. No incluyas cantidades, solo el nombre del ingrediente.
3.  Organiza los ingredientes en categorías lógicas de supermercado. Usa las siguientes categorías si aplican: "Frutas y Verduras", "Carnes y Aves", "Pescados y Mariscos", "Lácteos y Huevos", "Panadería", "Productos Enlatados y Secos", "Condimentos y Especias", "Bebidas", "Otros".
4.  La respuesta DEBE ser un objeto JSON válido.
5.  La clave de nivel superior debe ser \`shoppingList\`.
6.  El valor de \`shoppingList\` DEBE ser un ARRAY de objetos.
7.  Cada objeto en el array representa una categoría y debe contener las siguientes claves:
    - \`category\`: El nombre de la categoría (p. ej., "Frutas y Verduras").
    - \`items\`: Un ARRAY de strings, donde cada string es un ingrediente individual de esa categoría.
8.  **Instrucción de Idioma:** Toda la respuesta y el contenido debe estar en español.
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

const generateShoppingListFlow = ai.defineFlow(
  {
    name: 'generateShoppingListFlow',
    inputSchema: GenerateShoppingListInputSchema,
    outputSchema: GenerateShoppingListOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
