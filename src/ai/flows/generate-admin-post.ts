
'use server';
/**
 * @fileOverview An admin-only flow to generate and publish a recipe post for the official account.
 */

import { z } from 'zod';
import { doc, getDoc } from 'firebase/firestore';
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { generateRecipe } from './generate-recipe';
import { generateRecipeImage } from './generate-recipe-image';
import { createPost } from '@/lib/community';
import type { UserAccount } from '@/types';

// The UID of the official ChefAI account, taken from the provided screenshot URL.
const OFFICIAL_ACCOUNT_UID = "D0U6N4IEPaYKfDwy2";

const GenerateAdminPostInputSchema = z.object({
  topic: z.string().min(5, 'El tema debe tener al menos 5 caracteres.').describe('The topic for the recipe post, e.g., "a healthy chicken salad".'),
});
export type GenerateAdminPostInput = z.infer<typeof GenerateAdminPostInputSchema>;

const GenerateAdminPostOutputSchema = z.object({
  postId: z.string().describe('The ID of the newly created post.'),
});
export type GenerateAdminPostOutput = z.infer<typeof GenerateAdminPostOutputSchema>;


export async function generateAdminPost(input: GenerateAdminPostInput): Promise<GenerateAdminPostOutput> {
  return generateAdminPostFlow(input);
}

const generateAdminPostFlow = ai.defineFlow(
  {
    name: 'generateAdminPostFlow',
    inputSchema: GenerateAdminPostInputSchema,
    outputSchema: GenerateAdminPostOutputSchema,
  },
  async ({ topic }) => {
    if (!db) {
        throw new Error('Firestore is not initialized.');
    }
    
    // 1. Get official account details
    const userRef = doc(db, 'users', OFFICIAL_ACCOUNT_UID);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        throw new Error(`Official ChefAI account with UID ${OFFICIAL_ACCOUNT_UID} not found in Firestore.`);
    }
    const officialAccount = userSnap.data() as UserAccount;

    // 2. Generate recipe and image in parallel
    const [recipeData, imageResult] = await Promise.all([
        generateRecipe({
            ingredients: topic,
            servings: 4, // Default servings for generated posts
            language: 'Spanish',
            cuisine: 'Aleatoria',
        }),
        generateRecipeImage({ recipeName: topic }),
    ]);

    if (!recipeData || !imageResult.imageUrl) {
        throw new Error('Failed to generate recipe content or image.');
    }

    // 3. Create the post using the generated content
    const postId = await createPost(
      OFFICIAL_ACCOUNT_UID,
      officialAccount.name,
      officialAccount.photoURL,
      {
        type: 'recipe',
        content: recipeData.name,
        instructions: recipeData.instructions,
        ingredients: recipeData.ingredients,
        equipment: recipeData.equipment,
        benefits: recipeData.benefits,
        nutritionalTable: recipeData.nutritionalTable,
        mediaType: 'image',
      },
      imageResult.imageUrl
    );
    
    return { postId };
  }
);
