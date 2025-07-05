import { config } from 'dotenv';
config();

import '@/ai/flows/create-weekly-meal-plan.ts';
import '@/ai/flows/generate-shopping-list.ts';
import '@/ai/flows/generate-recipe.ts';
import '@/ai/flows/generate-recipe-image.ts';
import '@/ai/flows/generate-detailed-recipe.ts';
import '@/ai/flows/text-to-speech.ts';
