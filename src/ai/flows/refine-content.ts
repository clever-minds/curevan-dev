
'use server';

/**
 * @fileOverview A generic content refinement AI agent.
 *
 * - refineContent - A function that takes text and returns a refined version.
 * - RefineContentInput - The input type for the refineContent function.
 * - RefineContentOutput - The return type for the refineContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineContentInputSchema = z.object({
  text: z
    .string()
    .describe("The text content to be refined."),
  instruction: z.string().describe("The instruction for refinement (e.g., 'Make this more concise', 'Expand on this topic')."),
  context: z.object({
      entityType: z.enum(["pcr", "post", "training", "documentation"]).optional(),
      field: z.string().optional(),
  }).optional().describe("The context of where the text is being used."),
});

export type RefineContentInput = z.infer<
  typeof RefineContentInputSchema
>;

const RefineContentOutputSchema = z.object({
  refinedText: z
    .string()
    .describe('The refined version of the input text.'),
});

export type RefineContentOutput = z.infer<
  typeof RefineContentOutputSchema
>;

// Statically define the PCR-specific prompt
const pcrRefinePrompt = ai.definePrompt({
  name: 'pcrRefinePrompt',
  input: {schema: RefineContentInputSchema},
  output: {schema: RefineContentOutputSchema},
  prompt: `You are a helpful AI assistant for therapists.
  Your task is to refine the provided text based on the given instruction, adhering to clinical best practices.
  The notes should be objective, clear, and professional. Avoid subjective language or making definitive diagnoses unless stated.
  If the context is a "plan", ensure the output is actionable.
  If the context is "assessment", use the SOAP or a similar clinical structure.

  Context Field: {{{context.field}}}
  Instruction: {{{instruction}}}
  Original Text: {{{text}}}
  
  Return only the refined text in the 'refinedText' field.`
});

// Statically define the default prompt
const defaultRefinePrompt = ai.definePrompt({
  name: 'defaultRefinePrompt',
  input: {schema: RefineContentInputSchema},
  output: {schema: RefineContentOutputSchema},
  prompt: `You are an expert editor. Your task is to refine the provided text based on the given instruction.
  The context is a {{{context.entityType}}}.
  
  Instruction: {{{instruction}}}
  Original Text: {{{text}}}

  Return only the refined text in the 'refinedText' field.`
});


export async function refineContent(
  input: RefineContentInput
): Promise<RefineContentOutput> {
  return refineContentFlow(input);
}


const refineContentFlow = ai.defineFlow(
  {
    name: 'refineContentFlow',
    inputSchema: RefineContentInputSchema,
    outputSchema: RefineContentOutputSchema,
  },
  async (input) => {
    let result;
    // Choose which statically defined prompt to run based on the context
    if (input.context?.entityType === 'pcr') {
        result = await pcrRefinePrompt(input);
    } else {
        result = await defaultRefinePrompt(input);
    }
    
    return result.output!;
  }
);
