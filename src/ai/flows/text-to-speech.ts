'use server';
/**
 * @fileOverview Converts text to speech.
 *
 * - generateSpokenInstructions - A function that converts a string to a WAV audio data URI.
 * - GenerateSpokenInstructionsInput - The input type for the function.
 * - GenerateSpokenInstructionsOutput - The return type for the function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import wav from 'wav';

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

const GenerateSpokenInstructionsInputSchema = z.string();
export type GenerateSpokenInstructionsInput = z.infer<typeof GenerateSpokenInstructionsInputSchema>;

const GenerateSpokenInstructionsOutputSchema = z.object({
    audioDataUri: z.string().describe("The generated audio as a data URI. Expected format: 'data:audio/wav;base64,<encoded_data>'."),
});
export type GenerateSpokenInstructionsOutput = z.infer<typeof GenerateSpokenInstructionsOutputSchema>;

const textToSpeechFlow = ai.defineFlow(
  {
    name: 'textToSpeechFlow',
    inputSchema: GenerateSpokenInstructionsInputSchema,
    outputSchema: GenerateSpokenInstructionsOutputSchema,
  },
  async (instruction) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Algenib' }, // A friendly, clear voice
          },
        },
      },
      prompt: instruction,
    });
    
    if (!media) {
      throw new Error('No se pudo generar el audio.');
    }
    
    // Convert PCM to WAV
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavBase64 = await toWav(audioBuffer);

    return {
      audioDataUri: 'data:audio/wav;base64,' + wavBase64,
    };
  }
);


export async function generateSpokenInstructions(input: GenerateSpokenInstructionsInput): Promise<GenerateSpokenInstructionsOutput> {
  return textToSpeechFlow(input);
}
