'use server';

/**
 * @fileOverview AI-assisted objective note generation for therapists.
 *
 * - generateObjectiveNotes - A function that generates objective notes from a patient's description.
 * - GenerateObjectiveNotesInput - The input type for the generateObjectiveNotes function.
 * - GenerateObjectiveNotesOutput - The return type for the generateObjectiveNotes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateObjectiveNotesInputSchema = z.object({
  patientDescription: z
    .string()
    .describe("The patient's description of their problem."),
});

export type GenerateObjectiveNotesInput = z.infer<
  typeof GenerateObjectiveNotesInputSchema
>;

const GenerateObjectiveNotesOutputSchema = z.object({
  objectiveNotes: z
    .string()
    .describe('The generated objective notes from the patient description.'),
});

export type GenerateObjectiveNotesOutput = z.infer<
  typeof GenerateObjectiveNotesOutputSchema
>;

export async function generateObjectiveNotes(
  input: GenerateObjectiveNotesInput
): Promise<GenerateObjectiveNotesOutput> {
  return generateObjectiveNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateObjectiveNotesPrompt',
  input: {schema: GenerateObjectiveNotesInputSchema},
  output: {schema: GenerateObjectiveNotesOutputSchema},
  prompt: `You are a helpful AI assistant for therapists.
  Your task is to generate objective notes from a patient's description of their problem.
  The notes should be concise and focus on observable facts rather than subjective interpretations.

  Patient Description: {{{patientDescription}}}

  Objective Notes:`, // Ensure the output is assigned to the objectiveNotes field.
});

const generateObjectiveNotesFlow = ai.defineFlow(
  {
    name: 'generateObjectiveNotesFlow',
    inputSchema: GenerateObjectiveNotesInputSchema,
    outputSchema: GenerateObjectiveNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
