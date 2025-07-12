
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin, explicitly passing the API key.
// This prevents conflicts with Firebase client-side authentication.
export const ai = genkit({
  plugins: [googleAI({
    apiKey: process.env.GOOGLE_API_KEY
  })],
  model: 'googleai/gemini-1.5-flash-latest',
});
